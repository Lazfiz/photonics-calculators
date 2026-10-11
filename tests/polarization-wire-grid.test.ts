import test from "node:test";
import assert from "node:assert/strict";

import { complex, add } from "../src/physics/complex";
import { Z_0 } from "../src/physics/constants";
import { shuntSheet, stripSurfaceImpedance, wireGridResponse } from "../src/physics/polarization/wire-grid";

function assertAbs(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual - expected) <= tol, `${label}: ${actual} vs ${expected}`);
}

const pec = (period: number, width: number) => ({ period, width, thickness: 100e-9, conductivity: Infinity });

test("perfectly conducting strips, p = 200 nm, w = 100 nm, λ = 1.55 µm: T_∥ = 0.0079358, T_⊥ = 0.99206", () => {
  // X/Z₀ = (p/λ) ln csc(πw/2p) = (0.2/1.55) ln √2 = 0.0447192 (Marcuvitz ch. 5); T = (2x)²/(1 + (2x)²).
  // Across: B/Y₀ = 4 × 0.0447192, z = −i/B; T = (2|z|)²/(1 + (2|z|)²).
  const g = wireGridResponse(pec(200e-9, 100e-9), 1.55e-6);
  assertAbs(g.parallel.T, 0.0079358, 1e-7, "T_∥");
  assertAbs(g.perpendicular.T, 0.992064, 1e-6, "T_⊥");
  assertAbs(10 * Math.log10(g.extinction), 20.97, 0.01, "ER (dB)");
  assertAbs(g.parallel.R + g.parallel.T, 1, 1e-14, "lossless");
  assertAbs(g.periodRatio, 0.2 / 1.55, 1e-15, "p/λ");
});

test("Babinet: a strip grating and its complement (gaps where the strips were) have t_∥ + t_⊥ = 1", () => {
  const a = wireGridResponse(pec(300e-9, 90e-9), 2e-6);
  const b = wireGridResponse(pec(300e-9, 210e-9), 2e-6);
  const sum = add(a.parallel.t, b.perpendicular.t);
  assertAbs(sum.re, 1, 1e-14, "Re");
  assertAbs(sum.im, 0, 1e-14, "Im");
});

test("shunt sheet: a resistive sheet of Z₀/2 transmits 25 %, reflects 25 %, absorbs 50 % (the most a thin sheet can)", () => {
  const s = shuntSheet(complex(Z_0 / 2));
  assertAbs(s.T, 0.25, 1e-15, "T");
  assertAbs(s.R, 0.25, 1e-15, "R");
  assertAbs(s.A, 0.5, 1e-15, "A");
  for (const f of [0.1, 0.3, 0.9, 3]) assert.ok(shuntSheet(complex(f * Z_0)).A <= 0.5 + 1e-15);
});

test("strip impedance: 1/(σh) when h ≪ δ, (1 + i)/(2σδ) when h ≫ δ; losses keep T + R + A = 1", () => {
  const sigma = 3.77e7, delta = 20e-9;
  const thin = stripSurfaceImpedance(sigma, 0.2e-9, delta);
  assertAbs(thin.re * sigma * 0.2e-9, 1, 1e-4, "thin: R = 1/(σh)");
  const thick = stripSurfaceImpedance(sigma, 2e-6, delta);
  assertAbs(thick.re, 1 / (2 * sigma * delta), 1e-12, "thick: Re");
  assertAbs(thick.im, 1 / (2 * sigma * delta), 1e-12, "thick: Im");
  const g = wireGridResponse({ period: 830e-9, width: 415e-9, thickness: 100e-9, conductivity: sigma }, 10.6e-6);
  assert.ok(g.parallel.A > 0, "absorbs");
  assertAbs(g.parallel.T + g.parallel.R + g.parallel.A, 1, 1e-12, "energy");
  // δ = √(2/(ωμ₀σ)) at 10.6 µm in aluminium: 15.4 nm.
  assertAbs(g.skinDepth * 1e9, 15.4, 0.1, "δ");
});

test("thin lossy strips: Re Z_∥ = p/(wσh) when h ≪ δ (σ = 3.77e7, h = 1 nm, w = 0.2 µm, p = 0.83 µm: 110.1 Ω)", () => {
  const g = wireGridResponse({ period: 0.83e-6, width: 0.2e-6, thickness: 1e-9, conductivity: 3.77e7 }, 10.6e-6);
  assertAbs(g.parallel.Z.re, 0.83 / (0.2 * 3.77e7 * 1e-9), 0.5, "Re Z");
  assertAbs(g.parallel.Z.re, 110.08, 0.5, "hand value");
  // Im Z is the grid inductance Z₀(p/λ) ln csc(πw/2p) = 376.73 × 0.07830 × 0.99545 = 29.37 Ω, plus 0.08 Ω inside the strips.
  assertAbs(g.parallel.Z.im, 29.37, 0.1, "Im Z");
});

test("the quasi-static model refuses p ≥ λ (a diffraction order propagates) and w outside (0, p)", () => {
  assert.ok(Number.isNaN(wireGridResponse(pec(1.6e-6, 0.8e-6), 1.55e-6).parallel.T));
  assert.ok(Number.isNaN(wireGridResponse(pec(200e-9, 200e-9), 1.55e-6).parallel.T));
  assert.ok(Number.isNaN(wireGridResponse(pec(200e-9, 0), 1.55e-6).extinction));
});
