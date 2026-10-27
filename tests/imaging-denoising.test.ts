import { test } from "node:test";
import assert from "node:assert/strict";

import {
  boxNoiseRatio,
  boxTransfer,
  gaussianNoiseRatio,
  gaussianTransfer,
  halfResponseFrequency,
  medianNoiseRatio,
  medianVarianceFactor,
  snrGainDb,
  visuShrinkThreshold,
} from "../src/physics/imaging/denoising";
import {
  coherentCutoffPeriod,
  fusedSnr,
  incoherentCutoffPeriod,
  singleViewSnr,
  spaceBandwidthGain,
  syntheticNa,
} from "../src/physics/imaging/computational-imaging";
import { createRng, gaussian } from "../src/physics/random";

const close = (a: number, b: number, rel: number) =>
  assert.ok(Math.abs(a - b) <= rel * Math.abs(b), `${a} vs ${b} (rel ${rel})`);

test("box filter: σ/k, 3 × 3 gives 9.54 dB; half response where sin²(πf) = 3/8", () => {
  // Var = σ²Σw² with w = 1/9 (Gonzalez & Woods): σ/3, 20 log₁₀ 3 = 9.5424 dB.
  assert.equal(boxNoiseRatio(3), 1 / 3);
  close(snrGainDb(boxNoiseRatio(3)), 9.542425, 1e-6);
  // H = sin 3πf/(3 sin πf) = 1 − (4/3) sin²πf = 0.5 → f = asin(√(3/8))/π = 0.209785 cycles/pixel (hand calculation).
  close(halfResponseFrequency((f) => boxTransfer(3, f)), Math.asin(Math.sqrt(3 / 8)) / Math.PI, 1e-9);
  assert.equal(boxTransfer(3, 0), 1);
  close(boxTransfer(3, 0.5), -1 / 3, 1e-12); // sin(1.5π)/(3 sin(0.5π))
  assert.ok(Number.isNaN(boxNoiseRatio(4)));
});

test("Gaussian filter tends to the continuous limits 1/(2√π σ) and √(ln2/2)/(πσ)", () => {
  // ∫g² for a unit-area 1-D Gaussian is 1/(2√π σ); its transfer exp(−2π²σ²f²) halves at f = √(ln 2/2)/(πσ).
  close(gaussianNoiseRatio(5), 1 / (2 * Math.sqrt(Math.PI) * 5), 5e-3);
  close(halfResponseFrequency((f) => gaussianTransfer(5, f)), Math.sqrt(Math.LN2 / 2) / (Math.PI * 5), 5e-3);
  // σ_s = 0.5 px stays above 0.5 up to Nyquist; a non-positive width is rejected.
  assert.ok(Number.isNaN(halfResponseFrequency((f) => gaussianTransfer(0.5, f))));
  assert.ok(Number.isNaN(gaussianNoiseRatio(0)));
});

test("median of 3 normals has variance 1 − √3/π; large n tends to π/(2n)", () => {
  // Closed form for n = 3 (David & Nagaraja, Order Statistics): 0.448671.
  close(medianVarianceFactor(3), 1 - Math.sqrt(3) / Math.PI, 1e-7);
  assert.equal(medianVarianceFactor(1), 1);
  // Asymptotic efficiency 2/π: var → π/(2n); at n = 225 the exact value is within 0.3 %.
  close(medianVarianceFactor(225), Math.PI / 450, 3e-3);
  assert.ok(Number.isNaN(medianVarianceFactor(4)));
});

test("3 × 3 median noise ratio matches a seeded Monte Carlo", () => {
  const rng = createRng(2026);
  const trials = 100_000;
  let sumSq = 0;
  for (let t = 0; t < trials; t++) {
    const v = Array.from({ length: 9 }, () => gaussian(rng)).sort((a, b) => a - b);
    sumSq += v[4] * v[4];
  }
  // Var(median of 9) = 0.166101; the Monte Carlo std error of the variance is ≈ 0.5 %.
  close(medianNoiseRatio(3) ** 2, sumSq / trials, 0.02);
  close(medianNoiseRatio(3), Math.sqrt(0.166101), 1e-5);
});

test("VisuShrink threshold σ√(2 ln N) for a 512 × 512 image", () => {
  // √(2 ln 262144) = 4.99533 (hand calculation, Donoho & Johnstone 1994).
  close(visuShrinkThreshold(1, 512 * 512), 4.995328, 1e-6);
  assert.ok(Number.isNaN(visuShrinkThreshold(1, 1)));
});

test("fused SNR: √N per view, read-noise penalty at a fixed total dose", () => {
  // S = 1000, B = 10, σ_r = 2: SNR₁ = 1000/√1014 = 31.404, ×√25 = 157.02 (ROADMAP golden, hand calculation).
  const base = { signal: 1000, background: 10, read: 2, views: 25 } as const;
  close(singleViewSnr({ ...base, views: 1, mode: "perView" }), 31.4037, 1e-4);
  close(fusedSnr({ ...base, mode: "perView" }), 157.019, 1e-4);
  // Same 1000 e⁻ split over 25 views: 1000/√(1000 + 10 + 25·4) = 30.015.
  close(fusedSnr({ ...base, mode: "totalDose" }), 1000 / Math.sqrt(1110), 1e-12);
  close(singleViewSnr({ ...base, mode: "totalDose" }), 40 / Math.sqrt(40 + 0.4 + 4), 1e-12);
  // One view: both modes agree.
  assert.equal(fusedSnr({ ...base, views: 1, mode: "totalDose" }), fusedSnr({ ...base, views: 1, mode: "perView" }));
  assert.ok(Number.isNaN(fusedSnr({ ...base, views: 0, mode: "perView" })));
});

test("Fourier ptychography: NA 0.08 + 0.42 → synthetic 0.5", () => {
  // Zheng, Horstmeyer & Yang 2013: 2× objective (NA 0.08), illumination NA 0.42, synthetic NA 0.5.
  close(syntheticNa(0.08, 0.42), 0.5, 1e-12);
  close(coherentCutoffPeriod(632e-9, 0.5), 1.264e-6, 1e-12);
  close(incoherentCutoffPeriod(632e-9, 0.08), 3.95e-6, 1e-12);
  close(spaceBandwidthGain(0.08, 0.42), 39.0625, 1e-12);
  assert.equal(spaceBandwidthGain(0.1, 0), 1);
  assert.ok(Number.isNaN(syntheticNa(0, 0.4)));
});
