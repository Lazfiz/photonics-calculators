import test from "node:test";
import assert from "node:assert/strict";

import { c, k_B, m_u, q } from "../src/physics/constants";
import { integrateSimpson } from "../src/physics/math";
import {
  dopplerFwhmFraction,
  electronDensityFromStark,
  faddeeva,
  gaussianProfile,
  lifetimeFromFwhmHz,
  lorentzianProfile,
  mcWhirterDensity,
  mostProbableSpeed,
  naturalFwhmHz,
  pseudoVoigtProfile,
  pseudoVoigtTch,
  sahaRatio,
  starkFwhm,
  voigtFwhm,
  voigtFwhmOlivero,
  voigtProfile,
} from "../src/physics/spectroscopy/line-broadening";

const close = (actual: number, expected: number, rel: number) =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${actual} vs ${expected}`);

test("Faddeeva w(z) matches tabulated values", () => {
  // Abramowitz & Stegun Table 7.9: w(1 + i) = 0.304744 + 0.208219 i.
  const [re, im] = faddeeva(1, 1);
  close(re, 0.304744, 2e-6);
  close(im, 0.208219, 2e-6);
  // w(iy) = erfcx(y): erfcx(1) = e·erfc(1) = 0.4275835762.
  close(faddeeva(0, 1)[0], 0.4275835762, 1e-9);
  // Real axis: Re w(x) = e^(−x²), Im w(x) = (2/√π)·Dawson(x), Dawson(1) = 0.5380795069 (A&S Table 7.5).
  close(faddeeva(1, 0)[0], Math.exp(-1), 1e-12);
  close(faddeeva(1, 0)[1], (2 / Math.sqrt(Math.PI)) * 0.5380795069, 1e-9);
  close(faddeeva(0, 0)[0], 1, 1e-12);
});

test("Re w agrees with the Fourier integral of the Voigt decay exp(−t²/4 − yt)", () => {
  // Independent quadrature: Re w(x + iy) = π^(−1/2) ∫₀^∞ exp(−t²/4 − yt) cos(xt) dt (Fourier transform of the
  // Gaussian × exponential decay whose spectrum is the Voigt line).
  for (const y of [0, 0.01, 0.3, 1, 5]) {
    for (const x of [0, 0.5, 2, 6]) {
      const ref = integrateSimpson((t) => Math.exp(-t * t / 4 - y * t) * Math.cos(x * t), 0, 40, 40000) / Math.sqrt(Math.PI);
      assert.ok(Math.abs(faddeeva(x, y)[0] - ref) < 1e-10, `x ${x} y ${y}`);
    }
  }
});

test("profiles are area-normalised", () => {
  close(integrateSimpson((x) => gaussianProfile(x, 0.5), -5, 5, 2000), 1, 1e-10);
  // The Lorentzian and Voigt wings beyond ±X hold 2γ/(πX) of the area (γ = Δ_L/2).
  const X = 2000, tail = (2 * 0.15) / (Math.PI * X);
  close(integrateSimpson((x) => lorentzianProfile(x, 0.3), -X, X, 400000), 1 - tail, 1e-6);
  close(integrateSimpson((x) => voigtProfile(x, 0.5, 0.3), -X, X, 400000), 1 - tail, 1e-6);
  close(integrateSimpson((x) => pseudoVoigtProfile(x, 0.5, 0.3), -X, X, 400000), 1, 1e-4);
});

test("Voigt FWHM, Δ_G 0.5 and Δ_L 0.3: exact 0.67941, Olivero 0.67951, TCH 0.67679", () => {
  // Session 96 audit (PR #127): numerical 0.67941; Olivero & Longbothum 1977 formula 0.67951; TCH 1987 width 0.67679.
  close(voigtFwhm(0.5, 0.3), 0.67941, 2e-5);
  close(voigtFwhmOlivero(0.5, 0.3), 0.67951, 2e-5);
  close(pseudoVoigtTch(0.5, 0.3).fwhm, 0.67679, 2e-5);
  // Olivero & Longbothum quote 0.02 % accuracy.
  assert.ok(Math.abs(voigtFwhmOlivero(0.5, 0.3) / voigtFwhm(0.5, 0.3) - 1) < 2e-4);
});

test("Voigt FWHM limits: pure Gaussian, pure Lorentzian, and no width", () => {
  assert.equal(voigtFwhm(0.5, 0), 0.5);
  assert.equal(voigtFwhm(0, 0.3), 0.3);
  close(voigtFwhm(1, 1e-9), 1, 1e-8);
  close(voigtFwhm(1e-9, 1), 1, 1e-8);
  assert.ok(Number.isNaN(voigtFwhm(0, 0)));
  assert.ok(Number.isNaN(voigtProfile(0, 0, 0)));
  // TCH mixing: η = 0 for a Gaussian, 1.36603 − 0.47719 + 0.11116 = 1 for a Lorentzian.
  assert.equal(pseudoVoigtTch(1, 0).eta, 0);
  close(pseudoVoigtTch(0, 1).eta, 1, 1e-12);
});

test("spectral-line-broadening defaults: Doppler 0.2265 cm⁻¹, Voigt 0.3525 cm⁻¹", () => {
  // 500 nm (20 000 cm⁻¹), 5000 K, 20 u; Lorentzian 2·0.1·1 + 0.001 = 0.201 cm⁻¹. Audit (PR #127): Doppler 0.2265,
  // Voigt exact 0.3525, Olivero 0.3525, TCH 0.3517.
  const fG = 2e4 * dopplerFwhmFraction(5000, 20 * m_u);
  close(fG, 0.22649, 5e-5);
  close(voigtFwhm(fG, 0.201), 0.35249, 5e-5);
  close(voigtFwhmOlivero(fG, 0.201), 0.35251, 5e-5);
  close(pseudoVoigtTch(fG, 0.201).fwhm, 0.35169, 5e-5);
});

test("Doppler width: Ne 632.8 nm at 300 K and Na 589 nm at 500 K", () => {
  // Hand: √(8·k_B·300·ln 2/(20.18 u·c²)) = 2.7615e-6; ·c/632.8 nm = 1.308 GHz; ·632.8 nm = 1.748e-3 nm;
  // v_p = √(2 k_B T/m) = 497.2 m/s.
  const f = dopplerFwhmFraction(300, 20.18 * m_u);
  close((f * c) / 632.8e-9, 1.3083e9, 1e-4);
  close(f * 632.8, 1.7475e-3, 1e-4);
  close(mostProbableSpeed(300, 20.18 * m_u), 497.2, 1e-4);
  // Hand: Na D line (22.99 u, 589.0 nm) at 500 K: √(8·k_B·500·ln 2/(m c²))·c/λ = 1.699 GHz.
  close((dopplerFwhmFraction(500, 22.99 * m_u) * c) / 589.0e-9, 1.699e9, 1e-3);
  assert.ok(Number.isNaN(dopplerFwhmFraction(-1, m_u)));
  assert.equal(dopplerFwhmFraction(0, m_u), 0);
});

test("natural width: τ = 16 ns gives 9.947 MHz, and back", () => {
  // Hand: 1/(2π·16 ns) = 9.9472 MHz.
  close(naturalFwhmHz(16e-9), 9.9472e6, 1e-4);
  close(lifetimeFromFwhmHz(naturalFwhmHz(16e-9)), 16e-9, 1e-12);
  assert.ok(Number.isNaN(naturalFwhmHz(0)));
});

test("LIBS: Doppler 0.00566 nm at 500 nm, 10⁴ K, 40 u; Stark 2w·n_e/10¹⁶ cm⁻³", () => {
  // Audit (PR #127) golden 0.00566 nm.
  close(500 * dopplerFwhmFraction(1e4, 40 * m_u), 0.005662, 2e-4);
  // w = 0.01 nm at 1e16 cm⁻³ = 1e22 m⁻³: n_e = 1e17 cm⁻³ gives 0.2 nm, and 0.2 nm gives back 1e17 cm⁻³.
  close(starkFwhm(0.01, 1e23), 0.2, 1e-12);
  close(electronDensityFromStark(0.2, 0.01), 1e23, 1e-12);
  assert.ok(Number.isNaN(electronDensityFromStark(0.2, 0)));
});

test("Saha: (2π m_e k_B T/h²)^(3/2) = 2.415e21 T^(3/2) m⁻³; Fe at 10⁴ K", () => {
  // Chen, Introduction to Plasma Physics, ch. 1: n_i/n_n ≈ 2.4e21 T^(3/2)/n_i · e^(−U/kT) (SI, T in K), the Saha
  // equation with the statistical-weight factor 2U⁺/U⁰ set to 1. χ = 0 isolates the thermal factor.
  close(sahaRatio(1e4, 0) / 2, 2.4147e21 * 1e6, 1e-4);
  // Fe, χ = 7.9024 eV, U⁺/U⁰ = 1: hand 2·2.41468e27·exp(−7.9024/0.861733) = 5.026e23 m⁻³.
  close(sahaRatio(1e4, 7.9024 * q), 5.026e23, 1e-3);
  assert.ok(Number.isNaN(sahaRatio(0, q)));
  // k_B T in eV at 10⁴ K, for the hand value above.
  close((k_B * 1e4) / q, 0.861733, 1e-6);
});

test("McWhirter: T 10⁴ K, ΔE 3 eV needs n_e ≥ 4.32e15 cm⁻³", () => {
  // Cristoforetti et al. 2010 (Spectrochim. Acta B 65, 86): 1.6e12·√(10⁴)·3³ = 4.32e15 cm⁻³.
  close(mcWhirterDensity(1e4, 3), 4.32e21, 1e-12);
});
