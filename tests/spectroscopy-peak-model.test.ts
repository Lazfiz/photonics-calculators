import test from "node:test";
import assert from "node:assert/strict";

import { integrateSimpson } from "../src/physics/math";
import {
  bandStats,
  bandSum,
  dipDepth,
  fitHeights,
  franckCondonWeights,
  gaussianNoise,
  peakArea,
  peakShape,
  vibronicLineShape,
  vibronicSpectrum,
  vibronicSpectrumNm,
} from "../src/physics/spectroscopy/peak-model";
import { stokesShift } from "../src/physics/spectroscopy/stokes-shift";

const close = (actual: number, expected: number, rel: number) =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${actual} vs ${expected}`);

test("Stokes shift 480 → 520 nm", () => {
  // Hand calculation: 10⁷ (1/480 − 1/520) = 1602.564 cm⁻¹; × hc = 1239.842 eV·nm / 10⁷ → 0.198693 eV (part-0 audit golden).
  const s = stokesShift(480, 520);
  assert.equal(s.dNm, 40);
  close(s.dCm, 1602.5641, 1e-7);
  close(s.dEv, 0.1986926, 1e-6);
  assert.ok(stokesShift(520, 480).dCm < 0); // anti-Stokes
  assert.ok(Number.isNaN(stokesShift(0, 520).dCm));
});

test("peak areas: Gaussian √(π/(4 ln 2)) w, pseudo-Voigt mixes the Gaussian and Lorentzian (π/2) w", () => {
  close(peakArea(1, 1, "gaussian"), 1.0644670194, 1e-10);
  close(peakArea(2, 3, "lorentzian"), 3 * Math.PI, 1e-14);
  // Independent check: Simpson over ±10⁵ w (the Lorentzian tail beyond carries 2/(π·4·10⁵) ≈ 1.6e-6 of its area).
  const numeric = integrateSimpson((x) => peakShape(x, 1, "pseudo-voigt", 0.3), -1e5, 1e5, 2e6);
  close(numeric, peakArea(1, 1, "pseudo-voigt", 0.3), 2e-6);
  assert.equal(peakShape(0.5, 1, "gaussian"), 0.5); // half maximum at x = w/2
  assert.equal(peakShape(0.5, 1, "lorentzian"), 0.5);
  assert.ok(Number.isNaN(peakShape(0, 0, "gaussian")));
});

test("two equal peaks resolve at the Sparrow limit: 2σ for Gaussians, w/√3 for Lorentzians", () => {
  // f″(midpoint) = 0 at separation d = 2σ = w/√(2 ln 2) = 0.8493 w (Gaussian) and d = w/√3 = 0.5774 w (Lorentzian).
  const pair = (d: number, profile: "gaussian" | "lorentzian") => (x: number) =>
    bandSum(x, [{ center: 0, fwhm: 1, height: 1 }, { center: d, fwhm: 1, height: 1 }], profile);
  assert.equal(dipDepth(pair(0.84, "gaussian"), 0, 0.84), 0);
  assert.ok(dipDepth(pair(0.86, "gaussian"), 0, 0.86) > 1e-4);
  assert.equal(dipDepth(pair(0.57, "lorentzian"), 0, 0.57), 0);
  assert.ok(dipDepth(pair(0.59, "lorentzian"), 0, 0.59) > 1e-5);
  // At d = w the midpoint is 2·2^(−1) = 1; the maximum from a dense brute-force scan.
  let max = 0;
  for (let i = 0; i <= 1e5; i++) max = Math.max(max, pair(1, "gaussian")(i / 1e5));
  close(dipDepth(pair(1, "gaussian"), 0, 1), 1 - 1 / max, 1e-4);
});

test("height fit recovers exact data and gives the analytic standard error and correlation", () => {
  const xs = Array.from({ length: 1201 }, (_, i) => -6 + (12 * i) / 1200); // step Δ = 0.01
  const shapes = [{ center: -0.5, fwhm: 1 }, { center: 0.5, fwhm: 1 }];
  const exact = fitHeights(xs, xs.map((x) => bandSum(x, [{ ...shapes[0], height: 0.7 }, { ...shapes[1], height: 1.2 }], "gaussian")), shapes, "gaussian");
  assert.ok(exact);
  close(exact.heights[0], 0.7, 1e-12);
  close(exact.heights[1], 1.2, 1e-12);
  // corr(h₁, h₂) = −∫G₁G₂ / ∫G² = −exp(−2 ln 2 (d/w)²) = −1/4 at d = w (product of two Gaussians).
  close(exact.correlation[0][1], -0.25, 1e-9);

  // One isolated peak: SE(h) = s / √(Σ G²) with Σ G² ≈ w √(π/(8 ln 2)) / Δ and s² = RSS/(n − 1) (Numerical Recipes 3rd ed., ch. 15).
  const noise = gaussianNoise(xs.length, 7);
  const one = [{ center: 0, fwhm: 1 }];
  const fit = fitHeights(xs, xs.map((x, i) => peakShape(x, 1, "gaussian") + 0.02 * noise[i]), one, "gaussian");
  assert.ok(fit);
  const s = fit.residualRms * Math.sqrt(xs.length / (xs.length - 1));
  close(fit.stdErrors[0], s / Math.sqrt(Math.sqrt(Math.PI / (8 * Math.LN2)) / 0.01), 1e-6);
  close(s, 0.02, 0.05);
  assert.equal(fitHeights(xs, xs, [shapes[0], shapes[0]], "gaussian"), null); // identical peaks: singular
});

test("seeded Gaussian noise: reproducible, zero mean, unit variance", () => {
  const a = gaussianNoise(100000, 42);
  assert.deepEqual(a.slice(0, 5), gaussianNoise(5, 42));
  const mean = a.reduce((s, v) => s + v, 0) / a.length;
  const sd = Math.sqrt(a.reduce((s, v) => s + (v - mean) ** 2, 0) / a.length);
  assert.ok(Math.abs(mean) < 0.01); // 3.2 standard errors
  close(sd, 1, 0.01);
});

test("band statistics of one Gaussian: maximum, FWHM and centroid", () => {
  const st = bandStats((x) => bandSum(x, [{ center: 520, fwhm: 35, height: 1 }], "gaussian"), 400, 700);
  close(st.peak, 520, 1e-12);
  close(st.fwhm, 35, 1e-10);
  close(st.centroid, 520, 1e-10);
  assert.ok(Number.isNaN(bandStats(() => 1, 0, 1).fwhm)); // never falls to half: no width
});

test("Huang–Rhys progression: Poisson weights and mirror-image centroids ν̃₀₀ ∓ S ν̃_v", () => {
  const w = franckCondonWeights(1);
  close(w[0], Math.exp(-1), 1e-14);
  close(w[2], Math.exp(-1) / 2, 1e-14);
  close(w.reduce((s, p) => s + p, 0), 1, 1e-9);
  assert.deepEqual(franckCondonWeights(0), [1]);
  // First moment of a Poisson-weighted comb is ν̃₀₀ ∓ S ν̃_v (Huang & Rhys 1950): a Stokes shift of 2 S ν̃_v = 2800 cm⁻¹.
  const band = { nu00: 20000, nuVib: 1400, S: 1, fwhm: 1000 };
  close(bandStats((n) => vibronicLineShape(n, band, "emission"), 5000, 35000).centroid, 18600, 1e-8);
  close(bandStats((n) => vibronicLineShape(n, band, "absorption"), 5000, 35000).centroid, 21400, 1e-8);
});

test("vibronic band maxima with the ν̃ and ν̃³ factors and the λ⁻² Jacobian", () => {
  // S = 0, one Gaussian line at ν̃₀ = 20000 cm⁻¹, w = 3000 cm⁻¹. Hand derivation: the maximum of ν̃ᵏ exp(−4 ln 2 (ν̃−ν̃₀)²/w²)
  // solves k/ν̃ = 8 ln 2 (ν̃−ν̃₀)/w², ν̃* = [ν̃₀ + √(ν̃₀² + k w²/(2 ln 2))]/2. Absorption k = 1; emission per nm
  // k = 3 + 2 (ν̃³ and the 10⁷/λ² = ν̃²/10⁷ Jacobian).
  const b0 = { nu00: 20000, nuVib: 1400, S: 0, fwhm: 3000 };
  const star = (k: number) => (20000 + Math.sqrt(20000 ** 2 + (k * 3000 ** 2) / (2 * Math.LN2))) / 2;
  close(bandStats((n) => vibronicSpectrum(n, b0, "absorption"), 5000, 40000).peak, star(1), 1e-8);
  close(bandStats((l) => vibronicSpectrumNm(l, b0, "emission"), 300, 800).peak, 1e7 / star(5), 1e-6);
  assert.equal(vibronicSpectrum(-1, b0, "emission"), 0);
});
