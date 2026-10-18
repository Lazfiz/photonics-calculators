import test from "node:test";
import assert from "node:assert/strict";

import { besselJ } from "../src/physics/math";
import {
  GAUSSIAN_FWHM_PER_SIGMA, PSF_SIGMA_COEFFICIENT, abbeLateralFwhm, axialPsfFwhm, expansionEffectiveResolution,
  localizationPrecision, mortensenPrecision, nyquistResolution, rayleighDistance, simCutoff, simLateralFwhm,
  simRawImageCount, smlmEffectiveResolution, stedLateralFwhm,
} from "../src/physics/imaging/super-resolution";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const nm = 1e-9;

test("STED law uses the λ/(2NA) FWHM, not the Rayleigh distance (page defaults)", () => {
  // Westphal & Hell, PRL 94, 143903 (2005): d = λ/(2NA√(1 + ζ)). 580 nm, NA 1.4, ζ = 30:
  // λ/(2NA) = 207.1429 nm; / √31 = 37.2041 nm. The page computed 0.61λ/NA/√31 = 45.3891 nm (1.22×).
  assertRel(abbeLateralFwhm(580 * nm, 1.4), 207.1429 * nm, 1e-6, "Abbe");
  assertRel(stedLateralFwhm(580 * nm, 1.4, 30), 37.2041 * nm, 1e-5, "STED");
  assertRel(rayleighDistance(580 * nm, 1.4) / Math.sqrt(31) / stedLateralFwhm(580 * nm, 1.4, 30), 1.22, 1e-12, "old/new");
  assert.equal(stedLateralFwhm(580 * nm, 1.4, 0), abbeLateralFwhm(580 * nm, 1.4), "ζ = 0 is confocal");
});

test("Gaussian σ = 0.21 λ/NA agrees with a least-squares fit to the Airy PSF", () => {
  // Independent check of Zhang et al. (2007): fit A exp(−r²/2s²) to [2J₁(v)/v]², v = 2πx (x in λ/NA),
  // weighted by the area element 2πx dx. The best s is 0.206 λ/NA (within 2 % of 0.21).
  const airy = (x: number) => { const v = 2 * Math.PI * x; return v === 0 ? 1 : (2 * besselJ(1, v) / v) ** 2; };
  const xs: number[] = [];
  for (let x = 0.001; x < 3; x += 0.004) xs.push(x);
  const ys = xs.map(airy);
  let best = { err: Infinity, s: 0 };
  for (let s = 0.18; s < 0.24; s += 0.0005) {
    let num = 0, den = 0;
    xs.forEach((x, i) => { const g = Math.exp(-x * x / (2 * s * s)); num += ys[i] * g * x; den += g * g * x; });
    const A = num / den;
    let err = 0;
    xs.forEach((x, i) => { err += (ys[i] - A * Math.exp(-x * x / (2 * s * s))) ** 2 * x; });
    if (err < best.err) best = { err, s };
  }
  assertRel(best.s, PSF_SIGMA_COEFFICIENT, 0.025, "LSQ σ");
});

test("shot-noise localization precision (Thompson et al. 2002, no pixelation or background)", () => {
  // 580 nm, NA 1.4, N = 5000: s = 0.21 · 580/1.4 = 87.0 nm; σ = 87.0/√5000 = 1.230366 nm; FWHM 2.897280 nm.
  assertRel(localizationPrecision(580 * nm, 1.4, 5000), 1.230366 * nm, 1e-5, "σ");
  assertRel(localizationPrecision(580 * nm, 1.4, 5000) * GAUSSIAN_FWHM_PER_SIGMA, 2.897280 * nm, 1e-5, "FWHM");
  // 1/√N: four times the photons halves σ.
  assertRel(localizationPrecision(580 * nm, 1.4, 1250) / localizationPrecision(580 * nm, 1.4, 5000), 2, 1e-12, "√N");
});

test("axial diffraction limit and domain guards", () => {
  // 0.88 · 580/(1.52 − √(1.52² − 1.4²)) = 510.4/0.928054 = 549.968 nm.
  assertRel(axialPsfFwhm(580 * nm, 1.52, 1.4), 549.968 * nm, 1e-5, "axial");
  assert.ok(Number.isNaN(axialPsfFwhm(580 * nm, 1.33, 1.4)), "NA > n");
  assert.ok(Number.isNaN(stedLateralFwhm(580 * nm, 1.4, -1)));
  assert.ok(Number.isNaN(localizationPrecision(580 * nm, 1.4, 0)));
  assert.ok(Number.isNaN(abbeLateralFwhm(580 * nm, 0)));
});

// Li₂(z) for z ≤ 0: power series on [−1, 0], inversion Li₂(z) = −π²/6 − ½ ln²(−z) − Li₂(1/z) below −1.
function dilog(z: number): number {
  if (z < -1) return -(Math.PI ** 2) / 6 - 0.5 * Math.log(-z) ** 2 - dilog(1 / z);
  let sum = 0, zk = 1;
  for (let k = 1; k < 100000; k++) { zk *= z; sum += zk / (k * k); if (Math.abs(zk) < 1e-17) break; }
  return sum;
}

test("Mortensen localization precision (Nat. Methods 7, 377 (2010), eqs. 5–6)", () => {
  // 647 nm, NA 1.49, a = 100 nm, N = 1000, b² = 10: σ = 0.21·647/1.49 = 91.1879 nm, σ_a² = σ² + a²/12 = 9148.570 nm².
  // Eq. 6 (least squares): 9.14857 · (16/9 + 8π · 9148.57 · 10/(1000 · 10⁴)) = 18.3676 nm² → 4.2857 nm.
  const args = [647 * nm, 1.49, 1000, 100 * nm, 10] as const;
  assertRel(mortensenPrecision(...args), 4.2857 * nm, 1e-4, "LS");
  assertRel(mortensenPrecision(...args, { emccd: true }) / mortensenPrecision(...args), Math.SQRT2, 1e-12, "EMCCD ×√2");
  // Eq. 5 (MLE): ∫₀¹ ln t/(1 + τt) dt = Li₂(−τ)/τ, τ = N a²/(2π σ_a² b²). Checked at τ = 17.4 and 1.7·10⁵.
  for (const b2 of [10, 0.001]) {
    const sa2 = (0.21 * 647 / 1.49) ** 2 + 1e4 / 12;
    const tau = (1000 * 1e4) / (2 * Math.PI * sa2 * b2);
    const ref = Math.sqrt((sa2 / 1000) / (1 + dilog(-tau) / tau)) * nm;
    assertRel(mortensenPrecision(647 * nm, 1.49, 1000, 100 * nm, b2, { estimator: "mle" }), ref, 1e-9, `MLE b² ${b2}`);
  }
  // No background: MLE reaches σ_a/√N = 3.02466 nm, LS stays 4/3 above it (the 16/9 variance factor).
  const mle0 = mortensenPrecision(647 * nm, 1.49, 1000, 100 * nm, 0, { estimator: "mle" });
  assertRel(mle0, 3.02466 * nm, 1e-5, "MLE b = 0");
  assertRel(mortensenPrecision(647 * nm, 1.49, 1000, 100 * nm, 0) / mle0, 4 / 3, 1e-12, "LS/MLE");
  // Pixel → 0 and no background: LS → (4/3) · 0.21λ/(NA√N), the Thompson shot-noise limit × 4/3.
  assertRel(mortensenPrecision(647 * nm, 1.49, 1000, 1e-15, 0), (4 / 3) * localizationPrecision(647 * nm, 1.49, 1000), 1e-9, "a → 0");
  assert.ok(Number.isNaN(mortensenPrecision(647 * nm, 1.49, 1000, 0, 10)), "a = 0");
  assert.ok(Number.isNaN(mortensenPrecision(647 * nm, 1.49, 1000, 100 * nm, -1)), "b² < 0");
});

test("SMLM effective resolution: localization FWHM and Nyquist term in quadrature (Legant 2016)", () => {
  // Shroff 2008: d_Nyquist = 2/ρ^(1/D). 2500 labels/µm², 50 labels/µm (1D) and 125 000 labels/µm³ all give 40 nm.
  assertRel(nyquistResolution(2500e12, 2), 40 * nm, 1e-12, "2D");
  assertRel(nyquistResolution(5e7, 1), 40 * nm, 1e-12, "1D");
  assertRel(nyquistResolution(1.25e23, 3), 40 * nm, 1e-12, "3D: 125 000 labels/µm³");
  // √((2.355 · 20)² + 40²) = 61.79 nm; the page combined σ itself: √(20² + 40²) = 44.72 nm.
  assertRel(smlmEffectiveResolution(20 * nm, 40 * nm), 61.7905 * nm, 1e-5, "Legant");
  assert.ok(Number.isNaN(nyquistResolution(0, 2)));
});

test("SIM cut-off, resolution and raw image count (Gustafsson 2000, 2005)", () => {
  // NA 1.4, λex 488, λem 520: k_c = 2.8/520 + 2.8/488 = 0.0111223 nm⁻¹ = 11.1223 cycles/µm; 1/k_c = 89.909 nm,
  // against the widefield λem/(2NA) = 185.71 nm (factor 2.066, not 2, because λex < λem).
  assertRel(simCutoff(488 * nm, 520 * nm, 1.4), 11.1223e6, 1e-5, "k_c");
  assertRel(simLateralFwhm(488 * nm, 520 * nm, 1.4), 89.9093 * nm, 1e-5, "linear SIM");
  // λex = λem, p = 1: exactly half the widefield value. Saturated SIM with m = 2 harmonics: 1/(2.8/520 + 5.6/488) = 59.31 nm.
  assertRel(simLateralFwhm(500 * nm, 500 * nm, 1.4), abbeLateralFwhm(500 * nm, 1.4) / 2, 1e-12, "doubling");
  assertRel(simLateralFwhm(488 * nm, 520 * nm, 1.4, 1, 2), 59.3119 * nm, 1e-5, "SSIM");
  assert.equal(simRawImageCount(1, 3), 9, "3 angles × 3 phases");
  assert.equal(simRawImageCount(2, 5), 25, "5 phases for orders −2 … 2");
  assert.ok(Number.isNaN(simCutoff(488 * nm, 520 * nm, 0)), "NA = 0");
  assert.ok(Number.isNaN(simCutoff(488 * nm, 520 * nm, 1.4, 1.2)), "p > 1");
});

test("expansion microscopy: linkage error is not reduced by pre-expansion labelling (Wassie et al. 2019)", () => {
  // d = 250 nm, E = 4, probe 10 nm, linker 15 nm, L = √325 = 18.028 nm.
  // Pre: √(62.5² + 325) = 65.048 nm. Post: √(62.5² + 325/16) = 62.662 nm. The page gave 62.5 nm for both.
  assertRel(expansionEffectiveResolution(250 * nm, 4, 10 * nm, 15 * nm, "pre"), 65.0481 * nm, 1e-5, "pre");
  assertRel(expansionEffectiveResolution(250 * nm, 4, 10 * nm, 15 * nm, "post"), 62.6623 * nm, 1e-5, "post");
  // 20×: 21.94 nm with pre-expansion labels (the page showed 12.5 nm); E = 1 is the plain microscope plus L.
  assertRel(expansionEffectiveResolution(250 * nm, 20, 10 * nm, 15 * nm, "pre"), 21.9374 * nm, 1e-5, "20×");
  assertRel(expansionEffectiveResolution(250 * nm, 1, 0, 0, "post"), 250 * nm, 1e-12, "E = 1");
  assert.ok(Number.isNaN(expansionEffectiveResolution(250 * nm, 0.5, 10 * nm, 15 * nm, "pre")), "E < 1");
});
