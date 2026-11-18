import test from "node:test";
import assert from "node:assert/strict";

import { telecentricitySummary } from "../src/physics/imaging/telecentricity";

const close = (actual: number, expected: number, tol: number, label: string) =>
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);

const base = {
  magnification: 0.5, NA: 0.025, lambda: 550e-9, blur: 10e-6, fieldHeight: 5e-3, pupilDistance: 0.2, dz: 0.5e-3,
  slope: 0.1 * (Math.PI / 180),
};

test("telecentricity summary, defaults (Greivenkamp 2004; Inoué & Spring 1997)", () => {
  // Hand: Δm/m = −0.5/200.5; edge shift 0.5·5 mm·Δm/m = −6.234413965 µm; s = 5/tan 0.1° = 2864.78606677 mm;
  // DOF λ/NA² = 0.88 mm, e/(m NA) = 0.8 mm.
  const t = telecentricitySummary(base);
  close(t.ordinary, -0.5 / 200.5, 1e-12, "ordinary");
  close(t.ordinaryShift, -6.234413965087282e-6, 1e-9, "shift");
  close(t.teleDistance, 2.8647860667714385, 1e-9, "tele s");
  close(t.dofTotal, 1.68e-3, 1e-9, "dof");
  assert.equal(t.outOfFocus, false);
});

test("telecentricity summary, edges: zero slope is perfectly telecentric; Δz through the pupil is NaN", () => {
  const t = telecentricitySummary({ ...base, slope: 0 });
  assert.equal(t.teleDistance, Infinity);
  assert.equal(t.telecentric, 0);
  assert.ok(Number.isNaN(telecentricitySummary({ ...base, dz: -0.3 }).ordinary));
});
