import test from "node:test";
import assert from "node:assert/strict";

import { photodiodeSpeedSummary, type PhotodiodeSpeedParams } from "../src/physics/detectors/photodiode-speed";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// J. E. Bowers, C. A. Burrus, J. Lightwave Technol. 5, 1339 (1987): f_RC = 1/(2πRC), f_tr = 0.443·v/W, 1/f² = 1/f_RC² + 1/f_tr²;
// W. W. Gärtner, Phys. Rev. 116, 84 (1959): drift share. Values re-derived with an independent script (own constants and root finder).
const base: PhotodiodeSpeedParams = {
  wavelength_nm: 850, qe: 0.8, capacitanceDensity: 1e-5, epsR: 11.9, velocity: 8.4e4, loadResistance: 50, absorptionDepth_um: 5,
  diffusionLength: 35e-6, diffusivity: 36e-4,
};

test("photodiodeSpeedSummary: drift-dominated case has no diffusion corner", () => {
  const s = photodiodeSpeedSummary(base);
  assertRel(s.responsivity, 0.5484569877397465, 1e-9, "R");
  assertRel(s.W, 10.536483504372001e-6, 1e-9, "W");
  assertRel(s.fTransit, 3531301829.9284716, 1e-9, "f_tr");
  assertRel(s.capacitance1, 1e-11, 1e-12, "C");
  assertRel(s.fRC1, 318309886.1837907, 1e-9, "f_RC");
  assertRel(s.f1, 317024558.13053876, 1e-9, "f");
  assertRel(s.driftShare, 0.8919882958144911, 1e-9, "drift share");
  assert.equal(s.fDiffusion, Infinity);
  assert.equal(s.diffusionLimited, false);
  assertRel(s.fTotal, 261328779.73896664, 1e-9, "total");
});

test("photodiodeSpeedSummary: diffusion-limited case", () => {
  const s = photodiodeSpeedSummary({
    ...base, capacitanceDensity: 5e-6, velocity: 1e5, loadResistance: 100, absorptionDepth_um: 100, diffusionLength: 50e-6, diffusivity: 30e-4,
  });
  assertRel(s.driftShare, 0.4130545011089523, 1e-9, "drift share");
  assertRel(s.fDiffusion, 1006110.4384392053, 1e-9, "f_diff");
  assertRel(s.fTotal, 1006083.8038965729, 1e-9, "total");
  assert.equal(s.diffusionLimited, true);
});

test("photodiodeSpeedSummary: silicon outside its absorption table has no absorption coefficient", () => {
  const s = photodiodeSpeedSummary({ ...base, wavelength_nm: 20000, absorptionDepth_um: 0 });
  assert.ok(Number.isNaN(s.alpha));
  assert.ok(Number.isNaN(s.driftShare));
  assert.ok(Number.isNaN(s.fTotal));
});
