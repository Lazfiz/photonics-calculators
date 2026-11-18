import assert from "node:assert/strict";
import test from "node:test";

import { afocalSummary } from "../src/physics/imaging/afocal";

const mm = 1e-3;
const deg = Math.PI / 180;

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Greivenkamp, Field Guide to Geometrical Optics (SPIE 2004), doi:10.1117/3.547461: ray-transfer matrix of two thin lenses,
// afocal at t = f₁ + f₂ with M = −f₁/f₂.
test("afocalSummary: Keplerian 100/200 mm at t = 300 mm", () => {
  // M = −0.5, A = 1 − 3 = −2, D = 1 − 1.5 = −0.5, θ′ = atan(−0.5 tan 2°) = −1.0003047°, beam 5·2 = 10 mm, field stop 200·tan 2° = 6.9841539 mm
  const r = afocalSummary({ f1: 100 * mm, f2: 200 * mm, t: 300 * mm, theta: 2 * deg, beam: 5 * mm });
  assert.equal(r.afocal, true);
  assert.equal(r.notice, "");
  assertRel(r.magnification, -0.5, 1e-12, "M");
  assertRel(r.A, -2, 1e-12, "A");
  assertRel(r.D, -0.5, 1e-12, "D");
  assertRel(r.outputAngle / deg, -1.0003047102322886, 1e-9, "θ′");
  assertRel(r.outputBeam, 10 * mm, 1e-12, "beam");
  assertRel(r.fieldStopDiameter, 6.984153898349546 * mm, 1e-9, "field stop");
});

test("afocalSummary: Galilean off the afocal spacing", () => {
  // f₁ = 100, f₂ = −25, t = 50 mm: C = −10 + 40 − 20 = 10 dpt, power −10 D, EFL −100 mm, BFD −A/C = −50 mm, FFD −D/C = −300 mm
  const r = afocalSummary({ f1: 100 * mm, f2: -25 * mm, t: 50 * mm, theta: 0, beam: 5 * mm });
  assert.equal(r.afocal, false);
  assert.match(r.notice, /−?25\.000 mm from the afocal spacing/);
  assertRel(r.C, 10, 1e-12, "C");
  assertRel(r.power, -10, 1e-12, "power");
  assertRel(r.efl, -100 * mm, 1e-12, "EFL");
  assertRel(r.bfd, -50 * mm, 1e-12, "BFD");
  assertRel(r.ffd, -300 * mm, 1e-12, "FFD");
  assert.ok(Number.isNaN(r.fieldStopDiameter));
});

test("afocalSummary: f₁ + f₂ < 0, f₁ = −f₂ in contact, and a tiny focal length", () => {
  const neg = afocalSummary({ f1: 50 * mm, f2: -80 * mm, t: 10 * mm, theta: 0, beam: 5 * mm });
  assert.equal(neg.afocalPossible, false);
  assert.match(neg.notice, /no spacing t ≥ 0/);
  // Edge: f₁ = −f₂ at t = 0 has C = −1/f₁ − 1/f₂ = 0: an afocal pair of unit angular magnification −f₁/f₂ = 1.
  const pair = afocalSummary({ f1: 100 * mm, f2: -100 * mm, t: 0, theta: 0.01, beam: 5 * mm });
  assert.equal(pair.afocal, true);
  assert.equal(pair.magnification, 1);
  assert.equal(pair.notice, "");
  const bad = afocalSummary({ f1: 0.05 * mm, f2: 80 * mm, t: 10 * mm, theta: 0, beam: 5 * mm });
  assert.ok(bad.problem.length > 0);
});
