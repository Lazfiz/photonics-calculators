import assert from "node:assert/strict";
import test from "node:test";

import { shotNoiseSummary } from "../src/physics/detectors/shot-noise";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Schottky, Ann. Phys. 362, 541 (1918), doi:10.1002/andp.19183622304: i = √(2qIB).
test("shotNoiseSummary: hand-worked", () => {
  // I = 1 µA, B = 1 MHz: i = √(2·1.602176634e-19·1) = 5.66070072e-10 A; I/i = 1766.56575; I/(2qB) = 3120754.54
  const r = shotNoiseSummary(1e-6, 1e6);
  assertRel(r.iShot, 5.66070072e-10, 1e-8, "i");
  assertRel(r.snrAmplitude, 1766.56575, 1e-8, "snr");
  assertRel(r.snrPower, 3120754.54, 1e-8, "snr power");
  assert.ok(Number.isNaN(shotNoiseSummary(0, 1e6).snrAmplitude));
});
