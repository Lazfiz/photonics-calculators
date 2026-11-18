import test from "node:test";
import assert from "node:assert/strict";

import { imageDistanceSummary } from "../src/physics/imaging/image-distance";

const mm = 1e-3;
const close = (actual: number, expected: number, tol: number, label: string) =>
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);

test("image distance from o (Greivenkamp, Field Guide to Geometrical Optics 2004, Gaussian imaging equation)", () => {
  // Hand: f = 50 mm, o = 200 mm: i = 50·200/150 = 66.6667 mm, M = −1/3, x = 150 mm, x′ = 16.6667 mm, x·x′ = f².
  const s = imageDistanceSummary(50 * mm, "object", 200 * mm, -2);
  close(s.i, (200 / 3) * mm, 1e-12, "i");
  close(s.M, -1 / 3, 1e-12, "M");
  close(s.newtonX * s.newtonXPrime, (50 * mm) ** 2, 1e-12, "x x'");
  close(s.objectToImage, (800 / 3) * mm, 1e-12, "o+i");
  assert.equal(s.problem, "");
});

test("image distance from M: f = 50 mm, M = −2 gives o = 75 mm, i = 150 mm", () => {
  const s = imageDistanceSummary(50 * mm, "mag", 200 * mm, -2);
  close(s.o, 75 * mm, 1e-12, "o");
  close(s.i, 150 * mm, 1e-12, "i");
  assert.equal(s.M, -2);
});

test("image distance edge cases: object at f, M = 0, M = +1, virtual object, tiny f", () => {
  assert.match(imageDistanceSummary(50 * mm, "object", 50 * mm, 1).problem, /front focal point/);
  assert.match(imageDistanceSummary(50 * mm, "mag", 0.1, 0).problem, /M = 0/);
  assert.match(imageDistanceSummary(50 * mm, "mag", 0.1, 1).problem, /M = \+1/);
  // f = 50 mm, M = 0.5: o = 50(1 − 2) = −50 mm, a virtual object.
  const v = imageDistanceSummary(50 * mm, "mag", 0.1, 0.5);
  assert.match(v.problem, /virtual object/);
  assert.match(v.problem, /f = 50 mm needs o = -50\.00 mm/);
  assert.match(imageDistanceSummary(0, "object", 0.2, 1).problem, /at least 0.1 mm/);
});
