import test from "node:test";
import assert from "node:assert/strict";

import { besselJ } from "../src/physics/math";
import {
  AIRY_HALF_MAX_V, BESSEL_J1_FIRST_ZERO, SINC2_HALF_MAX_X, airyFirstZeroRadius, airyFwhm, airyIntensity, axialFirstZero,
  axialIntensity, axialOpticalCoordinate, encircledEnergyAiry, fNumberFromNa, lateralOpticalCoordinate, naFromFNumber,
  paraxialAxialIntensity, thinLensNa,
} from "../src/physics/imaging/diffraction-psf";
import { axialPsfFwhm } from "../src/physics/imaging/optical-sectioning-thickness";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const nm = 1e-9;
const bisect = (f: (x: number) => number, a: number, b: number) => {
  for (let i = 0; i < 200; i++) { const m = (a + b) / 2; if (f(a) * f(m) <= 0) b = m; else a = m; }
  return (a + b) / 2;
};

test("Airy disk radius and FWHM (Born & Wolf §8.5.2; j₁,₁ from A&S Table 9.5)", () => {
  // j₁,₁ = 3.8317059702 (A&S Table 9.5) → r = 3.8317059702/(2π) · 550/0.95 nm = 353.0623 nm.
  assertRel(airyFirstZeroRadius(550 * nm, 0.95), 353.0623 * nm, 1e-6, "airy-disk default");
  assert.ok(Math.abs(besselJ(1, BESSEL_J1_FIRST_ZERO)) < 1e-14, "J₁ zero");
  // Half maximum at v = 1.61634 → FWHM = 2v/(2π) λ/NA = 0.514497 λ/NA (the quoted 0.514–0.515 λ/NA).
  assert.ok(Math.abs(airyIntensity(AIRY_HALF_MAX_V) - 0.5) < 1e-14, "half max");
  assertRel(AIRY_HALF_MAX_V, bisect((v) => airyIntensity(v) - 0.5, 1, 2), 1e-12, "half-max root");
  assertRel(airyFwhm(1, 1), 0.514497, 1e-5, "FWHM coefficient");
  // psf-calculator default: 550 nm, NA 1.4 → FWHM 202.124 nm, r = 239.649 nm.
  assertRel(airyFwhm(550 * nm, 1.4), 202.124 * nm, 1e-5, "FWHM 1.4");
  assertRel(lateralOpticalCoordinate(airyFirstZeroRadius(550 * nm, 1.4), 550 * nm, 1.4), BESSEL_J1_FIRST_ZERO, 1e-12, "v(r₀)");
  assert.equal(airyIntensity(0), 1);
  assert.ok(Math.abs(airyIntensity(BESSEL_J1_FIRST_ZERO)) < 1e-28, "dark ring");
  // Series branch meets the quadrature branch.
  assertRel(airyIntensity(0.999e-3), (2 * besselJ(1, 0.999e-3) / 0.999e-3) ** 2, 1e-12, "series join");
  assert.ok(Number.isNaN(airyFirstZeroRadius(550 * nm, 0)) && Number.isNaN(airyFwhm(-1, 1)));
});

test("encircled energy 1 − J₀² − J₁² (Rayleigh; Born & Wolf §8.5.2)", () => {
  // Inside the first and second dark rings: 83.8 % and 91.0 % (Born & Wolf); 1 AU and 0.5 AU pinholes
  // (diameter 1.22 λ/NA and half of it) pass 0.838 and 0.588.
  assertRel(encircledEnergyAiry(BESSEL_J1_FIRST_ZERO), 0.837785, 1e-5, "1 AU");
  assertRel(encircledEnergyAiry(BESSEL_J1_FIRST_ZERO / 2), 0.588443, 1e-5, "0.5 AU");
  assertRel(encircledEnergyAiry(7.0155866698), 0.909931, 1e-5, "second ring (j₁,₂ = 7.01559)");
  // Independent check: integrate the intensity, ∫₀^V [2J₁(x)/x]² x dx / 2 (total = 2).
  let s = 0;
  const h = 2e-4;
  for (let x = h / 2; x < BESSEL_J1_FIRST_ZERO; x += h) s += airyIntensity(x) * x * h;
  assertRel(s / 2, encircledEnergyAiry(BESSEL_J1_FIRST_ZERO), 1e-6, "integral");
  // Edge: small v, L ≈ v²/4 (series branch).
  assertRel(encircledEnergyAiry(1e-4), 2.5e-9, 1e-6, "small v");
  assert.equal(encircledEnergyAiry(0), 0);
  assert.ok(encircledEnergyAiry(200) > 0.995 && encircledEnergyAiry(200) < 1, "→ 1");
  assert.ok(Number.isNaN(encircledEnergyAiry(-1)));
});

test("axial PSF: high-NA sinc² reduces to the paraxial sinc²(u/4) (Born & Wolf §8.8)", () => {
  // Paraxial first zero u = 4π ↔ z = 2nλ/NA²; NA 0.01 in air, 550 nm → 11.0 mm (high-NA form 10.99972 mm).
  assertRel(axialFirstZero(550 * nm, 1, 0.01), 0.011, 1e-4, "paraxial limit");
  assert.ok(paraxialAxialIntensity(4 * Math.PI) < 1e-30, "u = 4π zero");
  for (const z of [1e-5, 3e-3, 7e-3]) {
    const u = axialOpticalCoordinate(z, 550 * nm, 1, 0.01);
    assert.ok(Math.abs(axialIntensity(z, 550 * nm, 1, 0.01) - paraxialAxialIntensity(u)) < 1e-4, `z = ${z}`);
  }
  // psf-calculator default: 550 nm, n 1.518, NA 1.4 → n − √(n² − NA²) = 0.931206; FWHM
  // 2 · 1.391557/π · λ/0.931206 = 523.24 nm; first zero λ/0.931206 = 590.63 nm. The page showed 0.88nλ/NA² = 375 nm.
  const zHalf = (SINC2_HALF_MAX_X / Math.PI) * axialFirstZero(550 * nm, 1.518, 1.4);
  assertRel(2 * zHalf, 523.24 * nm, 1e-4, "axial FWHM");
  assertRel(axialFirstZero(550 * nm, 1.518, 1.4), 590.63 * nm, 1e-4, "first zero");
  assert.ok(Math.abs(axialIntensity(zHalf, 550 * nm, 1.518, 1.4) - 0.5) < 1e-12, "half max");
  // The Zeiss 0.88 rounds this curve's 0.8859: within 0.7 %.
  assertRel(axialPsfFwhm(550 * nm, 1.518, 1.4), 5.1975e-7, 1e-4, "Zeiss 0.88");
  assertRel(axialPsfFwhm(550 * nm, 1.518, 1.4), 2 * zHalf, 0.007, "0.88 vs 0.886");
  assert.ok(Number.isNaN(axialIntensity(0, 550 * nm, 1.0, 1.2)), "NA > n");
  assert.ok(Number.isNaN(axialFirstZero(550 * nm, 1.33, 1.33)), "NA = n");
});

test("NA from f-number uses the sine condition, NA = 1/(2N) (Born & Wolf ch. 4)", () => {
  assertRel(naFromFNumber(2.8), 0.178571, 1e-5, "f/2.8");
  assert.equal(naFromFNumber(0.5), 1);
  assert.equal(fNumberFromNa(naFromFNumber(4)), 4);
  // The tangent form the page used: 1/√(1 + 4·2.8²) = 0.175791 (1.6 % low); at f/1, 0.447214 (12 % low).
  assertRel(thinLensNa(2.8), 0.175791, 1e-5, "tan form f/2.8");
  assertRel(thinLensNa(1) / naFromFNumber(1), 0.894427, 1e-5, "tan/sine f/1");
  assert.ok(Number.isNaN(naFromFNumber(0.4)), "N < 0.5 in air");
  assert.ok(Number.isNaN(fNumberFromNa(1.2)), "NA > 1 in air");
});
