// Golden values for the deconvolution page summary (hand-worked).
import assert from "node:assert/strict";
import { test } from "node:test";
import { noiseToSignalRatio, wienerRestorationSummary } from "../src/physics/imaging/deconvolution";

const close = (a: number, b: number, tol = 1e-8) => assert.ok(Math.abs(a - b) <= tol * Math.abs(b), `${a} vs ${b}`);

test("deconvolution summary: NA 1.4, 550 nm, 30 dB", () => {
  const s = wienerRestorationSummary(1.4, 550e-9, 30);
  // f_c = 2·1.4/550e-9 = 5.090909e6 m⁻¹; λ/(2NA) = 196.42857 nm; 0.61·550/1.4 = 239.64286 nm.
  close(s.cutoff, 5.0909090909e6);
  close(s.passbandPeriod, 196.42857143e-9);
  close(s.rayleighDistance, 239.64285714e-9);
  // NSR = 10^(−3) and gain 1/(2√NSR) = 15.811388; H(ν) = √NSR at ν = 0.91065938 (bisection) → 215.69928 nm.
  close(s.nsr, 1e-3);
  close(s.peakGain, 15.811388301);
  close(s.nuHalf, 0.91065938487, 1e-6);
  close(s.restoredPeriod, 215.69927756e-9, 1e-6);
});

test("deconvolution summary: 0 dB has NSR 1 and no restored period", () => {
  close(noiseToSignalRatio(0), 1);
  const s = wienerRestorationSummary(1.4, 550e-9, 0);
  assert.equal(s.nuHalf, 0);
  assert.equal(s.restoredPeriod, Infinity);
});
