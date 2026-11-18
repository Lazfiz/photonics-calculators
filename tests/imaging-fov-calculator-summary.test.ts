import assert from "node:assert/strict";
import test from "node:test";

import { fovCalculatorSummary } from "../src/physics/imaging/fov-calculator";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}
const mm = 1e-3;
const um = 1e-6;
const nm = 1e-9;

// Nikon MicroscopyU "Field of View"; Pawley, Handbook of Biological Confocal Microscopy (2006), ch. 4: Nyquist pixel lambda/(4 NA).
test("fovCalculatorSummary: 13.336 x 10.016 mm sensor, 20x, 6.5 um pixel, NA 0.75, 550 nm", () => {
  // 13.336/20 = 0.6668, 10.016/20 = 0.5008 mm, diagonal sqrt(0.6668^2 + 0.5008^2) = 0.83392019 mm, 325 nm footprint,
  // 550/3 = 183.3333 nm Nyquist, ratio 1.7727273, M = 6500/183.3333 = 35.454545
  const r = fovCalculatorSummary({
    sensorWidth: 13.336 * mm, sensorHeight: 10.016 * mm, magnification: 20, pixelSize: 6.5 * um, na: 0.75,
    wavelength: 550 * nm, fieldNumber: 22 * mm,
  });
  assertRel(r.fovWidth, 0.6668 * mm, 1e-12, "width");
  assertRel(r.fovHeight, 0.5008 * mm, 1e-12, "height");
  assertRel(r.fovDiagonal, 0.83392018802761 * mm, 1e-10, "diagonal");
  assertRel(r.footprint, 325 * nm, 1e-12, "footprint");
  assertRel(r.nyquist, 183.33333333333 * nm, 1e-12, "Nyquist");
  assertRel(r.ratio, 1.7727272727273, 1e-12, "ratio");
  assertRel(r.nyquistMag, 35.454545454545, 1e-12, "Nyquist magnification");
  assertRel(r.eyepieceField, 1.1 * mm, 1e-12, "eyepiece field");
  assert.equal(r.verdict, "undersampled by 1.77×: the camera loses detail the objective passes");
});

test("fovCalculatorSummary: oversampled case reports the Nyquist factor", () => {
  // footprint 2000/100 = 20 nm, Nyquist 500/(4*1.0) = 125 nm: sampled at 6.25x
  const r = fovCalculatorSummary({
    sensorWidth: 10 * mm, sensorHeight: 10 * mm, magnification: 100, pixelSize: 2 * um, na: 1,
    wavelength: 500 * nm, fieldNumber: 22 * mm,
  });
  assert.equal(r.verdict, "sampled at 6.25× Nyquist");
});
