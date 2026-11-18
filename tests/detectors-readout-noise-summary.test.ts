import assert from "node:assert/strict";
import test from "node:test";

import { readoutNoiseSummary } from "../src/physics/detectors/readout-noise";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Janesick, Photon Transfer (SPIE Press 2007), doi:10.1117/3.725073.
test("readoutNoiseSummary: hand-worked", () => {
  // σ_read = 4 e⁻, 2 e⁻/s for 3 s: N_dark = 6; floor √(16 + 6) = √22 = 4.69041576; S = 16
  const r = readoutNoiseSummary({ readNoise: 4, darkCurrent: 2, exposureTime: 3 });
  assert.equal(r.darkElectrons, 6);
  assertRel(r.noiseFloor, 4.69041576, 1e-8, "floor");
  assert.equal(r.readNoiseLimitedSignal, 16);
  assert.ok(Number.isNaN(readoutNoiseSummary({ readNoise: -1, darkCurrent: 0, exposureTime: 0 }).noiseFloor));
});
