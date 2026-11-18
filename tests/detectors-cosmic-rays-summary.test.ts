import test from "node:test";
import assert from "node:assert/strict";

import { cosmicRaySummary } from "../src/physics/detectors/cosmic-rays";

const assertRel = (actual: number, expected: number, tol: number, msg: string) =>
  assert.ok(Math.abs(actual - expected) <= tol * Math.abs(expected), `${msg}: ${actual} vs ${expected}`);

// Golden values from an independent scratch re-implementation (CODATA 2022 constants): N = Φ·A·t, L = t/cos θ,
// mean = L·1.664e6·2.329/3.65 e⁻/cm, Landau–Vavilov–Bichsel Δp (PDG 2024, Review of Particle Physics, ch. 34), pixels per
// track 1 + 4t·tan θ/(πp), fraction 1 − exp(−N·n/N_pix).
test("cosmicRaySummary at the page defaults", () => {
  const r = cosmicRaySummary({ flux: 1e4 / 60, area: 1e-4, exposure: 1, pitch: 10e-6, thickness: 20e-6, zenith: (30 * Math.PI) / 180, frames: 100 });
  assertRel(r.hits, 1 / 60, 1e-12, "hits");
  assert.equal(r.hits99, 1);
  assertRel(r.path, 23.09401076758503e-6, 1e-10, "path");
  assertRel(r.meanCharge, 2452.049934063069, 1e-8, "mean charge");
  assertRel(r.mpvCharge, 1487.1592187008464, 1e-8, "most probable charge");
  assertRel(r.pixelsHit, 2.4702103877914454, 1e-8, "pixels per track");
  assertRel(r.hitFraction, 4.117017227134312e-8, 1e-6, "hit fraction");
  assertRel(r.hitsInFrames, 100 / 60, 1e-12, "hits in 100 frames");
});

test("cosmicRaySummary for a thick layer at 45°", () => {
  const r = cosmicRaySummary({ flux: (2 * 1e4) / 60, area: 4e-4, exposure: 10, pitch: 5e-6, thickness: 300e-6, zenith: Math.PI / 4, frames: 10 });
  assertRel(r.hits, 4 / 3, 1e-12, "hits");
  assert.equal(r.hits99, 5);
  assertRel(r.meanCharge, 45047.033717097416, 1e-8, "mean charge");
  assertRel(r.mpvCharge, 33351.770218970865, 1e-8, "most probable charge");
  assertRel(r.pixelsHit, 77.39437268410975, 1e-8, "pixels per track");
  assertRel(r.pixelsHitPerFrame, 103.19249691214634, 1e-8, "pixels hit");
  assertRel(r.hitsInFrames, 40 / 3, 1e-12, "hits in 10 frames");
});
