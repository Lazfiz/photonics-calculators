import test from "node:test";
import assert from "node:assert/strict";

import { capacitanceSummary, gradingM } from "../src/physics/detectors/capacitance";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Sze & Ng, Physics of Semiconductor Devices, 3rd ed. (2007), ch. 2: C_j = C_j0/(1 + V_R/V_bi)^m; f = 1/(2π·R·C_j).
// Hand-worked: C_j0 = 10 pF, V_bi = 0.6 V, R = 50 + 10 Ω.
const base = { zeroBiasCap: 10e-12, builtInVoltage: 0.6, loadResistance: 50, seriesResistance: 10, customM: 0.75 };

test("capacitanceSummary: abrupt and graded profiles", () => {
  const a = capacitanceSummary({ ...base, reverseBias: 5.4, profile: "abrupt" }); // 1 + 9 = 10
  assertRel(a.capacitance, 10e-12 / Math.sqrt(10), 1e-12, "abrupt C");
  assertRel(a.rcBw, 1 / (2 * Math.PI * 60 * 10e-12 / Math.sqrt(10)), 1e-12, "abrupt f");
  assertRel(a.rcTime, 60 * 10e-12 / Math.sqrt(10), 1e-12, "abrupt tau");
  const g = capacitanceSummary({ ...base, reverseBias: 4.2, profile: "graded" }); // 1 + 7 = 8, 8^(1/3) = 2
  assertRel(g.capacitance, 5e-12, 1e-12, "graded C");
  assertRel(g.rcTime, 0.3e-9, 1e-12, "graded tau");
});

test("capacitanceSummary: custom exponent and the zero-bias edge", () => {
  assert.equal(gradingM("custom", 0.75), 0.75);
  assert.equal(gradingM("abrupt", 0.75), 0.5);
  const c = capacitanceSummary({ ...base, reverseBias: 1.8, profile: "custom" }); // 4^(-0.75)
  assertRel(c.capacitance, 10e-12 * 4 ** -0.75, 1e-12, "custom C");
  assertRel(capacitanceSummary({ ...base, reverseBias: 0, profile: "abrupt" }).capacitance, 10e-12, 1e-12, "V_R = 0");
});
