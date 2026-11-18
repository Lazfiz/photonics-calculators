import assert from "node:assert/strict";
import test from "node:test";

import { gainTemperatureSummary } from "../src/physics/detectors/gain-temperature";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Crowell & Sze, Appl. Phys. Lett. 9, 242 (1966), doi:10.1063/1.1754731; Miller, Phys. Rev. 99, 1234 (1955).
const apd = { detector: "apd" as const, gainRef: 10, tempRef: 22, breakdown: 50, margin: 4, vbrCoeff: 0.14, pmtCoeff: -0.3 };

test("gainTemperatureSummary: APD, hand-worked", () => {
  // n = ln(0.9)/ln(0.92) = 1.2635942; V_br(0 °C) = 46.92 → M = 40.466142; V_br(60 °C) = 55.32 → M = 4.8089644
  const r = gainTemperatureSummary(apd, 0, 60);
  assertRel(r.exponent, 1.2635942, 1e-7, "n");
  assertRel(r.gainAtMin, 40.466142, 1e-7, "M(0)");
  assertRel(r.gainAtMax, 4.8089644, 1e-7, "M(60)");
  assertRel(r.ratio, 8.4147311, 1e-7, "ratio");
  assertRel(r.coeffPercent, -3.1842573, 1e-7, "coefficient");
  assertRel(r.bias, 46, 1e-12, "bias");
  assertRel(r.breakdownTemp, -6.5714286, 1e-7, "breakdown temperature");
});

test("gainTemperatureSummary: APD gain diverges once V_br(T) falls to the bias", () => {
  // V_br(T) = 50 + 0.14·(T − 22) = 46 at T = −6.57 °C
  assert.equal(gainTemperatureSummary(apd, -20, 60).gainAtMin, Infinity);
});

test("gainTemperatureSummary: PMT M = M_ref·exp(β·ΔT), no APD outputs", () => {
  // 10·exp(−0.003·(0 − 22)) = 10.682267; 10·exp(−0.003·38) = 8.9225796
  const r = gainTemperatureSummary({ ...apd, detector: "pmt" }, 0, 60);
  assertRel(r.gainAtMin, 10.682267, 1e-7, "M(0)");
  assertRel(r.gainAtMax, 8.9225796, 1e-7, "M(60)");
  assert.equal(r.coeffPercent, -0.3);
  assert.ok(Number.isNaN(r.exponent) && Number.isNaN(r.bias) && Number.isNaN(r.breakdownTemp));
});
