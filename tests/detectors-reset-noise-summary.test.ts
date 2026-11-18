import assert from "node:assert/strict";
import test from "node:test";

import { resetNoiseSummary } from "../src/physics/detectors/reset-noise";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Janesick, Photon Transfer (SPIE Press 2007), doi:10.1117/3.725073: kTC noise.
test("resetNoiseSummary: hand-worked", () => {
  // C = 1 pF, T = 300 K: v = √(1.380649e-23·300/1e-12) = 64.35796 µV; N_e = √(1.380649e-23·300·1e-12)/q = 401.69079; q/C = 1.602176634e-7 V/e⁻
  const r = resetNoiseSummary(1e-12, 300);
  assertRel(r.noiseV, 64.35796e-6, 1e-7, "v");
  assertRel(r.noiseElectrons, 401.69079, 1e-8, "N_e");
  assertRel(r.conversionGain, 1.602176634e-7, 1e-12, "q/C");
  assert.ok(Number.isNaN(resetNoiseSummary(0, 300).conversionGain));
});
