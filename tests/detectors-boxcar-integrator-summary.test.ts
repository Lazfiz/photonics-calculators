import test from "node:test";
import assert from "node:assert/strict";

import { boxcarSingleShotSnr, boxcarSummary } from "../src/physics/detectors/boxcar";

const assertRel = (actual: number, expected: number, tol: number, msg: string) =>
  assert.ok(Math.abs(actual - expected) <= tol * Math.abs(expected), `${msg}: ${actual} vs ${expected}`);

// Golden values from an independent scratch re-implementation (Maclaurin erf series): Gaussian pulse gate average
// sigma*sqrt(pi/2)/T*[erf((t_g + T/2)/sigma*sqrt2) - erf((t_g - T/2)/sigma*sqrt2)], FWHM = 2*sqrt(2 ln 2)*sigma, and the gate noise
// e_n*sqrt(B*(2/x)*(1 + (e^-x - 1)/x)), x = 4BT (variance of a time average, Papoulis & Pillai, 4th ed., single-pole noise).
const base = { gateWidth: 100e-9, fwhm: 500e-9, gateDelay: 0, signalPeak: 1e-3, noiseDensity: 100e-9, inputBandwidth: 100e6, repRate: 1000, averages: 100 };

test("boxcarSummary at the page defaults", () => {
  const r = boxcarSummary(base);
  assertRel(r.gateSignal, 0.9908344053320838e-3, 1e-8, "gate signal");
  assertRel(r.gateNoise, 220.79402165819614e-6, 1e-8, "gate noise");
  assertRel(r.snrSingle, 4.487596167191345, 1e-8, "single-shot SNR");
  assertRel(r.snrAveraged, 44.87596167191345, 1e-8, "averaged SNR");
  assertRel(r.neb, 5e6, 1e-12, "NEB");
  assertRel(r.measureTime, 0.1, 1e-12, "measurement time");
  assertRel(r.optimalGate, 592.7950392040161e-9, 1e-6, "optimum gate");
  assert.equal(r.bandLimited, false);
});

test("boxcarSummary with an offset gate and a slow input", () => {
  const r = boxcarSummary({ gateWidth: 50e-9, fwhm: 200e-9, gateDelay: 80e-9, signalPeak: 2e-3, noiseDensity: 50e-9, inputBandwidth: 20e6, repRate: 500, averages: 400 });
  assertRel(r.gateSignal, 1.281214780091411e-3, 1e-8, "gate signal");
  assertRel(r.snrSingle, 9.32823770530726, 1e-8, "single-shot SNR");
  assertRel(r.measureTime, 0.8, 1e-12, "measurement time");
});

test("band limit flag and the no-noise edge case", () => {
  assert.equal(boxcarSummary({ ...base, inputBandwidth: 1e6 }).bandLimited, true); // B*FWHM = 0.5 < 2
  assert.ok(Number.isNaN(boxcarSummary({ ...base, noiseDensity: 0 }).snrSingle));
  assert.ok(Number.isNaN(boxcarSingleShotSnr(1e-3, 500e-9, 100e-9, 0, 0, 100e6)));
  assertRel(boxcarSingleShotSnr(1e-3, 500e-9, 100e-9, 0, 100e-9, 100e6), 4.487596167191345, 1e-8, "snr");
});
