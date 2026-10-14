import test from "node:test";
import assert from "node:assert/strict";

import {
  cornerFlickerRms,
  enobFromSinad,
  flickerPsd,
  flickerRms,
  flickerShotCorner,
  idealSqnrDb,
  johnsonNoise,
  ktcNoise,
  minDetectableSignal,
  sensorNoiseElectrons,
  shotNoiseCurrent,
} from "../src/physics/detectors/noise";

const close = (actual: number, expected: number, rel: number, msg = "") =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${msg} ${actual} vs ${expected}`);

test("shot noise √(2qIB): 1 µA in 1 MHz gives 0.566 nA (Saleh & Teich §17.5)", () => {
  // Hand calculation: 2 × 1.602176634e-19 C × 1e-6 A × 1e6 Hz = 3.2043533e-19 A², √ = 5.66070e-10 A.
  close(shotNoiseCurrent(1e-6, 1e6), 5.6607007e-10, 1e-7);
  // Power SNR I/(2qB) = 3.1208e6 at 1 µA, 1 MHz.
  close((1e-6 / shotNoiseCurrent(1e-6, 1e6)) ** 2, 1e-6 / (2 * 1.602176634e-19 * 1e6), 1e-12);
  assert.equal(shotNoiseCurrent(0, 1e6), 0);
  assert.ok(Number.isNaN(shotNoiseCurrent(-1e-6, 1e6)));
});

test("Johnson noise: 1 kΩ at 300 K is 4.07 nV/√Hz, and k_B·T is −173.8 dBm/Hz (Nyquist 1928)", () => {
  const n = johnsonNoise(1e3, 300, 1e6);
  // √(4 × 1.380649e-23 × 300 × 1e3 × 1e6) = 4.07035 µV.
  close(n.v, 4.0703548e-6, 1e-7);
  close(n.i, 4.0703548e-9, 1e-7);
  close(10 * Math.log10(johnsonNoise(50, 300, 1).p / 1e-3), -173.828, 1e-5);
  // The textbook −174 dBm/Hz is k_B·T at the IEEE reference temperature 290 K.
  close(10 * Math.log10(johnsonNoise(50, 290, 1).p / 1e-3), -173.975, 1e-5);
  assert.ok(Number.isNaN(johnsonNoise(0, 300, 1e6).i));
});

test("kTC noise: 10 fF at 300 K holds 40.17 e⁻ rms and 0.644 mV (Janesick 2001)", () => {
  const n = ktcNoise(10e-15, 300);
  // √(1.380649e-23 × 300 × 1e-14) = 6.43580e-18 C = 40.1691 e⁻; √(k_B·T/C) = 0.643580 mV.
  close(n.electrons, 40.169079, 1e-7);
  close(n.v, 6.4357960e-4, 1e-7);
  // Charge noise scales as √C: 1 pF holds 10× the electrons of 10 fF.
  close(ktcNoise(1e-12, 300).electrons, 401.69079, 1e-7);
  assert.equal(ktcNoise(10e-15, 0).electrons, 0);
  assert.ok(Number.isNaN(ktcNoise(0, 300).v));
});

test("1/f noise K_f·I^α/f: rms over 1 Hz–1 MHz and the corner against 2qI (Hooge 1969)", () => {
  // √(1e-24 × 1e-6 × ln 1e6) = 3.71692e-15 A.
  close(flickerRms(1e-24, 1e-6, 1, 1, 1e6), 3.7169222e-15, 1e-7);
  // 1e-24 × 1e-6 / f_c = 2q × 1e-6 → f_c = 1e-24/(3.2043533e-19) = 3.12075e-6 Hz.
  close(flickerShotCorner(1e-24, 1e-6, 1), 3.1207545e-6, 1e-7);
  const fc = flickerShotCorner(3e-12, 1e-3, 1.5);
  close(flickerPsd(3e-12, 1e-3, 1.5, fc), 2 * 1.602176634e-19 * 1e-3, 1e-12, "density equals 2qI at the corner");
  // Equal noise per decade: each decade adds K_f·I^α·ln 10.
  close(flickerRms(1, 1, 1, 10, 100) ** 2, Math.log(10), 1e-12);
  assert.ok(Number.isNaN(flickerRms(1e-24, 1e-6, 1, 1e6, 1e6)));
  assert.ok(Number.isNaN(flickerRms(1e-24, 1e-6, 1, 0, 1e6)));
});

test("1/f noise from a corner frequency on a white floor (Motchenbacher & Connelly)", () => {
  // 5 e⁻ of white noise over 1 MHz with a 1 kHz corner, from 50 Hz: 5·√(1e-3 · ln 2e4) = 0.4976 e⁻.
  close(cornerFlickerRms(5, 1e3, 1e6, 50), 0.49758134, 1e-7);
  // Independent check: trapezoid integral in f of the density (σ²/B)·f_c/f from f_L to B on a geometric grid.
  const n = 20000;
  const [s, fcorner, b, fl] = [5, 1e3, 1e6, 50];
  const density = (f: number) => ((s * s) / b) * (fcorner / f);
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const f0 = fl * (b / fl) ** (i / n);
    const f1 = fl * (b / fl) ** ((i + 1) / n);
    sum += ((f1 - f0) * (density(f0) + density(f1))) / 2;
  }
  close(cornerFlickerRms(s, fcorner, b, fl), Math.sqrt(sum), 1e-6);
  assert.equal(cornerFlickerRms(5, 0, 1e6, 50), 0);
  assert.ok(Number.isNaN(cornerFlickerRms(5, 1e3, 50, 50)));
});

test("sensor noise and the 3σ minimum detectable signal (Janesick, Photon Transfer)", () => {
  // √(1000 + 5²) = 32.016 e⁻; with 0.1 e⁻/s dark for 10 ms: √(1000 + 100 + 0.001).
  close(sensorNoiseElectrons({ signal: 1000, read: 5 }), Math.sqrt(1025), 1e-12);
  close(sensorNoiseElectrons({ signal: 1000, read: 10, dark: 0.001 }), Math.sqrt(1100.001), 1e-12);
  // S_min(5 e⁻) = (9 + √(81 + 900))/2 = 20.1605 e⁻, and it meets S/√(S + σ²) = 3.
  const s = minDetectableSignal(5);
  close(s, 20.16046, 1e-6);
  close(s / Math.sqrt(s + 25), 3, 1e-12);
  // No floor: S/√S = 3 → S = 9.
  assert.equal(minDetectableSignal(0), 9);
  assert.ok(Number.isNaN(sensorNoiseElectrons({ signal: -1, read: 5 })));
});

test("ADC: ideal SQNR 6.02N + 1.76 dB and ENOB from SINAD (IEEE 1241, Kester MT-001/MT-003)", () => {
  close(idealSqnrDb(12), 74.00811, 1e-6);
  close(idealSqnrDb(16), 98.0905, 1e-5);
  // Kester's rounded constants give the same within 0.005 dB per bit over 1–24 bits.
  for (const n of [1, 8, 24]) assert.ok(Math.abs(idealSqnrDb(n) - (6.02 * n + 1.76)) < 0.005 * n + 0.001);
  assert.ok(Math.abs(enobFromSinad(idealSqnrDb(12)) - 12) < 1e-12);
  // SINAD of S = 1, N = 0.01, D = 0.001 is 10·log₁₀(1/0.011) = 19.586 dB → ENOB 2.9607 (2.9611 with 6.02/1.76).
  const sinad = 10 * Math.log10(1 / 0.011);
  close(sinad, 19.586073, 1e-7);
  close(enobFromSinad(sinad), 2.9606951, 1e-7);
  assert.ok(Number.isNaN(idealSqnrDb(0)));
});
