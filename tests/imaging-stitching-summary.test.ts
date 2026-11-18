import test from "node:test";
import assert from "node:assert/strict";

import { stitchingSummary } from "../src/physics/imaging/stitching";

function close(actual: number, expected: number, label: string, tol = 1e-12) {
  assert.ok(Math.abs(actual / expected - 1) <= tol, `${label}: ${actual} vs ${expected}`);
}

const base = { cols: 5, rows: 5, tileWidth: 512, tileHeight: 512, overlapPercent: 10, blendWidth: 50, profile: "linear", gain: 5 } as const;

test("stitching: mosaic geometry of a 5 × 5 grid with 10 % overlap", () => {
  // o = round(51.2) = 51 px; W = 5·512 − 4·51 = 2356; η = 2356²/(25·512²) (elementary counting).
  const s = stitchingSummary(base);
  assert.equal(s.grid.width, 2356);
  assert.equal(s.grid.overlapX, 51);
  close(s.grid.efficiency, 5550736 / 6553600, "efficiency");
  assert.equal(s.noOverlap, false);
  assert.equal(s.blend, 50);
});

test("stitching: chained error is √(C + R − 2) in σ units; the global error of a 2 × 2 grid", () => {
  const s = stitchingSummary(base);
  close(s.chain.max, Math.sqrt(8), "chain max");
  close(s.chain.rms, 2, "chain rms");
  // 2 × 2 unit-resistor square: R_eff = 3/4 to the neighbours, 1 to the opposite corner (Barooah & Hespanha 2007, doi:10.1109/MCS.2007.384125).
  const g = stitchingSummary({ ...base, cols: 2, rows: 2 }).global;
  close(g.max, 1, "global max");
  close(g.rms, Math.sqrt(5 / 8), "global rms");
});

test("stitching: seam gradient of a gain step, and the edge cases", () => {
  // Linear ramp: Δ/w = 5/50; cos²: (π/2)·Δ/w (d/dt cos²(πt/2) = −(π/2) sin(πt), peak π/2 at t = ½).
  close(stitchingSummary(base).seamSlope, 0.1, "linear");
  close(stitchingSummary({ ...base, profile: "cosine" }).seamSlope, (Math.PI / 2) * 0.1, "cosine");
  // The blend can't exceed the overlap, and with no overlap there is neither a blend nor a registration.
  assert.equal(stitchingSummary({ ...base, blendWidth: 400 }).blend, 51);
  const none = stitchingSummary({ ...base, overlapPercent: 0 });
  assert.equal(none.noOverlap, true);
  assert.ok(Number.isNaN(none.seamSlope));
});

test("stitching: grids with a single row or column, and a single tile, at 0 % overlap", () => {
  // A 1 × 1 grid has no neighbours, so 0 % overlap is not a registration problem; a 1 × 4 grid (4 rows) has y seams that need overlap.
  assert.equal(stitchingSummary({ ...base, cols: 1, rows: 1, overlapPercent: 0 }).noOverlap, false);
  assert.equal(stitchingSummary({ ...base, cols: 1, rows: 4, overlapPercent: 0 }).noOverlap, true);
  assert.equal(stitchingSummary({ ...base, cols: 4, rows: 1, overlapPercent: 0 }).noOverlap, true);
  assert.equal(stitchingSummary({ ...base, cols: 4, rows: 4, overlapPercent: 0 }).noOverlap, true);
  // The blend cap uses the overlap of the axes with seams: 10 % of 100 px is 10 px (x), of 512 px is round(51.2) = 51 px (y).
  const wide = { ...base, tileWidth: 100, tileHeight: 512, blendWidth: 400 };
  assert.equal(stitchingSummary({ ...wide, cols: 3, rows: 1 }).blend, 10);
  assert.equal(stitchingSummary({ ...wide, cols: 1, rows: 3 }).blend, 51);
  assert.equal(stitchingSummary({ ...wide, cols: 3, rows: 3 }).blend, 10);
});
