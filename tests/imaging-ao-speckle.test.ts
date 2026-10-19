import test from "node:test";
import assert from "node:assert/strict";

import {
  DM_FITTING_COEFFICIENT, NOLL_MAX_MODES, dmFittingVariance, fittingErrorVariance, nollResidual, strehlRatio,
  zernikeRadialOrder,
} from "../src/physics/free-space-comms/turbulence";
import {
  SPECKLE_FIRST_ZERO, averagedContrast, objectiveSpeckleSize, speckleContrast, subjectiveSpeckleSize, surfacePhaseRms,
} from "../src/physics/imaging/speckle";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const um = 1e-6;
const nm = 1e-9;

test("Noll residual Δ_J after J corrected Zernike modes (JOSA 66, 207 (1976), Table IV)", () => {
  assert.deepEqual([1, 2, 3, 4, 6, 7, 10, 11, 15, 16, 21].map(zernikeRadialOrder), [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
  assert.equal(nollResidual(1), 1.0299);
  // Table IV, printed to 3 significant figures.
  const table: [number, number][] = [[2, 0.582], [3, 0.134], [4, 0.111], [6, 0.0648], [10, 0.0401], [15, 0.0279], [21, 0.0208]];
  for (const [j, delta] of table) assertRel(nollResidual(j), delta, 0.006, `Δ${j}`);
  // Noll's fit 0.2944 J^(−√3/2): the ROADMAP golden at J = 15; it matches Δ_J within 1.3 % for 10 ≤ J ≤ 100, but the
  // exact residual falls as J^(−5/6) (fitting error ∝ (d/r₀)^(5/3) with d ∝ J^(−1/2)), 8 % above the fit at J = 1000.
  assertRel(fittingErrorVariance(15, 1, 1), 0.02821, 1e-4, "asymptote at J = 15");
  for (const j of [10, 30, 100]) assertRel(nollResidual(j), fittingErrorVariance(j, 1, 1), 0.013, `Δ${j} vs fit`);
  assertRel(nollResidual(4000) / nollResidual(1000), 4 ** (-5 / 6), 0.01, "J^(−5/6) at large J");
  assert.ok(nollResidual(NOLL_MAX_MODES) > 0);
  for (const bad of [0, 1.5, NOLL_MAX_MODES + 1, NaN]) assert.ok(Number.isNaN(nollResidual(bad)), `J = ${bad}`);
});

test("deformable-mirror fitting error κ(d/r₀)^(5/3) (Hudgin, JOSA 67, 393 (1977))", () => {
  assert.equal(dmFittingVariance(0.1, 0.1), 0.28);
  // Hand value: 0.28 · 0.5^(5/3) = 0.088195.
  assertRel(dmFittingVariance(0.05, 0.1), 0.0881945, 1e-6, "d/r₀ = 0.5");
  assertRel(dmFittingVariance(0.1, 0.1, DM_FITTING_COEFFICIENT.segmentedPiston), 1.26, 1e-12, "piston segments");
  assert.equal(dmFittingVariance(0, 0.1), 0);
  assert.ok(Number.isNaN(dmFittingVariance(0.1, 0)));
  // Page default: D/r₀ = 10, 32 actuators across → σ² = 0.28 · (10/32)^(5/3) = 0.040294 rad², S = 0.9605 + halo.
  const sigma2 = dmFittingVariance(10 / 32, 1);
  assertRel(sigma2, 0.040294, 1e-4, "default fitting variance");
  assertRel(strehlRatio(sigma2, 10, 1), Math.exp(-sigma2) + -Math.expm1(-sigma2) / 101, 1e-12, "Strehl with halo");
});

test("speckle size and Gaussian-surface contrast (Goodman, Speckle Phenomena in Optics, 2020)", () => {
  // λ 532 nm, z 200 mm, D 5 mm: λz/D = 21.28 µm; first zero of |2J₁(v)/v|² at 1.2197 λz/D.
  assertRel(objectiveSpeckleSize(532 * nm, 0.2, 5e-3) / um, 21.28, 1e-12, "λz/D");
  assertRel(SPECKLE_FIRST_ZERO, 1.21967, 1e-5, "j₁,₁/π");
  // λ(1 + M)N = 0.532 µm · 1.5 · 8 = 6.384 µm.
  assertRel(subjectiveSpeckleSize(532 * nm, 8, 0.5) / um, 6.384, 1e-12, "λ(1 + M)N");
  assertRel(surfacePhaseRms(532 * nm / (4 * Math.PI), 532 * nm), 1, 1e-12, "σ_h = λ/4π → σ_φ = 1");
  // Rician hand values √(1 + 2r)/(1 + r), r = e^(−σ²)/(1 − e^(−σ²)): σ_φ 1 → 0.92987, 0.5 → 0.62727.
  for (const s of [1, 0.5]) {
    const r = Math.exp(-s * s) / -Math.expm1(-s * s);
    assertRel(speckleContrast(s), Math.sqrt(1 + 2 * r) / (1 + r), 1e-12, `Rician form at ${s}`);
  }
  assertRel(speckleContrast(1), 0.92987, 1e-5, "C(1)");
  assertRel(speckleContrast(0.5), 0.62727, 1e-5, "C(0.5)");
  // Small σ_φ: C ≈ √2 σ_φ; fully rough: C → 1.
  assertRel(speckleContrast(1e-4), Math.SQRT2 * 1e-4, 1e-6, "smooth limit");
  assert.equal(speckleContrast(0), 0);
  assert.equal(speckleContrast(10), 1);
  assertRel(averagedContrast(1, 10), 0.316228, 1e-6, "1/√10");
  assert.ok(Number.isNaN(averagedContrast(1, 0.5)));
  assert.ok(Number.isNaN(objectiveSpeckleSize(532 * nm, 0.2, 0)));
  assert.ok(Number.isNaN(speckleContrast(-1)));
});
