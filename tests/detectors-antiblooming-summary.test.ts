import assert from "node:assert/strict";
import test from "node:test";

import { antibloomingSummary } from "../src/physics/detectors/antiblooming";

// Idealised hard-threshold drain: Janesick, Scientific Charge-Coupled Devices (SPIE 2001), doi:10.1117/3.374903.
test("antibloomingSummary: below blooming, hand-worked", () => {
  // W = 50000, a = 0.8: T = 40000; N = 60000, η = 0.99: drained 19800, leaked 200, collected 40200; N_b = 40000 + 10000/0.01
  const r = antibloomingSummary(50000, 0.8, 20000, 0.99);
  assert.equal(r.threshold, 40000);
  assert.ok(Math.abs(r.collected - 40200) < 1e-8);
  assert.ok(Math.abs(r.drained - 19800) < 1e-8);
  assert.equal(r.spilled, 0);
  assert.ok(Math.abs(r.onset - 1040000) < 1e-6);
  assert.equal(r.headroom, 10000);
});

test("antibloomingSummary: blooming and the perfect drain", () => {
  // excess 2e6, η = 0.9: leaked 2e5, room 1e4: collected 50000, spilled 190000; N_b = 40000 + 1e4/0.1 = 140000
  const r = antibloomingSummary(50000, 0.8, 2e6, 0.9);
  assert.ok(Math.abs(r.collected - 50000) < 1e-8);
  assert.ok(Math.abs(r.spilled - 190000) < 1e-6);
  assert.ok(Math.abs(r.onset - 140000) < 1e-6);
  assert.equal(antibloomingSummary(50000, 0.8, 2e6, 1).onset, Infinity);
});
