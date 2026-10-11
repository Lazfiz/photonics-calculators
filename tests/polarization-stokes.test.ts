import test from "node:test";
import assert from "node:assert/strict";

import {
  type Stokes, analyzerIntensity, axisRatio, degreeOfCircularPolarization, degreeOfLinearPolarization,
  degreeOfPolarization, ellipseAngles, ellipseShape, handedness, isPhysicalStokes, stokesFromEllipse,
} from "../src/physics/polarization/stokes";

const deg = 180 / Math.PI;

function near(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual - expected) < tol, `${label}: ${actual} vs ${expected}`);
}

test("Stokes: DOP, azimuth and ellipticity, hand-calculated (Goldstein, Polarized Light)", () => {
  // DOP = √(S1² + S2² + S3²)/S0, ψ = ½ atan2(S2, S1), χ = ½ asin(S3/I_p).
  // (1, .8, .3, .2): √0.77 = 0.877496, ψ = ½ atan(0.375) = 10.27802°, χ = ½ asin(0.2/√0.77) = 6.58736°.
  const a: Stokes = [1, 0.8, 0.3, 0.2];
  near(degreeOfPolarization(a), Math.sqrt(0.77), 1e-15, "DOP a");
  near(ellipseAngles(a).psi * deg, 10.27802, 5e-6, "ψ a");
  near(ellipseAngles(a).chi * deg, 6.58736, 5e-6, "χ a");
  // (1, .5, .3, .2): √0.38 = 0.616441, ψ = 15.48188°, χ = 9.46591°.
  const b: Stokes = [1, 0.5, 0.3, 0.2];
  near(degreeOfPolarization(b), Math.sqrt(0.38), 1e-15, "DOP b");
  near(ellipseAngles(b).psi * deg, 15.48188, 5e-6, "ψ b");
  near(ellipseAngles(b).chi * deg, 9.46591, 5e-6, "χ b");
  near(degreeOfLinearPolarization(b), Math.sqrt(0.34), 1e-15, "DOLP b");
  near(degreeOfCircularPolarization([1, 0, 0, -0.3]), -0.3, 1e-15, "DOCP signed");
  // A 33 % preset: S1 = S2 = S3 = 0.1905 gives √3 · 0.1905 = 0.329956.
  near(degreeOfPolarization([1, 0.1905, 0.1905, 0.1905]), 0.329956, 1e-6, "33 %");
});

test("Stokes: physical vectors only", () => {
  assert.equal(isPhysicalStokes([1, 1, 0, 0]), true);
  assert.equal(isPhysicalStokes([2, 0.6, 0.8, 1.6]), true);
  assert.equal(isPhysicalStokes([0.1, 1, 0, 0]), false);
  assert.equal(isPhysicalStokes([1, 0.8, 0.6, 0.1]), false);
  assert.equal(isPhysicalStokes([0, 0, 0, 0]), false);
  assert.ok(Number.isNaN(degreeOfPolarization([0.1, 1, 0, 0])));
});

test("Stokes: unpolarized and circular light have undefined angles, not NaN-free guesses", () => {
  const u: Stokes = [1, 0, 0, 0];
  assert.equal(degreeOfPolarization(u), 0);
  assert.ok(Number.isNaN(ellipseAngles(u).psi) && Number.isNaN(ellipseAngles(u).chi));
  assert.equal(handedness(u), "unpolarized");
  assert.equal(ellipseShape(u), "unpolarized");
  // Rounding noise from a matrix chain (I_p ~ 1e-14 S0) is unpolarized too, not a 45° ellipse.
  const noise: Stokes = [1, 1e-14, 0, 1e-14];
  assert.ok(Number.isNaN(ellipseAngles(noise).chi));
  assert.equal(handedness(noise), "unpolarized");
  // RCP: χ = 45°, ψ undefined, right-handed, axis ratio 1.
  const r: Stokes = [1, 0, 0, 1];
  assert.ok(Number.isNaN(ellipseAngles(r).psi));
  near(ellipseAngles(r).chi * deg, 45, 1e-12, "χ RCP");
  assert.equal(handedness(r), "right");
  assert.equal(ellipseShape(r), "circular");
  near(axisRatio(r), 1, 1e-12, "b/a RCP");
});

test("Stokes: ellipse parameters round-trip, with handedness from the sign of S3", () => {
  for (const [psi, chi, P] of [[10, 5, 1], [-60, -20, 0.4], [89, 30, 0.75]]) {
    const S = stokesFromEllipse(2, psi / deg, chi / deg, P);
    near(degreeOfPolarization(S), P, 1e-14, "DOP");
    near(ellipseAngles(S).psi * deg, psi, 1e-10, "ψ");
    near(ellipseAngles(S).chi * deg, chi, 1e-10, "χ");
    assert.equal(handedness(S), chi > 0 ? "right" : "left");
    assert.equal(ellipseShape(S), "elliptical");
  }
  assert.equal(handedness(stokesFromEllipse(1, 0.3, 0)), "linear");
});

test("Stokes: linear analyzer, Malus for polarized light and ½ for unpolarized", () => {
  near(analyzerIntensity([1, 1, 0, 0], 30 / deg), 0.75, 1e-15, "H at 30°");
  near(analyzerIntensity([1, 0, 1, 0], 45 / deg), 1, 1e-15, "+45° at 45°");
  near(analyzerIntensity([1, 0, 0, 1], 17 / deg), 0.5, 1e-15, "RCP");
  near(analyzerIntensity([1, 0, 0, 0], 73 / deg), 0.5, 1e-15, "unpolarized");
});
