import test from "node:test";
import assert from "node:assert/strict";

import { c, h, k_B, q } from "../src/physics/constants";
import {
  APD_K_TABLE, apdReceiver, driftExponent, excessNoiseFactor, excessNoiseIndex, gainAtTemperature,
  gainTemperatureCoefficient, millerExponent, millerGain, optimumGain, parseApdMaterial,
} from "../src/physics/detectors/apd";

const close = (actual: number, expected: number, rel: number, msg = "") =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${msg} ${actual} vs ${expected}`);

test("Miller gain: hand values, breakdown and the one-point fit (Miller 1955)", () => {
  // 1/(1 − (140/150)³) = 3375/631.
  close(millerGain(140, 150, 3), 3375 / 631, 1e-14);
  assert.equal(millerGain(0, 150, 3), 1);
  assert.equal(millerGain(150, 150, 3), Infinity);
  assert.ok(Number.isNaN(millerGain(-1, 150, 3)));
  assert.ok(Number.isNaN(millerGain(100, 150, 0)));
  // Near breakdown 1 − r^n ≈ n(1 − r): no cancellation at V = V_br(1 − 1e-9).
  close(millerGain(150 * (1 - 1e-9), 150, 3), 1 / 3e-9, 1e-6);
  // The fit reproduces the point it was fitted through: n(5.3487, 140, 150) = 3.
  close(millerExponent(3375 / 631, 140, 150), 3, 1e-13);
  assert.ok(Number.isNaN(millerExponent(1, 140, 150)));
  assert.ok(Number.isNaN(millerExponent(10, 150, 150)));
});

test("McIntyre excess noise F and the datasheet index x (McIntyre 1966)", () => {
  // F(100, 0.02) = 0.02·100 + 0.98·(2 − 0.01) = 3.9502.
  close(excessNoiseFactor(100, 0.02), 3.9502, 1e-14);
  // k = 1: F = M; k = 0: F = 2 − 1/M; M = 1: F = 1 for any k.
  close(excessNoiseFactor(50, 1), 50, 1e-15);
  close(excessNoiseFactor(50, 0), 1.98, 1e-15);
  assert.equal(excessNoiseFactor(1, 0.5), 1);
  assert.ok(Number.isNaN(excessNoiseFactor(100, 1.1)));
  // x = ln 3.9502 / ln 100 = 0.29831, close to the x ≈ 0.3 Hamamatsu quotes for silicon APDs.
  close(excessNoiseIndex(100, 0.02), Math.log(3.9502) / Math.log(100), 1e-14);
  assert.ok(Number.isNaN(excessNoiseIndex(1, 0.02)));
});

test("k table: one sourced value per material, inside its range (Agrawal 2010, Table 4.2)", () => {
  for (const m of APD_K_TABLE) assert.ok(m.k >= m.range[0] && m.k <= m.range[1], m.id);
  // Excelitas C30902EH datasheet (Rev. 2022.02): k_eff = 0.02.
  assert.equal(APD_K_TABLE.find((m) => m.id === "si")?.k, 0.02);
  assert.equal(parseApdMaterial("ge"), "ge");
  assert.equal(parseApdMaterial("toString"), "si");
});

test("gain drift at fixed bias from V_br(T): Excelitas C30662 operating point (Crowell & Sze 1966)", () => {
  // C30645/C30662 datasheet (Rev. 2025.11): V_br = 50 V, M = 10 at 4 V below breakdown, γ = 0.14 V/°C.
  const p = { gainRef: 10, breakdownRef: 50, marginRef: 4, breakdownCoeff: 0.14 };
  const n = Math.log(0.9) / Math.log(0.92); // 1.26359
  close(driftExponent(p), n, 1e-14);
  assert.equal(gainAtTemperature(p, 0), 10);
  // +10 K: V_br = 51.4 V, M = 1/(1 − (46/51.4)^n) = 7.6416.
  close(gainAtTemperature(p, 10), 1 / (1 - (46 / 51.4) ** n), 1e-12);
  close(gainAtTemperature(p, 10), 7.6416, 1e-4);
  // V_br falls to the 46 V bias at ΔT = −4/0.14 = −28.6 K: breakdown.
  assert.equal(gainAtTemperature(p, -4 / 0.14), Infinity);
  assert.equal(gainAtTemperature(p, -40), Infinity);
  // (1/M)dM/dT = −n(M − 1)γ/V_br = −3.184 %/K, matching a central difference of the full model.
  const coeff = gainTemperatureCoefficient(p);
  close(coeff, (-n * 9 * 0.14) / 50, 1e-14);
  close(coeff, (gainAtTemperature(p, 1e-4) - gainAtTemperature(p, -1e-4)) / 2e-4 / 10, 1e-7);
  // The drift grows with gain: M = 100 at 0.5 V below breakdown (n = ln 0.99/ln 0.99 = 1) drifts 8.7× faster: −99·0.14/50 = −27.72 %/K.
  close(gainTemperatureCoefficient({ ...p, gainRef: 100, marginRef: 0.5 }), -0.2772, 1e-12);
  assert.ok(Number.isNaN(gainAtTemperature({ ...p, marginRef: 60 }, 0)));
});

test("APD receiver SNR and the optimum gain against thermal noise (Personick 1977)", () => {
  // 1 nW at 800 nm, η = 0.8: I_p = 0.8·q·λ·P/(hc) = 0.51619 nA.
  const Ip = (0.8 * q * 800e-9 * 1e-9) / (h * c);
  close(Ip, 5.1619e-10, 1e-4);
  const base = { photocurrent: Ip, darkCurrent: 0.05e-9, k: 0.02, bandwidth: 100e6, loadResistance: 1000, temperature: 300 };
  // Thermal variance 4k_B·T·B/R = 1.65678e-15 A².
  const r1 = apdReceiver(base, 1);
  close(r1.thermal, 1.6567788e-15, 1e-7);
  close(r1.shot, 2 * q * (Ip + 0.05e-9) * 1e8, 1e-14);
  // C = 4k_B·T/(qR(I_p + I_d)) = 1.82637e5; k = 0 gives M_opt = C and k = 1 gives C^(1/3) = 56.737.
  const C = (4 * k_B * 300) / (q * 1000 * (Ip + 0.05e-9));
  close(optimumGain({ ...base, k: 0 }), C, 1e-12);
  close(optimumGain({ ...base, k: 1 }), Math.cbrt(C), 1e-12);
  // k = 0.02: Cardano's root of 0.02M³ + 0.98M − C = 0.
  const P = 0.98 / 0.02, Q = -C / 0.02, D = Math.sqrt((Q / 2) ** 2 + (P / 3) ** 3);
  const cardano = Math.cbrt(-Q / 2 + D) + Math.cbrt(-Q / 2 - D);
  const Mopt = optimumGain(base);
  close(Mopt, cardano, 1e-10);
  close(Mopt, 208.94, 1e-4);
  // It is a maximum of the SNR, and the SNR there is 1.7854.
  const snr = (M: number) => apdReceiver(base, M).snr;
  assert.ok(snr(Mopt) > snr(Mopt * 0.999) && snr(Mopt) > snr(Mopt * 1.001));
  close(snr(Mopt), 1.7854, 1e-4);
  // The old page default (10 nA bulk dark current) gives M_opt = 78.72.
  close(optimumGain({ ...base, darkCurrent: 10e-9 }), 78.72, 1e-4);
  // A huge load leaves no thermal noise to beat: the optimum clamps to M = 1.
  assert.equal(optimumGain({ ...base, loadResistance: 1e30 }), 1);
  assert.equal(optimumGain({ ...base, photocurrent: 0, darkCurrent: 0 }), Infinity);
  assert.equal(apdReceiver({ ...base, photocurrent: 0 }, 10).snr, 0);
  assert.ok(Number.isNaN(apdReceiver({ ...base, loadResistance: 0 }, 10).snr));
});
