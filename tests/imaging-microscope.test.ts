import test from "node:test";
import assert from "node:assert/strict";

import {
  abbePeriodLimit, apertureDiameter, exitPupilDiameter, objectiveMag, rayleighCondenserResolution, totalMag,
  usefulMagRange,
} from "../src/physics/imaging/microscope";
import { objectFieldDiameter } from "../src/physics/imaging/field-of-view";
import { inoueDepthOfField, quarterWaveDepth, widefieldDepthOfField } from "../src/physics/imaging/optical-sectioning-thickness";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const mm = 1e-3;
const um = 1e-6;
const nm = 1e-9;

test("objective and total magnification, M_obj = f_TL/f_obj (Greivenkamp 2004, doi:10.1117/3.547461)", () => {
  // f_obj 10 mm with a 200 mm tube lens: 20×; a 0.5× C-mount adapter gives 10× on the camera, a 10× eyepiece 200×.
  const Mobj = objectiveMag(10 * mm, 200 * mm);
  assertRel(Mobj, 20, 1e-12, "M_obj");
  assertRel(totalMag(Mobj, 0.5), 10, 1e-12, "camera");
  assertRel(totalMag(Mobj, 10), 200, 1e-12, "visual");
  // A Nikon 40× (f 5 mm at 200 mm) behind an Olympus 180 mm tube lens: 36×.
  assertRel(objectiveMag(5 * mm, 180 * mm), 36, 1e-12, "foreign tube lens");
  assert.ok(Number.isNaN(objectiveMag(0, 200 * mm)));
  assert.ok(Number.isNaN(totalMag(20, 0)));
});

test("exit pupil 500 mm·NA/M and useful magnification 500–1000·NA (MicroscopyU)", () => {
  // Hand values: 40×/0.75 with a 10× eyepiece, 500·0.75/400 = 0.9375 mm; 10×/0.25 with 10×, 125/100 = 1.25 mm.
  assertRel(exitPupilDiameter(0.75, 400), 0.9375 * mm, 1e-12, "40×/0.75");
  assertRel(exitPupilDiameter(0.25, 100), 1.25 * mm, 1e-12, "10×/0.25");
  // At the ends of the useful range the exit pupil is 1 mm and 0.5 mm, for any NA.
  const r = usefulMagRange(1.4);
  assertRel(r.min, 700, 1e-12, "min");
  assertRel(r.max, 1400, 1e-12, "max");
  assertRel(exitPupilDiameter(1.4, r.min), 1 * mm, 1e-12, "pupil at min");
  assertRel(exitPupilDiameter(1.4, r.max), 0.5 * mm, 1e-12, "pupil at max");
  // Same pupil via the back aperture 2·f_obj·NA imaged by f_eye/f_TL: f_obj 5, f_TL 200, f_eye 25 mm → 0.9375 mm.
  assertRel(apertureDiameter(5 * mm, 0.75) * (25 / 200), 0.9375 * mm, 1e-12, "via back aperture");
  assert.ok(Number.isNaN(exitPupilDiameter(0, 400)));
});

test("Köhler resolution λ/(NA_obj + NA_c) and 1.22λ/(NA_obj + NA_c) (MicroscopyU, Resolution)", () => {
  // 550 nm, 0.95 objective, 0.9 condenser: 550/1.85 = 297.30 nm (Abbe period), ×1.22 = 362.70 nm (Rayleigh).
  assertRel(abbePeriodLimit(550 * nm, 0.95, 0.9), 297.2973 * nm, 1e-6, "Abbe");
  assertRel(rayleighCondenserResolution(550 * nm, 0.95, 0.9), 362.7027 * nm, 1e-6, "Rayleigh");
  // A condenser wider than the objective adds no brightfield resolution: λ/(2NA) = 289.47 nm.
  assertRel(abbePeriodLimit(550 * nm, 0.95, 1.4), 289.4737 * nm, 1e-6, "capped");
  // Condenser closed (coherent axial illumination): λ/NA_obj.
  assertRel(abbePeriodLimit(550 * nm, 0.95, 0), 578.9474 * nm, 1e-6, "coherent");
});

test("visual field FN/M_obj (MicroscopyU, Field of View)", () => {
  assertRel(objectFieldDiameter(20 * mm, 40), 500 * um, 1e-12, "FN 20 at 40×");
  assert.ok(Number.isNaN(objectFieldDiameter(20 * mm, 0)));
});

test("Inoué depth of field λ₀n/NA² + n·e/(M·NA) (Inoué & Spring 1997, doi:10.1007/978-1-4615-5859-0_2)", () => {
  // Hand values. Dry 40×/0.4, 550 nm, n 1 (air), e 6.5 µm: 3.4375 + 0.40625 = 3.84375 µm.
  const dry = inoueDepthOfField(550 * nm, 1, 0.4, 6.5 * um, 40);
  assertRel(dry.wave, 3.4375 * um, 1e-12, "wave");
  assertRel(dry.detector, 0.40625 * um, 1e-12, "detector");
  assertRel(dry.total, 3.84375 * um, 1e-12, "total");
  // Both terms scale with n: n 1.52 gives 5.225 + 0.6175 = 5.8425 µm.
  assertRel(inoueDepthOfField(550 * nm, 1.52, 0.4, 6.5 * um, 40).total, 5.8425 * um, 1e-12, "n 1.52");
  // 100×/1.4 oil, n 1.515: 0.83325/1.96 + 9.8475/140 = 0.425128 + 0.070339 = 0.495467 µm.
  assertRel(inoueDepthOfField(550 * nm, 1.515, 1.4, 6.5 * um, 100).total, 0.495467 * um, 1e-5, "oil");
  // The wave term is half Born & Wolf's focus-to-first-zero distance 2nλ/NA².
  assertRel(dry.wave, widefieldDepthOfField(550 * nm, 1, 0.4) / 2, 1e-12, "vs first zero");
  // Non-paraxial quarter-wave depth λ/(2(n − √(n² − NA²))): 1.515 − √0.335225 = 0.936014, 0.55/1.872028 = 0.29380 µm.
  assertRel(quarterWaveDepth(550 * nm, 1.515, 1.4), 0.293799 * um, 1e-5, "exact wave term, oil");
  // At low NA it tends to Inoué's λn/NA².
  assertRel(quarterWaveDepth(550 * nm, 1, 0.01), (550 * nm) / 1e-4, 1e-4, "paraxial limit");
  // NA ≥ n is not a valid aperture.
  assert.ok(Number.isNaN(inoueDepthOfField(550 * nm, 1, 1.2, 6.5 * um, 40).total));
});
