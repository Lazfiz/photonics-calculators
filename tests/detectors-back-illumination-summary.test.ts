import test from "node:test";
import assert from "node:assert/strict";

import { backIlluminationSummary } from "../src/physics/detectors/back-illumination";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Janesick, Photon Transfer (SPIE 2007), doi:10.1117/3.725073: SNR ∝ √QE (shot-limited), ∝ QE (read-limited).
// Hand-worked: QE 0.4 / 0.9, CFA 0.5, microlens 1.2: FI 0.24, BI 0.5, ratio 25/12; a ratio of 4 gives 2× = 6.0206 dB.
const base = { fiQE: 0.4, biQE: 0.9, cfa: 0.5, microlensGain: 1.2 };

test("backIlluminationSummary: effective QEs, ratio and SNR gain per regime", () => {
  const s = backIlluminationSummary({ ...base, regime: "shot" });
  assertRel(s.effectiveFi, 0.24, 1e-12, "FI");
  assertRel(s.effectiveBi, 0.5, 1e-12, "BI");
  assertRel(s.qeRatio, 25 / 12, 1e-12, "ratio");
  assertRel(s.snrGain, Math.sqrt(25 / 12), 1e-12, "shot gain");
  assertRel(s.snrGainDb, 20 * Math.log10(Math.sqrt(25 / 12)), 1e-12, "shot dB");
  assertRel(backIlluminationSummary({ ...base, regime: "read" }).snrGain, 25 / 12, 1e-12, "read gain");
  // Ratio 4: √4 = 2 → 6.0206 dB.
  const four = backIlluminationSummary({ fiQE: 0.2, biQE: 0.8, cfa: 1, microlensGain: 1, regime: "shot" });
  assertRel(four.snrGainDb, 6.020599913279624, 1e-12, "6.02 dB");
});

test("backIlluminationSummary: the microlens gain cannot lift the QE above 1; zero QE is NaN", () => {
  const s = backIlluminationSummary({ fiQE: 0.9, biQE: 0.95, cfa: 1, microlensGain: 3, regime: "shot" });
  assert.equal(s.effectiveFi, 1);
  assert.equal(s.effectiveBi, 1);
  assert.ok(Number.isNaN(backIlluminationSummary({ ...base, fiQE: 0, regime: "shot" }).qeRatio));
  assert.ok(Number.isNaN(backIlluminationSummary({ ...base, biQE: 0, regime: "shot" }).snrGain));
});
