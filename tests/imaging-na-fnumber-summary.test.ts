import test from "node:test";
import assert from "node:assert/strict";

import { naFNumberSummary } from "../src/physics/imaging/na-fnumber";

const close = (actual: number, expected: number, tol: number, label: string) =>
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);

test("f/1 at 633 nm: NA 0.5, 30°, Airy diameter (Born & Wolf ch. 4, §8.5.2)", () => {
  // Hand: NA = 1/2; asin(0.5) = π/6; thin-lens 1/√5 = 0.4472136; Airy 2·(3.8317059702/(2π))·633 nm/0.5 = 1.5441021 µm.
  const s = naFNumberSummary(1, 633e-9);
  close(s.na, 0.5, 1e-12, "NA");
  close(s.halfAngle, Math.PI / 6, 1e-12, "half-angle");
  close(s.thinLensNa, 0.4472135954999579, 1e-12, "thin");
  close(s.airyDiameter, 1.5441020823433946e-6, 1e-9, "Airy");
});

test("f/2.8 at 550 nm and the f/0.5 limit", () => {
  // Hand: NA = 1/5.6 = 0.1785714; Airy 3.7565833 µm = 1.21966 λ/NA.
  const s = naFNumberSummary(2.8, 550e-9);
  close(s.na, 0.17857142857142858, 1e-12, "NA");
  close(s.airyDiameter, 3.7565832651008337e-6, 1e-9, "Airy");
  close(naFNumberSummary(0.5, 550e-9).halfAngle, Math.PI / 2, 1e-12, "limit");
  assert.ok(Number.isNaN(naFNumberSummary(0.4, 550e-9).na));
});
