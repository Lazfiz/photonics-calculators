import test from "node:test";
import assert from "node:assert/strict";

import { lockinSummary } from "../src/physics/detectors/lockin";

const assertRel = (actual: number, expected: number, tol: number, msg: string) =>
  assert.ok(Math.abs(actual - expected) <= tol * Math.abs(expected), `${msg}: ${actual} vs ${expected}`);

// Golden values from an independent scratch re-implementation of Scofield (1994, doi:10.1119/1.17629): X = (A/√2)·g·cos φ·|H|, noise e_n·√ENBW,
// gain g·|cos φ|·|H|·√(B/ENBW); RC N = 1 ENBW = 1/4τ, Butterworth N = 2 ENBW = 1/(8τ·sin(π/4)).
test("lockinSummary: sine, matched, RC order 1", () => {
  const r = lockinSummary({
    phase_rad: 0, signal_Hz: 1000, reference_Hz: 1000, tau: 1, order: 1, filter: "rc", reference: "sine", inputBandwidth_Hz: 1e5,
    amplitude_V: 1e-6, noiseDensity_VrtHz: 10e-9,
  });
  assertRel(r.enbw_Hz, 0.25, 1e-12, "ENBW");
  assertRel(r.outputSignal_V, 0.7071067811865475e-6, 1e-12, "X");
  assertRel(r.outputNoise_V, 5e-9, 1e-12, "noise");
  assertRel(r.snrInput, 0.22360679774997894, 1e-12, "SNR in");
  assertRel(r.snrGain, 632.4555320336759, 1e-12, "gain");
  assertRel(r.snrOutput, 141.4213562373095, 1e-12, "SNR out");
  assert.equal(r.match.detuning_Hz, 0);
});

test("lockinSummary: square reference, Butterworth order 2, 60 degrees", () => {
  const r = lockinSummary({
    phase_rad: Math.PI / 3, signal_Hz: 1000, reference_Hz: 1000, tau: 0.1, order: 2, filter: "butterworth", reference: "square", inputBandwidth_Hz: 1e4,
    amplitude_V: 2e-6, noiseDensity_VrtHz: 5e-9,
  });
  assertRel(r.enbw_Hz, 1.7677669529663689, 1e-12, "ENBW");
  assertRel(r.outputSignal_V, 0.6366197723675815e-6, 1e-9, "X = 2/π µV");
  assertRel(r.snrGain, 33.85732323296562, 1e-9, "gain");
});
