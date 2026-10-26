import test from "node:test";
import assert from "node:assert/strict";

import { frequencyWidth, wavelengthWidth } from "../src/physics/spectroscopy/wavenumber";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

test("narrow-band width conversion Δλ = λ²Δν/c", () => {
  // ITU-T G.694.1 DWDM grid: 100 GHz at 1550 nm is ≈ 0.8 nm. By hand, (1550e-9)² · 1e11 / 299 792 458 = 0.801 3877 nm.
  assertRel(wavelengthWidth(1550e-9, 100e9), 0.8013877e-9, 1e-7, "100 GHz");
  // Round trip.
  assertRel(frequencyWidth(1550e-9, wavelengthWidth(1550e-9, 50e9)), 50e9, 1e-14, "round trip");
  // 0.8 nm at 1550 nm: 299 792 458 · 0.8e-9 / 2.4025e-12 = 99.827 GHz.
  assertRel(frequencyWidth(1550e-9, 0.8e-9), 99.827e9, 1e-5, "0.8 nm");
  assert.ok(Number.isNaN(wavelengthWidth(0, 1e9)), "λ = 0");
  assert.ok(Number.isNaN(frequencyWidth(-1e-6, 1e-9)), "λ < 0");
});
