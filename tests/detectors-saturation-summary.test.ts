import assert from "node:assert/strict";
import test from "node:test";

import { saturationSummary } from "../src/physics/detectors/saturation";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Janesick, Photon Transfer (SPIE Press 2007), doi:10.1117/3.725073.
test("saturationSummary: hand-worked", () => {
  // FWC = 50000, σ_read = 5, 14 bit, n = 0.02: DN_max = 16383; Δ = 3.05194409; Δ/√12 = 0.88102037; floor √(25 + 0.77626) = 5.07702638;
  // DR = 80 dB; DR_ADC = 79.8672117 dB; SNR = 20·log₁₀(50000/√(50000 + 25.77626)) = 46.9874617 dB; response 49000
  const r = saturationSummary({ fullWell: 50000, readNoise: 5, bitDepth: 14, nonlinearity: 0.02 });
  assert.equal(r.dnMax, 16383);
  assertRel(r.electronsPerDn, 3.05194409, 1e-8, "Δ");
  assertRel(r.noiseFloor, 5.07702638, 1e-8, "floor");
  assertRel(r.dynamicRange, 80, 1e-12, "DR");
  assertRel(r.dynamicRangeAdc, 79.8672117, 1e-8, "DR ADC");
  assertRel(r.snrSatDb, 46.9874617, 1e-8, "SNR");
  assertRel(r.responseAtFullWell, 49000, 1e-12, "response");
});
