import test from "node:test";
import assert from "node:assert/strict";

import { bandwidthNoiseModel, bandwidthSummary, quantumCorrectionNeeded, signalVoltageTooHigh } from "../src/physics/detectors/bandwidth";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Nyquist, Phys. Rev. 32, 110 (1928), doi:10.1103/PhysRev.32.110, and Saleh & Teich §17.5: S₀·f_c·atan(Δf/f_c) with
// S₀ = 4k_B·T·R_L (Johnson) and 2q·I·R_L² (shot). Hand-worked at R_L = 1 kΩ, C_j = 1 nF, T = 300 K, I = 1 µA, Δf = f_c.
const p = { bandwidth: 159154.94309189534, capacitance: 1e-9, loadR: 1000, photoCurrent: 1e-6, temperature: 300 };

test("bandwidthSummary: Δf = f_c integrates atan(1) = π/4", () => {
  const s = bandwidthSummary(p);
  assertRel(s.fc, 159154.94309189534, 1e-12, "f_c");
  assertRel(s.vJohnson, 1.4390877318634887e-6, 1e-9, "Johnson");
  assertRel(s.vShot, 2.00135993389495e-7, 1e-9, "shot");
  assertRel(s.vTotal, 1.4529376847786698e-6, 1e-9, "total");
  assertRel(s.kTC, 2.0351773878460816e-6, 1e-9, "kTC");
});

test("bandwidthNoiseModel: the noise saturates at √(k_B·T/C) for Δf ≫ f_c", () => {
  const m = bandwidthNoiseModel(p);
  const wide = m.noiseAt(1e6 * m.fc).vJohnson;
  assertRel(wide, 2.0351773878460816e-6 * Math.sqrt(1 - 2 / (Math.PI * 1e6)), 1e-9, "wide band");
  assert.equal(m.noiseAt(0).vTotal, 0); // empty band, edge of the domain
});

test("bandwidth warnings: thresholds", () => {
  assert.equal(signalVoltageTooHigh(1e-3, 1000), true); // 1 V > 0.3 V
  assert.equal(signalVoltageTooHigh(1e-6, 1000), false);
  assert.equal(quantumCorrectionNeeded(1e6, 1.6e7, 300), false);
  assert.equal(quantumCorrectionNeeded(1e12, 1e12, 300), true); // above 0.1·k_B·T/h = 0.625 THz
});
