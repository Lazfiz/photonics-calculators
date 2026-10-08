import test from "node:test";
import assert from "node:assert/strict";

import {
  LP11_CUTOFF_V, bendLossCoefficient, bendLossPerTurnDb, lp01Mode, lp11CutoffWavelength, modeFieldRadius, vNumber,
} from "../src/physics/fiber-optics/macro-bending-loss";
import { besselJ, besselK } from "../src/physics/math";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// SMF-28-like step-index fibre: a = 4.1 µm, n₁ = 1.4682, n₂ = 1.4629 (NA = 0.12464), at 1550 nm.
const n1 = 1.4682;
const smf = { a: 4.1e-6, n1, NA: Math.sqrt(n1 ** 2 - 1.4629 ** 2) };
const lambda = 1550e-9;

test("LP01 eigenvalue solves the characteristic equation and matches Rudolph–Neumann", () => {
  for (const V of [0.8, 1.5, 2, 2.4048, 3, 10]) {
    const { U, W } = lp01Mode(V);
    assertRel(U * U + W * W, V * V, 1e-13, `U² + W² at V = ${V}`);
    // Gloge, Appl. Opt. 10, 2252 (1971): U J₁(U)/J₀(U) = W K₁(W)/K₀(W).
    assertRel((U * besselJ(1, U)) / besselJ(0, U), (W * besselK(1, W)) / besselK(0, W), 1e-10, `residual at V = ${V}`);
  }
  // Rudolph & Neumann (1976), quoted by Snyder & Love: W ≈ 1.1428V − 0.9960 for 1.5 ≤ V ≤ 2.5, stated as
  // ≈ 0.1 %; on a 0.01 grid the largest deviation is 0.126 % (V = 1.64).
  for (let V = 1.5; V <= 2.5; V += 0.1) assertRel(lp01Mode(V).W, 1.1428 * V - 0.996, 1.5e-3, `W(${V.toFixed(1)})`);
  // Large V (hand expansion: W K₁/K₀ ≈ W + 1/2 ≈ V and J₀(j₀₁ − δ) ≈ δ J₁(j₀₁) give U ≈ j₀₁(1 − 1/V)).
  for (const V of [50, 200]) {
    assert.ok(Math.abs(lp01Mode(V).U / LP11_CUTOFF_V - (1 - 1 / V)) < 2 / V ** 2, `U(${V})`);
  }
});

test("Marcuse bend loss of an SMF-28-like fibre at 1550 nm", () => {
  // Golden values from the session-17 physics review (an independent implementation of Marcuse,
  // J. Opt. Soc. Am. 66, 216 (1976)), docs/ROADMAP.md Phase 2 findings: 16, 3.1 and 0.11 dB/turn.
  const V = vNumber(smf, lambda);
  assertRel(V, 2.0715, 1e-4, "V");
  const mode = lp01Mode(V);
  const cases: [number, number][] = [[7.5e-3, 16], [10e-3, 3.1], [15e-3, 0.11]];
  for (const [R, dB] of cases) assertRel(bendLossPerTurnDb(smf, lambda, R, mode), dB, 0.035, `${R * 1e3} mm`);
  // dB/m × 2πR = dB/turn, and the default `mode` argument gives the same answer.
  const R = 10e-3;
  assertRel((10 / Math.LN10) * bendLossCoefficient(smf, lambda, R) * 2 * Math.PI * R, 3.124, 1e-3, "dB/m → dB/turn");
  // Below the spec range of G.652 fibre: ≪ 0.05 dB per 100 turns at 25–30 mm.
  assert.ok(bendLossPerTurnDb(smf, lambda, 30e-3) * 100 < 0.05);
});

test("Cutoff wavelength and mode-field radius (hand calculations)", () => {
  // λc = 2π a NA / 2.404826 = 2π · 4.1 µm · 0.124639 / 2.404826 = 1.33516 µm.
  assertRel(lp11CutoffWavelength(smf), 1.33516e-6, 1e-5, "λc");
  // Marcuse, Bell Syst. Tech. J. 56, 703 (1977), at V = 2: w/a = 0.65 + 1.619/2^1.5 + 2.879/2^6 = 1.267387.
  const f = { a: 5e-6, n1: 1.45, NA: 0.1 };
  const lambdaV2 = (2 * Math.PI * f.a * f.NA) / 2;
  assertRel(modeFieldRadius(f, lambdaV2), 5e-6 * 1.267387, 1e-6, "MFR at V = 2");
});

test("bend loss domain edges", () => {
  assert.equal(bendLossCoefficient(smf, lambda, Infinity), 0);
  assert.equal(bendLossCoefficient(smf, lambda, 2), 0); // exp(−1400) underflows
  assert.ok(Number.isNaN(bendLossCoefficient(smf, lambda, 0)));
  assert.ok(Number.isNaN(bendLossCoefficient(smf, lambda, -1e-3)));
  assert.ok(Number.isNaN(bendLossCoefficient({ ...smf, NA: 1.5 }, lambda, 0.01))); // NA ≥ n₁
  assert.ok(Number.isNaN(lp01Mode(0.49).U)); // below MIN_V
  assert.ok(Number.isNaN(bendLossPerTurnDb(smf, 20e-6, 0.01))); // V = 0.16
  // A mode solved at another wavelength is rejected rather than silently reused.
  assert.ok(Number.isNaN(bendLossCoefficient(smf, lambda, 0.01, lp01Mode(2))));
  // Loss falls monotonically with R.
  let prev = Infinity;
  for (let R = 5e-3; R <= 30e-3; R += 1e-3) {
    const a = bendLossCoefficient(smf, lambda, R);
    assert.ok(a < prev, `monotonic at ${R}`);
    prev = a;
  }
});
