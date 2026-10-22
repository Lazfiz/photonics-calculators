import test from "node:test";
import assert from "node:assert/strict";

import {
  POLYMERS as P, corecladNA, normalReflectance, polymerAbbe, polymerDnDlambda, polymerGroupIndex, polymerIndex,
} from "../src/physics/materials/polymer-optics";

const nm = 1e-9;

function assertAbs(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual - expected) <= tol, `${label}: ${actual} vs ${expected}`);
}

// N. Sultanova, S. Kasarova, I. Nikolov, Acta Phys. Pol. A 116, 585 (2009), doi:10.12693/APhysPolA.116.585, Table:
// measured indices at 20 °C, accuracy ±0.001, and Abbe numbers V_d.
const WL = [436.8, 486.1, 587.6, 632.8, 703, 833, 879, 1052];
const SULTANOVA = {
  pmma: [1.502, 1.497, 1.491, 1.489, 1.486, 1.484, 1.483, 1.481],
  pc: [1.612, 1.599, 1.585, 1.58, 1.575, 1.569, 1.568, 1.565],
  ps: [1.617, 1.606, 1.592, 1.587, 1.582, 1.577, 1.576, 1.572],
  zeonex: [1.543, 1.538, 1.531, 1.528, 1.526, 1.523, 1.522, 1.52],
};

test("polymer Sellmeier fits reproduce Sultanova's measured indices within their ±0.001", () => {
  for (const id of ["pc", "ps", "zeonex"] as const) {
    WL.forEach((w, i) => assertAbs(polymerIndex(P[id].dispersion, w * nm), SULTANOVA[id][i], 1.1e-3, `${id} ${w} nm`));
  }
});

test("PMMA (Beadie 2015): hand value at 1 µm and agreement with Sultanova's sample", () => {
  // n² = 2.1778 + 6.1209e-3 − 1.5004e-3 + 2.3678e-2 − 4.2137e-3 + 7.3417e-4 − 4.5042e-5 = 2.202574 at λ = 1 µm.
  assertAbs(polymerIndex(P.pmma.dispersion, 1000 * nm), Math.sqrt(2.20257393), 1e-9, "PMMA 1 µm");
  // A different PMMA sample: within 3e-3 of Sultanova's at every wavelength.
  WL.forEach((w, i) => assertAbs(polymerIndex(P.pmma.dispersion, w * nm), SULTANOVA.pmma[i], 3e-3, `PMMA ${w} nm`));
  assertAbs(polymerIndex(P.pmma.dispersion, 1550 * nm), 1.4809, 1e-4, "PMMA 1550 nm");
});

test("polymer Abbe numbers against Sultanova's V_d", () => {
  assertAbs(polymerAbbe(P.pmma.dispersion), 59.2, 0.5, "PMMA V_d");
  assertAbs(polymerAbbe(P.pc.dispersion), 29.1, 1.5, "PC V_d");
  assertAbs(polymerAbbe(P.ps.dispersion), 30.5, 1.5, "PS V_d");
});

test("Cauchy fits (NOA 61, SU-8): hand values", () => {
  // NOA 61 at 589.3 nm: 1.5375 + 0.00829045/0.347275 − 0.000211046/0.347275² = 1.55962 (Norland quotes n = 1.56).
  assertAbs(polymerIndex(P.noa61.dispersion, 589.3 * nm), 1.5375 + 0.00829045 / 0.5893 ** 2 - 0.000211046 / 0.5893 ** 4, 1e-12, "NOA 61");
  assertAbs(polymerIndex(P.noa61.dispersion, 589.3 * nm), 1.56, 1e-3, "NOA 61 n_D");
  // SU-8 at 632.8 nm: 1.566 + 0.00796/0.400436 + 0.00014/0.400436² = 1.58675.
  assertAbs(polymerIndex(P.su8.dispersion, 632.8 * nm), 1.58675, 1e-5, "SU-8");
});

test("polymer group index, reflectance, NA and range guards", () => {
  for (const id of ["pmma", "pc", "noa61"] as const) {
    const d = P[id].dispersion;
    const l = 633 * nm;
    const h = 1e-12;
    const numeric = (polymerIndex(d, l + h) - polymerIndex(d, l - h)) / (2 * h);
    assertAbs(polymerDnDlambda(d, l), numeric, 1e-3 * Math.abs(numeric), `${id} dn/dλ`);
    assertAbs(polymerGroupIndex(d, l), polymerIndex(d, l) - l * numeric, 1e-6, `${id} n_g`);
  }
  assertAbs(normalReflectance(1.5), 0.04, 1e-12, "R(1.5)");
  assertAbs(corecladNA(1.492, 1.402), Math.sqrt(1.492 ** 2 - 1.402 ** 2), 1e-12, "NA");
  assert.ok(Number.isNaN(corecladNA(1.49, 1.59)));
  assert.ok(Number.isNaN(polymerIndex(P.pc.dispersion, 1550 * nm)) && Number.isFinite(polymerAbbe(P.su8.dispersion)));
  assert.ok(Number.isNaN(polymerIndex(P.pmma.dispersion, 400 * nm)));
});
