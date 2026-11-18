import assert from "node:assert/strict";
import test from "node:test";

import { pmtSnrAtDelta, pmtSummary } from "../src/physics/detectors/pmt";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Hamamatsu, Photomultiplier Tubes: Basics and Applications, 4th ed. (2017), §4.3.7: G = δⁿ, F = 1 + Σ δ^(−k), SNR = R_s/√(2B(R_s + R_d)F).
test("pmtSummary: ten dynodes at δ = 3.5, hand-worked", () => {
  // G = 3.5^10 = 275854.7353515625; F = 1.39999855; R_s = 2.5e5 /s; I = R_s·e·G = 1.10492003e-8 A; R_d = 1e-9/(e·G) = 22626.0719 /s;
  // SNR = 2.5e5/√(2e8·(250000 + 22626.0719)·1.39999855) = 0.0286139310.
  const r = pmtSummary({ numDynodes: 10, delta: 3.5, quantumEff: 0.25, darkCurrent: 1e-9, photonRate: 1e6, bandwidth: 1e8 });
  assertRel(r.gain, 275854.7353515625, 1e-12, "G");
  assertRel(r.excessNoise, 1.3999985499614516, 1e-8, "F");
  assertRel(r.excessNoiseLimit, 3.5 / 2.5, 1e-12, "delta/(delta-1)");
  assertRel(r.signalElectrons, 250000, 1e-12, "R_s");
  assertRel(r.signalCurrent, 1.104920028396318e-8, 1e-8, "I");
  assertRel(r.darkElectrons, 22626.07189434789, 1e-8, "R_d");
  assertRel(r.snr, 0.02861393095340976, 1e-8, "SNR");
});

test("pmtSummary: a non-integer dynode count is rounded; no signal and no dark current give no SNR", () => {
  const a = pmtSummary({ numDynodes: 8.4, delta: 4, quantumEff: 0.3, darkCurrent: 0.5e-9, photonRate: 5e7, bandwidth: 1e7 });
  assertRel(a.gain, 65536, 1e-12, "G = 4^8");
  assertRel(a.snr, 0.7488137818462888, 1e-8, "SNR");
  assert.ok(Number.isNaN(pmtSummary({ numDynodes: 8, delta: 4, quantumEff: 0.3, darkCurrent: 0, photonRate: 0, bandwidth: 1e7 }).snr));
});

test("pmtSnrAtDelta: the cathode dark rate is held, so only F changes with δ", () => {
  // δ = 4, n = 8: F = 1.3333282470703125, R_s = 1.5e7, R_d = 47618.9352: SNR = 0.74881378.
  assertRel(pmtSnrAtDelta(4, 8, 1.5e7, 47618.935199438194, 1e7), 0.7488137818462888, 1e-8, "SNR");
});
