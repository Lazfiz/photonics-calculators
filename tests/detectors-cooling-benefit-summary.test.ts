import test from "node:test";
import assert from "node:assert/strict";

import { coolingModel, coolingSummary, type CoolingParams } from "../src/physics/detectors/cooling-benefit";

const assertRel = (actual: number, expected: number, tol: number, msg: string) =>
  assert.ok(Math.abs(actual - expected) <= tol * Math.abs(expected), `${msg}: ${actual} vs ${expected}`);

// Golden values from an independent scratch script: n_i ratio = (T/Tref)^1.5 exp(-(q/2k_B)(E_g/T - E_gref/Tref)); Si generation current
// ∝ n_i, InGaAs diffusion current ∝ n_i^2 (Sze & Ng, Physics of Semiconductor Devices, 3rd ed.); Varshni (1967) Si gap with E_g(0) = 1.17 eV,
// alpha = 4.73e-4 eV/K, beta = 636 K; In0.53Ga0.47As gap from the Vurgaftman et al. (2001) GaAs and InAs Varshni sets and C = 0.477 eV.
const p: CoolingParams = {
  siVarshni: true, egSi: 1.12, inGaAsVurgaftman: true, egInGaAs: 0.75,
  darkCurrent25Si: 0.1, darkCurrent25InGaAs: 1000, signal: 1000, readNoise: 3, exposureTime: 1,
};

test("coolingSummary at -40 C with temperature-dependent gaps", () => {
  const r = coolingSummary(p, -40);
  assertRel(r.siReduction, 949.9913097988107, 1e-8, "Si reduction");
  assertRel(r.inGaAsReduction, 18995.807333082033, 1e-8, "InGaAs reduction");
  assertRel(r.siSnrCooled, 31.48142585887504, 1e-8, "Si SNR cooled");
  assertRel(r.inGaAsSnr25, 22.31053741265801, 1e-8, "InGaAs SNR at 25 C");
  assertRel(r.siGap25, 1.1249894675988865, 1e-8, "Si gap");
});

test("fixed gaps at -20 C, and no cooling at 25 C", () => {
  const fixed = { ...p, siVarshni: false, inGaAsVurgaftman: false };
  const r = coolingSummary(fixed, -20);
  assertRel(r.siReduction, 61.55401033561636, 1e-8, "Si reduction");
  assertRel(r.inGaAsReduction, 292.9192533456522, 1e-8, "InGaAs reduction");
  assertRel(coolingModel(fixed).siDark(25), 0.1, 1e-12, "dark current at the reference temperature");
});
