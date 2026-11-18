import assert from "node:assert/strict";
import test from "node:test";

import { thermalNoiseSummary } from "../src/physics/detectors/thermal-noise";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Nyquist, Phys. Rev. 32, 110 (1928), doi:10.1103/PhysRev.32.110: v² = 4k_B·T·R·B; Planck limit (π²/6)(k_B·T)²/h.
test("thermalNoiseSummary: hand-worked", () => {
  // R = 50 Ω, T = 290 K, B = 1e6 Hz: k_B·T·B = 4.0038821e-15 W = −113.975187 dBm; v = 8.9486112e-7 V; i = 1.7897222e-8 A
  const r = thermalNoiseSummary({ resistance: 50, temperature: 290, bandwidth: 1e6 });
  assertRel(r.power, 4.0038821e-15, 1e-9, "power");
  assertRel(r.powerDbm, -113.975187194, 1e-8, "dBm");
  assertRel(r.voltage, 8.948611177e-7, 1e-8, "v");
  assertRel(r.current, 1.789722235e-8, 1e-8, "i");
  assert.equal(r.quantumRegime, false);
});

test("thermalNoiseSummary: Planck regime and T = 0", () => {
  // T = 300 K: k_B·T/h = 6.2509e12 Hz; B = 1e12 Hz > 0.1·that; saturation (π²/6)(4.141947e-21)²/6.62607015e-34 = 4.2593e-8 W
  const hot = thermalNoiseSummary({ resistance: 1000, temperature: 300, bandwidth: 1e12 });
  assertRel(hot.quantumFrequency, 6.25e12, 1e-3, "f_q");
  assert.equal(hot.quantumRegime, true);
  assertRel(hot.planckSaturationPower, 4.2593e-8, 1e-3, "P_sat");
  const cold = thermalNoiseSummary({ resistance: 1000, temperature: 0, bandwidth: 1e6 });
  assert.equal(cold.power, 0);
  assert.equal(cold.powerDbm, -Infinity);
});
