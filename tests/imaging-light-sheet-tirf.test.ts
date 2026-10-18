import test from "node:test";
import assert from "node:assert/strict";

import {
  ballisticDepth, ballisticFraction, marginalFocalShift, paraxialFocalShift,
} from "../src/physics/imaging/cleared-tissue";
import {
  effectiveAxialFwhm, gaussianSheetDivergence, gaussianSheetFwhm, gaussianSheetHalfThicknessAt,
  gaussianSheetRayleighRange, gaussianSheetWaist,
} from "../src/physics/imaging/light-sheet";
import { axialPsfFwhm } from "../src/physics/imaging/optical-sectioning-thickness";
import { abbeLateralFwhm } from "../src/physics/imaging/super-resolution";
import {
  tirfCriticalAngle, tirfInterfaceIntensity, tirfMaxAngle, tirfPenetrationDepth,
} from "../src/physics/imaging/tirf";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const nm = 1e-9;
const deg = Math.PI / 180;

test("light sheet: selective-plane defaults and the Gaussian beam profile (Siegman, Lasers, ch. 17)", () => {
  // λ 488 nm, NA_ill 0.05, n 1.45, NA_det 1.0. Hand: w₀ = 488/(π·0.05) = 3106.7 nm, FWHM √(2 ln 2) w₀ = 3657.9 nm;
  // detection 0.88·488/(1.45 − √(1.45² − 1)) = 1073.6 nm; (3657.9⁻² + 1073.6⁻²)^(−1/2) = 1030.15 nm.
  const sheet = gaussianSheetFwhm(488 * nm, 0.05);
  assertRel(sheet, 3657.87 * nm, 1e-5, "sheet FWHM");
  const det = axialPsfFwhm(488 * nm, 1.45, 1.0);
  assertRel(det, 1073.60 * nm, 1e-5, "detection axial");
  assertRel(effectiveAxialFwhm(sheet, det), 1030.15 * nm, 1e-5, "effective axial");
  // The sheet is √2 thicker one Rayleigh range from the waist; divergence half-angle NA/n = λ/(π n w₀).
  const zR = gaussianSheetRayleighRange(488 * nm, 0.1, 1.33);
  assertRel(gaussianSheetHalfThicknessAt(zR, 488 * nm, 0.1, 1.33), Math.SQRT2 * gaussianSheetWaist(488 * nm, 0.1), 1e-12, "w(z_R)");
  assertRel(gaussianSheetDivergence(0.1, 1.33), (488 * nm) / (Math.PI * 1.33 * gaussianSheetWaist(488 * nm, 0.1)), 1e-12, "divergence");
  // Far from the waist w(x) → θ x.
  const x = 1e4 * zR;
  assertRel(gaussianSheetHalfThicknessAt(x, 488 * nm, 0.1, 1.33), gaussianSheetDivergence(0.1, 1.33) * x, 1e-6, "far field");
  assert.ok(Number.isNaN(gaussianSheetDivergence(0, 1.33)) && Number.isNaN(gaussianSheetHalfThicknessAt(NaN, 488 * nm, 0.1, 1.33)));
});

test("TIRF penetration depth and interface intensity (Axelrod, Traffic 2, 764 (2001), eqs. 2, 4, 5)", () => {
  // d = λ/(4π √(n₁² sin²θ − n₂²)); 488 nm, 1.518/1.33, 65°: 488/(4π · 0.35193) = 110.34 nm (half the field depth).
  assertRel(tirfPenetrationDepth(488 * nm, 1.518, 1.33, 65 * deg), 110.344 * nm, 1e-5, "d");
  assertRel(tirfCriticalAngle(1.518, 1.33) / deg, 61.1817, 1e-5, "θ_c");
  assertRel(tirfMaxAngle(1.49, 1.518) / deg, 78.9782, 1e-5, "θ_max for NA 1.49");
  // Interface intensity equals the Fresnel |t|² with cos θ₂ = i√(sin²θ₂ − 1): s 3.07470, p 3.93227 at 65°.
  const at65 = tirfInterfaceIntensity(1.518, 1.33, 65 * deg);
  assertRel(at65.s, 3.07470, 1e-5, "I_s(0)");
  assertRel(at65.p, 3.93227, 1e-5, "I_p(0)");
  // At the critical angle: s → 4, p → 4/n² (Axelrod 2001); the depth diverges.
  const n = 1.33 / 1.518;
  const atC = tirfInterfaceIntensity(1.518, 1.33, tirfCriticalAngle(1.518, 1.33));
  assertRel(atC.s, 4, 1e-9, "I_s at θ_c");
  assertRel(atC.p, 4 / (n * n), 1e-9, "I_p at θ_c");
  assert.ok(Number.isNaN(tirfPenetrationDepth(488 * nm, 1.518, 1.33, 60 * deg)), "no TIR below θ_c");
  assert.ok(Number.isNaN(tirfInterfaceIntensity(1.518, 1.33, 60 * deg).s));
  assert.ok(Number.isNaN(tirfCriticalAngle(1.33, 1.518)) && Number.isNaN(tirfMaxAngle(1.6, 1.518)));
});

test("cleared tissue: resolution, ballistic light (Jacques 2013) and focal shift (Hell 1993, Diel 2020)", () => {
  // Defaults: 680 nm, NA 1.2, n 1.52. Axial 0.88·680/(1.52 − √(1.52² − 1.2²)) = 1019.34 nm; Abbe 680/2.4 = 283.33 nm.
  assertRel(axialPsfFwhm(680 * nm, 1.52, 1.2), 1019.34 * nm, 1e-5, "axial");
  assertRel(abbeLateralFwhm(680 * nm, 1.2), 283.333 * nm, 1e-5, "lateral");
  // µ_a 0.01 + µ_s 0.5 mm⁻¹ over 1 mm: exp(−0.51) = 0.600496.
  assertRel(ballisticFraction(10, 500, 1e-3), 0.600496, 1e-6, "ballistic");
  assertRel(ballisticDepth(10, 500, Math.exp(-1)), 1e-3 / 0.51, 1e-12, "1/e depth = 1/µ_t");
  assertRel(ballisticDepth(10, 500, 0.01), Math.log(100) / 510, 1e-12, "1 % depth");
  assert.equal(ballisticFraction(0, 0, 1), 1);
  assert.ok(Number.isNaN(ballisticDepth(0, 0, 0.5)) && Number.isNaN(ballisticFraction(-1, 0, 1)));
  // Water objective (1.33) into a 1.52 medium at NA 0.8: paraxial 1.52/1.33 = 1.142857; marginal
  // tan(asin(0.8/1.33))/tan(asin(0.8/1.52)) = 0.753168/0.619171 = 1.216417.
  assertRel(paraxialFocalShift(1.33, 1.52), 1.142857, 1e-6, "paraxial");
  assertRel(marginalFocalShift(0.8, 1.33, 1.52), 1.216417, 1e-6, "marginal");
  // Matched indices: no shift; low NA: the marginal factor tends to the paraxial one.
  assert.equal(marginalFocalShift(1.2, 1.52, 1.52), 1);
  assertRel(marginalFocalShift(1e-4, 1.33, 1.52), 1.52 / 1.33, 1e-8, "paraxial limit");
  assert.ok(Number.isNaN(marginalFocalShift(1.4, 1.52, 1.33)), "NA above the sample index");
});
