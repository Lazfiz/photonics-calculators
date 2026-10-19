import test from "node:test";
import assert from "node:assert/strict";

import {
  nyquistFrequency, nyquistPixel, objectFov, pixelFootprint, pixelIfov, subtendedAngle,
} from "../src/physics/imaging/field-of-view";
import { chiefRayAngle, magnificationChange, pupilDistanceFromSlope } from "../src/physics/imaging/telecentric";
import { inoueDepthOfField } from "../src/physics/imaging/optical-sectioning-thickness";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const mm = 1e-3;
const um = 1e-6;
const nm = 1e-9;
const arcsec = Math.PI / (180 * 3600);
const deg = Math.PI / 180;

test("camera field and pixel footprint, sensor/M (MicroscopyU, Field of View)", () => {
  // Hand values: a 2048 × 1536 sensor of 6.5 µm pixels (13.312 × 9.984 mm; the page's 13.336 × 10.016 mm) at 20×.
  const fov = objectFov(13.336 * mm, 10.016 * mm, 20);
  assertRel(fov.width, 0.6668 * mm, 1e-12, "width");
  assertRel(fov.height, 0.5008 * mm, 1e-12, "height");
  assertRel(fov.diagonal, 0.83392 * mm, 1e-5, "diagonal √(0.6668² + 0.5008²)");
  assertRel(pixelFootprint(6.5 * um, 20), 325 * nm, 1e-12, "pixel");
  assertRel(pixelFootprint(6.5 * um, 20, 2), 650 * nm, 1e-12, "binned 2×2");
  assert.ok(Number.isNaN(objectFov(13 * mm, 10 * mm, 0).diagonal));
  assert.ok(Number.isNaN(pixelFootprint(6.5 * um, 20, 0)));
});

test("pixel IFOV 2·atan(p/2f) and Nyquist 1/(2p) (Holst 2017, doi:10.1117/3.2588947)", () => {
  // 6.5 µm at 50 mm: p/f = 130 µrad = 26.81″; 2 × 2 binning doubles it to 53.63″.
  assertRel(pixelIfov(6.5 * um, 50 * mm) / arcsec, 26.8144, 1e-5, "IFOV");
  assertRel(pixelIfov(6.5 * um, 50 * mm, 2) / arcsec, 53.6288, 1e-5, "IFOV bin 2");
  // 2048 pixels across: 13.312 mm at 50 mm, 2·atan(0.13312) = 15.165°.
  assertRel(subtendedAngle(2048 * 6.5 * um, 50 * mm) / deg, 15.16527, 1e-6, "full field");
  // Limit: at 90° the half-width equals f.
  assertRel(subtendedAngle(100 * mm, 50 * mm) / deg, 90, 1e-12, "90° field");
  assertRel(nyquistFrequency(6.5 * um) * mm, 76.923, 1e-5, "lp/mm");
  assert.ok(Number.isNaN(pixelIfov(6.5 * um, 0)));
});

test("Nyquist object pixel λ/(4NA) for the incoherent cutoff 2NA/λ (Pawley 2006, doi:10.1007/978-0-387-45524-2_4)", () => {
  // 550 nm at NA 0.75: 183.3 nm, so a 325 nm footprint (6.5 µm at 20×) undersamples by 1.77.
  assertRel(nyquistPixel(550 * nm, 0.75), 183.333 * nm, 1e-5, "Nyquist pixel");
  assertRel(pixelFootprint(6.5 * um, 20) / nyquistPixel(550 * nm, 0.75), 1.77273, 1e-5, "undersampling");
  assert.ok(Number.isNaN(nyquistPixel(550 * nm, 0)));
});

test("magnification change −Δz/(s_EP + Δz) with object distance (Greivenkamp 2004, doi:10.1117/3.547461)", () => {
  // Entrance pupil 200 mm away, object 10 mm farther: −10/210 = −4.762 %; the first-order −Δz/s_EP gives −5 %.
  assertRel(magnificationChange(10 * mm, 200 * mm), -1 / 21, 1e-12, "exact");
  assertRel(magnificationChange(10 * um, 200 * mm), -5e-5, 1e-4, "first order");
  // Closer object: +10/190.
  assertRel(magnificationChange(-10 * mm, 200 * mm), 1 / 19, 1e-12, "closer");
  // Hypercentric pupil 200 mm in front of the object: the image grows as the object recedes.
  assertRel(magnificationChange(10 * mm, -200 * mm), 1 / 19, 1e-12, "hypercentric");
  // Telecentric: no change, and +0 rather than −0.
  assert.ok(Object.is(magnificationChange(10 * mm, Infinity), 0));
  // The object can't cross the pupil.
  assert.ok(Number.isNaN(magnificationChange(-300 * mm, 200 * mm)));
  // Chief ray at 5 mm field height: atan(5/200) = 1.4321°.
  assertRel(chiefRayAngle(5 * mm, 200 * mm) / deg, 1.432096, 1e-6, "chief ray");
  assert.equal(chiefRayAngle(5 * mm, Infinity), 0);
});

test("residual telecentric slope as an equivalent pupil distance h/tan θ_t", () => {
  // 0.1° at 5 mm: s_EP = 2864.79 mm, and 10 mm of travel changes m by −0.348 %.
  const s = pupilDistanceFromSlope(5 * mm, 0.1 * deg);
  assertRel(s, 2864.786 * mm, 1e-6, "s_EP");
  assertRel(magnificationChange(10 * mm, s), -0.00347852, 1e-5, "Δm/m");
  assert.equal(pupilDistanceFromSlope(5 * mm, 0), Infinity);
  assert.ok(Number.isNaN(pupilDistanceFromSlope(0, 0.1 * deg)));
});

test("telecentric depth of field λ/NA² + e/(m·NA) (Inoué & Spring 1997, doi:10.1007/978-1-4615-5859-0_2)", () => {
  // m 0.5, object NA 0.025, 550 nm, 10 µm blur: 0.88 mm + 0.80 mm = 1.68 mm.
  const d = inoueDepthOfField(550 * nm, 1, 0.025, 10 * um, 0.5);
  assertRel(d.wave, 0.88 * mm, 1e-12, "wave");
  assertRel(d.detector, 0.8 * mm, 1e-12, "geometric");
  assertRel(d.total, 1.68 * mm, 1e-12, "total");
});
