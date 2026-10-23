import test from "node:test";
import assert from "node:assert/strict";

import {
  HEAT_CAPACITY_MATERIALS,
  debyeFunction,
  debyeMolarHeatCapacity,
  heatInput,
  scaledHeatCapacity,
} from "../src/physics/materials/heat-capacity";
import { cylinderCentreRise, rodThermalLens, slabConductionRise } from "../src/physics/materials/thermal-conduction";
import { energyAtFluence, gaussianPeakFluence, scaleDamageThreshold } from "../src/physics/materials/laser-damage";
import { doseForLoss, inducedAttenuation, internalTransmission } from "../src/physics/materials/radiation-induced-loss";
import { WINDOW_MATERIALS } from "../src/physics/materials/window-materials";

const assertRel = (actual: number, expected: number, tol: number, msg: string) =>
  assert.ok(Math.abs(actual - expected) <= tol * Math.abs(expected), `${msg}: ${actual} vs ${expected}`);

test("Debye function: C_V/3Nk = 0.9517 at T = θ_D and 0.0758 at θ_D/10 (Debye 1912 tables), and its limits", () => {
  assertRel(debyeFunction(1), 0.95173, 1e-4, "D(1)");
  assertRel(debyeFunction(10), 0.075821, 1e-4, "D(10)");
  // T ≪ θ_D: the T³ law (4π⁴/5)/x³; the switch to it at x = 50 is continuous.
  assertRel(debyeFunction(60), (4 * Math.PI ** 4) / 5 / 60 ** 3, 1e-12, "D(60)");
  assertRel(debyeFunction(50), debyeFunction(50 + 1e-9), 1e-8, "continuous at x = 50");
  // T ≫ θ_D: Dulong–Petit, D = 1 − x²/20.
  assertRel(debyeFunction(0.01), 1 - 1e-4 / 20, 1e-9, "D(0.01)");
  assert.equal(debyeFunction(0), 1);
  assert.ok(Number.isNaN(debyeFunction(-1)));
});

test("Silicon: the Debye value at θ_D = 645 K matches Desai 1986 at room temperature and 200 K", () => {
  // 3R·D(645/300)/M_Si = 0.7125 J/(g·K); Desai 1986 Table 4: 20.007 J/(mol·K) at 298.15 K = 0.7124 J/(g·K).
  assertRel(debyeMolarHeatCapacity(645, 300) / 28.0855, 0.71248, 1e-4, "Si, 300 K, J/(g·K)");
  const si = HEAT_CAPACITY_MATERIALS.si;
  assertRel(si.cRef, 712.36, 1e-4, "Si c_p(298.15 K), J/(kg·K)");
  // Desai Table 4: 15.642 J/(mol·K) at 200 K = 556.9 J/(kg·K); the scaled Debye curve gives 556.9.
  assertRel(scaledHeatCapacity(si.cRef, si.tRef, si.thetaD, 200), 15.642 / 28.0855e-3, 0.005, "Si, 200 K");
  // Desai Table 5: 26.569 J/(mol·K) at 1000 K; the harmonic Debye curve stays 7.8 % low (documented).
  assertRel(scaledHeatCapacity(si.cRef, si.tRef, si.thetaD, 1000), 872.06, 1e-3, "Si, 1000 K, scaled Debye");
  assert.equal(scaledHeatCapacity(si.cRef, si.tRef, si.thetaD, si.tRef), si.cRef);
});

test("Sapphire: θ_D = 990 K against Archer 1993 Table 2", () => {
  const al = HEAT_CAPACITY_MATERIALS.sapphire;
  assertRel(al.cRef, 799.9, 1e-4, "c_p(300 K) = 81.56 J/(mol·K) / 101.961 g/mol");
  // Archer Table 2, J/(mol·K): 250 K 69.80, 400 K 97.37, 550 K 110.31, 1000 K 124.89 within 3.1 %; 200 K 54.61 is missed by 9 %.
  const molar = (T: number) => scaledHeatCapacity(al.cRef, al.tRef, al.thetaD, T) * 101.9613e-3;
  assertRel(molar(250), 69.8, 0.035, "250 K");
  assertRel(molar(400), 97.37, 0.035, "400 K");
  assertRel(molar(550), 110.31, 0.035, "550 K");
  assertRel(molar(1000), 124.89, 0.035, "1000 K");
  assertRel(molar(200), 54.61 * (1 - 0.088), 0.005, "200 K, documented 8.8 % low");
});

test("MgO: θ_D = 945 K against NIST-JANAF table Mg-008", () => {
  const mgo = HEAT_CAPACITY_MATERIALS.mgo;
  const molar = (T: number) => scaledHeatCapacity(mgo.cRef, mgo.tRef, mgo.thetaD, T) * 40.304e-3;
  assertRel(molar(298.15), 37.106, 1e-12, "298.15 K");
  // JANAF: 26.681 (200 K), 45.544 (500 K), 51.208 (1000 K); the scaled curve gives 23.53, 49.23, 55.94 (documented).
  assertRel(molar(200), 23.534, 2e-3, "200 K, 12 % low");
  assertRel(molar(500), 45.544 * 1.081, 2e-3, "500 K, 8 % high");
  assertRel(molar(1000), 51.208 * 1.092, 2e-3, "1000 K, 9 % high");
});

test("Heat to warm 10 g of silicon from 20 °C to 200 °C: m∫c_p dT ≈ 1.39 kJ", () => {
  const si = HEAT_CAPACITY_MATERIALS.si;
  const q = heatInput(si.cRef, si.tRef, si.thetaD, 0.01, 293.15, 473.15);
  // Hand check, Simpson over two intervals: c_p = 707.18, 775.89, 812.77 J/(kg·K) at 293.15, 383.15, 473.15 K,
  // 0.01·180·(707.18 + 4·775.89 + 812.77)/6 = 1387.05 J; 200 intervals give 1387.28.
  assertRel(q, 1387.05, 5e-4, "Q against the hand estimate");
  assertRel(q, 1387.28, 1e-5, "Q, J");
  assert.equal(heatInput(si.cRef, si.tRef, si.thetaD, 0.01, 300, 300), 0);
  assertRel(heatInput(si.cRef, si.tRef, si.thetaD, 0.01, 473.15, 293.15), -1387.28, 1e-4, "cooling releases heat");
  assert.ok(Number.isNaN(heatInput(si.cRef, si.tRef, si.thetaD, 0.01, 0, 300)));
});

test("Conduction in a fused-silica window: ΔT = Pd/(kA), P/(4πkL) and the dn/dT lens 2kA/(P dn/dT) (Koechner)", () => {
  const fs = WINDOW_MATERIALS.fusedSilica;
  assert.equal(fs.conductivity, 1.38);
  // 1 W through 10 mm over 100 mm²: 1·0.01/(1.38·1e-4) = 72.464 K.
  assertRel(slabConductionRise(1, 0.01, 1.38, 1e-4), 72.4638, 1e-5, "face-to-face ΔT");
  // 1 W deposited along 10 mm: 1/(4π·1.38·0.01) = 5.7665 K beam centre to edge.
  assertRel(cylinderCentreRise(1, 1.38, 0.01), 5.76648, 1e-5, "centre-to-edge ΔT");
  // f = 2·1.38·1e-4/(1·12.9e-6) = 21.395 m, twice the slab value κA/(P dn/dT).
  assertRel(rodThermalLens(1, 1.38, 1e-4, 12.9e-6), 21.3953, 1e-5, "thermal lens");
  assert.equal(rodThermalLens(0, 1.38, 1e-4, 12.9e-6), Infinity);
  assert.ok(rodThermalLens(1, 9.71, 1e-4, -10.6e-6) < 0, "CaF₂ (dn/dT < 0) diverges");
  assert.ok(Number.isNaN(slabConductionRise(1, 0.01, 0, 1e-4)));
});

test("LIDT: √τ scaling (Stuart et al. 1996) and the Gaussian peak fluence 2E/(πw²) (ISO 21254-1)", () => {
  // 50 J/cm² at 10 ns → 50·√0.1 = 15.811 J/cm² at 1 ns.
  assertRel(scaleDamageThreshold(50e4, 10e-9, 1e-9), 15.8114e4, 1e-5, "F_th(1 ns)");
  assertRel(scaleDamageThreshold(50e4, 10e-9, 10e-9), 50e4, 1e-12, "at τ_ref");
  // 0.5 J, w = 0.5 cm: 2·0.5/(π·0.25 cm²) = 1.2732 J/cm².
  const F = gaussianPeakFluence(0.5, 0.005);
  assertRel(F, 1.27324e4, 1e-5, "peak fluence");
  assertRel(energyAtFluence(F, 0.005), 0.5, 1e-12, "inverse");
  assert.ok(Number.isNaN(gaussianPeakFluence(0.5, 0)));
  assert.ok(Number.isNaN(scaleDamageThreshold(50e4, 0, 1e-9)));
});

test("Radiation-induced loss: power law A₁D^f (Griscom et al. 1994), by hand", () => {
  // A₁ = 0.1 dB/m at 1 Gy, f = 0.5, 10 kGy: 0.1·100 = 10 dB/m; 10 mm: 0.1 dB, T = 10^(−0.01) = 0.977237.
  const A = inducedAttenuation(0.1, 0.5, 1e4);
  assertRel(A, 10, 1e-12, "A");
  assertRel(internalTransmission(A, 0.01), 0.977237, 1e-6, "T");
  // 1 dB over 10 mm needs (1/(0.1·0.01))^2 = 1e6 Gy.
  assertRel(doseForLoss(0.1, 0.5, 0.01, 1), 1e6, 1e-12, "dose for 1 dB");
  assert.equal(inducedAttenuation(0.1, 0.5, 0), 0);
  assert.ok(Number.isNaN(inducedAttenuation(0.1, 0, 1)));
  assert.ok(Number.isNaN(doseForLoss(0, 0.5, 0.01, 1)));
});
