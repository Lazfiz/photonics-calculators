import test from "node:test";
import assert from "node:assert/strict";

import { beamIrradiance, irradianceAt } from "../src/physics/laser-safety/power-density";

// Source: Saleh & Teich, Fundamentals of Photonics, ch. 3.1: I(ρ) = (2P/πW²) exp(−2ρ²/W²); the power inside radius ρ is
// P(1 − exp(−2ρ²/W²)). Numbers below are hand calculations.

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const W_CM2 = 1e4; // W/cm² → W/m²

test("1 W Gaussian, 1/e² diameter 1 mm: peak 254.648 W/cm², mean 127.324 W/cm², area 7.85398e-3 cm²", () => {
  // A = π(0.05 cm)² = 7.853982e-3 cm²; P/A = 127.3240 W/cm²; I₀ = 2P/(πw²) = 8P/(πd²) = 254.6479 W/cm².
  const r = beamIrradiance(1, 1e-3, "gaussian");
  assertRel(r.area, 7.853982e-7, 1e-6, "area");
  assertRel(r.mean, 127.3240 * W_CM2, 1e-6, "mean");
  assertRel(r.peak, 254.6479 * W_CM2, 1e-6, "peak");
});

test("top-hat: peak = mean = 4P/(πd²); 10 W over 2 mm gives 318.310 W/cm²", () => {
  // 4·10/(π·0.2²) = 318.3099 W/cm².
  const r = beamIrradiance(10, 2e-3, "tophat");
  assertRel(r.peak, 318.3099 * W_CM2, 1e-6, "peak");
  assert.equal(r.peak, r.mean);
  assert.equal(irradianceAt(0.999e-3, 10, 2e-3, "tophat"), r.peak);
  assert.equal(irradianceAt(1.001e-3, 10, 2e-3, "tophat"), 0);
});

test("Gaussian profile integrates to P, with 1 − e⁻² = 86.466 % inside the 1/e² radius (numerical quadrature)", () => {
  const P = 2.5;
  const d = 3e-3;
  const w = d / 2;
  const integrate = (rMax: number) => {
    const n = 20000;
    const h = rMax / n;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const r = (i + 0.5) * h; // midpoint rule
      sum += irradianceAt(r, P, d, "gaussian") * 2 * Math.PI * r * h;
    }
    return sum;
  };
  assertRel(integrate(6 * w), P, 1e-6, "total power");
  assertRel(integrate(w) / P, 1 - Math.exp(-2), 1e-6, "fraction inside w");
  // I(w) = I₀/e².
  assertRel(irradianceAt(w, P, d, "gaussian"), beamIrradiance(P, d, "gaussian").peak * Math.exp(-2), 1e-12, "I(w)");
});

test("domain: zero power gives zero irradiance; non-positive diameter or negative power gives NaN", () => {
  assert.equal(beamIrradiance(0, 1e-3, "gaussian").peak, 0);
  assert.ok(Number.isNaN(beamIrradiance(1, 0, "gaussian").peak));
  assert.ok(Number.isNaN(beamIrradiance(-1, 1e-3, "tophat").mean));
  assert.ok(Number.isNaN(irradianceAt(-1e-3, 1, 1e-3, "gaussian")));
});
