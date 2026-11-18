import test from "node:test";
import assert from "node:assert/strict";

import { qeInternalAt, quantumEfficiencySummary, resolveQeInputs, type QeRawInputs } from "../src/physics/detectors/quantum-efficiency";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// W. W. Gärtner, Phys. Rev. 116, 84 (1959), doi:10.1103/PhysRev.116.84: η = (1 − R)·e^(−αd)·[1 − e^(−αW)/(1 + αL)];
// M. A. Green, Sol. Energy Mater. Sol. Cells 92, 1305 (2008): silicon n, k. Values re-derived with an independent script
// (exact CODATA constants, the table parsed as data, own interpolation and scan).
const base: QeRawInputs = {
  material: "si", thickness: 20, diffusionLength: 100, deadLayer: 0, surface: "ar", reflectance: 0.05, fillFactor: 1, microlensGain: 1, probeWavelength: 850,
};

test("quantumEfficiencySummary: silicon p-i-n at 850 nm, flat 95 % top", () => {
  const s = quantumEfficiencySummary(resolveQeInputs(base));
  assertRel(s.probeQe, 0.898499343685063, 1e-9, "QE");
  assertRel(s.probeResponsivity, 0.6159853044045609, 1e-9, "R");
  assertRel(s.probeReflectance, 0.05, 1e-12, "reflectance");
  assertRel(s.peakQe, 0.95, 1e-12, "peak");
  assert.equal(s.peakLow, 250);
  assert.equal(s.peakHigh, 695);
});

test("quantumEfficiencySummary: bare silicon, fill factor and microlens gain", () => {
  const s = quantumEfficiencySummary(resolveQeInputs({
    ...base, surface: "bare", thickness: 3, diffusionLength: 0, deadLayer: 0.1, fillFactor: 0.5, microlensGain: 1.6, probeWavelength: 550,
  }));
  assertRel(s.probeReflectance, 0.3673358921641316, 1e-9, "Fresnel R");
  assertRel(s.probeQe, 0.4049847797025106, 1e-9, "QE");
  assertRel(s.peakQe, 0.4239469982341751, 1e-9, "peak");
  assert.equal(s.peakLow, 500);
  assert.equal(s.peakHigh, 520);
});

test("quantumEfficiencySummary: InGaAs rules and domain edges", () => {
  const raw = { ...base, material: "ingaas", thickness: 3, diffusionLength: 777, surface: "bare", probeWavelength: 1550 };
  const inputs = resolveQeInputs(raw);
  assert.equal(inputs.L, 0); // the InP substrate collects nothing
  assert.equal(inputs.surface, "ar"); // no bare-surface Fresnel for InGaAs
  assertRel(quantumEfficiencySummary(inputs).probeQe, 0.7932852605633181, 1e-9, "QE");
  assert.equal(qeInternalAt(900, inputs), 0); // short of the InP cap's 916 nm edge
  assert.equal(resolveQeInputs({ ...raw, probeWavelength: 100 }).probe, 800); // clamped into the material's range
  assert.equal(resolveQeInputs({ ...raw, material: "x" }).material, "si");
});
