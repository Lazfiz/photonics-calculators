import test from "node:test";
import assert from "node:assert/strict";

import { polarizationMaintainingSummary } from "../src/physics/fiber-optics/polarization-maintaining";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Noda, Okamoto, Sasaki, J. Lightwave Technol. 4, 1071 (1986), doi:10.1109/JLT.1986.1074847: random coupling
// dPx/dz = -h(Px - Py); Py/Px = (1 - r)/(1 + r), r = exp(-2hL)(1 - e0)/(1 + e0). Values from an independent script.
const base = { B: 3.5e-4, h: 1e-6, lambda: 1550e-9, L: 1000, erDb: 30, targetDb: 20 };

test("polarizationMaintainingSummary: beat length, DGD, output PER, crosstalk and length to 20 dB", () => {
  const s = polarizationMaintainingSummary(base);
  assertRel(s.beatLength, 4.428571428571429e-3, 1e-12, "beat length");
  assertRel(s.dgd, 1.167474333193532e-12, 1e-9, "DGD per length");
  assertRel(s.outDb, 26.98970511012541, 1e-9, "output PER");
  assertRel(s.fibreXt, -30.00000144764794, 1e-9, "fibre crosstalk");
  assertRel(s.Ltarget, 9000.333020001264, 1e-9, "length to target");
  assert.equal(s.meets, true);
});

test("polarizationMaintainingSummary: h = 0 never degrades the ratio, L = 0 has no crosstalk", () => {
  const noCoupling = polarizationMaintainingSummary({ ...base, h: 0 });
  assertRel(noCoupling.outDb, 30, 1e-12, "output PER stays at the input value");
  assert.equal(noCoupling.Ltarget, Infinity);
  assert.equal(noCoupling.fibreXt, -Infinity);
  const zeroLength = polarizationMaintainingSummary({ ...base, L: 0 });
  assertRel(zeroLength.outDb, 30, 1e-12, "output PER");
  assert.equal(zeroLength.fibreXt, -Infinity);
  // The input is already worse than the requirement: length 0.
  assert.equal(polarizationMaintainingSummary({ ...base, erDb: 10 }).Ltarget, 0);
});
