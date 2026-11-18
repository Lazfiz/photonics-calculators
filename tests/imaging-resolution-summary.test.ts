import assert from "node:assert/strict";
import test from "node:test";

import { immersionIndex, resolutionSummary } from "../src/physics/imaging/resolution";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Abbe λ/(2NA), Rayleigh 0.61 λ/NA, Airy FWHM v½/π·λ/NA (v½ = 1.616340), axial 0.886 λ/(n − √(n² − NA²)):
// Born & Wolf, Principles of Optics, 7th ed., §8.5.2, §8.6.2, §8.8, doi:10.1017/9781108769914.
test("resolutionSummary: air, λ = 500 nm, NA = 0.8", () => {
  // 500/1.6 = 312.5; 0.61·500/0.8 = 381.25; 1.616340/π·625 = 321.5606; 0.886·500/(1 − 0.6) = 1107.5 nm
  const r = resolutionSummary(500e-9, 1, 0.8);
  assertRel(r.abbe, 312.5e-9, 1e-12, "Abbe");
  assertRel(r.rayleigh, 381.25e-9, 1e-12, "Rayleigh");
  assertRel(r.fwhm, 321.5606156e-9, 1e-8, "Airy FWHM");
  assertRel(r.axial, 1107.5e-9, 1e-12, "axial");
});

test("immersionIndex: presets, custom entry and invalid index", () => {
  assert.equal(immersionIndex(0, 1.7), 1);
  assert.equal(immersionIndex(1, 1.7), 1.33);
  assert.equal(immersionIndex(2, 1.7), 1.518);
  assert.equal(immersionIndex(3, 1.7), 1.7);
  assert.equal(immersionIndex(2.4, 1.7), 1.518);
  assert.ok(Number.isNaN(immersionIndex(4, 1.7)));
});

test("resolutionSummary: NA not below n gives no lateral measures", () => {
  const r = resolutionSummary(550e-9, 1, 1);
  assert.ok(Number.isNaN(r.abbe) && Number.isNaN(r.rayleigh) && Number.isNaN(r.fwhm) && Number.isNaN(r.axial));
});
