import test from "node:test";
import assert from "node:assert/strict";

import { AIRY_HALF_MAX_V, SINC2_HALF_MAX_X, airyIntensity } from "../src/physics/imaging/diffraction-psf";
import {
  CONFOCAL_FWHM_TABLE, CONFOCAL_MAX_PINHOLE_AU, confocalAxialFwhm, confocalFwhmCoefficients, confocalLateralFwhm,
  confocalOpticalSectionFwhm, pinholeAiryUnits, pinholeFillFactor, pinholeThroughput, spinningDiskFrameRate,
} from "../src/physics/imaging/confocal";
import {
  effectiveAxialFwhm, gaussianSheetFwhm, gaussianSheetRayleighRange, gaussianSheetWaist,
} from "../src/physics/imaging/light-sheet";
import { axialPsfFwhm, confocalSectionFwhm } from "../src/physics/imaging/optical-sectioning-thickness";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const nm = 1e-9;
const um = 1e-6;
const bisect = (f: (x: number) => number, a: number, b: number) => {
  for (let i = 0; i < 200; i++) { const m = (a + b) / 2; if (f(a) * f(m) <= 0) b = m; else a = m; }
  return (a + b) / 2;
};

test("confocal FWHM limits: point pinhole (PSF squared) and open pinhole (widefield); Wilhelm et al. (Zeiss 2003)", () => {
  const point = CONFOCAL_FWHM_TABLE[0];
  // Point pinhole, in focus: [2J₁(v)/v]⁴ = ½ at Airy = 1/√2 → v = 1.16027, FWHM = v/π λ/NA = 0.36933 (Wilhelm: 0.37).
  const vHalf = bisect((v) => airyIntensity(v) - Math.SQRT1_2, 0.5, 1.6);
  assertRel(point[1], vHalf / Math.PI, 3e-5, "lateral point pinhole");
  assert.equal(point[1].toFixed(2), "0.37");
  // Point pinhole, on axis: sinc⁴(u/4) = ½ → sin x/x = 2^(−1/4), x = 1.00185; FWHM = 2 · 4x/(4π) = 2x/π = 0.63782
  // in λ/(n − √(n² − NA²)) (Wilhelm: 0.64).
  const x = bisect((s) => Math.sin(s) / s - 2 ** -0.25, 0.5, 1.5);
  assertRel(point[2], (2 * x) / Math.PI, 3e-5, "axial point pinhole");
  assert.equal(point[2].toFixed(2), "0.64");
  // Open pinhole: Airy FWHM 0.51450 λ/NA (Wilhelm: 0.51) and sinc² FWHM 0.88589; 5 AU is within 0.3 % of both.
  const open = CONFOCAL_FWHM_TABLE[CONFOCAL_FWHM_TABLE.length - 1];
  assert.equal(open[0], CONFOCAL_MAX_PINHOLE_AU);
  assertRel(open[1], AIRY_HALF_MAX_V / Math.PI, 3e-3, "lateral 5 AU");
  assertRel(open[2], (2 * SINC2_HALF_MAX_X) / Math.PI, 3e-3, "axial 5 AU");
  // The section keeps widening: no sectioning without a pinhole.
  for (let i = 1; i < CONFOCAL_FWHM_TABLE.length; i++) assert.ok(CONFOCAL_FWHM_TABLE[i][3] > CONFOCAL_FWHM_TABLE[i - 1][3]);
  assert.ok(open[3] > 3.5);
});

test("CONFOCAL_FWHM_TABLE rows match the numerical model (scripts/gen-confocal-table.ts)", () => {
  for (const i of [0, 10]) {
    const [P, lateral, axial, section] = CONFOCAL_FWHM_TABLE[i];
    const c = confocalFwhmCoefficients(P);
    assert.ok(Math.abs(c.lateral - lateral) < 1e-5 && Math.abs(c.axial - axial) < 1e-5 && Math.abs(c.section - section) < 1e-5, `row ${P}`);
  }
  // Mutation guard: a wrong pinhole radius (diameter used as radius) moves the 1 AU row.
  assert.ok(Math.abs(confocalFwhmCoefficients(2).section - CONFOCAL_FWHM_TABLE[10][3]) > 0.1);
});

test("confocal FWHM in SI units at the confocal-resolution and 3d-reconstruction defaults", () => {
  // 550 nm, NA 1.4, n 1.518, 1 AU: 0.50205 · 550/1.4 = 197.23 nm; n − √(n² − NA²) = 0.93115 →
  // axial 0.70754 · 550/0.93115 = 417.9 nm, section 0.87742 · 550/0.93115 = 518.3 nm.
  assertRel(confocalLateralFwhm(550 * nm, 1.4, 1), 197.23 * nm, 1e-4, "lateral");
  assertRel(confocalAxialFwhm(550 * nm, 1.518, 1.4, 1), 417.92 * nm, 1e-4, "axial");
  assertRel(confocalOpticalSectionFwhm(550 * nm, 1.518, 1.4, 1), 518.27 * nm, 1e-4, "section");
  // Wilhelm's geometric formula gives 900.2 nm here (ROADMAP golden), 1.74 × the wave-optical section.
  assertRel(confocalSectionFwhm(550 * nm, 1.518, 1.4, 1), 900.2 * nm, 1e-4, "Wilhelm 1 AU");
  // 3d-reconstruction: 550 nm, NA 1.0, n 1.33, point pinhole → 0.63784 · 550/0.453133 = 774.2 nm
  // (Wilhelm's rounded 0.64 gives the 777 nm of the ROADMAP).
  assertRel(confocalAxialFwhm(550 * nm, 1.33, 1.0, 0), 774.19 * nm, 1e-4, "3D point pinhole");
  // Interpolation between rows: 0.55 AU is the mean of the 0.5 and 0.6 rows.
  const [r5, r6] = [CONFOCAL_FWHM_TABLE[5], CONFOCAL_FWHM_TABLE[6]];
  assertRel(confocalLateralFwhm(1, 1, 0.55), (r5[1] + r6[1]) / 2, 1e-12, "interpolation");
  assert.ok(Number.isNaN(confocalLateralFwhm(550 * nm, 1.4, 5.01)));
  assert.ok(Number.isNaN(confocalAxialFwhm(550 * nm, 1.33, 1.4, 1)), "NA ≥ n");
  assert.ok(Number.isNaN(confocalOpticalSectionFwhm(550 * nm, 1.518, 1.4, -0.1)));
});

test("pinhole size, throughput and spinning-disk scan", () => {
  // 50 µm pinhole, 60×, 488 nm, NA 0.8: (50/60 µm)/(1.22 · 0.488/0.8 µm) = 0.83333/0.74420 = 1.11976 AU.
  assertRel(pinholeAiryUnits(50 * um, 60, 488 * nm, 0.8), 1.11976, 1e-5, "AU");
  // Encircled energy at the Airy ring (1 AU): 83.8 % (Rayleigh; Born & Wolf §8.5.2); 0.5 AU: 58.84 %.
  assertRel(pinholeThroughput(1), 0.83777, 1e-4, "EE 1 AU");
  assertRel(pinholeThroughput(0.5), 0.588443, 1e-4, "EE 0.5 AU");
  assert.equal(pinholeThroughput(0), 0);
  // Tanaami et al., Appl. Opt. 41, 4704 (2002): 1 frame/ms at 5000 rpm with 12 scans per revolution.
  assert.equal(spinningDiskFrameRate(5000, 12), 1000);
  // CSU pinholes 50 µm at 250 µm pitch: π/4 · (1/5)² = 3.1416 %.
  assertRel(pinholeFillFactor(50 * um, 250 * um), Math.PI / 100, 1e-12, "fill");
  assert.ok(Number.isNaN(pinholeFillFactor(300 * um, 250 * um)) && Number.isNaN(spinningDiskFrameRate(5000, 0)));
  assert.ok(Number.isNaN(pinholeAiryUnits(50 * um, 0, 488 * nm, 0.8)));
});

test("Gaussian light sheet and effective axial resolution (Engelbrecht & Stelzer 2006)", () => {
  // 488 nm, NA 0.1: w₀ = 488/(π · 0.1) nm = 1553.35 nm, thickness 2w₀ = 3.10670 µm; z_R = π · 1.33 · w₀²/λ = 20.660 µm.
  assertRel(2 * gaussianSheetWaist(488 * nm, 0.1), 3.10670 * um, 1e-5, "thickness");
  assertRel(gaussianSheetRayleighRange(488 * nm, 0.1, 1.33), 20.660 * um, 1e-4, "z_R");
  // FWHM_sheet = 1.17741 w₀ = 1828.9 nm; detection 0.88 · 488/(1.33 − √(1.33² − 0.64)) = 1605.3 nm →
  // (1/1828.9² + 1/1605.3²)^(−1/2) = 1206.5 nm (ROADMAP golden 1.2065 µm).
  assertRel(gaussianSheetFwhm(488 * nm, 0.1), 1828.93 * nm, 1e-5, "sheet FWHM");
  const det = axialPsfFwhm(488 * nm, 1.33, 0.8);
  assertRel(effectiveAxialFwhm(gaussianSheetFwhm(488 * nm, 0.1), det), 1206.5 * nm, 2e-4, "effective");
  // A very thick sheet leaves the detection PSF.
  assertRel(effectiveAxialFwhm(1, det), det, 1e-9, "thick-sheet limit");
  assert.ok(Number.isNaN(gaussianSheetWaist(488 * nm, 0)) && Number.isNaN(effectiveAxialFwhm(0, det)));
});
