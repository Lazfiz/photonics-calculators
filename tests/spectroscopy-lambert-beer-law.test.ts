import test from "node:test";
import assert from "node:assert/strict";

import {
  absorbance,
  absorbanceFromNapierian,
  absorbanceFromTransmittance,
  attenuationDb,
  concentrationForAbsorbance,
  crossSectionFromEpsilon,
  epsilonForAbsorbance,
  massAbsorptionCoefficient,
  napierianAbsorptionCoefficient,
  transmittance,
} from "../src/physics/spectroscopy/lambert-beer-law";

const close = (actual: number, expected: number, rel: number) =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${actual} vs ${expected}`);

// Lab units → SI (IUPAC Gold Book units): 1 L mol⁻¹ cm⁻¹ = 0.1 m²/mol, 1 mol/L = 1000 mol/m³, 1 cm = 0.01 m,
// 1 g/mol = 1e-3 kg/mol, 1 L g⁻¹ cm⁻¹ = 100 m²/kg, 1 cm² = 1e-4 m².
const EPS_LAB = 0.1, CONC_LAB = 1000, CM = 0.01, G_MOL = 1e-3, MASS_LAB = 100, CM2 = 1e-4;

test("page defaults: ε = 50 000 L mol⁻¹ cm⁻¹, c = 10 µM, l = 1 cm give A = 0.5, T = 31.6 %", () => {
  // Hand: 50 000 · 1e-5 · 1 = 0.5; 10^−0.5 = 0.316228.
  const A = absorbance(50000 * EPS_LAB, 1e-5 * CONC_LAB, 1 * CM);
  close(A, 0.5, 1e-12);
  close(transmittance(A), 0.316228, 1e-6);
});

test("the old default c = 0.01 M gives A = 500, which no spectrometer can measure", () => {
  close(absorbance(50000 * EPS_LAB, 0.01 * CONC_LAB, 1 * CM), 500, 1e-12);
});

test("concentration for a target absorbance inverts A = ε c l; ε l = 0 has no solution", () => {
  // A = 1 with ε = 116 000 L mol⁻¹ cm⁻¹ (rhodamine 6G near 530 nm) over 1 cm: c = 8.62 µM.
  close(concentrationForAbsorbance(1, 116000 * EPS_LAB, CM) / CONC_LAB, 8.6207e-6, 1e-4);
  assert.ok(Number.isNaN(concentrationForAbsorbance(1, 0, CM)));
  assert.equal(transmittance(0), 1);
});

test("old concentration page defaults: A = 0.5, ε = 50 000, l = 1 cm give c = 1.000e-5 M", () => {
  // Hand: 0.5 / (50 000 · 1) = 1e-5 mol/L.
  close(concentrationForAbsorbance(0.5, 50000 * EPS_LAB, CM) / CONC_LAB, 1e-5, 1e-12);
});

test("old extinction-coefficient page defaults: A = 0.5, c = 0.01 M, l = 1 cm, M = 100 g/mol give ε = 50, a = 0.5", () => {
  // Hand: ε = 0.5 / (0.01 · 1) = 50 L mol⁻¹ cm⁻¹; a = ε/M = 50/100 = 0.5 L g⁻¹ cm⁻¹ (Gold Book a = A/(ρ l)).
  const eps = epsilonForAbsorbance(0.5, 0.01 * CONC_LAB, CM);
  close(eps / EPS_LAB, 50, 1e-12);
  close(massAbsorptionCoefficient(eps, 100 * G_MOL) / MASS_LAB, 0.5, 1e-12);
  // a is the absorbance of 1 g/L over 1 cm: 1 g/L of M = 100 g/mol is 0.01 M, so A = 50 · 0.01 · 1 = 0.5.
  assert.ok(Number.isNaN(epsilonForAbsorbance(0.5, 0, CM)));
  assert.ok(Number.isNaN(massAbsorptionCoefficient(eps, 0)));
});

test("optical density: T = 1 % is OD 2 and 20 dB, OD 6 is T = 1e-4 %; T ≤ 0 has no OD", () => {
  close(absorbanceFromTransmittance(0.01), 2, 1e-12);
  close(attenuationDb(absorbanceFromTransmittance(0.01)), 20, 1e-12);
  close(transmittance(6) * 100, 1e-4, 1e-12);
  assert.equal(absorbanceFromTransmittance(1), 0);
  assert.ok(Number.isNaN(absorbanceFromTransmittance(0)));
});

test("cross-section: σ/ε = ln 10 · 1000 / N_A = 3.8235e-21 cm² per L mol⁻¹ cm⁻¹; ε = 5e4 gives 1.912e-16 cm²", () => {
  // Hand: 2.302585 · 1000 cm³/L / 6.02214076e23 mol⁻¹ = 3.82354e-21 cm² (IUPAC Gold Book "absorption cross section").
  close(crossSectionFromEpsilon(1 * EPS_LAB) / CM2, 3.82354e-21, 1e-5);
  close(crossSectionFromEpsilon(5e4 * EPS_LAB) / CM2, 1.91177e-16, 1e-5);
});

test("Napierian coefficient α = σ N_A c equals ln 10 · ε c, so α l = ln 10 · A", () => {
  // ε = 5e4, c = 10 µM: A = 0.5 over 1 cm, so α = 0.5 ln 10 = 1.151293 cm⁻¹.
  const sigma = crossSectionFromEpsilon(5e4 * EPS_LAB);
  close(napierianAbsorptionCoefficient(sigma, 1e-5 * CONC_LAB) * CM, 1.151293, 1e-6);
  assert.equal(napierianAbsorptionCoefficient(sigma, 0), 0);
});

test("bulk slab: α = 1 cm⁻¹ over 10 mm gives T = e⁻¹ = 0.367879 and 4.3429 dB; α = 0.1 cm⁻¹ gives 0.904837", () => {
  // Hand: α d = 1, A = 1/ln 10 = 0.4342945, T = e^(−1) = 0.3678794, 10 A = 4.342945 dB (Gold Book "absorption coefficient").
  const A = absorbanceFromNapierian(100, 0.01);
  close(A, 0.4342945, 1e-6);
  close(transmittance(A), 0.3678794, 1e-6);
  close(attenuationDb(A), 4.342945, 1e-6);
  close(transmittance(absorbanceFromNapierian(10, 0.01)), 0.9048374, 1e-6);
  assert.equal(absorbanceFromNapierian(0, 0.01), 0);
  assert.ok(Number.isNaN(absorbanceFromNapierian(-1, 0.01)));
});
