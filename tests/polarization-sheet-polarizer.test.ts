import test from "node:test";
import assert from "node:assert/strict";

import { fresnel } from "../src/physics/polarization/fresnel";
import { plateStackTransmittance } from "../src/physics/polarization/reflection-polarizers";
import {
  faceReflectance, lnTauFromAbsorbance, sheetMetrics, slabLogTransmittance, slabLogTransmittanceFrom,
} from "../src/physics/polarization/sheet-polarizer";

function assertAbs(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual - expected) <= tol, `${label}: ${actual} vs ${expected}`);
}

test("face reflectance ((n − 1)² + κ²)/((n + 1)² + κ²) equals the Fresnel R of N = n − iκ", () => {
  for (const [n, k] of [[1.5, 0], [1.62, 0.003], [1.2, 7]]) {
    assertAbs(faceReflectance(n, k), fresnel(1, n, 0, k).Rs, 1e-15, `n = ${n}, κ = ${k}`);
  }
  assertAbs(faceReflectance(1.5, 0), 0.04, 1e-15, "glass");
});

test("lossless slab: T = (1 − R)/(1 + R) = 0.92308 for n = 1.5, the one-plate pile-of-plates sum", () => {
  const lnT = slabLogTransmittance(1.5, 0, 1e-3, 550e-9);
  assertAbs(Math.exp(lnT), 0.96 / 1.04, 1e-15, "T");
  assertAbs(Math.exp(lnT), plateStackTransmittance(0.04, 1), 1e-15, "same as one plate");
});

test("absorbing slab: T = (1 − R)²τ/(1 − R²τ²) with τ = exp(−4πκd/λ)", () => {
  // n = 1.64, κ = 3e-3, d = 0.1 mm, λ = 550 nm: αd = 4π·3e-3·1e-4/5.5e-7 = 6.85438.
  const R = faceReflectance(1.64, 3e-3), tau = Math.exp((-4 * Math.PI * 3e-3 * 1e-4) / 550e-9);
  assertAbs((-4 * Math.PI * 3e-3 * 1e-4) / 550e-9, -6.85438, 1e-5, "−αd");
  const T = ((1 - R) ** 2 * tau) / (1 - R * R * tau * tau);
  assertAbs(slabLogTransmittance(1.64, 3e-3, 1e-4, 550e-9), Math.log(T), 1e-12, "ln T");
});

test("log domain: a metal-like κ = 2 over 0.1 mm still gives a finite extinction ratio (the old page printed Infinity)", () => {
  const lnK1 = slabLogTransmittance(1.6, 1e-5, 1e-4, 550e-9);
  const lnK2 = slabLogTransmittance(1.6, 2, 1e-4, 550e-9);
  assert.equal(Math.exp(lnK2), 0, "k₂ underflows as a number");
  const m = sheetMetrics(lnK1, lnK2);
  assert.ok(Number.isFinite(m.extinctionDb) && m.extinctionDb > 19000, `${m.extinctionDb} dB`);
  assertAbs(m.log10K2, lnK2 / Math.LN10, 1e-12, "log₁₀ k₂");
  assertAbs(m.efficiency, 1, 1e-15, "efficiency");
});

test("Shurcliff's sheet algebra: k₁ = 0.76, k₂ = 1e-4 → one sheet 0.38005, H₀ = 0.28880, H₉₀ = 7.6e-5, 38.8 dB", () => {
  const m = sheetMetrics(Math.log(0.76), Math.log(1e-4));
  assertAbs(m.single, 0.38005, 1e-12, "(k₁ + k₂)/2");
  assertAbs(m.parallel, (0.76 ** 2 + 1e-8) / 2, 1e-12, "H₀");
  assertAbs(m.crossed, 7.6e-5, 1e-15, "H₉₀");
  assertAbs(m.extinctionDb, 10 * Math.log10(7600), 1e-12, "ER");
  assertAbs(m.efficiency, (0.76 - 1e-4) / (0.76 + 1e-4), 1e-15, "efficiency");
  // Edge: equal transmittances do not polarize.
  const flat = sheetMetrics(Math.log(0.5), Math.log(0.5));
  assert.equal(flat.efficiency, 0);
  assert.equal(flat.extinctionDb, 0);
});

test("decadic absorbance: A = 2 is τ = 0.01; invalid inputs give NaN", () => {
  assertAbs(Math.exp(lnTauFromAbsorbance(2)), 0.01, 1e-15, "τ");
  assertAbs(Math.exp(slabLogTransmittanceFrom(0, lnTauFromAbsorbance(2))), 0.01, 1e-15, "no reflection");
  assert.ok(Number.isNaN(slabLogTransmittanceFrom(1, -1)));
  assert.ok(Number.isNaN(slabLogTransmittance(1.5, -1, 1e-3, 550e-9)));
});
