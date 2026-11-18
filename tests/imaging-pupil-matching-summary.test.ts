import assert from "node:assert/strict";
import test from "node:test";

import { pupilMatchingSummary } from "../src/physics/imaging/pupil-matching";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Exit pupil D = 2·(250 mm)·NA/(M_obj·M_eye) (Greivenkamp, Field Guide to Geometrical Optics, SPIE 2004,
// doi:10.1117/3.547461); useful magnification 500–1000 × NA (Nikon MicroscopyU, Useful Magnification Range).
test("pupilMatchingSummary: 0.75 NA, 40×, 10× eyepiece, 4 mm eye pupil", () => {
  // M = 400, D = 500 mm·0.75/400 = 0.9375 mm, useful 375–750, eyepieces 9.375–18.75, share 0.9375/4
  const s = pupilMatchingSummary(0.75, 40, 10, 4e-3);
  assertRel(s.magnification, 400, 1e-12, "M");
  assertRel(s.exitPupil, 0.9375e-3, 1e-12, "D");
  assertRel(s.usefulMin, 375, 1e-12, "useful min");
  assertRel(s.usefulMax, 750, 1e-12, "useful max");
  assertRel(s.eyepieceMin, 9.375, 1e-12, "eyepiece min");
  assertRel(s.eyepieceMax, 18.75, 1e-12, "eyepiece max");
  assertRel(s.filled, 0.234375, 1e-12, "share");
  assert.equal(s.verdict, "useful");
  assert.equal(s.eyeStop, false);
  assert.ok(Number.isNaN(s.effectiveNa));
});

test("pupilMatchingSummary: low magnification, the eye pupil clips the beam", () => {
  // M = 20, D = 500 mm·0.1/20 = 2.5 mm > 2 mm: effective NA = 0.1·2/2.5 = 0.08, share capped at 1
  const s = pupilMatchingSummary(0.1, 2, 10, 2e-3);
  assertRel(s.exitPupil, 2.5e-3, 1e-12, "D");
  assert.equal(s.verdict, "large");
  assert.equal(s.eyeStop, true);
  assertRel(s.effectiveNa, 0.08, 1e-12, "effective NA");
  assert.equal(s.filled, 1);
});

test("pupilMatchingSummary: empty magnification and the exact 0.5 and 1 mm boundaries", () => {
  // 1.4 NA, 100×, 25×: M = 2500, D = 500·1.4/2500 = 0.28 mm < 0.5 mm
  assert.equal(pupilMatchingSummary(1.4, 100, 25, 4e-3).verdict, "small");
  // NA 0.5, M = 250: D = 1 mm exactly is still useful (limit is "above 1 mm")
  assert.equal(pupilMatchingSummary(0.5, 25, 10, 4e-3).verdict, "useful");
  assert.equal(pupilMatchingSummary(0, 25, 10, 4e-3).verdict, "none");
});
