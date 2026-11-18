import assert from "node:assert/strict";
import test from "node:test";

import { excessNoiseSummary } from "../src/physics/detectors/excess-noise";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// McIntyre, IEEE Trans. Electron Devices ED-13, 164 (1966), doi:10.1109/T-ED.1966.15651.
test("excessNoiseSummary: M = 100, k = 0.02, hand-worked", () => {
  // F = 0.02·100 + 0.98·(2 − 0.01) = 3.9502; 10·log10 F = 5.9661908; 1/√F = 0.5031419; x = ln F/ln M = 0.2983095
  const r = excessNoiseSummary(100, 0.02);
  assertRel(r.factor, 3.9502, 1e-12, "F");
  assertRel(r.noiseFigureDb, 5.9661908, 1e-7, "NF");
  assertRel(r.snrRatio, 0.5031419, 1e-6, "1/√F");
  assertRel(r.index, 0.2983095, 1e-6, "x");
});

test("excessNoiseSummary: M = 1 has F = 1, 0 dB and no index", () => {
  const r = excessNoiseSummary(1, 0.5);
  assert.equal(r.factor, 1);
  assert.equal(r.noiseFigureDb, 0);
  assert.equal(r.snrRatio, 1);
  assert.ok(Number.isNaN(r.index));
});
