import test from "node:test";
import assert from "node:assert/strict";

import {
  FILTER_MATERIALS, filterTemperatureRise, thermalDiffusivity, timeToTemperatureRise,
} from "../src/physics/laser-safety/filter-heating";

// Carslaw & Jaeger, Conduction of Heat in Solids (1959): Gaussian sources from the instantaneous point-source solution;
// Lax, J. Appl. Phys. 48, 3919 (1977), doi:10.1063/1.324265: steady centre rise P/(2√π K a) of a half-space under a
// Gaussian of 1/e radius a. SCHOTT N-BK7 data sheet for the glass values.

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const PC = FILTER_MATERIALS.polycarbonate;

test("material values", () => {
  assertRel(thermalDiffusivity(FILTER_MATERIALS.glass), 1.114 / (2510 * 858), 1e-12, "N-BK7 κ");
  assertRel(thermalDiffusivity(FILTER_MATERIALS.glass), 5.173e-7, 1e-3, "N-BK7 κ value");
  assertRel(thermalDiffusivity(PC), 1.389e-7, 1e-3, "PC κ");
});

test("absorbed through the thickness: P/(4πKL) ln(1 + 8κt/w²)", () => {
  // 1 W, 5 mm beam, 3 mm PC, 10 s: 132.63 K × ln(2.7778) = 135.50 K (hand calculation).
  assertRel(filterTemperatureRise(1, 5e-3, 3e-3, 10, PC, "volume"), 135.50, 1e-4, "10 s");
  assert.equal(filterTemperatureRise(1, 5e-3, 3e-3, 0, PC, "volume"), 0);
});

test("absorbed at the face: half-space value early, Lax's steady value for a thick plate", () => {
  // Before L²/(40κ) = 1.62 s the back face doesn't matter: √2 P/(π^1.5 K w) arctan(√(8κt)/w).
  const w = 2.5e-3;
  const kappa = thermalDiffusivity(PC);
  const halfSpace = (t: number) => ((Math.SQRT2 * 1) / (Math.pow(Math.PI, 1.5) * PC.K * w)) * Math.atan(Math.sqrt(8 * kappa * t) / w);
  assertRel(filterTemperatureRise(1, 5e-3, 3e-3, 1, PC, "surface"), halfSpace(1), 1e-12, "1 s");
  assertRel(halfSpace(1), 202.68, 1e-4, "1 s, value");
  // 1 m thick, 30 ks: (2/π) arctan(73.0) = 0.99128 of P/(√(2π) K w) = 797.9 K (Lax, a = w/√2).
  const lax = 1 / (2 * Math.sqrt(Math.PI) * PC.K * (w / Math.SQRT2));
  assertRel(lax, 797.9, 1e-4, "Lax");
  assertRel(filterTemperatureRise(1, 5e-3, 1, 3e4, PC, "surface") / lax, 0.99128, 1e-4, "near steady state");
});

test("absorbed at the face of a thin plate: image sum against direct quadrature", () => {
  // ΔT = P/(ρc) ∫₀ᵗ Σₙ exp(−n²L²/(κτ)) / (√(πκτ) 2π(w²/4 + 2κτ)) dτ, with τ = s², Simpson in s and |n| ≤ 60 summed
  // directly (no theta identity).
  const P = 1;
  const d = 2e-3;
  const L = 1e-3;
  const t = 100;
  const kappa = thermalDiffusivity(PC);
  const w2 = (d / 2) ** 2;
  const g = (s: number) => {
    let sum = 1; // at s = 0 only the n = 0 term is left
    if (s > 0) for (let n = 1; n <= 60; n++) sum += 2 * Math.exp((-n * n * L * L) / (kappa * s * s));
    return (2 * sum) / (Math.sqrt(Math.PI * kappa) * 2 * Math.PI * (w2 / 4 + 2 * kappa * s * s));
  };
  const N = 20000;
  const h = Math.sqrt(t) / N;
  let acc = g(0) + g(Math.sqrt(t));
  for (let i = 1; i < N; i++) acc += (i % 2 ? 4 : 2) * g(i * h);
  const direct = (P / (PC.rho * PC.cp)) * ((acc * h) / 3);
  assertRel(filterTemperatureRise(P, d, L, t, PC, "surface"), direct, 1e-6, "100 s, 1 mm plate");
  // Once κt ≫ L² the face case grows like the even case: their difference settles (793.19 K here from 100 s on).
  const excess = (x: number) => filterTemperatureRise(P, d, L, x, PC, "surface") - filterTemperatureRise(P, d, L, x, PC, "volume");
  assertRel(excess(1e4), excess(t), 1e-9, "constant excess");
  assertRel(excess(t), 793.19, 1e-5, "excess value");
});

test("time to a temperature rise", () => {
  const t = timeToTemperatureRise(120, 2, 5e-3, 3e-3, PC, "surface");
  assertRel(filterTemperatureRise(2, 5e-3, 3e-3, t, PC, "surface"), 120, 1e-8, "inverse");
  assertRel(t, 0.07922, 1e-4, "2 W into PC reaches +120 K in 79 ms");
  assert.equal(timeToTemperatureRise(120, 1e-4, 5e-3, 3e-3, PC, "surface"), Infinity, "0.1 mW never does");
  assert.ok(Number.isNaN(timeToTemperatureRise(0, 2, 5e-3, 3e-3, PC, "surface")), "ΔT ≤ 0");
  assert.ok(Number.isNaN(filterTemperatureRise(1, 0, 3e-3, 1, PC, "surface")), "d = 0");
});
