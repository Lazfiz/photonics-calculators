import test from "node:test";
import assert from "node:assert/strict";

import {
  biaxialStrain, biaxialStrainEnergy, curvatureFromDeflection, deflectionFromCurvature, stoneyCurvature, stoneyStress,
  thermalMismatchStress,
} from "../src/physics/thin-film/stoney";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const GPa = 1e9;
const MPa = 1e6;

test("Stoney stress with the biaxial modulus", () => {
  // Si(001)-like wafer, biaxial modulus E/(1 − ν) = 180.5 GPa; t_s = 525 µm, t_f = 1 µm, R = 50 m.
  // Hand: 180.5e9 · (525e-6)² / (6 · 50 · 1e-6) = 165.83 MPa.
  const nu = 0.28;
  const Es = 180.5 * GPa * (1 - nu);
  assertRel(stoneyStress(1 / 50, 1e-6, Es, nu, 525e-6), 165.83 * MPa, 1e-4, "σ_f");
  // Compressive film, opposite curvature.
  assertRel(stoneyStress(-1 / 50, 1e-6, Es, nu, 525e-6), -165.83 * MPa, 1e-4, "σ_f < 0");
  // Round trip.
  const kappa = stoneyCurvature(-300 * MPa, 500e-9, 72 * GPa, 0.17, 1e-3);
  assertRel(stoneyStress(kappa, 500e-9, 72 * GPa, 0.17, 1e-3), -300 * MPa, 1e-14, "round trip");
  // The (1 − ν²) form some pages used overstates κ by 1/((1 − ν)(1 − ν²)) = 1.2407 at ν = 0.17.
  const wrong = (6 * 200 * MPa * 500e-9) / (70 * GPa * 1e-6 * (1 - 0.17 ** 2));
  assertRel(wrong / stoneyCurvature(200 * MPa, 500e-9, 70 * GPa, 0.17, 1e-3), 1.2407, 1e-4, "old/new");
  // Edges: no film thickness, ν = 1.
  assert.ok(Number.isNaN(stoneyStress(0.01, 0, Es, nu, 525e-6)));
  assert.ok(Number.isNaN(stoneyStress(0.01, 1e-6, Es, 1, 525e-6)));
  assert.equal(stoneyCurvature(100 * MPa, 0, Es, nu, 525e-6), 0);
});

test("curvature from center deflection: spherical cap", () => {
  // Hand: h = 1 µm over a = 25 mm → R = (a² + h²)/(2h) = 312.5 m (+1.6e-9 m²/2e-6 m, negligible).
  assertRel(1 / curvatureFromDeflection(1e-6, 25e-3), 312.5, 1e-8, "R");
  // A deep cap: a = 3, h = 1 → R = 5 (3-4-5 triangle), and back.
  assertRel(curvatureFromDeflection(1, 3), 0.2, 1e-15, "κ deep");
  assertRel(deflectionFromCurvature(0.2, 3), 1, 1e-14, "h deep");
  assertRel(deflectionFromCurvature(1 / 312.5, 25e-3), 1e-6, 1e-8, "h shallow");
  assert.equal(curvatureFromDeflection(0, 25e-3), 0);
  assert.ok(Number.isNaN(deflectionFromCurvature(1, 2)), "κa > 1");
});

test("thermal-mismatch stress, strain and stored energy", () => {
  // SiO₂ (E_f = 70 GPa, ν_f = 0.17, α_f = 0.5 ppm/K) on Si (α_s = 2.6 ppm/K), cooled from 400 °C to 25 °C.
  // Hand: 70e9/0.83 · 2.1e-6 · (−375) = −66.416 MPa (compressive: the substrate shrinks more).
  const s = thermalMismatchStress(70 * GPa, 0.17, 2.6e-6, 0.5e-6, 25, 400);
  assertRel(s, -66.416 * MPa, 1e-4, "σ_th");
  // Same α: no thermal stress.
  assert.ok(thermalMismatchStress(70 * GPa, 0.17, 0.5e-6, 0.5e-6, 25, 400) === 0); // ±0
  // ε = σ(1 − ν)/E recovers the mismatch strain (α_s − α_f)ΔT.
  assertRel(biaxialStrain(s, 70 * GPa, 0.17), 2.1e-6 * -375, 1e-12, "ε");
  // U = σ² t (1 − ν)/E: hand 100 MPa, 1 µm, 70 GPa, ν 0.17 → 1e16 · 1e-6 · 0.83 / 7e10 = 0.11857 J/m².
  assertRel(biaxialStrainEnergy(100 * MPa, 1e-6, 70 * GPa, 0.17), 0.11857, 1e-4, "U");
});
