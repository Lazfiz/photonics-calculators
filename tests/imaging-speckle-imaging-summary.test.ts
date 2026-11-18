import test from "node:test";
import assert from "node:assert/strict";

import { speckleSummary } from "../src/physics/imaging/speckle-imaging";

const rel = (actual: number, expected: number, tol = 1e-8) =>
  assert.ok(Math.abs(actual - expected) <= tol * Math.abs(expected), `${actual} vs ${expected}`);

// Goodman 2020 ch. 3, 5 and Fujii & Asakura 1974, hand-worked: 532 nm, D 5 mm, z 200 mm, N 8, M 0.5, σ_h 80 nm, N_c 100, 10 patterns.
test("speckleSummary: defaults", () => {
  const r = speckleSummary(532e-9, 5e-3, 0.2, 8, 0.5, 80e-9, 100, 10);
  rel(r.objective * 1e6, 21.28);
  rel(r.objectiveFirstZero * 1e6, 25.95457529);
  rel(r.subjective * 1e6, 6.384);
  rel(r.phaseRms, 1.889679792);
  rel(r.contrast, 0.6690381763);
  rel(r.averagedContrast, 0.2115684479);
  assert.equal(r.wideAngle, false);
  assert.equal(r.lowPhase, false);
});

test("speckleSummary: flags", () => {
  assert.equal(speckleSummary(532e-9, 0.1, 0.2, 8, 0.5, 80e-9, 100, 10).wideAngle, true);
  assert.equal(speckleSummary(532e-9, 5e-3, 0.2, 8, 0.5, 20e-9, 100, 10).lowPhase, true);
  assert.equal(speckleSummary(532e-9, 5e-3, 0.2, 8, 0.5, 0, 100, 10).lowPhase, false);
});
