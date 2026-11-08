import test from "node:test";
import assert from "node:assert/strict";

import { twoToneAnalysis } from "../src/physics/spectroscopy/fourier-transform";

// Harris, Proc. IEEE 66, 51 (1978); Oppenheim & Schafer, Discrete-Time Signal Processing, 3rd ed., ch. 4 and 10.
// f_s = N = 64, boxcar, no noise: tones on bins 8 and 20 give X_k = A N/2, so the one-sided amplitude 2|X_k|/N is A.
test("on-bin tones read their true amplitude, noise-free", () => {
  const r = twoToneAnalysis({ f1: 8, a1: 1, f2: 20, a2: 0.5, sigma: 0, N: 64, fs: 64, win: "boxcar" });
  assert.ok(Math.abs(r.tones[0].read - 1) < 1e-9);
  assert.ok(Math.abs(r.tones[1].read - 0.5) < 1e-9);
  assert.equal(r.df, 1);
});

// Edge case: 72 Hz sampled at 64 Hz folds to |72 − 64·round(72/64)| = 8 Hz.
test("a tone above Nyquist folds to its alias", () => {
  const r = twoToneAnalysis({ f1: 72, a1: 1, f2: 20, a2: 0.5, sigma: 0, N: 64, fs: 64, win: "boxcar" });
  assert.equal(r.tones[0].fa, 8);
  assert.ok(Math.abs(r.tones[0].read - 1) < 1e-9);
});

test("the fixed seed makes the noisy record reproducible", () => {
  const p = { f1: 10, a1: 1, f2: 25, a2: 0.5, sigma: 0.1, N: 256, fs: 100, win: "hanning" as const };
  assert.deepEqual(twoToneAnalysis(p).signal, twoToneAnalysis(p).signal);
});
