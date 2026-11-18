import test from "node:test";
import assert from "node:assert/strict";

import { magnificationSummary } from "../src/physics/imaging/magnification";

const mm = 1e-3;
const close = (actual: number, expected: number, tol: number, label: string) =>
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);

test("magnification, 5 mm objective, 180 mm tube lens, NA 0.8 (Greivenkamp 2004 Microscopes; Nikon MicroscopyU)", () => {
  // Hand: M_obj = 180/5 = 36; camera 36·0.63 = 22.68; visual 36·12.5 = 450; useful 400–800; pupil 500 mm·0.8/450 = 0.8889 mm.
  const s = magnificationSummary(5 * mm, 180 * mm, 0.63, 12.5, 0.8);
  close(s.objective, 36, 1e-12, "M_obj");
  close(s.camera, 22.68, 1e-12, "camera");
  close(s.visual, 450, 1e-12, "visual");
  close(s.usefulMin, 400, 1e-12, "min");
  close(s.usefulMax, 800, 1e-12, "max");
  close(s.exitPupil, 0.8888888888888888 * mm, 1e-12, "pupil");
  assert.equal(s.verdict, "within");
});

test("magnification verdicts below and above the useful range", () => {
  // 20× objective, 10× eyepiece, NA 0.8: 200× < 400×. NA 0.1: 200× > 100×.
  assert.equal(magnificationSummary(10 * mm, 200 * mm, 1, 10, 0.8).verdict, "below");
  assert.equal(magnificationSummary(10 * mm, 200 * mm, 1, 10, 0.1).verdict, "above");
  assert.ok(Number.isNaN(magnificationSummary(0, 200 * mm, 1, 10, 0.4).visual));
});
