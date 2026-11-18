import assert from "node:assert/strict";
import test from "node:test";

import { STREAK_FASTEST_SWEEP_MM_NS, streakSummary } from "../src/physics/detectors/streak-camera";

const rel = (a: number, e: number, tol: number, label: string) => assert.ok(Math.abs(a / e - 1) < tol, `${label}: ${a} vs ${e}`);

// Hamamatsu, Guide to Streak Cameras SHSS0006E; C16910 data sheet SHSS0026E06. FWHM of rect ⊗ rect ⊗ Gauss bisected on an independent erf-series profile.
const camera = {
  slitWidth: 10e-6, magnification: 2.77, pixelSize: 9.75e-6, pixels: 968, tube: 0.5e-12, screenLength: 18e-3, jitter: 0,
  limitingResolution: 35e3, spec: 0.8e-12,
};

test("streakSummary: C16910 defaults at the fastest sweep", () => {
  const r = streakSummary(camera, STREAK_FASTEST_SWEEP_MM_NS * 1e6);
  rel(r.slit, 0.1760593220e-12, 1e-8, "slit");
  rel(r.pixel, 0.06197033898e-12, 1e-8, "pixel");
  rel(r.blurTime, 0.4614613512e-12, 1e-8, "blur");
  rel(r.total, 0.6922802754e-12, 1e-7, "FWHM");
  rel(r.allowance, 0.6409378683e-12, 1e-7, "allowance");
  rel(r.window, 59.98728814e-12, 1e-8, "window");
  assert.equal(r.undersampled, false);
  assert.equal(r.overSpec, false);
  assert.equal(r.screenLimited, false);
  assert.equal(r.dominant, "tube, blur and jitter");
});

test("streakSummary: readout longer than the screen limits the window; a tiny spec leaves no allowance", () => {
  const r = streakSummary({ ...camera, pixels: 4000, spec: 0.1e-12 }, 1e8);
  rel(r.window, 18e-3 / 1e8, 1e-12, "window = screen/v");
  assert.equal(r.screenLimited, true);
  assert.ok(Number.isNaN(r.allowance));
});
