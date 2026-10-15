import test from "node:test";
import assert from "node:assert/strict";

import { SILICON_LAMBDA_MAX, SILICON_LAMBDA_MIN, siliconAbsorption, siliconIndex } from "../src/physics/materials/silicon-absorption";
import { normalReflectance, photodiodeQe } from "../src/physics/detectors/photodiode-qe";
import { photonsPerJoule, quantumEfficiencyFromResponsivity, responsivity } from "../src/physics/detectors/responsivity";
import { generationCurrent, siliconIntrinsicDensity } from "../src/physics/detectors/dark-current";
import { EPS_R_SILICON, depletionCapacitance } from "../src/physics/detectors/photodiode-rc";

const close = (actual: number, expected: number, rel: number, msg = "") =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${msg} ${actual} vs ${expected}`);

const alphaCm = (nm: number) => siliconAbsorption(nm * 1e-9) / 100;

test("Green 2008 silicon: α(800) = 850, α(900) = 303, α(1000) = 64 cm⁻¹ from α = 4πk/λ", () => {
  // Green 2008 Table 1 k: 5.4113e-3 (800 nm), 2.1701e-3 (900 nm), 5.0930e-4 (1000 nm). Hand: 4π·5.4113e-3/8e-5 cm = 850.0.
  close(alphaCm(800), 850.0, 1e-4);
  close(alphaCm(900), 303.0, 1e-3);
  close(alphaCm(1000), 64.0, 1e-3);
  close(siliconIndex(800e-9).n, 3.675, 1e-9);
});

test("Green 2008 interpolation: ln k linear and n linear between nodes (805 nm → α = 811.62 cm⁻¹)", () => {
  // Hand: k = √(5.4113e-3·4.9955e-3) = 5.19927e-3; α = 4π·5.19927e-3/8.05e-5 cm = 811.62 cm⁻¹; n = (3.675 + 3.668)/2.
  close(alphaCm(805), 811.62, 1e-4);
  close(siliconIndex(805e-9).n, 3.6715, 1e-9);
});

test("Green 2008 agrees with Green & Keevers 1995 within 3 % over 400–1150 nm (second source)", () => {
  // M. A. Green, M. J. Keevers, Prog. Photovolt. 3, 189 (1995), doi:10.1002/pip.4670030303, as tabulated on pveducation.org.
  const g95: [number, number][] = [[400, 9.52e4], [500, 1.11e4], [600, 4.14e3], [700, 1.9e3], [800, 850], [900, 306], [1000, 64], [1100, 3.5], [1150, 0.68]];
  for (const [nm, a] of g95) close(alphaCm(nm), a, 0.03, `${nm} nm`);
});

test("silicon table range: finite at 250 and 1450 nm, NaN outside", () => {
  assert.ok(Number.isFinite(siliconAbsorption(SILICON_LAMBDA_MIN)));
  assert.ok(Number.isFinite(siliconAbsorption(SILICON_LAMBDA_MAX)));
  close(alphaCm(1450), 1.2e-8, 1e-2);
  assert.ok(Number.isNaN(siliconAbsorption(249e-9)));
  assert.ok(Number.isNaN(siliconAbsorption(1451e-9)));
});

test("Gärtner QE: W = 10 µm, L = 100 µm, R = 0.05 at 900 nm → η = 0.77589, ℛ = 0.56322 A/W (silicon-photodiode default)", () => {
  // Hand: α = 30300.3 m⁻¹, αW = 0.303003, αL = 3.03003; η = 0.95·(1 − e^(−0.303003)/4.03003) = 0.95·0.816725 = 0.775890.
  const alpha = siliconAbsorption(900e-9);
  const eta = photodiodeQe({ alpha, reflectance: 0.05, depletionWidth: 10e-6, diffusionLength: 100e-6 });
  close(eta, 0.775890, 1e-5);
  close(responsivity(eta, 900e-9), 0.563218, 1e-5);
});

test("slab QE (L = 0) reproduces (1 − R)(1 − e^(−αW)): 900 nm, 10 µm → 0.24833 (old depletion-only value)", () => {
  const alpha = siliconAbsorption(900e-9);
  const slab = photodiodeQe({ alpha, reflectance: 0.05, depletionWidth: 10e-6 });
  close(slab, 0.95 * (1 - Math.exp(-alpha * 10e-6)), 1e-12);
  close(slab, 0.248333, 1e-5);
});

test("QE limits: α = 0 → 0; thick absorber → 1 − R; dead layer → e^(−αd); small αW stays accurate", () => {
  assert.equal(photodiodeQe({ alpha: 0, reflectance: 0.1, depletionWidth: 1e-3, diffusionLength: 1e-3 }), 0);
  close(photodiodeQe({ alpha: 1e7, reflectance: 0.1, depletionWidth: 1e-5 }), 0.9, 1e-12);
  close(photodiodeQe({ alpha: 1e7, reflectance: 0, depletionWidth: 1e-5, deadLayer: 1e-7 }), Math.exp(-1), 1e-12);
  close(photodiodeQe({ alpha: 1, reflectance: 0, depletionWidth: 1e-9 }), 1e-9, 1e-8);
  assert.ok(Number.isNaN(photodiodeQe({ alpha: 1e5, reflectance: 1.2, depletionWidth: 1e-5 })));
  assert.ok(Number.isNaN(photodiodeQe({ alpha: -1, reflectance: 0, depletionWidth: 1e-5 })));
});

test("normal-incidence reflectance: n = 4 → 0.36; n = 1, k = 1 → 0.2; bare Si at 633 nm ≈ 0.348", () => {
  close(normalReflectance(4), 0.36, 1e-12);
  close(normalReflectance(1, 1), 0.2, 1e-12);
  const { n, k } = siliconIndex(633e-9);
  close(normalReflectance(n, k), 0.3477, 1e-3);
  assert.ok(Number.isNaN(normalReflectance(0)));
});

test("responsivity: ℛ(0.8, 1550 nm) = 1.00013 A/W; η = 1 at 1 µm → 1/1.239842 A/W; inverse round-trips", () => {
  // h·c/q = 1.23984198 µm·V (exact SI constants).
  close(responsivity(0.8, 1550e-9), 1.000127, 1e-6);
  close(responsivity(1, 1e-6), 1 / 1.23984198, 1e-8);
  close(quantumEfficiencyFromResponsivity(0.55, 700e-9), 0.974162, 1e-5);
  close(quantumEfficiencyFromResponsivity(responsivity(0.37, 633e-9), 633e-9), 0.37, 1e-12);
  close(photonsPerJoule(1e-6), 5.0341e18, 1e-4);
  assert.ok(Number.isNaN(quantumEfficiencyFromResponsivity(0.5, 0)));
});

test("silicon n_i: 9.65e9 cm⁻³ at 300 K (Altermatt 2003), 5.349e9 at 293 K; generation current 8.570 pA", () => {
  // Hand at 293 K: E_g = 1.126289 eV, E_g(300) = 1.124519 eV; (293/300)^1.5 = 0.965222;
  // exp(−(q/2k)(1.126289/293 − 1.124519/300)) = exp(−0.554638) = 0.574276 → ratio 0.554304 → 5.3490e15 m⁻³.
  close(siliconIntrinsicDensity(300), 9.65e15, 1e-12);
  close(siliconIntrinsicDensity(293), 5.3490e15, 2e-4);
  // q·n_i·W·A/τ_g with W = 10 µm, A = 1 mm², τ_g = 1 ms.
  close(generationCurrent(siliconIntrinsicDensity(293), 10e-6, 1e-6, 1e-3), 8.5697e-12, 2e-4);
  assert.ok(Number.isNaN(generationCurrent(1e16, 1e-5, 1e-6, 0)));
});

test("depletion capacitance: 1 mm², 10 µm, ε_r 11.9 → 10.537 pF", () => {
  // Hand: 8.8541878e-12·11.9·1e-6/1e-5 = 1.053648e-11 F.
  close(depletionCapacitance(1e-6, 10e-6, EPS_R_SILICON), 1.053648e-11, 1e-6);
  assert.ok(Number.isNaN(depletionCapacitance(1e-6, 0, EPS_R_SILICON)));
});
