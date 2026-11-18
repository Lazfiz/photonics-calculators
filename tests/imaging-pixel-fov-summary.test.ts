import assert from "node:assert/strict";
import test from "node:test";

import { pixelFovSummary } from "../src/physics/imaging/pixel-fov";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Holst, Electro-Optical Imaging System Performance, 6th ed. (SPIE 2017), doi:10.1117/3.2588947: detector angular subtense
// IFOV = 2·atan(b·p/(2f)) and Nyquist 1/(2p).
test("pixelFovSummary: 6.5 µm pixel, 50 mm lens, 2048 px", () => {
  // IFOV = 2·atan(6.5e-5) = 1.2999999982e-4 rad; 1/(2·6.5e-6) = 76923.08 cycles/m; 1/(2·IFOV) = 3846.1538516 cycles/rad;
  // field 2·atan(13.312/100) = 0.264682... rad = 15.165267°
  const s = pixelFovSummary(6.5e-6, 50e-3, 1, 2048);
  assertRel(s.ifov, 1.2999999981692e-4, 1e-9, "IFOV");
  assertRel(s.effectivePixel, 6.5e-6, 1e-12, "effective pixel");
  assertRel(s.sensorNyquist, 1 / (2 * 6.5e-6), 1e-12, "sensor Nyquist");
  assertRel(s.angularNyquist, 3846.1538516, 1e-9, "angular Nyquist");
  assertRel((s.fullField * 180) / Math.PI, 15.165266875, 1e-9, "full field");
});

test("pixelFovSummary: 2 × 2 binning doubles the pixel and halves the Nyquist frequency", () => {
  // b·p = 10 µm: IFOV = 2·atan(2e-4) = 3.9999999467e-4 rad; Nyquist 1/(20 µm) = 50000 cycles/m
  const s = pixelFovSummary(5e-6, 25e-3, 2, 1000);
  assertRel(s.ifov, 3.9999999467e-4, 1e-9, "IFOV");
  assertRel(s.effectivePixel, 10e-6, 1e-12, "effective pixel");
  assertRel(s.sensorNyquist, 50000, 1e-12, "sensor Nyquist");
});

test("pixelFovSummary: non-positive focal length has no angles", () => {
  const s = pixelFovSummary(5e-6, 0, 1, 1000);
  assert.ok(Number.isNaN(s.ifov) && Number.isNaN(s.angularNyquist) && Number.isNaN(s.fullField));
});
