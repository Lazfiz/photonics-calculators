import test from "node:test";
import assert from "node:assert/strict";

import {
  cameraNoise, cameraSnr, compressiveResponse, dynamicRangeDb, emExcessNoiseFactorSq, emMaxSignal, emStageProbability,
  pixelCapacitance, quantizationNoise,
} from "../src/physics/detectors/camera-snr";
import { darkReadCrossoverTemperature } from "../src/physics/detectors/dark-current";

const close = (actual: number, expected: number, rel: number, msg = "") =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${msg} ${actual} vs ${expected}`);

/** Galton–Watson moments of an N-stage register, each stage doubling an electron with probability p: 1 + Var/E². */
function galtonWatsonF2(gain: number, stages: number): number {
  const p = gain ** (1 / stages) - 1;
  let mean = 1;
  let variance = 0;
  for (let k = 0; k < stages; k++) {
    variance = variance * (1 + p) ** 2 + mean * p * (1 - p);
    mean *= 1 + p;
  }
  return 1 + variance / mean ** 2;
}

test("EM register excess noise (Robbins & Hadwen 2003, doi:10.1109/TED.2003.813462)", () => {
  // F² = 2(G − 1)·G^(−(N+1)/N) + 1/G: 2·99·100^(−605/604) + 0.01 = 1.98·e^(−ln100/604) + 0.01 = 1.974961.
  close(emExcessNoiseFactorSq(100, 604), 2 * 99 * 100 ** (-605 / 604) + 0.01, 1e-12);
  close(emExcessNoiseFactorSq(100, 604), 1.974961, 1e-6);
  // Independent check: the branching-process moments of a binomial stage.
  for (const [g, n] of [[100, 604], [1000, 604], [37, 20], [1000, 10]] as const) {
    close(emExcessNoiseFactorSq(g, n), galtonWatsonF2(g, n), 1e-10, `G=${g} N=${n}`);
  }
  // Limits: G = 1 is noiseless, p = 1 (G = 2^N) is a noiseless doubler, N → ∞ gives 2 − 1/G.
  assert.equal(emExcessNoiseFactorSq(1, 604), 1);
  close(emExcessNoiseFactorSq(1024, 10), 1, 1e-12);
  close(emExcessNoiseFactorSq(1000, 1e9), 2 - 1 / 1000, 1e-8);
  assert.ok(Number.isNaN(emExcessNoiseFactorSq(1025, 10))); // would need p > 1
  assert.ok(Number.isNaN(emExcessNoiseFactorSq(0.5, 604)));
  // p = 100^(1/604) − 1 = 0.7653 %.
  close(emStageProbability(100, 604), 7.6531e-3, 1e-4);
});

test("pixel SNR with and without EM gain (Janesick, Photon Transfer, 2007)", () => {
  // em-gain defaults: S = 10, CIC = 0.001, σ_r = 50 e⁻. Without gain 10/√(10.001 + 2500) = 0.199601.
  close(cameraSnr({ signal: 10, cic: 0.001, read: 50 }), 10 / Math.sqrt(2510.001), 1e-12);
  // At G = 500: F² = 1.977568, noise² = 1.977568·10.001 + 0.1² = 19.787659, SNR = 2.248033.
  const snr500 = cameraSnr({ signal: 10, cic: 0.001, read: 50, gain: 500, excessNoiseFactorSq: emExcessNoiseFactorSq(500, 604) });
  close(snr500, 2.248033, 1e-6);
  // ... and it keeps rising: 2.253123 at 10⁴ (the knownIssue's 2.252 used F² rounded).
  const snr1e4 = cameraSnr({ signal: 10, cic: 0.001, read: 50, gain: 1e4, excessNoiseFactorSq: emExcessNoiseFactorSq(1e4, 604) });
  assert.ok(snr1e4 > snr500);
  close(snr1e4, 2.253123, 1e-6);
  // electron-multiplying defaults: S = 10, D = 0.001, σ_r = 60 e⁻ at G = 1000 vs a 1.5 e⁻ sCMOS: 2.2491 vs 2.8570.
  close(cameraSnr({ signal: 10, dark: 0.001, read: 60, gain: 1000, excessNoiseFactorSq: emExcessNoiseFactorSq(1000, 604) }), 2.249130, 1e-6);
  close(cameraSnr({ signal: 10, dark: 0.001, read: 1.5 }), 10 / Math.sqrt(12.251), 1e-12);
  // Edge: no signal and no noise has no SNR; negative inputs are invalid.
  assert.ok(Number.isNaN(cameraSnr({ signal: 0, read: 0 })));
  assert.equal(cameraSnr({ signal: 0, read: 5 }), 0);
  assert.ok(Number.isNaN(cameraNoise({ signal: -1, read: 5 })));
  assert.ok(Number.isNaN(cameraNoise({ signal: 1, read: 5, gain: 0.5 })));
});

test("dynamic range, EM register well and pixel capacitance", () => {
  // iXon Ultra 897 (Andor specifications): 180 ke⁻ pixel well, 800 ke⁻ register well, 89 e⁻ at 17 MHz.
  // Under gain G the register caps the input at 800k/G and the floor is 89/G: DR = 20·log₁₀(800000/89) = 79.074 dB.
  for (const g of [10, 300, 1000]) close(dynamicRangeDb(emMaxSignal(180e3, 800e3, g), 89 / g), 79.07400, 1e-6, `G=${g}`);
  // Below G = 800/180 the pixel well limits instead.
  assert.equal(emMaxSignal(180e3, 800e3, 2), 180e3);
  // well-capacity defaults: 50 ke⁻, 5 e⁻ → 80.00 dB; C = 50000·1.602176634e-19/1.5 V = 5.340589 fF.
  close(dynamicRangeDb(50e3, 5), 80, 1e-12);
  close(pixelCapacitance(50e3, 1.5), 5.34058878e-15, 1e-9);
  assert.ok(Number.isNaN(dynamicRangeDb(50e3, 0)));
  assert.ok(Number.isNaN(pixelCapacitance(50e3, 0)));
});

test("saturation: SNR at full well, quantization noise and the compressive response", () => {
  // saturation defaults: 20 ke⁻, 5 e⁻, 16 bit. DR = 20·log₁₀(4000) = 72.0412 dB, SNR at FWC 20·log₁₀(20000/√20025) = 43.0049 dB.
  close(dynamicRangeDb(20e3, 5), 72.04120, 1e-6);
  close(20 * Math.log10(cameraSnr({ signal: 20e3, read: 5 })), 43.00487, 1e-6);
  // Δ = 20000/65535 = 0.305180 e⁻/DN → Δ/√12 = 0.0880979 e⁻; 8 bit: 78.431/√12 = 22.641 e⁻ dominates the 5 e⁻.
  close(quantizationNoise(20e3 / 65535), 0.0880979, 1e-5);
  close(quantizationNoise(20e3 / 255), 22.6410, 1e-5);
  // S·(1 − n·S/W): 0.5 % at full well, a quarter of that (in units of W) at half well, flat above.
  assert.equal(compressiveResponse(20e3, 20e3, 0.005), 19900);
  assert.equal(compressiveResponse(10e3, 20e3, 0.005), 9975);
  assert.equal(compressiveResponse(30e3, 20e3, 0.005), 19900);
  assert.equal(compressiveResponse(0, 20e3, 0.005), 0);
  assert.ok(Number.isNaN(compressiveResponse(1, 20e3, 0.6))); // not monotonic above n = 0.5
});

test("EMCCD dynamic range at unity gain is pixel-well limited, 20·log10(180000/89) = 66.11765 dB", () => {
  assert.ok(Math.abs(dynamicRangeDb(emMaxSignal(180e3, 800e3, 1), 89) - 66.11765) < 1e-4);
});

test("dark/read crossover at the dark-current page defaults is 25 + 6·log2(250) = 72.7947 °C", () => {
  assert.ok(Math.abs(darkReadCrossoverTemperature(5, 0.1 * 1, 25, 6) - 72.7947) < 1e-3);
});

// Janesick, Photon Transfer (SPIE 2007): quantisation noise Δ/√12 adds in quadrature to the read noise.
// Hand calculation, FWC 20000 e⁻, σ_r 5 e⁻, 12-bit: Δ = 20000/4095 = 4.8840, σ_q = 1.4099,
// DR = 20·log10(20000/√(25 + 1.9878)) = 71.709 dB (vs 72.04 dB for read noise alone).
test("saturation page default: 12-bit ADC DR = 71.709 dB", () => {
  const sq = quantizationNoise(20000 / (2 ** 12 - 1));
  close(sq, 1.4099, 1e-4);
  close(dynamicRangeDb(20000, Math.hypot(5, sq)), 71.709, 1e-5);
  close(dynamicRangeDb(20000, 5), 72.0412, 1e-5);
});
