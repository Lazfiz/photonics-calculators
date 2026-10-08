import test from "node:test";
import assert from "node:assert/strict";

import {
  airyUnit, axialPsfFwhm, confocalSectionFwhm, confocalSectionFwhmPointPinhole, twoPhotonAxialFwhm, widefieldDepthOfField,
} from "../src/physics/imaging/optical-sectioning-thickness";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const um = 1e-6;

test("confocal section at 550 nm, NA 0.75, n 1.518, 1 AU (Zeiss formula, hand calculation)", () => {
  // n − √(n² − NA²) = 1.518 − √1.741824 = 0.1982182.
  // Diffraction term 0.88 · 0.55 µm / 0.1982182 = 2.44175 µm; 1 AU = 1.22 · 0.55 / 0.75 = 0.894667 µm;
  // pinhole term √2 · 1.518 · 0.894667 / 0.75 = 2.560871 µm; FWHM = √(2.44175² + 2.560871²) = 3.53839 µm.
  // (The page used to add the first term in nm to the second in µm and showed 2.44 µm.)
  assertRel(airyUnit(550e-9, 0.75), 0.894667 * um, 1e-6, "AU");
  assertRel(axialPsfFwhm(550e-9, 1.518, 0.75), 2.44175 * um, 1e-5, "diffraction term");
  assertRel(confocalSectionFwhm(550e-9, 1.518, 0.75, 1), 3.53839 * um, 1e-5, "1 AU");
  assertRel(confocalSectionFwhmPointPinhole(550e-9, 1.518, 0.75), 1.775819 * um, 1e-5, "point pinhole");
  // A larger pinhole only adds to the section.
  assert.ok(confocalSectionFwhm(550e-9, 1.518, 0.75, 2) > confocalSectionFwhm(550e-9, 1.518, 0.75, 1));
  assert.equal(confocalSectionFwhm(550e-9, 1.518, 0.75, 0), axialPsfFwhm(550e-9, 1.518, 0.75));
});

test("low-NA limit matches the paraxial focal intensity (Born & Wolf §8.8)", () => {
  // I(u) ∝ [sin(u/4)/(u/4)]², u = 2π NA² z/(nλ): half maximum at u/4 = 1.391557, so the axial
  // FWHM is 2 · 4 · 1.391557 / (2π) · nλ/NA² = 1.77178 nλ/NA², and the first zero is at 2nλ/NA².
  const lambda = 500e-9;
  const n = 1;
  const NA = 0.05;
  assertRel(axialPsfFwhm(lambda, n, NA), (1.77178 * n * lambda) / NA ** 2, 0.01, "0.88 rule vs paraxial");
  assertRel(widefieldDepthOfField(lambda, n, NA), (2 * n * lambda) / NA ** 2, 1e-15, "DOF");
  // No cancellation in n − √(n² − NA²) at tiny NA: → NA²/(2n).
  assertRel(axialPsfFwhm(lambda, 1.5, 1e-6), (0.88 * lambda * 2 * 1.5) / 1e-12, 1e-9, "NA → 0");
});

test("two-photon axial FWHM (Zipfel, Williams & Webb 2003, hand calculation)", () => {
  // 800 nm, water n = 1.33, NA 1.0: n − √(n² − 1) = 0.4531306; ω_z = 0.532 · 0.8 / (√2 · 0.4531306)
  // = 0.664143 µm; FWHM = 2√(ln 2) · ω_z = 1.105876 µm.
  assertRel(twoPhotonAxialFwhm(800e-9, 1.33, 1.0), 1.105876 * um, 1e-5, "2P FWHM");
});

test("optical sectioning domain edges", () => {
  assert.ok(Number.isNaN(axialPsfFwhm(550e-9, 1.0, 1.0))); // NA = n
  assert.ok(Number.isNaN(confocalSectionFwhm(550e-9, 1.33, 1.4, 1))); // NA > n
  assert.ok(Number.isNaN(confocalSectionFwhm(550e-9, 1.518, 0.75, -1)));
  assert.ok(Number.isNaN(twoPhotonAxialFwhm(0, 1.33, 1.0)));
  assert.ok(Number.isNaN(widefieldDepthOfField(550e-9, 1.518, 0)));
});
