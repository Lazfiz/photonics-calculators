import assert from "node:assert/strict";
import test from "node:test";

import { channelPmtSummary } from "../src/physics/detectors/channel-photomultiplier";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const base = {
  wavelength: 410e-9, quantumEff: 0.25, gain: 1e5, excessNoise: 2, darkRate: 10, photonRate: 1e4, gate: 1,
  photonsPerPulse: 100, linearLimit: 1e7,
};

// Hamamatsu, Photomultiplier Tubes: Basics and Applications, 4th ed. (2017), §4.3.7, Eq. 4-29; Wiza, Nucl. Instrum. Methods 162, 587 (1979).
test("channelPmtSummary: defaults, hand-worked", () => {
  // R_s = 1e4·0.25 = 2500; SNR_count = 2500/√2510 = 49.900299; SNR_analog = 2500/√(2·0.5·2510·2) = 35.28484;
  // N_pe = 25, N_pe·G = 2.5e6 (linear); FWHM = 2√(2 ln 2)·√(2/25) = 0.66604369
  const r = channelPmtSummary(base);
  assertRel(r.signalRate, 2500, 1e-12, "R_s");
  assertRel(r.countSnr, 49.900299, 1e-7, "count SNR");
  assertRel(r.analogSnr, 35.28484, 1e-7, "analog SNR");
  assertRel(r.pulseElectrons, 2.5e6, 1e-12, "electrons");
  assertRel(r.resolution, 0.66604369, 1e-7, "FWHM");
  assert.equal(r.linear, true);
  assert.equal(r.saturated, false);
  assert.deepEqual(r.warnings, []);
});

test("channelPmtSummary: above the linear limit the resolution is NaN; gain 1e7 is saturated", () => {
  // N_pe·G = 25·1e8 = 2.5e9 > 1e7
  const r = channelPmtSummary({ ...base, gain: 1e8 });
  assert.equal(r.linear, false);
  assert.equal(r.saturated, true);
  assert.ok(Number.isNaN(r.resolution));
  assert.equal(r.warnings.length, 2);
});
