import test from "node:test";
import assert from "node:assert/strict";

import { fluorophoreByName } from "../src/physics/imaging/fluorophores";
import { normalisedShares, relativeError, unmixingRange, unmixingSummary } from "../src/physics/imaging/spectral-unmixing";

function close(actual: number, expected: number, label: string, tol = 1e-8) {
  assert.ok(Math.abs(actual / expected - 1) <= tol, `${label}: ${actual} vs ${expected}`);
}

const dyes = ["EGFP", "mVenus", "mCherry"].map(fluorophoreByName);
const base = { dyes, abundances: [0.5, 0.3, 0.2], bands: 32, start: 480, end: 720, photons: 2000, readNoise: 1, method: "nnls", seed: 1 } as const;

test("spectral unmixing: κ(E), share σ and σ/x against an independent calculation", () => {
  // Scratch script with its own trapezoid integrals of the FPbase emission samples, Gauss–Jordan inverse and Jacobi eigensolver:
  // Kay 1993 §4.3, Cov = (EᵀE)⁻¹ Eᵀ diag(v) E (EᵀE)⁻¹ with v_b = (E·x)_b + σ_read².
  const s = unmixingSummary(base);
  close(s.step, 7.5, "band width");
  close(s.kappa, 2.2251569413233154, "kappa");
  close(s.shareSigma[0] * 100, 2.383151546231027, "σ1");
  close(s.shareSigma[2] * 100, 1.165989993006902, "σ3");
  close(s.relError[1] * 100, 8.549582515737319, "σ/x 2");
  close(relativeError(s.E, s.shares, 1, 2000, 1) * 100, 8.549582515737319, "relativeError");
});

test("spectral unmixing: the seed fixes the noisy estimate, the precision figures don't depend on it", () => {
  const a = unmixingSummary(base);
  const b = unmixingSummary(base);
  assert.deepEqual(a.estimate, b.estimate);
  const c = unmixingSummary({ ...base, seed: 2 });
  assert.notDeepEqual(a.estimate, c.estimate);
  assert.equal(a.kappa, c.kappa);
  assert.deepEqual(a.shareSigma, c.shareSigma);
});

test("spectral unmixing: range rewrite, shares, and a duplicated dye", () => {
  assert.deepEqual(unmixingRange(950, 960, 128), { start: 872, end: 1000, rewritten: true });
  assert.equal(unmixingRange(480, 720, 32).rewritten, false);
  assert.deepEqual(normalisedShares([0, 0]), [0.5, 0.5]);
  const dup = unmixingSummary({ ...base, dyes: [dyes[0], dyes[0]], abundances: [0.5, 0.5] });
  assert.equal(dup.duplicate, true);
  assert.equal(dup.kappa, Infinity);
});

test("spectral unmixing: two endmembers whose in-range spectra are proportional give κ = ∞", () => {
  // Hand (independent scratch script on the FPbase samples): over 350–470 nm in 4 bands of 30 nm, mTurquoise2 emission (starts 441 nm) has band
  // integrals (0, 0, 0, 78982) and EGFP emission (starts 463 nm) has (0, 0, 0, 323); after normalising each column to its range total both are (0, 0, 0, 1).
  // E has rank 1, so EᵀE is singular and κ = ∞ although neither endmember is missing and the dyes differ.
  const s = unmixingSummary({ ...base, dyes: ["mTurquoise2", "EGFP"].map(fluorophoreByName), abundances: [0.5, 0.5], bands: 4, start: 350, end: 470 });
  assert.deepEqual(s.missing, []);
  assert.equal(s.duplicate, false);
  assert.equal(s.kappa, Infinity);
});
