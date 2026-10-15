import test from "node:test";
import assert from "node:assert/strict";

import {
  analogSnr, anodeSensitivity, channelGain, channelStrikes, channelYieldPerStrike, dynodeExcessNoise, dynodeGain, excessNoiseFromFwhm,
  FWHM_PER_SIGMA, hexagonalPitch, maximumChannelGain, optimumLdRatio, photonCountingSnr, pulseResolutionFwhm,
  saturatedChannelGain, stackedGain, uniformDynodes,
} from "../src/physics/detectors/electron-multiplier";

const close = (actual: number, expected: number, rel: number, msg = "") =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${msg} ${actual} vs ${expected}`);

test("dynode chain gain and noise figure (Hamamatsu PMT handbook, 4th ed., Eq. 4-25 to 4-26)", () => {
  const chain = uniformDynodes(3.5, 10);
  // 3.5¹⁰ = 275 854.735…
  close(dynodeGain(chain), 275854.7353515625, 1e-12);
  // Equal stages: F = 1 + (1 − δ⁻ⁿ)/(δ − 1) = 1 + 0.4·(1 − 3.6252e-6) = 1.39999855, just under δ/(δ − 1) = 1.4.
  close(dynodeExcessNoise(chain), 1 + (1 - 3.5 ** -10) / 2.5, 1e-14);
  close(dynodeExcessNoise(chain), 1.3999985499, 1e-9);
  close(dynodeExcessNoise(uniformDynodes(3.5, 60)), 3.5 / 2.5, 1e-14);
  // Two Poisson stages of mean 4 then 2, by the branching-process variance: E = 8,
  // Var = E[Z₁]·Var(2) + Var(Z₁)·2² = 4·2 + 4·4 = 24, F = 1 + 24/64 = 1.375 = 1 + 1/4 + 1/8.
  close(dynodeExcessNoise([4, 2]), 1.375, 1e-15);
  assert.equal(dynodeGain([]), 1);
  assert.equal(dynodeExcessNoise([]), 1);
  assert.ok(Number.isNaN(dynodeGain([3, 0])));
  assert.ok(Number.isNaN(dynodeExcessNoise([3, -1])));
  assert.deepEqual(uniformDynodes(3, 2.5), []);
});

test("shot-noise SNR of the multiplied photocurrent and of photon counting", () => {
  // PMT page defaults: 2.5e5 photoelectrons/s, 1 nA anode dark current at G = 3.5¹⁰ → 22 626.07 e⁻/s at the
  // cathode, 100 MHz, F = 1.39999855: 2.5e5/√(2·1e8·272 626.07·1.39999855) = 0.0286139.
  const dark = 1e-9 / (1.602176634e-19 * 275854.7353515625);
  close(dark, 22626.0719, 1e-8);
  close(analogSnr(2.5e5, dark, 100e6, 1.3999985499), 0.0286139310, 1e-8);
  // Hamamatsu Eq. 4-31 (F = 1, no dark): SNR = √(I_k/(2eB)) = 1.75e3·√(I_k[µA]/B[MHz]); 1 µA, 1 MHz → √3.1207539e6 = 1766.5657.
  close(analogSnr(1e-6 / 1.602176634e-19, 0, 1e6, 1), 1766.5657466, 1e-9);
  // Counting over 1 s: 2500/√2510 = 49.900299; analog in B = 1/(2T) with F = 2: 2500/√(2·0.5·2510·2) = 35.284840.
  close(photonCountingSnr(2500, 10, 1), 49.900299003, 1e-10);
  close(analogSnr(2500, 10, 0.5, 2), 35.284839809, 1e-10);
  // Counting in T equals analog in B = 1/(2T) with F = 1.
  close(analogSnr(2500, 10, 0.5, 1), photonCountingSnr(2500, 10, 1), 1e-14);
  assert.ok(Number.isNaN(analogSnr(0, 0, 1e6, 1)));
  assert.ok(Number.isNaN(analogSnr(1, 0, 1e6, 0.5)));
  assert.ok(Number.isNaN(photonCountingSnr(1, 0, 0)));
});

test("anode sensitivity, single-electron noise figure and pulse resolution", () => {
  // qλ/(hc) at 410 nm = 410/1239.841984 = 0.3306873 A/W; × QE 0.25 × G 1e6 = 82 671.83 A/W.
  close(anodeSensitivity(0.25, 410e-9, 1e6), 82671.825, 1e-7);
  assert.ok(Number.isNaN(anodeSensitivity(1.2, 410e-9, 1e6)));
  close(FWHM_PER_SIGMA, 2.3548200450, 1e-10);
  // A saturated single-electron peak of 50 % FWHM (Wiza 1979, "50 % or better"): F = 1 + (0.5/2.35482)² = 1.045084.
  close(excessNoiseFromFwhm(0.5), 1.0450842200, 1e-9);
  assert.equal(excessNoiseFromFwhm(0), 1);
  // 25 photoelectrons with F = 2 (exponential pulse heights): 2.35482·√(2/25) = 66.60 % FWHM; with F = 1, 47.10 %.
  close(pulseResolutionFwhm(25, 2), 0.6660436889, 1e-9);
  close(pulseResolutionFwhm(25, 1), 0.4709640090, 1e-9);
  assert.ok(Number.isNaN(pulseResolutionFwhm(0, 2)));
});

test("Eberhardt–Schagen channel gain (Wiza 1979 eq. 1–4)", () => {
  // A = 0.2, V₀ = 1 eV, 1 kV, L/d = 50: δ = 0.2·1000/(2·50) = 2 per strike, 4·2500/1000 = 10 strikes → 2¹⁰.
  close(channelGain(1000, 50, 0.2, 1), 1024, 1e-13);
  close(channelStrikes(1000, 50, 1), 10, 1e-15);
  close(channelYieldPerStrike(1000, 50, 0.2, 1), 2, 1e-15);
  // Optimum L/d = A·V/(2√(e·V₀)) = 60.653 (Wiza: 60), gain there exp(A²V/(2e)) = e^{7.357589} = 1568.05.
  // Wiza's 1635 comes from rounding 0.184·A² to 0.0074.
  close(optimumLdRatio(1000, 0.2, 1), 60.653065971, 1e-10);
  close(maximumChannelGain(1000, 0.2), 1568.0511529, 1e-10);
  close(channelGain(1000, optimumLdRatio(1000, 0.2, 1), 0.2, 1), maximumChannelGain(1000, 0.2), 1e-12);
  // The optimum is a maximum: either side is lower.
  assert.ok(channelGain(1000, 55, 0.2, 1) < 1568.05 && channelGain(1000, 66, 0.2, 1) < 1568.05);
  // A yield below one per strike attenuates: 200 V at L/d 50 gives δ = 0.4 over 50 strikes.
  close(channelGain(200, 50, 0.2, 1), 0.4 ** 50, 1e-10);
  assert.ok(Number.isNaN(channelGain(0, 50, 0.2, 1)));
  assert.ok(Number.isNaN(channelGain(1000, 50, 0.2, 0)));
});

test("space-charge limit and hexagonal channel pitch", () => {
  // Wiza 1979 §2.2: a 1 mm channel saturates at 10⁸, so a 10 µm channel at 10⁶.
  close(saturatedChannelGain(1e-3), 1e8, 1e-15);
  close(saturatedChannelGain(10e-6), 1e6, 1e-12);
  // 25 µm pores: 2.5e6, Wiza's "low 10⁶ range" for curved-channel plates.
  close(saturatedChannelGain(25e-6), 2.5e6, 1e-12);
  // Stacks: 1024² = 1 048 576; the optimum at A = 1, 2 kV (≈ 5.9e159 per plate) overflows for two plates.
  assert.equal(stackedGain(1024, 2), 1048576);
  assert.ok(Number.isNaN(stackedGain(maximumChannelGain(2000, 1), 2)));
  assert.ok(Number.isNaN(stackedGain(1024, 0)));
  // Hexagonal lattice: OAR = π d²/(2√3 p²). 10 µm at 60 %: p = 10·√(π/(2√3·0.6)) = 12.2943 µm.
  close(hexagonalPitch(10e-6, 0.6), 12.294305471e-6, 1e-9);
  // Touching channels: OAR = π/(2√3) = 0.9069 gives p = d.
  close(hexagonalPitch(10e-6, Math.PI / (2 * Math.sqrt(3))), 10e-6, 1e-14);
  assert.ok(Number.isNaN(hexagonalPitch(10e-6, 0.95)));
  assert.ok(Number.isNaN(saturatedChannelGain(0)));
});
