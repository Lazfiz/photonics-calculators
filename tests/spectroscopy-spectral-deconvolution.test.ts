import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_PEAKS, bandModel, parsePeaks, vibronicModel } from "../src/physics/spectroscopy/spectral-deconvolution";

test("parsePeaks: parses, clamps and falls back to the defaults", () => {
  assert.deepEqual(parsePeaks("500:20:1"), [{ center: 500, fwhm: 20, height: 1 }]);
  assert.equal(parsePeaks("garbage").length, 3);
  assert.deepEqual(parsePeaks("garbage"), parsePeaks(DEFAULT_PEAKS));
  assert.equal(parsePeaks("1:2:3,1:2:3,1:2:3,1:2:3,1:2:3,1:2:3").length, 5);
});

test("bandModel: total area is Σ h·w·√(π/(4 ln2)) for Gaussians (hand calculation: 67.5 × 1.0644670194)", () => {
  const m = bandModel({ peaks: parsePeaks(DEFAULT_PEAKS), profile: "gaussian", eta: 0.5, noise: 0, seed: 1, xMin: 400, xMax: 700 });
  assert.ok(Math.abs(m.sumArea / 71.8515238 - 1) < 1e-8);
  assert.equal(m.xs.length, 601);
  // Noise-free data: the least-squares fit returns the true heights.
  assert.ok(m.fit && Math.abs(m.fit.heights[0] - 0.7) < 1e-9);
});

test("bandModel: an empty window has no samples and no statistics", () => {
  const m = bandModel({ peaks: parsePeaks(DEFAULT_PEAKS), profile: "gaussian", eta: 0.5, noise: 0.02, seed: 1, xMin: 700, xMax: 400 });
  assert.equal(m.validWindow, false);
  assert.equal(m.stats, null);
  assert.equal(m.fit, null);
});

test("vibronicModel: reorganisation energy S·ν̃_v and 0–0 wavenumber 1e7/λ₀₀", () => {
  const v = vibronicModel(500, 1400, 1, 1000);
  assert.equal(v.reorg, 1400);
  assert.equal(v.nu00, 20000);
  assert.ok(v.emNm.centroid > 500); // the emission centroid lies to the red of the 0–0 line (progression runs to lower wavenumber)
});
