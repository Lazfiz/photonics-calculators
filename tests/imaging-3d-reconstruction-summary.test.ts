import test from "node:test";
import assert from "node:assert/strict";

import { methodResolution, reconstructionSummary } from "../src/physics/imaging/3d-reconstruction";

const nm = 1e-9;
const um = 1e-6;
const close = (actual: number, expected: number, tol: number, label: string) =>
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);

test("3D reconstruction, widefield 600 nm NA 0.8 n 1.33 (Born & Wolf §8.5.2, §8.8; Wilhelm et al. 2003)", () => {
  // Hand: lateral (1.6163399483/π) λ/NA = 385.8727387 nm; axial 0.88589 λ/(n − √(n² − NA²)) = 1987.027741 nm.
  // 100 µm / 0.1 µm = 1000 px per side; 50 slices → 5e7 voxels × 2 bytes = 1e8 B.
  const s = reconstructionSummary("widefield", 50, 0.5 * um, 0.1 * um, 0.8, 600 * nm, 1.33, 1, 0.1, 100 * um);
  close(s.lateral, 385.8727387358205 * nm, 1e-9, "lateral");
  close(s.axial, 1987.027740635577 * nm, 1e-9, "axial");
  assert.equal(s.pixelsPerSide, 1000);
  assert.equal(s.totalVoxels, 50e6);
  assert.equal(s.volumeBytes, 100e6);
  assert.equal(s.xyOk, true); // 100 nm ≤ 192.9 nm
  assert.equal(s.zOk, true); // 500 nm ≤ 993.6 nm
});

test("3D reconstruction, light sheet NA 0.1 (Engelbrecht & Stelzer 2006; Siegman ch. 17)", () => {
  // Hand: w0 = λ/(π NA) = 1909.859 nm; sheet FWHM √(2 ln 2) w0 = 2248.6875016 nm; axial (1/2248.69² + 1/1987.03²)^(−1/2) = 1488.998289 nm;
  // 2 z_R = 2π n w0²/λ = 50.80225783 µm.
  const s = reconstructionSummary("lightsheet", 50, 0.5 * um, 0.1 * um, 0.8, 600 * nm, 1.33, 1, 0.1, 100 * um);
  close(s.axial, 1488.998289108732 * nm, 1e-9, "effective axial");
  close(s.sheetLength, 50.802257834933 * um, 1e-9, "sheet length");
  const all = (["widefield", "confocal", "lightsheet"] as const).map((m) => methodResolution(m, 600 * nm, 1.33, 0.8, 1, 0.1));
  assert.ok(all[2].axial < all[0].axial && all[1].axial < all[0].axial);
});

test("3D reconstruction: a coarse pixel and z-step are flagged (edge)", () => {
  const s = reconstructionSummary("widefield", 10, 5 * um, 1 * um, 0.8, 600 * nm, 1.33, 1, 0.1, 100 * um);
  assert.equal(s.xyOk, false);
  assert.equal(s.zOk, false);
});

test("3D reconstruction: a .5 pixel tie rounds up as in micrometres (FOV 5 µm / 0.08 µm → 63 px; edge)", () => {
  const s = reconstructionSummary("widefield", 10, 0.5 * um, 0.08 * um, 0.8, 600 * nm, 1.33, 1, 0.1, 5 * um);
  assert.equal(s.pixelsPerSide, 63);
});
