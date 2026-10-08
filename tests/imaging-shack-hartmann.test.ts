import test from "node:test";
import assert from "node:assert/strict";

import { besselJ } from "../src/physics/math";
import {
  centroidPrecision, dynamicRangeAngle, dynamicRangeOverPupil, fresnelNumber, lensletsInPupil, marechalStrehl,
  spotFirstZeroRadius, spotFwhm, wavefrontPerPixel,
} from "../src/physics/imaging/shack-hartmann";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const um = 1e-6;
const lambda = 632.8e-9, f = 20e-3, d = 300e-6, D = 8e-3; // page defaults

/** Bisection for the half-maximum (or zero) of a decreasing profile on (0, hi). */
function solve(g: (u: number) => number, level: number, hi: number) {
  let lo = 1e-9;
  for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (g(m) > level) lo = m; else hi = m; }
  return lo;
}

test("spot sizes: sinc² (square) and Airy (circular), checked against the diffraction patterns", () => {
  // Square lenslet: I ∝ sinc²(πdx/(λf)); first zero at λf/d; half maximum at 0.442946 λf/d.
  const sinc2 = (u: number) => (Math.sin(Math.PI * u) / (Math.PI * u)) ** 2;
  assertRel(spotFwhm(lambda, f, d, "square") / (lambda * f / d), 2 * solve(sinc2, 0.5, 0.9), 1e-5, "sinc² FWHM");
  // Circular: [2J₁(v)/v]², v = πdx/(λf); first zero at v = 3.831706, half maximum at v = 1.616340.
  const airyField = (v: number) => 2 * besselJ(1, v) / v;
  const airy = (v: number) => airyField(v) ** 2;
  assertRel(spotFirstZeroRadius(lambda, f, d, "circular") / (lambda * f / d), solve(airyField, 0, 4.5) / Math.PI, 1e-4, "Airy zero");
  assertRel(spotFwhm(lambda, f, d, "circular") / (lambda * f / d), (2 * solve(airy, 0.5, 3)) / Math.PI, 1e-5, "Airy FWHM");
  // Defaults: λf/d = 42.1867 µm. The page called the circular radius 1.22λf/d = 51.45 µm the "spot size";
  // the square spot is 84.37 µm across (zero to zero), FWHM 37.37 µm.
  assertRel(2 * spotFirstZeroRadius(lambda, f, d, "square"), 84.3733 * um, 1e-5, "square diameter");
  assertRel(spotFwhm(lambda, f, d, "square"), 37.3730 * um, 1e-4, "square FWHM");
});

test("lenslet-bound dynamic range (Akondi & Dubra 2021, eq. 2) at the page defaults", () => {
  // Square: θ_max = d/(2f) − λ/d = 0.0075 − 0.00210933 = 5.39067 mrad.
  // Over D = 8 mm: tilt PV = 43.125 µm, defocus PV = 10.781 µm, 2θ/D = 1.34767 D.
  // Circular: (300 − 2 · 51.4535)/(2 · 20 000) = 4.92733 mrad.
  const t = dynamicRangeAngle(lambda, f, d, "square");
  assertRel(t, 5.390667e-3, 1e-6, "θ_max square");
  assertRel(dynamicRangeAngle(lambda, f, d, "circular"), 4.92733e-3, 1e-5, "θ_max circular");
  const r = dynamicRangeOverPupil(t, D);
  assertRel(r.tiltPV, 43.12533 * um, 1e-6, "tilt PV");
  assertRel(r.defocusPV, 10.78133 * um, 1e-6, "defocus PV");
  assertRel(r.defocusDiopters, 1.347667, 1e-6, "dioptres");
  // Defocus check: W = W_PV (r/R)², slope at r = R is 2W_PV/R = θ_max.
  assertRel((2 * r.defocusPV) / (D / 2), t, 1e-12, "edge slope");
  // Fresnel number 9e-8/(632.8e-9 · 0.02) = 7.111252; the square spot stops fitting at N_F = 2 (θ_max = 0).
  assertRel(fresnelNumber(lambda, f, d), 7.111252, 1e-6, "N_F");
  const fAtLimit = (d * d) / (2 * lambda);
  assert.ok(Math.abs(dynamicRangeAngle(lambda, fAtLimit, d, "square")) < 1e-15, "N_F = 2");
  assert.equal(dynamicRangeOverPupil(-1e-3, D).tiltPV, 0);
});

test("sensitivity, centroid precision and Strehl at the page defaults", () => {
  // p d/f = 5.5 µm · 300 µm/20 mm = 82.5 nm.
  assertRel(wavefrontPerPixel(5.5e-6, f, d), 82.5e-9, 1e-12, "nm/px");
  // σ_spot = 37.3730/2.354820 = 15.8708 µm; N = 1000 → 0.501880 µm.
  assertRel(centroidPrecision(lambda, f, d, "square", 1000), 0.501880 * um, 1e-5, "σ_c");
  // 150 nm RMS at 632.8 nm: (2π · 0.237042)² = 2.218244 → S = 0.108800.
  assertRel(marechalStrehl(150e-9, lambda), 0.108800, 1e-5, "Strehl");
  assert.equal(marechalStrehl(0, lambda), 1);
});

test("lenslets in a circular pupil: hand-counted small cases and the π/4 (D/d)² limit", () => {
  // D = 3d (R = 1.5d), a lenslet corner on the axis: the four central cells reach √2 d ≤ 1.5d (full);
  // the eight edge-adjacent (1.5, 0.5)d cells and the four (1.5, 1.5)d cells overlap (partial).
  assert.deepEqual((({ full, partial }) => ({ full, partial }))(lensletsInPupil(3 * d, d)), { full: 4, partial: 12 });
  // D = 2.2d: nothing fits fully; 4 + 8 cells overlap.
  assert.deepEqual((({ full, partial }) => ({ full, partial }))(lensletsInPupil(2.2 * d, d)), { full: 0, partial: 12 });
  // Large pupil: full ≤ π/4 (D/d)² ≤ full + partial, and full approaches it.
  const big = lensletsInPupil(200 * d, d);
  const area = (Math.PI / 4) * 200 ** 2;
  assert.ok(big.full <= area && area <= big.full + big.partial, `${big.full} ${big.partial}`);
  assert.ok(big.full / area > 0.97, `${big.full / area}`);
  assert.equal(lensletsInPupil(3 * d, d, true).cells.length, 16);
  assert.ok(Number.isNaN(lensletsInPupil(0, d).full));
});
