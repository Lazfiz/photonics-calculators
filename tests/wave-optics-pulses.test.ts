import test from "node:test";
import assert from "node:assert/strict";

import { c, h, q } from "../src/physics/constants";
import {
  chirpedGaussianDuration, gddForStretch, gratingDiffractionAngle, treacyCompressor,
} from "../src/physics/wave-optics/chirped-pulse";
import { cePhaseSlip, combTooth, nearestTooth, wrapOffset } from "../src/physics/wave-optics/frequency-comb";
import {
  IONIZATION_ENERGY_EV, barrierSuppressionIntensity, fourierLimitDuration, hhgCutoff, highestOddHarmonic,
  lorentzDriftParameter, ponderomotiveEnergy,
} from "../src/physics/wave-optics/high-harmonic";
import { TIME_BANDWIDTH, frequencyWidth, wavelengthWidth } from "../src/physics/wave-optics/pulsed-laser";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

test("frequencyWidth inverts wavelengthWidth; 10 nm at 800 nm is a 94.21 fs Gaussian", () => {
  for (const dl of [0.1e-9, 10e-9, 300e-9]) assertRel(wavelengthWidth(frequencyWidth(dl, 800e-9), 800e-9), dl, 1e-12, `Δλ ${dl}`);
  // Hand value: narrow band Δν = cΔλ/λ² = 4.6845 THz, τ = 0.44127/Δν = 94.20 fs (part 0 audit); the exact band 4.68407 THz.
  const dnu = frequencyWidth(10e-9, 800e-9);
  assertRel(dnu, (c * 10e-9) / (800e-9) ** 2, 1e-4, "narrow-band limit");
  assertRel(TIME_BANDWIDTH.gaussian / dnu, 94.2067e-15, 1e-5, "τ₀");
  assert.ok(Number.isNaN(frequencyWidth(1e-9, 0)));
});

test("chirped Gaussian: τ = τ₀√(1 + (4 ln2 φ₂/τ₀²)²) (Diels & Rudolph ch. 1)", () => {
  const tau0 = 94.2067e-15;
  assert.equal(chirpedGaussianDuration(tau0, 0), tau0);
  // Hand value: φ₂ = τ₀²/(4 ln2) doubles √2 times; stretch 1000 needs (τ₀²/4 ln2)√(1000² − 1) = 3.20094 ps².
  assertRel(chirpedGaussianDuration(tau0, tau0 ** 2 / (4 * Math.LN2)), Math.SQRT2 * tau0, 1e-12, "√2");
  const gdd = gddForStretch(tau0, 1000);
  assertRel(gdd, 3.200943e-24, 1e-6, "stretcher GDD");
  assertRel(chirpedGaussianDuration(tau0, -gdd), 1000 * tau0, 1e-12, "sign-symmetric stretch");
  assert.equal(gddForStretch(tau0, 1), 0);
  assert.ok(Number.isNaN(gddForStretch(tau0, 0.5)));
});

test("Treacy compressor: φ₂ = −NGλ³/(2πc²d²cos³β), φ₃ = dφ₂/dω (Treacy 1969; arXiv 2211.15767)", () => {
  const d = 1e-3 / 1740;
  const alpha = Math.PI / 4;
  // Hand value: sin β = 0.8 µm × 1740/mm − sin 45° = 0.684893, cos β = 0.728643, β = 43.2272°; a double pass gives
  // 2 × (0.8 µm)³/(2π c² d² cos³β) = 14.1916 ps² per metre of separation.
  const one = treacyCompressor(800e-9, d, alpha, 1);
  assertRel((one.beta * 180) / Math.PI, 43.22721, 1e-6, "β");
  assertRel(one.gdd, -14.19162e-24, 1e-6, "GDD per metre");
  // Matching the 1000× stretcher above takes G = 3.20094/14.1916 = 0.22555 m.
  assertRel(gddForStretch(94.2067e-15, 1000) / -one.gdd, 0.225552, 1e-5, "matched G");
  // Independent check of φ₃: a central difference of φ₂(ω).
  const w0 = (2 * Math.PI * c) / 800e-9;
  const gddAt = (w: number) => treacyCompressor((2 * Math.PI * c) / w, d, alpha, 1).gdd;
  const numeric = (gddAt(w0 * (1 + 1e-5)) - gddAt(w0 * (1 - 1e-5))) / (2e-5 * w0);
  assertRel(one.tod, numeric, 1e-6, "TOD");
  assert.ok(one.tod > 0);
  // Edge: no first order when λ/d − sin α > 1 (2000 nm on 1740/mm at normal incidence).
  assert.ok(Number.isNaN(gratingDiffractionAngle(2000e-9, d, 0)));
  assert.ok(Number.isNaN(treacyCompressor(2000e-9, d, 0, 1).gdd));
});

test("frequency comb: ν_n = n f_rep + f_ceo, Δφ_CE = 2π f_ceo/f_rep (Telle 1999; Jones 2000)", () => {
  // Part 0 audit: f_ceo 20 MHz on 80 MHz slips π/2 per pulse.
  assertRel(cePhaseSlip(20e6, 80e6), Math.PI / 2, 1e-12, "π/2");
  assert.equal(wrapOffset(-20e6, 80e6), 60e6);
  assert.equal(wrapOffset(160e6, 80e6), 0);
  assert.equal(cePhaseSlip(0, 80e6), 0);
  assert.ok(Number.isNaN(wrapOffset(1, 0)));
  // Hand value: c/1550 nm = 193.41449 THz; (ν − 20 MHz)/250 MHz = 773657.96 → tooth 773658 at 193.414520 THz.
  const comb = { frep: 250e6, fceo: 20e6 };
  const n = nearestTooth(comb, c / 1550e-9);
  assert.equal(n, 773658);
  assertRel(combTooth(comb, n), 193.41452e12, 1e-12, "ν_n");
  // f-to-2f: 2ν_n − ν_2n = f_ceo.
  assertRel(2 * combTooth(comb, n) - combTooth(comb, 2 * n), 20e6, 1e-6, "f-2f");
});

test("HHG: U_p, E_c = I_p + 3.17 U_p, odd harmonics, Fourier limit (Krause 1992; Corkum 1993)", () => {
  // U_p = 9.337e-14 I[W/cm²] λ²[µm] eV: 2e14 W/cm², 800 nm → 11.952 eV; hydrogen E_c = 13.598 + 37.887 = 51.485 eV
  // (part 0 audit: 11.94 and 51.5 with the rounded 9.33e-14), λ_min = 1239.84/51.485 = 24.08 nm.
  const up = ponderomotiveEnergy(2e18, 800e-9);
  assertRel(up / q, 11.95173, 1e-5, "U_p");
  const ec = hhgCutoff(IONIZATION_ENERGY_EV.hydrogen * q, up);
  assertRel(ec / q, 51.48539, 1e-6, "E_c");
  assertRel(((h * c) / ec) * 1e9, 24.0814, 1e-5, "λ_min");
  // ħω = 1.5498 eV: E_c/ħω = 33.22, so the last odd harmonic is 33; 34 ħω exactly gives 33 too.
  const photon = (h * c) / 800e-9;
  assert.equal(highestOddHarmonic(ec, photon), 33);
  assert.equal(highestOddHarmonic(34 * photon, photon), 33);
  assert.equal(highestOddHarmonic(0.5 * photon, photon), 0);
  // 0.4413 h = 1.82495 eV fs; Augst 1989: I_BS ≈ 4.0e9 I_p⁴[eV] W/cm², hydrogen 1.37e14 W/cm².
  assertRel(fourierLimitDuration(q) * 1e15, 1.824951, 1e-6, "0.441 h");
  assertRel(barrierSuppressionIntensity(IONIZATION_ENERGY_EV.hydrogen * q) / 1e4, 4.0e9 * 13.5984 ** 4, 2e-4, "I_BS");
  assert.ok(Number.isNaN(fourierLimitDuration(0)));
  assert.ok(Number.isNaN(ponderomotiveEnergy(1e18, 0)));
});

test("HHG Lorentz drift parameter (Klaiber et al. 2008)", () => {
  // Hand calculation in atomic units: He (I_p = 0.90357 Ha), 800 nm (ω = 0.056954), 6.2e16 W/cm² (E₀ = 1.3291 au):
  // a₀ = E₀/(cω) = 1.3291/(137.036 × 0.056954) = 0.17030; Γ = √(1.80714) × 0.17030³ × 137.036/(16 × 0.056954) = 0.9985.
  assertRel(lorentzDriftParameter(IONIZATION_ENERGY_EV.helium * q, 6.2e20, 800e-9), 0.9985, 1e-3, "Γ He 800 nm");
  // Γ ∝ I^(3/2) λ⁴.
  const g0 = lorentzDriftParameter(IONIZATION_ENERGY_EV.argon * q, 2e18, 800e-9);
  assertRel(lorentzDriftParameter(IONIZATION_ENERGY_EV.argon * q, 8e18, 1600e-9), g0 * 8 * 16, 1e-12, "scaling");
  assert.ok(g0 < 1e-3, "negligible at 800 nm, 2e14 W/cm²");
  assert.equal(lorentzDriftParameter(IONIZATION_ENERGY_EV.argon * q, 0, 800e-9), 0);
  assert.ok(Number.isNaN(lorentzDriftParameter(0, 1e18, 800e-9)));
});
