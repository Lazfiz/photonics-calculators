import test from "node:test";
import assert from "node:assert/strict";

import { besselJ } from "../src/physics/math";
import {
  GAUSSIAN_PULSE_PEAK_FACTOR, ballisticFraction, focalIntensityRadius, focalPeakIntensity, gaussianPulsePeakPower,
  multiphotonFwhm, multiphotonVolume, pulseEnergy, zipfelAxialRadius, zipfelLateralRadius,
} from "../src/physics/imaging/multiphoton-focus";
import { twoPhotonAxialFwhm } from "../src/physics/imaging/optical-sectioning-thickness";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const um = 1e-6;

test("Zipfel radii reproduce a published SRS focus (880 nm, NA 1.0, n 1.33)", () => {
  // arXiv:2606.26461 (Methods, "effective SRS excitation volume") uses Zipfel et al. 2003 and quotes a lateral
  // 1/e diameter of 404 nm, an axial FWHM of 1.22 µm and V = π^(3/2) ω_xy² ω_z = 1.66e-1 µm³.
  // Hand calculation: ω_xy = 0.325 · 0.88/√2 = 0.202233 µm; n − √(n² − 1) = 0.453131;
  // ω_z = 0.532 · 0.88/(√2 · 0.453131) = 0.730560 µm; FWHM = 2√ln2 ω_z = 1.216462 µm; V = 0.166374 µm³.
  const lambda = 880e-9;
  assertRel(2 * zipfelLateralRadius(lambda, 1.0), 0.404465 * um, 1e-5, "2ω_xy");
  assertRel(zipfelAxialRadius(lambda, 1.33, 1.0), 0.730560 * um, 1e-5, "ω_z");
  assertRel(multiphotonFwhm(lambda, 1.33, 1.0, 2).axial, 1.216462 * um, 1e-5, "axial FWHM");
  assertRel(multiphotonVolume(lambda, 1.33, 1.0, 2), 0.166374 * um ** 3, 1e-5, "2P volume");
  // The paper's rounded values.
  assert.equal(Math.round(2 * zipfelLateralRadius(lambda, 1.0) * 1e9), 404);
  assert.equal(Number((multiphotonFwhm(lambda, 1.33, 1.0, 2).axial / um).toFixed(2)), 1.22);
  assert.equal(Number((multiphotonVolume(lambda, 1.33, 1.0, 2) / um ** 3).toFixed(3)), 0.166);
  // Same axial FWHM as the optical-sectioning module.
  assertRel(multiphotonFwhm(lambda, 1.33, 1.0, 2).axial, twoPhotonAxialFwhm(lambda, 1.33, 1.0), 1e-12, "same as sectioning");
});

test("the 2P focal volume at the old page defaults was 7× too large", () => {
  // 800 nm, NA 0.8, n 1.33: ω_xy = 0.325 · 0.8/(√2 · 0.8^0.91) = 0.225240 µm, ω_z = 1.125014 µm,
  // V = π^(3/2) ω_xy² ω_z = 0.317816 µm³. The page used the Airy radius as a Gaussian waist,
  // w₀ = 0.61λ/NA = 0.61 µm, z_R = π w₀² n/λ, V = π w₀² z_R = 2.271856 µm³.
  const V = multiphotonVolume(800e-9, 1.33, 0.8, 2);
  assertRel(V, 0.317816 * um ** 3, 1e-5, "V");
  const w0 = 0.61 * um, zR = (Math.PI * w0 * w0 * 1.33) / 800e-9;
  assertRel(Math.PI * w0 * w0 * zR / V, 7.1483, 1e-4, "old/new");
});

/** Half width of [2J₁(v)/v]^(2k) at half maximum, in units of λ/NA (v = 2π NA r/λ). */
function airyHalfWidth(order: number): number {
  const I = (x: number) => { const v = 2 * Math.PI * x; return (2 * besselJ(1, v) / v) ** 2; };
  let lo = 1e-6, hi = 0.6;
  for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (I(m) ** order > 0.5) lo = m; else hi = m; }
  return lo;
}

test("low-NA lateral FWHM and peak intensity agree with the paraxial Airy pattern", () => {
  // Born & Wolf §8.5: I(v) = I₀ [2J₁(v)/v]², I₀ = π NA² P/λ². Exact FWHMs: k = 1: 0.5145 λ/NA (textbook),
  // k = 2: 0.3693 λ/NA, k = 3: 0.3030 λ/NA. Zipfel's Gaussian is 2.0 % (k = 2) and 1.5 % (k = 3) wider.
  const lambda = 800e-9, NA = 0.3, unit = lambda / NA;
  assertRel(2 * airyHalfWidth(1), 0.5145, 1e-3, "Airy FWHM sanity");
  const k2 = multiphotonFwhm(lambda, 1.33, NA, 2).lateral / unit;
  const k3 = multiphotonFwhm(lambda, 1.33, NA, 3).lateral / unit;
  assertRel(k2, 2 * airyHalfWidth(2), 0.025, "k = 2");
  assertRel(k3, 2 * airyHalfWidth(3), 0.02, "k = 3");
  assert.ok(k2 > 2 * airyHalfWidth(2) && k3 > 2 * airyHalfWidth(3), "the Gaussian is slightly wide");
  // Peak intensity P/(2π ω_xy²) vs π NA² P/λ².
  assertRel(focalPeakIntensity(1, lambda, NA), (Math.PI * NA * NA) / (lambda * lambda), 0.015, "I₀");
  assertRel(focalIntensityRadius(lambda, NA), (2 * 0.32 * lambda) / (Math.SQRT2 * NA), 1e-12, "w = 2ω_xy");
});

test("k-photon FWHM and volume scale as the Gaussian I^k", () => {
  const f2 = multiphotonFwhm(1300e-9, 1.33, 1.0, 2), f3 = multiphotonFwhm(1300e-9, 1.33, 1.0, 3);
  assertRel(f2.lateral / f3.lateral, Math.sqrt(3 / 2), 1e-12, "lateral √(3/2)");
  assertRel(f2.axial / f3.axial, Math.sqrt(3 / 2), 1e-12, "axial √(3/2)");
  assertRel(multiphotonVolume(1300e-9, 1.33, 1.0, 2) / multiphotonVolume(1300e-9, 1.33, 1.0, 3), 1.5 ** 1.5, 1e-12, "volume");
  // k = 2 volume is π^(3/2) ω_xy² ω_z.
  const wxy = zipfelLateralRadius(1300e-9, 1.0), wz = zipfelAxialRadius(1300e-9, 1.33, 1.0);
  assertRel(multiphotonVolume(1300e-9, 1.33, 1.0, 2), Math.PI ** 1.5 * wxy * wxy * wz, 1e-12, "π^(3/2)");
});

test("Gaussian pulse peak power integrates back to the pulse energy", () => {
  // 30 mW at 80 MHz = 0.375 nJ; 100 fs FWHM → P_peak = 0.939437 · 3750 W = 3522.89 W.
  assertRel(pulseEnergy(30e-3, 80e6), 0.375e-9, 1e-12, "E");
  const P = gaussianPulsePeakPower(30e-3, 80e6, 100e-15);
  assertRel(P, 3522.89, 1e-5, "P_peak");
  let E = 0;
  const tau = 100e-15, dt = tau / 2000;
  for (let t = -5 * tau; t <= 5 * tau; t += dt) E += P * Math.exp((-4 * Math.LN2 * t * t) / (tau * tau)) * dt;
  assertRel(E, 0.375e-9, 1e-6, "∫P dt");
  assertRel(GAUSSIAN_PULSE_PEAK_FACTOR, 0.939437, 1e-6, "factor");
});

test("domain guards and limits", () => {
  assert.ok(Number.isNaN(zipfelAxialRadius(800e-9, 1.33, 1.33)), "NA = n");
  assert.ok(Number.isNaN(zipfelAxialRadius(800e-9, 1.33, 1.4)), "NA > n");
  assert.ok(Number.isNaN(zipfelLateralRadius(800e-9, 0)), "NA = 0");
  assert.ok(Number.isNaN(multiphotonFwhm(800e-9, 1.33, 0.8, 0).lateral), "order 0");
  assert.ok(Number.isNaN(gaussianPulsePeakPower(30e-3, 0, 100e-15)), "f = 0");
  assert.ok(Number.isNaN(focalPeakIntensity(-1, 800e-9, 0.8)), "P < 0");
  // The two lateral branches meet within 1.7 % at NA = 0.7.
  assertRel(zipfelLateralRadius(800e-9, 0.7) / zipfelLateralRadius(800e-9, 0.7000001), 1.0168, 1e-3, "branch step");
  assert.equal(ballisticFraction(0, 1e4), 1);
  assertRel(ballisticFraction(100e-6, 1e4), Math.exp(-1), 1e-12, "one attenuation length");
  assert.ok(Number.isNaN(ballisticFraction(-1, 1e4)));
});
