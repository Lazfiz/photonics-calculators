// Golden values for the signal-to-noise page summary (hand-worked from Janesick, Photon Transfer, SPIE 2007,
// doi:10.1117/3.725073: SNR = S/√(S + S_bg + D + σ_read²), SNR_N = √N·SNR, charge binning reads once, a digital sum b·σ_read).
import assert from "node:assert/strict";
import { test } from "node:test";
import { ROSE_SNR, signalToNoiseSummary } from "../src/physics/imaging/signal-to-noise";

const close = (a: number, b: number, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.abs(b), `${a} vs ${b}`);
const base = { signalPhotons: 5000, backgroundPhotons: 500, quantumEfficiency: 0.7, read: 1.5, darkRate: 0.1, exposure: 0.1, binning: 1, binningMode: "charge" as const, frames: 1, targetSnr: 100 };

test("signal-to-noise summary: defaults", () => {
  const s = signalToNoiseSummary(base);
  // S = 3500, S_bg = 350, D = 0.01, σ² = 2.25: noise² = 3852.26.
  close(s.signal, 3500);
  close(s.noise, Math.sqrt(3852.26));
  close(s.snr, 56.391058768073655);
  assert.equal(s.framesNeeded, 4); // ⌈(100/56.391)²⌉ = ⌈3.1447⌉
  assert.equal(s.dominant.name, "Signal shot noise");
  close(s.totalVariance, 3852.26);
});

test("signal-to-noise summary: 3 × 3 digital sum, 4 frames", () => {
  const s = signalToNoiseSummary({ ...base, binning: 3, binningMode: "digital", frames: 4, targetSnr: 200 });
  // 9 pixels: S = 31500, S_bg = 3150, D = 0.09, σ_read,B = 4.5: noise² = 34670.34; SNR = 169.17317630; SNR_4 = 2·SNR.
  close(s.readBinned, 4.5);
  close(s.snr, 169.17317630422096);
  close(s.snrAveraged, 338.3463526084419);
  assert.equal(s.framesNeeded, 2);
  assert.equal(s.detectable, true);
  assert.equal(ROSE_SNR, 5);
});

test("signal-to-noise summary: edge cases (no signal, no noise at all)", () => {
  const none = signalToNoiseSummary({ ...base, signalPhotons: 0 });
  assert.equal(none.snr, 0);
  assert.ok(Number.isNaN(none.framesNeeded));
  assert.equal(none.detectable, false);
  const zero = signalToNoiseSummary({ ...base, signalPhotons: 0, backgroundPhotons: 0, read: 0, darkRate: 0 });
  assert.ok(Number.isNaN(zero.snr));
});
