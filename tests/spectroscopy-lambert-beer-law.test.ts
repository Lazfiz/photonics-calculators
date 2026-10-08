import test from "node:test";
import assert from "node:assert/strict";

import { absorbance, concentrationForAbsorbance, transmittance } from "../src/physics/spectroscopy/lambert-beer-law";

const close = (actual: number, expected: number, rel: number) =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${actual} vs ${expected}`);

// Lab units → SI (IUPAC Gold Book units): 1 L mol⁻¹ cm⁻¹ = 0.1 m²/mol, 1 mol/L = 1000 mol/m³, 1 cm = 0.01 m.
const EPS_LAB = 0.1, CONC_LAB = 1000, CM = 0.01;

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
