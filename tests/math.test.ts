import test from "node:test";
import assert from "node:assert/strict";

import {
  erf,
  erfc,
  lnFactorial,
  normalCdf,
  poissonCdf,
  poissonPmf,
  poissonSf,
  qFunction,
} from "../src/physics/math";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Reference values: CPython 3 math.erf / math.erfc (accurate to ~1 ulp).
test("erfc matches reference values from the centre to the far tail", () => {
  const cases: Array<[number, number]> = [
    [0.5, 0.4795001221869534],
    [1, 0.1572992070502851],
    [2, 0.004677734981047265],
    [3, 2.209049699858544e-5],
    [5, 1.5374597944280351e-12],
    [10, 2.088487583762545e-45],
  ];
  for (const [x, expected] of cases) assertRel(erfc(x), expected, 2e-13, `erfc(${x})`);
});

test("erf is odd and accurate near zero", () => {
  assertRel(erf(-0.5), -0.5204998778130465, 1e-15, "erf(-0.5)");
  assert.equal(erf(0), 0);
  assertRel(erf(1e-10), (2 / Math.sqrt(Math.PI)) * 1e-10, 1e-15, "erf(1e-10)");
  assert.ok(Number.isNaN(erf(NaN)));
});

test("erfc reflection and limits", () => {
  assertRel(erfc(-1.3), 2 - erfc(1.3), 1e-15, "erfc(-1.3)");
  assert.equal(erfc(Number.POSITIVE_INFINITY), 0);
  assert.equal(erfc(Number.NEGATIVE_INFINITY), 2);
  assert.equal(erfc(40), 0); // underflows (true value ~1e-697)
});

test("Q and Φ match standard normal tables", () => {
  // Q(6) = ½ erfc(6/√2) from CPython math.erfc; 1.959963984540054 is the 97.5 % normal quantile.
  assertRel(qFunction(6), 9.865876450377016e-10, 1e-12, "Q(6)");
  assertRel(normalCdf(1.959963984540054), 0.975, 1e-15, "Phi(1.96)");
  assert.equal(qFunction(0), 0.5);
});

test("lnFactorial: exact table and Stirling branch agree with lgamma", () => {
  assert.equal(lnFactorial(0), 0);
  assertRel(lnFactorial(10), Math.log(3628800), 1e-15, "ln 10!");
  // CPython math.lgamma(301)
  assertRel(lnFactorial(300), 1414.905849945068, 1e-15, "ln 300!");
  assert.ok(Number.isNaN(lnFactorial(2.5)));
  assert.ok(Number.isNaN(lnFactorial(-1)));
});

test("Poisson tails keep relative accuracy (hand-summed closed forms)", () => {
  // P(K ≤ 3 | 20.1) = e^(−20.1)(1 + 20.1 + 20.1²/2 + 20.1³/6)
  const mu = 20.1;
  const lower = Math.exp(-mu) * (1 + mu + mu ** 2 / 2 + mu ** 3 / 6);
  assertRel(poissonCdf(3, mu), lower, 1e-13, "cdf(3, 20.1)");
  // P(K > 3 | 0.1) = Σ_{j≥4} e^(−0.1) 0.1^j / j!  (summed directly, no cancellation)
  assertRel(poissonSf(3, 0.1), 3.846833925345059e-6, 1e-13, "sf(3, 0.1)");
  assertRel(poissonPmf(2, 3), (Math.exp(-3) * 9) / 2, 1e-15, "pmf(2, 3)");
});

test("Poisson edge cases", () => {
  assertRel(poissonCdf(1000, 1000) + poissonSf(1000, 1000), 1, 1e-14, "cdf + sf");
  assert.equal(poissonCdf(-1, 2), 0);
  assert.equal(poissonSf(-1, 2), 1);
  assert.equal(poissonCdf(0, 0), 1);
  assert.equal(poissonPmf(3, 0), 0);
  assert.ok(Number.isNaN(poissonCdf(2, -1)));
  assert.equal(poissonSf(5000, 1), 0); // underflow, and no runaway loop
});
