import assert from "node:assert/strict";
import test from "node:test";

import { psfSummary } from "../src/physics/imaging/psf-calculator";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Born & Wolf, Principles of Optics, 7th ed., §8.5.2 and §8.8, doi:10.1017/9781108769914. Expected values worked with
// an independent series-Bessel bisection: j₁,₁ = 3.831706 (J₁ = 0), v½ = 1.616340 ([2J₁/v]² = ½), x½ = 1.391557 (sinc² = ½).
test("psfSummary: air, λ = 500 nm, NA = 0.4", () => {
  // r = j₁,₁/(2π)·λ/NA = 0.609835·1250 nm; FWHM = v½/π·1250 nm; n − √(n² − NA²) = 1 − √0.84 = 0.083484, zero = 500/0.083484 nm
  const s = psfSummary(500e-9, 1, 0.4);
  assertRel(s.airyRadius, 762.2936820e-9, 1e-8, "Airy radius");
  assertRel(s.lateralFwhm, 643.1212312e-9, 1e-8, "lateral FWHM");
  assertRel(s.axialZero, 500e-9 / (1 - Math.sqrt(0.84)), 1e-12, "axial zero");
  assertRel(s.axialFwhm, ((2 * 1.3915573782515103) / Math.PI) * s.axialZero, 1e-12, "axial FWHM");
});

test("psfSummary: oil immersion, λ = 550 nm, n = 1.518, NA = 1.4", () => {
  // √(2.304324 − 1.96) = √0.344324 = 0.5867913, 1.518 − 0.5867913 = 0.9312087; zero 590.6302 nm, FWHM 2·1.391557/π·590.6302 = 523.2351 nm
  const s = psfSummary(550e-9, 1.518, 1.4);
  assertRel(s.axialZero, 590.6302046e-9, 1e-8, "axial zero");
  assertRel(s.axialFwhm, 523.2351292e-9, 1e-8, "axial FWHM");
  assertRel(s.airyRadius, 239.5780144e-9, 1e-8, "Airy radius");
});

test("psfSummary: NA at or above n has no result", () => {
  for (const s of [psfSummary(550e-9, 1.33, 1.33), psfSummary(550e-9, 1, 1.4)]) {
    assert.ok(Number.isNaN(s.airyRadius) && Number.isNaN(s.lateralFwhm) && Number.isNaN(s.axialFwhm) && Number.isNaN(s.axialZero));
  }
});
