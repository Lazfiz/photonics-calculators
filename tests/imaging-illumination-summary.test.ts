import assert from "node:assert/strict";
import test from "node:test";

import { illuminationSummary } from "../src/physics/imaging/illumination";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}
const mm = 1e-3;
const nm = 1e-9;
const base = {
  objectiveMag: 40, objectiveNa: 0.95, tubeFocal: 200 * mm, condenserNa: 0.9, condenserFocal: 12 * mm,
  fieldNumber: 20 * mm, wavelength: 550 * nm,
};

// Nikon MicroscopyU "Microscope Resolution" (r = 1.22 lambda/(NA_obj + NA_c)) and "Field of View" (FN/M);
// Evident Koehler illumination guide (2020): condenser NA about 0.7-0.8 of the objective NA.
test("illuminationSummary: 40x/0.95 objective, condenser NA 0.9", () => {
  // FN/M = 0.5 mm, f_obj = 5 mm, back aperture 9.5 mm, iris image 9.5*0.9/0.95 = 9 mm, iris 21.6 mm, 550/1.85 = 297.2973 nm
  const r = illuminationSummary(base);
  assertRel(r.fieldOfView, 0.5 * mm, 1e-12, "FOV");
  assertRel(r.objectiveFocal, 5 * mm, 1e-12, "f_obj");
  assertRel(r.backAperture, 9.5 * mm, 1e-12, "back aperture");
  assertRel(r.irisImage, 9 * mm, 1e-12, "iris image");
  assertRel(r.irisFill, 0.9 / 0.95, 1e-12, "fill");
  assertRel(r.irisDiameter, 21.6 * mm, 1e-12, "iris");
  assertRel(r.usualNaLow, 0.665, 1e-12, "low");
  assertRel(r.usualNaHigh, 0.76, 1e-12, "high");
  assertRel(r.abbePeriod, 297.2972972973 * nm, 1e-10, "Abbe");
  assertRel(r.rayleigh, 362.7027027027 * nm, 1e-10, "Rayleigh");
  assert.match(r.advice, /^Condenser NA is above 0.8 × the objective NA/);
});

test("illuminationSummary: condenser wider than the objective is capped at the back aperture", () => {
  // NA_c 1.2 > NA_obj 0.95: iris image = back aperture 9.5 mm, resolution uses min(NA_c, NA_obj): 550/1.9 = 289.4737 nm
  const r = illuminationSummary({ ...base, condenserNa: 1.2 });
  assertRel(r.irisImage, 9.5 * mm, 1e-12, "iris image");
  assertRel(r.irisFill, 1, 1e-12, "fill");
  assertRel(r.abbePeriod, 289.4736842105 * nm, 1e-10, "Abbe");
  assert.match(r.advice, /^Condenser NA is above the objective NA/);
});

test("illuminationSummary: condenser NA 0.7 fills 73.68 % of the back aperture", () => {
  // ratio 0.7/0.95 = 0.73684210526316; iris image 9.5 mm × 0.73684210526316 = 7 mm; between 0.7 and 0.8: the usual range
  const r = illuminationSummary({ ...base, condenserNa: 0.7 });
  assertRel(r.irisFill, 0.7368421052632, 1e-12, "fill");
  assertRel(r.irisImage, 7 * mm, 1e-12, "iris image");
  assert.match(r.advice, /^Condenser NA is within the usual/);
});
