import test from "node:test";
import assert from "node:assert/strict";

import { superResolutionSummary } from "../src/physics/imaging/super-resolution-summary";

const rel = (actual: number, expected: number, tol = 1e-8) =>
  assert.ok(Math.abs(actual - expected) <= tol * Math.abs(expected), `${actual} vs ${expected}`);

// Hand-worked: λ 580 nm, NA 1.4, n 1.52, ζ 30, λ_STED 660 nm, 5000 photons (Harke 2008 eq. 7; Zhang 2007; Born & Wolf §8.8).
test("superResolutionSummary: defaults", () => {
  const r = superResolutionSummary(580e-9, 1.4, 1.52, 30, 660e-9, 5000);
  rel(r.abbe * 1e9, 207.1428571);
  rel(r.rayleigh * 1e9, 252.7142857);
  rel(r.axial * 1e9, 553.6508379);
  rel(r.sted * 1e9, 42.13560267);
  rel(r.palm * 1e9, 1.230365799);
  rel(r.palmFwhm * 1e9, 2.897290047);
});

test("superResolutionSummary: no axial FWHM at NA >= n", () => {
  assert.ok(Number.isNaN(superResolutionSummary(580e-9, 1.6, 1.52, 30, 660e-9, 5000).axial));
});
