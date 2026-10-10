import test from "node:test";
import assert from "node:assert/strict";

import {
  gaussianApparentSource, MIN_RETINAL_IMAGE, pupilPower, retinalGain, retinalImageDiameter, retinalIrradiance,
} from "../src/physics/laser-safety/retinal-image";

// ICNIRP, Health Phys. 105(3), 271–295 (2013), doi:10.1097/HP.0b013e3182983fd4: α_min = 1.5 mrad (Table 2), and "for
// a point source of light, the increase in irradiance from the cornea to the retina is approximately 100,000".
// f = 17 mm: Sliney & Wolbarsht, Safety with Lasers and Other Optical Sources (1980).

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

test("retinal image: Gaussian focus 4λf/(πd), no smaller than α_min · 17 mm", () => {
  assertRel(MIN_RETINAL_IMAGE, 25.5e-6, 1e-12, "α_min f");
  // 1064 nm, 0.1 mm beam: 4 × 1.064 µm × 17 mm / (π × 0.1 mm) = 230.3 µm (a pinhole-like beam diverges).
  assertRel(retinalImageDiameter(1064e-9, 1e-4), 230.3e-6, 1e-4, "thin beam");
  assert.equal(retinalImageDiameter(550e-9, 2e-3), MIN_RETINAL_IMAGE, "2 mm beam: 6 µm diffraction spot, floored");
  // The pupil caps the beam: a 20 mm beam through a 2 mm pupil focuses like a 2 mm beam.
  assert.equal(retinalImageDiameter(1064e-9, 20e-3, 2e-4), retinalImageDiameter(1064e-9, 2e-4));
  assert.ok(Number.isNaN(retinalImageDiameter(0, 1e-3)) && Number.isNaN(retinalImageDiameter(550e-9, 0)), "domain");
});

test("gain and retinal irradiance", () => {
  // (7 mm / 25.5 µm)² = 7.54e4, ICNIRP's "approximately 100,000".
  assertRel(retinalGain(MIN_RETINAL_IMAGE), 75355.6, 1e-6, "point-source gain");
  assert.ok(retinalGain(MIN_RETINAL_IMAGE) > 5e4 && retinalGain(MIN_RETINAL_IMAGE) < 2e5);
  assertRel(pupilPower(1, 7e-3), 1 - Math.exp(-2), 1e-12, "1/e² diameter = pupil: 86.5 %");
  assert.equal(pupilPower(1e-3, 0), 1e-3);
  // 1 mW in a 2 mm beam, all inside 7 mm, on a 25.5 µm disc: 1e-3 / (π (25.5 µm)²/4) = 1.96e6 W/m².
  assertRel(retinalIrradiance(1e-3, 2e-3, MIN_RETINAL_IMAGE), 1e-3 / (Math.PI * 25.5e-6 ** 2 / 4), 1e-9, "1.96 MW/m²");
  // The gain links the two: retinal = gain × corneal irradiance averaged over 7 mm.
  const corneal = pupilPower(1e-3, 2e-3) / (Math.PI * 7e-3 ** 2 / 4);
  assertRel(retinalIrradiance(1e-3, 2e-3, MIN_RETINAL_IMAGE), retinalGain(MIN_RETINAL_IMAGE) * corneal, 1e-12, "gain");
});

// Apparent source: IEC 60825-1:2014, "the real or virtual object that forms the smallest possible retinal image
// (considering the accommodation range of the human eye)", 100 mm to infinity; α from the 63 % (1/e) diameter.
// Gaussian beam: w(r) = w₀√(1 + (r/z_R)²), R = r(1 + (z_R/r)²), M² = θπd₀/(4λ) (ISO 11146-1). Hand calculations.
test("apparent source of a TEM₀₀ beam: the eye focuses it to 4λf/(πd)", () => {
  // At the waist (r = 0) the wavefront is flat: no accommodation, the diffraction spot of the 2 mm beam.
  const s = gaussianApparentSource(633e-9, 2e-3, (4 * 633e-9) / (Math.PI * 2e-3), 0);
  assertRel(s.M2, 1, 1e-12, "M²");
  assertRel(s.retinalDiameter, (4 * 633e-9 * 17e-3) / (Math.PI * 2e-3), 1e-12, "4λf/(πd)");
  assert.equal(s.accommodation, 0);
  // A TEM₀₀ beam wider than the pupil at the eye (0.5 mm waist, 10 m away: 16 mm): the 7 mm pupil diffracts, 4λf/(πD).
  const wide = gaussianApparentSource(633e-9, 0.5e-3, (4 * 633e-9) / (Math.PI * 0.5e-3), 10);
  assert.ok(wide.dCornea > 7e-3 && wide.defocus === 0);
  assertRel(wide.retinalDiameter, (4 * 633e-9 * 17e-3) / (Math.PI * 7e-3), 1e-12, "pupil-limited");
  // A divergence below the TEM₀₀ value is read as M² = 1.
  assert.equal(gaussianApparentSource(633e-9, 2e-3, 1e-5, 1).M2, 1);
  // 1 mm, 1 mrad He-Ne at 1 m: a point source (α ≪ 1.5 mrad).
  assert.ok(gaussianApparentSource(633e-9, 1e-3, 1e-3, 1).alpha < 1.5e-3);
  // The largest α of a TEM₀₀ beam at r has z_R = r (d₀ = √(4λr/π)): √(λ/(πr)), 1.840 mrad at 1064 nm and 100 mm.
  const d0 = Math.sqrt((4 * 1064e-9 * 0.1) / Math.PI);
  assertRel(gaussianApparentSource(1064e-9, d0, (4 * 1064e-9) / (Math.PI * d0), 0.1).alpha, Math.sqrt(1064e-9 / (Math.PI * 0.1)), 1e-12, "z_R = r");
  assertRel(Math.sqrt(1064e-9 / (Math.PI * 0.1)), 1.840e-3, 1e-3, "value");
});

test("apparent source of a multimode beam: the image of its waist", () => {
  // d₀ = 0.4 mm, θ = 0.2 rad, 808 nm (M² = 77.8), seen from 0.2 m: z_R = 2 mm, 1/R = 5.0 D within the 10 D range,
  // so the eye images the waist: α = d₀ / (√2 √(r² + z_R²)) = 1.41414 mrad.
  const s = gaussianApparentSource(808e-9, 0.4e-3, 0.2, 0.2);
  assertRel(s.M2, (0.2 * Math.PI * 0.4e-3) / (4 * 808e-9), 1e-12, "M²");
  assertRel(s.curvature, 0.2 / (0.04 + 4e-6), 1e-12, "1/R");
  assert.equal(s.defocus, 0);
  assertRel(s.alpha, 0.4e-3 / (Math.SQRT2 * Math.hypot(0.2, 2e-3)), 1e-12, "α");
  assertRel(s.alpha, 1.41414e-3, 1e-5, "α value");
  // From 50 mm (nearer than the 100 mm near point): 1/R = 19.968 D, 10 D accommodated; the beam (10.0 mm) overfills
  // the pupil, so the blur radius is 3.5 mm × 17 mm × 9.968 D = 0.5931 mm, with the waist image (67.9 µm) in quadrature.
  const near = gaussianApparentSource(808e-9, 0.4e-3, 0.2, 0.05);
  const delta = 0.05 / (0.0025 + 4e-6) - 10;
  const blur = 3.5e-3 * 17e-3 * delta;
  const image = (0.2 * 0.4e-3 * 17e-3) / (4 * 0.2e-3 * Math.hypot(1, 25));
  assertRel(near.defocus, delta, 1e-12, "defocus");
  assertRel(near.alpha, (Math.SQRT2 * Math.hypot(blur, image)) / 17e-3, 1e-12, "α near");
  assertRel(near.alpha, 49.66e-3, 1e-3, "α near, value");
  assert.ok(Number.isNaN(gaussianApparentSource(808e-9, 0.4e-3, 0.2, -1).alpha), "r < 0");
});
