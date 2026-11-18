import test from "node:test";
import assert from "node:assert/strict";

import { simSummary } from "../src/physics/imaging/structured-illumination";

const rel = (actual: number, expected: number, tol = 1e-8) =>
  assert.ok(Math.abs(actual - expected) <= tol * Math.abs(expected), `${actual} vs ${expected}`);

// Gustafsson, J. Microsc. 198, 82 (2000): k_c = 2NA/λ_em + k₀, k₀ = p · 2NA/λ_ex; hand-worked with NA 1.4, 488/520 nm, p 0.8.
test("simSummary: cut-offs, resolution and gain", () => {
  const r = simSummary(488e-9, 520e-9, 1.4, 0.8, 1, 3);
  rel(r.cutoff * 1e-6, 5.384615385);
  rel(r.patternFrequency * 1e-6, 4.590163934);
  rel(r.simCutoff * 1e-6, 9.974779319);
  rel(r.simResolution * 1e9, 100.2528445);
  rel(r.widefieldResolution * 1e9, 185.7142857);
  rel(r.improvement, 1.852459016);
  rel(r.rawImages, 9);
  assert.deepEqual(r.notes, []);
});

test("simSummary: notes for the default full-frequency pattern, one angle and harmonics", () => {
  const r = simSummary(488e-9, 520e-9, 1.4, 1, 2, 1);
  assert.equal(r.notes.length, 3);
  assert.match(r.notes[0], /beyond the detection cut-off/);
  assert.match(r.notes[1], /nonlinear/);
  assert.match(r.notes[2], /1 pattern angle extends the support along its direction only/);
  assert.match(simSummary(520e-9, 488e-9, 1.4, 0.5, 1, 3).notes[0], /Stokes-shifted/);
});
