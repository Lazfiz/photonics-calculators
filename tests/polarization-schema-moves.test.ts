// Functions moved out of the polarization pages for their API schemas (11c-3a).
import assert from "node:assert/strict";
import { test } from "node:test";

import { retarderBandDopSweep } from "../src/physics/polarization/mueller";
import { compensatorPlate, sampleChain, senarmontReading } from "../src/physics/polarization/interference-colours";
import { plateBandModel } from "../src/physics/polarization/spectral-depolarization";
import type { Stokes } from "../src/physics/polarization/stokes";

test("retarderBandDopSweep: a half-wave plate at 45° flips S₁ and S₃ and keeps the DoP (Goldstein)", () => {
  const S: Stokes = [1, 0.8, 0.3, 0.2];
  const r = retarderBandDopSweep(S, 0.5, 550e-9, 0, Math.PI / 4);
  assert.ok(Math.abs(r.avgS[1] + 0.8) < 1e-9 && Math.abs(r.avgS[3] + 0.2) < 1e-9 && Math.abs(r.avgS[2] - 0.3) < 1e-9);
  assert.ok(Math.abs(r.avgDop - Math.sqrt(0.77)) < 1e-9);
});

test("compensatorPlate and sampleChain: Sénarmont λ/4 along P, full wave at P + 45°", () => {
  assert.equal(compensatorPlate("none", 0.3, 546e-9, 1, 1), null);
  assert.deepEqual(compensatorPlate("qwp", 0.3, 546e-9, 1, 1), { R: 546e-9 / 4, axis: 0.3 });
  const full = compensatorPlate("full", 0.3, 546e-9, 1, 1)!;
  assert.equal(full.R, 550e-9);
  assert.ok(Math.abs(full.axis - (0.3 + Math.PI / 4)) < 1e-15);
  assert.equal(sampleChain(546e-9, 100e-9, 0.5, null).length, 1);
  assert.equal(sampleChain(546e-9, 100e-9, 0.5, full).length, 2);
});

test("senarmontReading reads the sample retardance of φ = P + 45° (R = λΔθ/180°)", () => {
  const r = senarmontReading(0, Math.PI / 4, 100e-9, 546e-9);
  assert.ok(Math.abs(r.R - 100e-9) < 1e-15);
});

test("plateBandModel: a dispersion-free plate has V = sinc(π R_g Δσ) with R_g = R", () => {
  const m = plateBandModel(1e-3, () => 0.009, 550e-9, 1e-9, "flat", 0);
  assert.ok(Math.abs(m.group - 9e-6) < 1e-15 && Math.abs(m.centre.group - 9e-6) < 1e-15);
  const x = Math.PI * 9e-6 * m.dSigma;
  assert.ok(Math.abs(m.visibility - Math.sin(x) / x) < 1e-12);
});
