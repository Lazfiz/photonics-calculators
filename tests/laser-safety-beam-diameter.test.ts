import test from "node:test";
import assert from "node:assert/strict";

import {
  FWHM_PER_D1E2, d1e2From, gaussianDiameters, powerInsideDiameter, relativeIntensity, type DiameterKind,
} from "../src/physics/laser-safety/beam-diameter";

// Gaussian beam I(r) = I₀ exp(−2r²/w²), d(1/e²) = 2w (Saleh & Teich, Fundamentals of Photonics, ch. 3.1).
// FWHM: exp(−2r²/w²) = ½ → r = w√(ln2/2) → FWHM = 0.588705 d(1/e²), not √(ln2) = 0.8326 (that is for exp(−r²/w²)).
// 1/e: r = w/√2 → d(1/e) = 0.707107 d(1/e²). IEC 60825-1 / ANSI Z136.1 beam diameter = the 1/e diameter (63 % power).

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

test("d(1/e²) = 1: FWHM 0.588705, d(1/e) 0.707107, w 0.5", () => {
  const d = gaussianDiameters(1);
  assertRel(d.fwhm, 0.588705, 1e-6, "FWHM");
  assertRel(d.d1e, 0.707107, 1e-6, "1/e");
  assert.equal(d.d1e2, 1);
  assert.equal(d.w, 0.5);
  assertRel(FWHM_PER_D1E2, 0.588705, 1e-6, "FWHM / d(1/e²)");
});

test("FWHM = 1 → d(1/e²) = 1.698644; the other kinds convert back", () => {
  assertRel(d1e2From("fwhm", 1), 1.698644, 1e-6, "FWHM input");
  assertRel(d1e2From("1e", 1), Math.SQRT2, 1e-12, "1/e input");
  assert.equal(d1e2From("1e2", 3.5), 3.5);
  for (const kind of ["1e2", "1e", "fwhm"] as DiameterKind[]) {
    const d = gaussianDiameters(d1e2From(kind, 2.7));
    assertRel({ "1e2": d.d1e2, "1e": d.d1e, fwhm: d.fwhm }[kind], 2.7, 1e-12, `round trip ${kind}`);
  }
});

test("intensity at r = FWHM/2 is 0.5, at r = d(1/e)/2 is 1/e, at r = d(1/e²)/2 is 1/e²", () => {
  const d = gaussianDiameters(1.8);
  assertRel(relativeIntensity(d.fwhm / 2, d.w), 0.5, 1e-12, "half maximum");
  assertRel(relativeIntensity(d.d1e / 2, d.w), Math.exp(-1), 1e-12, "1/e");
  assertRel(relativeIntensity(d.d1e2 / 2, d.w), Math.exp(-2), 1e-12, "1/e²");
  assert.equal(relativeIntensity(0, d.w), 1);
  // The page's former FWHM, √(ln2)·d(1/e²), put its marker at r = √(ln2)/2 (d = 1, w = 0.5), where I = exp(−2 ln2) = 0.25.
  assertRel(relativeIntensity(Math.sqrt(Math.LN2) / 2, 0.5), 0.25, 1e-12, "old marker");
});

test("power inside the 1/e² (86.47 %), 1/e (63.21 %) and FWHM (50 %) diameters", () => {
  const d = gaussianDiameters(2);
  assertRel(powerInsideDiameter(d.d1e2, d.w), 1 - Math.exp(-2), 1e-12, "1/e²");
  assertRel(powerInsideDiameter(d.d1e2, d.w), 0.8647, 1e-4, "1/e² value");
  assertRel(powerInsideDiameter(d.d1e, d.w), 1 - Math.exp(-1), 1e-12, "1/e");
  assertRel(powerInsideDiameter(d.d1e, d.w), 0.6321, 1e-4, "1/e value");
  assertRel(powerInsideDiameter(d.fwhm, d.w), 0.5, 1e-12, "FWHM");
  // Total power: a very large aperture holds all of it; a zero-diameter one holds none.
  assert.equal(powerInsideDiameter(0, d.w), 0);
  assertRel(powerInsideDiameter(100 * d.w, d.w), 1, 1e-12, "everything");
});

test("edges: non-positive or non-finite input gives NaN", () => {
  for (const x of [0, -1, NaN, Infinity]) {
    assert.ok(Object.values(gaussianDiameters(x)).every(Number.isNaN), `diameters of ${x}`);
    for (const kind of ["1e2", "1e", "fwhm"] as DiameterKind[]) assert.ok(Number.isNaN(d1e2From(kind, x)), `${kind} ${x}`);
  }
  assert.ok(Number.isNaN(powerInsideDiameter(-1, 1)));
  assert.ok(Number.isNaN(powerInsideDiameter(1, 0)));
  assert.ok(Number.isNaN(relativeIntensity(1, 0)));
});
