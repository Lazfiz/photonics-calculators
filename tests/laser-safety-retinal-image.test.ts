import test from "node:test";
import assert from "node:assert/strict";

import {
  MIN_RETINAL_IMAGE, pupilPower, retinalGain, retinalImageDiameter, retinalIrradiance,
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
