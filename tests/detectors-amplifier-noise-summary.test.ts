import test from "node:test";
import assert from "node:assert/strict";

import { amplifierNoiseSummary, readFloorElectrons } from "../src/physics/detectors/amplifier-noise";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Janesick, Photon Transfer (SPIE 2007), doi:10.1117/3.725073: quadrature sum of shot, read and quantisation noise.
// Hand-worked: e_n = 3, g = 6, S = 100: σ_read² = 9 + 36/12 = 12, total √112, S_min = (9 + √513)/2.
test("amplifierNoiseSummary: quadrature sum and minimum detectable signal", () => {
  const r = amplifierNoiseSummary({ inputNoise: 3, conversionGain: 6, signal: 100 });
  assertRel(r.readFloor, Math.sqrt(12), 1e-12, "read floor");
  assertRel(r.quantNoise, Math.sqrt(3), 1e-12, "quantisation");
  assertRel(r.noiseDn, Math.sqrt(12) / 6, 1e-12, "DN");
  assertRel(r.totalNoise, Math.sqrt(112), 1e-12, "total");
  assertRel(r.snrTotal, 100 / Math.sqrt(112), 1e-12, "SNR");
  assertRel(r.minDetectable, (9 + Math.sqrt(513)) / 2, 1e-12, "S_min");
  // At S = S_min the total SNR is exactly 3.
  const at = amplifierNoiseSummary({ inputNoise: 3, conversionGain: 6, signal: r.minDetectable });
  assertRel(at.snrTotal, 3, 1e-12, "SNR at S_min");
});

test("amplifierNoiseSummary: domain edge, a non-positive gain gives NaN", () => {
  assert.ok(Number.isNaN(readFloorElectrons(3, 0)));
  assert.ok(Number.isNaN(amplifierNoiseSummary({ inputNoise: 3, conversionGain: 0, signal: 100 }).noiseDn));
});
