import assert from "node:assert/strict";
import test from "node:test";

import { avalancheGainSummary } from "../src/physics/detectors/avalanche-gain";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Miller, Phys. Rev. 99, 1234 (1955), doi:10.1103/PhysRev.99.1234; McIntyre, IEEE TED ED-13, 164 (1966), doi:10.1109/T-ED.1966.15651.
test("avalancheGainSummary: V = 120 V, V_br = 150 V, n = 3, k = 0.5, hand-worked", () => {
  // M = 1/(1 − 0.512) = 2.0491803; F = 0.5 M + 0.5 (2 − 1/M) = 1.7805902; x = ln F/ln M; √F·M = 2.7344007
  const r = avalancheGainSummary(120, 150, 3, 0.5);
  assertRel(r.ratio, 0.8, 1e-12, "V/V_br");
  assertRel(r.gain, 2.0491803, 1e-7, "M");
  assertRel(r.noiseFactor, 1.7805902, 1e-7, "F");
  assertRel(r.noiseIndex, 0.8041717, 1e-6, "x");
  assertRel(r.noiseGain, 2.7344007, 1e-7, "√F M");
  assert.equal(r.aboveBreakdown, false);
});

test("avalancheGainSummary: at or above breakdown the gain is Infinity and flagged", () => {
  const r = avalancheGainSummary(150, 150, 3, 0.02);
  assert.equal(r.gain, Infinity);
  assert.equal(r.aboveBreakdown, true);
  assert.equal(Number.isFinite(r.noiseGain), false);
});
