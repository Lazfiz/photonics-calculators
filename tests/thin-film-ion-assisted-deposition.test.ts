import test from "node:test";
import assert from "node:assert/strict";

import { IAD_MATERIALS, iadParameters, ionFlux, moleculeFlux } from "../src/physics/thin-film/ion-assisted-deposition";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

test("arrival rates and the ion-to-molecule ratio", () => {
  // 50 µA/cm² = 0.5 A/m²: 0.5 / 1.602176634e-19 = 3.12075e18 ions m⁻² s⁻¹.
  assertRel(ionFlux(0.5), 3.120755e18, 1e-6, "ion flux");
  // SiO₂ at 0.5 nm/s, ρ = 2200 kg/m³, M = 60.084 g/mol:
  // 0.5e-9 · 2200 · 6.02214076e23 / 0.060084 = 1.102516e19 molecules m⁻² s⁻¹.
  assertRel(moleculeFlux(0.5e-9, 2200, 60.084e-3), 1.102516e19, 1e-6, "molecule flux");
  // Ratio 0.283058; at 300 eV Ar⁺: 84.917 eV per molecule, 28.306 eV per atom,
  // momentum 0.283058 · √(2 · 40 · 300) = 43.851 √(u·eV).
  const r = iadParameters(300, 40, 0.5, 0.5e-9, IAD_MATERIALS.SiO2);
  assertRel(r.ratio, 0.2830576, 1e-6, "ratio");
  assertRel(r.energyPerMolecule, 84.91729, 1e-6, "E per molecule");
  assertRel(r.energyPerAtom, 28.30576, 1e-6, "E per atom");
  assertRel(r.momentumPerMolecule, 43.8511, 1e-5, "momentum");
});

test("Ta₂O₅ with O₂⁺: atoms per formula unit", () => {
  // 0.3 nm/s, ρ = 8180 kg/m³, M = 441.89 g/mol: Φ_m = 0.3e-9 · 8180 · 6.02214076e23 / 0.44189 = 3.34435e18;
  // 100 µA/cm² = 1 A/m²: Φ_i = 6.24151e18, ratio 1.866287; 500 eV O₂⁺ (32 u): 933.143 eV per molecule,
  // 133.306 eV per atom (7 atoms), momentum 1.866287 · √(2 · 32 · 500) = 333.851 √(u·eV).
  const r = iadParameters(500, 32, 1, 0.3e-9, IAD_MATERIALS.Ta2O5);
  assertRel(r.moleculeFlux, 3.344347e18, 1e-6, "Φ_m");
  assertRel(r.ratio, 1.866287, 1e-6, "ratio");
  assertRel(r.energyPerMolecule, 933.1433, 1e-6, "E per molecule");
  assertRel(r.energyPerAtom, 133.3062, 1e-6, "E per atom");
  assertRel(r.momentumPerMolecule, 333.8515, 1e-6, "momentum");
});

test("monitor density: Φ_m scales with the density set in the QCM", () => {
  // SiO₂ with ρ_set = 2000 kg/m³ (page input 2 g/cm³), 0.5 nm/s, 50 µA/cm², 300 eV: Φ_m = 0.5e-9 · 2000 ·
  // 6.02214076e23 / 0.060084 = 1.002288e19, ratio 3.120755e18 / 1.002288e19 = 0.311363, 93.409 eV per molecule.
  const r = iadParameters(300, 40, 0.5, 0.5e-9, { ...IAD_MATERIALS.SiO2, rho: 2000 });
  assertRel(r.ratio, 0.311363, 1e-5, "ratio");
  assertRel(r.energyPerMolecule, 93.4090, 1e-5, "E per molecule");
});

test("domain guards", () => {
  assert.ok(Number.isNaN(iadParameters(300, 40, 0.5, 0, IAD_MATERIALS.SiO2).ratio)); // no deposition
  assert.ok(Number.isNaN(ionFlux(-1)));
  assert.ok(Number.isNaN(moleculeFlux(1e-9, 0, 0.06)));
  assert.equal(iadParameters(300, 40, 0, 1e-9, IAD_MATERIALS.SiO2).ratio, 0); // ion source off
  const bad = iadParameters(-1, 0, 0.5, 1e-9, IAD_MATERIALS.SiO2);
  assert.ok(bad.ratio > 0 && Number.isNaN(bad.energyPerMolecule) && Number.isNaN(bad.momentumPerMolecule));
});
