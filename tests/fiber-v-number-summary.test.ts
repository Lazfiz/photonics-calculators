// Golden values for vNumberSummary / vNumberProblem (src/physics/fiber-optics/v-number.ts), from an independent script
// (own Bessel integral and zero search): V = 2π a NA/λ, λc = 2π a NA/2.4048256 (first zero of J₀), LP_lm cutoff at the m-th zero of
// J_(l−1) (LP01 has none), 2 modes per LP_0m and 4 per LP_lm (l ≥ 1), V²/2 estimate. Gloge D., Appl. Opt. 10, 2252 (1971),
// doi:10.1364/AO.10.002252.
import assert from "node:assert/strict";
import { test } from "node:test";

import { INDEX_ORDER_PROBLEM, NO_V_PROBLEM, vNumberProblem, vNumberSummary } from "../src/physics/fiber-optics/v-number";

const close = (actual: number, expected: number, rel = 1e-8) =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${actual} vs ${expected}`);

test("single-mode fibre, NA entered", () => {
  const s = vNumberSummary({ mode: "na", a: 4.1e-6, lambda: 1550e-9, na: 0.1246, coreIndex: 1, claddingIndex: 1 });
  close(s.V, 2.070856803887589);
  close(s.cutoff, 1334.7446494627734e-9);
  assert.equal(s.modes, 2);
  assert.equal(s.lpModes.length, 1);
  close(s.approx, 2.14422395110376);
  close(s.acceptanceDeg, 7.157656880406496);
});

test("multimode fibre from the indices: 129 LP modes, 496 modes", () => {
  const s = vNumberSummary({ mode: "indices", a: 25e-6, lambda: 850e-9, na: 0.5, coreIndex: 1.45, claddingIndex: 1.44 });
  close(s.NA, 0.17);
  close(s.V, 31.41592653589801);
  assert.equal(s.lpModes.length, 129);
  assert.equal(s.modes, 496);
  close(s.approx, 493.48022005447035);
  close(s.acceptanceDeg, 9.787819056714003);
});

test("13 LP modes, 46 modes at V = 9.59", () => {
  const s = vNumberSummary({ mode: "na", a: 10e-6, lambda: 1310e-9, na: 0.2, coreIndex: 1, claddingIndex: 1 });
  assert.equal(s.lpModes.length, 13);
  assert.equal(s.modes, 46);
  close(s.cutoff, 5225.481147331065e-9);
});

test("problems: index order, then a missing V", () => {
  assert.equal(vNumberProblem("indices", 1.44, 1.45, 3), INDEX_ORDER_PROBLEM);
  assert.equal(vNumberProblem("na", 1.44, 1.45, NaN), NO_V_PROBLEM);
  assert.equal(vNumberProblem("na", 1.44, 1.45, 3), null);
});

test("above V = 40 the exact count is NaN and the V²/2 estimate remains", () => {
  const s = vNumberSummary({ mode: "na", a: 50e-6, lambda: 850e-9, na: 0.2, coreIndex: 1, claddingIndex: 1 });
  assert.ok(Number.isNaN(s.modes));
  close(s.approx, (s.V * s.V) / 2);
});
