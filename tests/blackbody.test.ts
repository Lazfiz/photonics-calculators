import test from "node:test";
import assert from "node:assert/strict";

import { blackbodyBandFraction, blackbodyFractionBelow, planckExitance, planckWeightedMean } from "../src/physics/blackbody";
import { b_Wien, sigma_SB } from "../src/physics/constants";

// Blackbody radiation functions F(0 → λT), as tabulated in heat-transfer texts (e.g. Incropera & DeWitt,
// "Blackbody radiation functions", computed with c₂ = 14 388 µm·K). The printed values differ from the exact
// integral by up to 4e-5 (at 10 000 µm·K); the next test checks the series against the integral itself to 1e-8.
const TABLE: [number, number][] = [
  [1000, 0.000321],
  [2000, 0.066728],
  [3000, 0.273232],
  [5000, 0.633747],
  [10000, 0.914199],
];

test("blackbody: band fractions match the tabulated radiation functions", () => {
  for (const [lt, F] of TABLE) {
    const f = blackbodyFractionBelow(lt * 1e-6, 1);
    assert.ok(Math.abs(f - F) < 5e-5, `F(${lt} µm·K) = ${f} vs ${F}`);
  }
  // A quarter of the power lies below the Wien peak (independent of T).
  assert.ok(Math.abs(blackbodyFractionBelow(b_Wien / 300, 300) - 0.25005) < 2e-5);
});

test("blackbody: series agrees with direct integration of Planck's law", () => {
  // Both branches of the series (x < 1 and x ≥ 1) against a fine trapezoid sum of M_λ over σT⁴.
  const T = 300;
  const integrate = (a: number, b: number) => {
    const n = 200000;
    const h = Math.log(b / a) / n;
    let s = 0;
    for (let i = 0; i <= n; i++) {
      const lam = a * Math.exp(i * h);
      s += planckExitance(lam, T) * lam * (i === 0 || i === n ? 0.5 : 1);
    }
    return (s * h) / (sigma_SB * T ** 4);
  };
  for (const [a, b] of [[2.5e-6, 25e-6], [25e-6, 1e-3], [1e-3, 0.1]]) {
    const series = blackbodyBandFraction(a, b, T);
    assert.ok(Math.abs(series - integrate(a, b)) < 1e-8, `${a}–${b}: ${series}`);
  }
  // Limits: everything below λ = ∞, nothing below 0; σT⁴ = ∫ M_λ dλ.
  assert.equal(blackbodyFractionBelow(Infinity, 300), 1);
  assert.equal(blackbodyFractionBelow(0, 300), 0);
  assert.ok(Math.abs(integrate(1e-7, 1) - 1) < 1e-7);
  assert.ok(Number.isNaN(blackbodyFractionBelow(1e-6, 0)));
  assert.ok(Number.isNaN(blackbodyBandFraction(2e-6, 1e-6, 300)));
});

test("blackbody: Planck-weighted mean", () => {
  assert.ok(Math.abs(planckWeightedMean(() => 0.42, 300, 2.5e-6, 50e-6) - 0.42) < 1e-15);
  // A step at λ_s splits the weight in the ratio of the band fractions.
  const T = 300, a = 2.5e-6, s = 9.66e-6, b = 50e-6;
  const mean = planckWeightedMean((lam) => (lam < s ? 1 : 0), T, a, b, 20000);
  const expected = blackbodyBandFraction(a, s, T) / blackbodyBandFraction(a, b, T);
  assert.ok(Math.abs(mean - expected) < 1e-4, `${mean} vs ${expected}`);
  assert.ok(Number.isNaN(planckWeightedMean(() => 1, 300, 5e-6, 2e-6)));
});
