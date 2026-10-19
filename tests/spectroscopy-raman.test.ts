import test from "node:test";
import assert from "node:assert/strict";

import { c2_radiation } from "../src/physics/constants";
import { complex } from "../src/physics/complex";
import {
  antiStokesStokesRatio, antiStokesWavelength, ramanShiftEnergy, ramanShiftOf, stokesWavelength,
} from "../src/physics/spectroscopy/raman";
import {
  sersEnhancement, silverPermittivity, silverSphereResonance, sphereFieldEnhancement,
} from "../src/physics/spectroscopy/sers";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const perCm = 100; // 1 cm⁻¹ in 1/m

test("Raman shift: 532 nm and 1000 cm⁻¹ give 561.893 nm (Stokes) and 505.127 nm (anti-Stokes)", () => {
  // Hand calculation (audit value, PR #127): 10⁷/(18796.99 ∓ 1000).
  assertRel(stokesWavelength(532e-9, 1000 * perCm) * 1e9, 561.8927, 1e-6, "Stokes");
  assertRel(antiStokesWavelength(532e-9, 1000 * perCm) * 1e9, 505.1272, 1e-6, "anti-Stokes");
  // Inverse: the shift of each line, with the sign of its side.
  assertRel(ramanShiftOf(532e-9, 561.892691e-9) / perCm, 1000, 1e-6, "shift of the Stokes line");
  assertRel(ramanShiftOf(532e-9, 505.127231e-9) / perCm, -1000, 1e-6, "shift of the anti-Stokes line");
  // 1000 cm⁻¹ = 123.984 meV (hc = 1.239842 eV µm).
  assertRel(ramanShiftEnergy(1000 * perCm) / 1.602176634e-22, 123.9842, 1e-6, "energy, meV");
  // Edge: a shift at or above the laser wavenumber has no Stokes line.
  assert.ok(Number.isNaN(stokesWavelength(532e-9, 1 / 532e-9)), "shift = ν̃_L");
  assert.ok(Number.isNaN(ramanShiftOf(0, 500e-9)), "λ_L = 0");
});

test("Anti-Stokes/Stokes ratio of the silicon 520.7 cm⁻¹ phonon at 532 nm and 295 K", () => {
  // Hand calculation: x = c₂Ω̃/T = 1.4387769 cm K · 520.7 cm⁻¹/295 K = 2.539563, e^−x = 0.0789009;
  // ((18796.992 + 520.7)/(18796.992 − 520.7))³ = 1.180868 → 0.0931715 for photon counts; ⁴ = 1.248155 → 0.0984805 for power.
  const x = (c2_radiation * 520.7 * perCm) / 295;
  assertRel(x, 2.539563, 1e-6, "x");
  assertRel(antiStokesStokesRatio(532e-9, 520.7 * perCm, 295, "photon"), 0.0931715, 1e-6, "photon");
  assertRel(antiStokesStokesRatio(532e-9, 520.7 * perCm, 295, "power"), 0.0984805, 1e-6, "power");
  // High-temperature limit: the Boltzmann factor → 1, only the frequency factor stays.
  const f = (1 / 532e-9 + 52070) / (1 / 532e-9 - 52070);
  assertRel(antiStokesStokesRatio(532e-9, 520.7 * perCm, 1e12, "photon"), f ** 3, 1e-8, "T → ∞");
  assert.ok(Number.isNaN(antiStokesStokesRatio(532e-9, 520.7 * perCm, 0, "photon")), "T = 0");
});

test("Quasistatic sphere: a perfect conductor triples the field at the pole and zeroes it at the equator", () => {
  // ε → −∞ gives g → 1: E = 3E₀ at the pole, 0 at the equator (Jackson, Classical Electrodynamics, 3rd ed., §4.4;
  // Bohren & Huffman ch. 5). So EF_max = 9·9 = 81 and the surface average 81/5 = 16.2.
  const metal = complex(-1e12, 0);
  const f = sphereFieldEnhancement(metal, 1.77, 20e-9, 0);
  assertRel(f.pole, 9, 1e-9, "pole |E/E₀|²");
  assert.ok(f.equator < 1e-20, "equator");
  const ef = sersEnhancement(metal, metal, 1.77, 20e-9, 0);
  assertRel(ef.max, 81, 1e-9, "EF max");
  assertRel(ef.average, 16.2, 1e-9, "EF average");
  // One radius out (d = a) the dipole field falls by (1/2)³: 1 + 2/8 = 1.25 → |E/E₀|² = 1.5625.
  assertRel(sphereFieldEnhancement(metal, 1.77, 20e-9, 20e-9).pole, 1.5625, 1e-9, "d = a");
  // No contrast (ε = ε_m): no enhancement anywhere.
  const same = sersEnhancement(complex(1.77, 0), complex(1.77, 0), 1.77, 20e-9, 0);
  assertRel(same.max, 1, 1e-12, "ε = ε_m max");
  assertRel(same.average, 1, 1e-12, "ε = ε_m average");
});

test("SERS surface average equals a quadrature of |E_L|²|E_R|² over the sphere", () => {
  // Independent check of the 1/5, 8/15, 2/15 moments: ⟨f⟩ = ½∫₀^π f(θ) sin θ dθ (midpoint rule, 20000 steps).
  const epsL = silverPermittivity(405e-9);
  const epsR = silverPermittivity(stokesWavelength(405e-9, 1000 * perCm));
  const em = 1.33 ** 2;
  const L = sphereFieldEnhancement(epsL, em, 20e-9, 1e-9);
  const R = sphereFieldEnhancement(epsR, em, 20e-9, 1e-9);
  const N = 20000;
  let sum = 0;
  for (let i = 0; i < N; i++) {
    const t = (Math.PI * (i + 0.5)) / N;
    const c2 = Math.cos(t) ** 2, s2 = Math.sin(t) ** 2;
    sum += (L.pole * c2 + L.equator * s2) * (R.pole * c2 + R.equator * s2) * Math.sin(t);
  }
  assertRel(sersEnhancement(epsL, epsR, em, 20e-9, 1e-9).average, (sum * Math.PI) / N / 2, 1e-7, "average");
});

test("Silver sphere: resonance where Re ε = −2ε_m, near 383 nm in water and 355 nm in air", () => {
  // Hand check of the Fröhlich condition on the Yang et al. (2015) data: Re ε(383.5 nm) ≈ −2·1.7689 = −3.54.
  const lambda = silverSphereResonance(1.33 ** 2);
  assert.ok(Math.abs(lambda * 1e9 - 383.5) <= 1, `water ${lambda * 1e9}`);
  assert.ok(Math.abs(silverPermittivity(lambda).re + 2 * 1.33 ** 2) < 0.15, `Re ε ${silverPermittivity(lambda).re}`);
  assert.ok(Math.abs(silverSphereResonance(1) * 1e9 - 354.5) <= 1, "air");
  // At 532 nm (ε ≈ −11.12 + 0.35i) the sphere is off resonance: |1 + 2g|² from the hand-evaluated g.
  const e = silverPermittivity(532e-9);
  const em = 1.33 ** 2;
  const dr = e.re + 2 * em, nr = e.re - em;
  const d2 = dr * dr + e.im * e.im;
  const gr = (nr * dr + e.im * e.im) / d2, gi = (e.im * dr - nr * e.im) / d2;
  assertRel(sphereFieldEnhancement(e, em, 20e-9, 0).pole, (1 + 2 * gr) ** 2 + 4 * gi * gi, 1e-12, "532 nm pole");
  assert.ok(Number.isNaN(silverPermittivity(250e-9).re), "below the table");
});
