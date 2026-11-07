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

test("absorbing slab: T = (1 − R)²(1 + κ²/n²)τ/(1 − R²τ²) with τ = exp(−4πκd/λ)", () => {
  // n = 1.64, κ = 3e-3, d = 0.1 mm, λ = 550 nm: αd = 4π·3e-3·1e-4/5.5e-7 = 6.85438.
  const R = faceReflectance(1.64, 3e-3), tau = Math.exp((-4 * Math.PI * 3e-3 * 1e-4) / 550e-9);
  assertAbs((-4 * Math.PI * 3e-3 * 1e-4) / 550e-9, -6.85438, 1e-5, "−αd");
  const T = ((1 - R) ** 2 * (1 + (3e-3 / 1.64) ** 2) * tau) / (1 - R * R * tau * tau);
  assertAbs(slabLogTransmittance(1.64, 3e-3, 1e-4, 550e-9), Math.log(T), 1e-12, "ln T");
  // The exit-face factor is 1 + 3.35e-6 here: (1 − R)² alone is within 4e-6 in ln T.
  assertAbs(slabLogTransmittance(1.64, 3e-3, 1e-4, 550e-9) - slabLogTransmittanceFrom(R, Math.log(tau)), 3.346e-6, 1e-9, "factor");
});

test("metal-like κ: the face amplitudes t = 2/(1 + N), t′ = 2N/(N + 1) give |tt′|² = (1 − R)²(1 + κ²/n²) (Harbecke 1986)", () => {
  // N = 1.2 − 7i, d = 1 µm, λ = 10 µm: |N|² = 50.44, |1 + N|² = 2.2² + 49 = 53.84, |tt′|² = 807.04/2898.7456 = 0.278410.
  const n = 1.2, k = 7, d = 1e-6, lambda = 10e-6;
  const tt2 = (16 * (n * n + k * k)) / ((1 + n) ** 2 + k * k) ** 2;
  assertAbs(tt2, 0.278410, 1e-6, "|tt′|²");
  const R = faceReflectance(n, k), tau = Math.exp((-4 * Math.PI * k * d) / lambda);
  // R = (0.04 + 49)/(4.84 + 49) = 0.910847; (1 − R)² = 0.0079484, 35 times less than |tt′|².
  assertAbs(R, 49.04 / 53.84, 1e-15, "R");
  const T = (tt2 * tau) / (1 - R * R * tau * tau);
  assertAbs(slabLogTransmittance(n, k, d, lambda), Math.log(T), 1e-12, "ln T");
  assert.ok(Math.exp(slabLogTransmittance(n, k, d, lambda)) < 1, "T < 1");
});

test("the page's thinnest sheet, d = 1 µm at λ = 20 µm (d/λ = 0.05): T ≤ 1 for n ∈ [1, 5], κ ∈ [1e-4, 10]; n ≤ 0 is NaN", () => {
  for (let n = 1; n <= 5; n += 0.25) {
    for (let e = -4; e <= 1; e += 0.125) {
      const lnT = slabLogTransmittance(n, 10 ** e, 1e-6, 20e-6);
      assert.ok(lnT <= 0, `n = ${n}, κ = ${10 ** e}: ln T = ${lnT}`);
    }
  }
  assert.ok(Number.isNaN(slabLogTransmittance(0, 1, 1e-6, 20e-6)));
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
