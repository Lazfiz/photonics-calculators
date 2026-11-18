import assert from "node:assert/strict";
import test from "node:test";

import { microchannelPlateSummary } from "../src/physics/detectors/microchannel-plate";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Wiza, Nucl. Instrum. Methods 162, 587 (1979), doi:10.1016/0029-554X(79)90734-1: G = δ^n, n = 4V₀α²/V, δ = A·V/(2α√V₀).
const base = { plates: 1, diameter: 10e-6, length: 0.5e-3, openAreaRatio: 0.6, voltage: 1000, yieldConstant: 0.2, emissionEnergy: 1, qe: 0.25 };

test("microchannelPlateSummary: hand-worked one-plate case", () => {
  // α = 50: n = 4·2500/1000 = 10, δ = 0.2·1000/100 = 2, G = 2^10 = 1024; limit 1e8·0.01 = 1e6
  // α_opt = 200/(2√e) = 60.653066, G_max = exp(0.04·1000/(2e)) = 1568.0512, pitch = 10 µm·√(π/(2√3·0.6)) = 12.294305 µm, η = 0.15
  const r = microchannelPlateSummary(base);
  assertRel(r.ld, 50, 1e-12, "α");
  assertRel(r.strikes, 10, 1e-12, "n");
  assertRel(r.yieldPerStrike, 2, 1e-12, "δ");
  assertRel(r.plateGain, 1024, 1e-12, "G");
  assertRel(r.limit, 1e6, 1e-12, "limit");
  assertRel(r.optimumLd, 60.653066, 1e-8, "α_opt");
  assertRel(r.peakPlateGain, 1568.05115, 1e-8, "G_max");
  assertRel(r.pitch, 12.294305e-6, 1e-7, "pitch");
  assertRel(r.detection, 0.15, 1e-12, "η");
  assert.equal(r.saturated, false);
  assert.equal(r.outOfRange, false);
});

test("microchannelPlateSummary: a two-plate stack of 1024 is above the one-channel limit; few strikes are out of range", () => {
  // 1024² = 1048576 > 1e6
  const two = microchannelPlateSummary({ ...base, plates: 2 });
  assertRel(two.stackGain, 1048576, 1e-12, "stack");
  assert.equal(two.saturated, true);
  // V = 2000 V, α = 5: n = 4·25/2000 = 0.05 strikes (< 2)
  assert.equal(microchannelPlateSummary({ ...base, voltage: 2000, length: 50e-6 }).outOfRange, true);
});
