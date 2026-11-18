import assert from "node:assert/strict";
import test from "node:test";

import { wellCapacitySummary } from "../src/physics/detectors/well-capacity";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Janesick, Photon Transfer (SPIE Press 2007), doi:10.1117/3.725073: DR = 20·log10(N/σ), C = N·q/V, gain = V/N.
test("wellCapacitySummary: hand-worked", () => {
  // N = 30000 e⁻, σ = 3 e⁻, 6 μm, 2 V: DR 80 dB; log2(1e4) = 13.2877124; C = 30000·1.602176634e-19/2 = 2.40326495e-15 F;
  // gain 2/30000 = 6.6666667e-5 V/e⁻; node noise 2e-4 V; density 30000/(6e-6)² = 8.3333333e14 e⁻/m²; S = (9 + √405)/2 = 14.5623059 e⁻
  const r = wellCapacitySummary({ wellCapacity: 30000, readNoise: 3, pixelSize: 6e-6, voltageSwing: 2 });
  assertRel(r.dynamicRange, 80, 1e-12, "DR");
  assertRel(r.usableBits, 13.2877124, 1e-8, "bits");
  assertRel(r.capacitance, 2.40326495e-15, 1e-8, "C");
  assertRel(r.conversionGain, 6.6666667e-5, 1e-8, "gain");
  assertRel(r.senseNodeNoise, 2e-4, 1e-12, "node noise");
  assertRel(r.wellDensity, 8.3333333e14, 1e-8, "density");
  assertRel(r.minDetectable, 14.5623059, 1e-8, "S_min");
});

test("wellCapacitySummary: zero read noise has no dynamic range", () => {
  const r = wellCapacitySummary({ wellCapacity: 30000, readNoise: 0, pixelSize: 6e-6, voltageSwing: 2 });
  assert.ok(Number.isNaN(r.dynamicRange));
  assert.equal(r.minDetectable, 9);
});
