import test from "node:test";
import assert from "node:assert/strict";

import {
  BESSEL_Y_MAX_X,
  besselI0,
  besselIScaled,
  besselIScaled01,
  besselKScaled01,
  besselY,
  besselJ,
  besselK,
  erf,
  erfc,
  firstCrossing,
  integrateTanhSinh,
  intervalStats,
  lnFactorial,
  lnGamma,
  normalCdf,
  poissonCdf,
  poissonPmf,
  poissonSf,
  qFunction,
  regularizedGammaP,
  unwrapPhase,
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

test("Bessel J_n and K_ν match A&S Tables 9.1 and 9.8", () => {
  // Abramowitz & Stegun, Handbook of Mathematical Functions, Table 9.1 (J) and Table 9.8 (K; K₀(10) = e^(−10)·0.3916319344).
  const J: [number, number, number][] = [[0, 1, 0.7651976866], [1, 1, 0.4400505857], [1, 10, 0.0434727462], [0, 5, -0.1775967713]];
  for (const [n, x, v] of J) assertRel(besselJ(n, x), v, 1e-9, `J${n}(${x})`);
  const K: [number, number, number][] = [
    [0, 0.1, 2.4270690247], [1, 0.1, 9.8538447809], [0, 1, 0.4210244382], [1, 1, 0.6019072302],
    [0, 2, 0.1138938727], [1, 2, 0.1398658818], [0, 10, Math.exp(-10) * 0.3916319344],
  ];
  for (const [nu, x, v] of K) assertRel(besselK(nu, x), v, 1e-9, `K${nu}(${x})`);
  // I₀: A&S Table 9.8 (I₀(8) = e^8 · 0.1434317818).
  assertRel(besselI0(1), 1.2660658778, 1e-9, "I0(1)");
  assertRel(besselI0(8), Math.exp(8) * 0.1434317818, 1e-9, "I0(8)");
  // Closed form K_{1/2}(x) = √(π/2x) e^(−x) (DLMF 10.39.2), and the first zero of J₀ (DLMF Table 10.21.1).
  for (const x of [0.01, 0.5, 3, 40]) assertRel(besselK(0.5, x), Math.sqrt(Math.PI / (2 * x)) * Math.exp(-x), 1e-13, `K½(${x})`);
  assert.ok(Math.abs(besselJ(0, 2.404825557695773)) < 1e-15);
});

test("Bessel edge cases", () => {
  assert.equal(besselJ(0, 0), 1);
  assert.equal(besselJ(1, 0), 0);
  assertRel(besselK(1, 1e-6), 1e6, 1e-9, "K₁(x) → 1/x"); // DLMF 10.30.2
  assert.equal(besselI0(0), 1);
  assert.equal(besselK(0, 0), Infinity);
  assert.ok(Number.isNaN(besselK(0, -1)));
  assert.ok(Number.isNaN(besselJ(0.5, 1))); // integer orders only
});

test("Bessel Y_0, Y_1 and scaled I_n, K_0/K_1 match A&S Tables 9.1 and 9.8", () => {
  // A&S Table 9.1: Y₀(1) = 0.0882569642, Y₁(1) = −0.7812128213, Y₀(10) = 0.0556711673, Y₁(10) = 0.2490154242,
  // Y₀(0.1) = −1.5342386514, Y₁(0.1) = −6.4589510947; A&S Table 9.2 (x = 20): Y₀ = 0.0626405968, Y₁ = −0.1655116144.
  const Y: [0 | 1, number, number, number][] = [
    [0, 1, 0.0882569642, 1e-10], [1, 1, -0.7812128213, 1e-10], [0, 10, 0.0556711673, 1e-10], [1, 10, 0.2490154242, 1e-10],
    [0, 0.1, -1.5342386514, 1e-10], [1, 0.1, -6.4589510947, 1e-10], [0, 20, 0.0626405968, 1e-8], [1, 20, -0.1655116144, 1e-8],
  ];
  for (const [n, x, v, tol] of Y) assert.ok(Math.abs(besselY(n, x) - v) < tol, `Y${n}(${x}) = ${besselY(n, x)}`);
  // Wronskian J₁Y₀ − J₀Y₁ = 2/(πx) (DLMF 10.5.2), an independent check of both series.
  for (const x of [0.01, 0.7, 3, 12]) {
    const w = besselJ(1, x) * besselY(0, x) - besselJ(0, x) * besselY(1, x);
    assertRel(w, 2 / (Math.PI * x), 1e-10, `Wronskian(${x})`);
  }
  // A&S Table 9.8: e^(−1) I₁(1) = 0.2079104154, e^(−8)·I₁(8) = 0.1343383 (I₁(8) = 399.8731).
  assertRel(besselIScaled(1, 1), 0.2079104154, 1e-9, "e^-1 I1(1)");
  assertRel(besselIScaled(1, 8) * Math.exp(8), 399.8731367825, 1e-9, "I1(8)");
  assertRel(besselIScaled(0, 8) * Math.exp(8), besselI0(8), 1e-13, "I0 scaled");
  const [i0, i1] = besselIScaled01(5);
  assertRel(i0, besselIScaled(0, 5), 1e-14, "I pair 0");
  assertRel(i1, besselIScaled(1, 5), 1e-14, "I pair 1");
  for (const x of [1e-6, 0.1, 2, 300]) {
    const [k0, k1] = besselKScaled01(x);
    assertRel(k0, besselK(0, x) * Math.exp(x), 1e-12, `K pair 0 (${x})`);
    assertRel(k1, besselK(1, x) * Math.exp(x), 1e-12, `K pair 1 (${x})`);
  }
  // Domain edges.
  assert.ok(Number.isNaN(besselY(0, 0)));
  assert.ok(Number.isNaN(besselY(1, BESSEL_Y_MAX_X + 1)));
  assert.equal(besselIScaled(0, 0), 1);
  assert.equal(besselIScaled(1, 0), 0);
});

// cos x crosses 0 at π/2 and 0.5 at π/3 (exact). Scanning from 3 down to 0 meets π/2 first for level 0.
test("firstCrossing: bisects the first sign change in the scan direction", () => {
  assert.ok(Math.abs(firstCrossing(Math.cos, 0, 3, 0) - Math.PI / 2) < 1e-12);
  assert.ok(Math.abs(firstCrossing(Math.cos, 3, 0, 0) - Math.PI / 2) < 1e-12);
  assert.ok(Math.abs(firstCrossing(Math.cos, 3, 0, 0.5) - Math.PI / 3) < 1e-12);
  // sin on [0, 10]: crossings of 0.5 at π/6, 5π/6, …; the first is π/6.
  assert.ok(Math.abs(firstCrossing(Math.sin, 0, 10, 0.5) - Math.PI / 6) < 1e-12);
  assert.equal(firstCrossing(Math.cos, 0, 1, 1), 0); // f(a) = level
  assert.ok(Number.isNaN(firstCrossing(Math.cos, 0, 1, 2)), "no crossing");
  assert.ok(Number.isNaN(firstCrossing(() => NaN, 0, 1, 0)));
});

// Trapezoidal rule for x² on [0, 1] with n intervals: 1/3 + 1/(6n²) (error term h²/12·[f′(1) − f′(0)]).
test("intervalStats: trapezoidal mean, min and max", () => {
  const s = intervalStats((x) => x * x, 0, 1, 400);
  assert.ok(Math.abs(s.mean - (1 / 3 + 1 / (6 * 400 * 400))) < 1e-15, `${s.mean}`);
  assert.equal(s.min, 0);
  assert.equal(s.max, 1);
  assert.ok(Number.isNaN(intervalStats((x) => x, 1, 1).mean), "empty interval");
  assert.ok(Number.isNaN(intervalStats(() => NaN, 0, 1).max));
});

test("unwrapPhase: recovers a phase ramp wrapped by atan2, NaN passes through", () => {
  // φ = 0.9·k + 2: steps of 0.9 rad (< π), wrapped into (−π, π] by atan2.
  const truth = Array.from({ length: 40 }, (_, k) => 0.9 * k + 2);
  const wrapped = truth.map((p) => Math.atan2(Math.sin(p), Math.cos(p)));
  const out = unwrapPhase(wrapped);
  for (let k = 0; k < truth.length; k++) {
    assert.ok(Math.abs(out[k] - truth[k]) < 1e-12, `k = ${k}: ${out[k]} vs ${truth[k]}`);
  }
  // A step across ±π, and a NaN in the middle (the chain continues across it).
  const down = unwrapPhase([3, -3, 2.5, NaN, 2]);
  assert.ok(Math.abs(down[1] - (2 * Math.PI - 3)) < 1e-12, `${down[1]}`);
  assert.ok(Math.abs(down[2] - 2.5) < 1e-12, `${down[2]}`);
  assert.ok(Number.isNaN(down[3]));
  assert.ok(Math.abs(down[4] - 2) < 1e-12, `${down[4]}`);
  assert.deepEqual(unwrapPhase([]), []);
});

test("lnGamma matches factorials, Γ(1/2) = √π and Γ(1/6) (A&S 6.1.8, DLMF 5.4.6 table value)", () => {
  assert.ok(Math.abs(lnGamma(1)) < 1e-14 && Math.abs(lnGamma(2)) < 1e-14, "Γ(1) = Γ(2) = 1");
  for (const k of [2, 5, 10, 30, 170]) assertRel(lnGamma(k + 1), lnFactorial(k), 1e-14, `lnΓ(${k + 1})`);
  assertRel(Math.exp(lnGamma(0.5)), Math.sqrt(Math.PI), 1e-14, "Γ(1/2)");
  assertRel(Math.exp(lnGamma(1 / 6)), 5.566316001780235, 1e-13, "Γ(1/6)");
  assert.ok(Number.isNaN(lnGamma(0)) && Number.isNaN(lnGamma(-1)));
});

test("regularized incomplete gamma: Poisson identity, exponential and erf cases, both branches", () => {
  // Integer a: P(a, x) = 1 − Σ_{k<a} e^(−x) x^k/k! = poissonSf(a − 1, x) (series and continued-fraction branches).
  for (const [a, x] of [[3, 2.5], [3, 9], [20, 12], [20, 40], [1, 1e-3]]) assertRel(regularizedGammaP(a, x), poissonSf(a - 1, x), 1e-12, `P(${a}, ${x})`);
  assertRel(regularizedGammaP(1, 0.7), -Math.expm1(-0.7), 1e-14, "P(1, x)");
  assertRel(regularizedGammaP(0.5, 2), erf(Math.SQRT2), 1e-13, "P(1/2, x) = erf √x");
  // Deep lower tail keeps relative accuracy: P(a, x) → x^a/Γ(a + 1).
  assertRel(regularizedGammaP(50, 1), Math.exp(-1 - lnGamma(51)) * (1 + 1 / 51 + 1 / (51 * 52) + 1 / (51 * 52 * 53)), 1e-6, "P(50, 1)");
  assert.equal(regularizedGammaP(2, 0), 0);
  assert.ok(Number.isNaN(regularizedGammaP(0, 1)) && Number.isNaN(regularizedGammaP(1, -1)));
});

test("tanh-sinh quadrature handles algebraic end singularities", () => {
  assertRel(integrateTanhSinh((x) => x ** -0.5, 0, 1), 2, 1e-10, "∫x^(−1/2)");
  // B(11/6, 11/6) = Γ(11/6)²/Γ(11/3).
  assertRel(integrateTanhSinh((x) => (x * (1 - x)) ** (5 / 6), 0, 1), Math.exp(2 * lnGamma(11 / 6) - lnGamma(11 / 3)), 1e-12, "Beta");
  assertRel(integrateTanhSinh(Math.exp, -1, 2), Math.E ** 2 - 1 / Math.E, 1e-13, "∫eˣ");
});

test("regularizedGammaP for large a: Temme's expansion (a ≥ 1e5) matches the power series summed to convergence", () => {
  // Independent check: P(a, x) = x^a e^(−x)/Γ(a+1) Σ x^k/((a+1)…(a+k)), lnΓ by Stirling's series (DLMF 5.11.1).
  const a = 1e5;
  const lnGammaA = (a - 0.5) * Math.log(a) - a + 0.5 * Math.log(2 * Math.PI) + 1 / (12 * a) - 1 / (360 * a ** 3);
  for (const r of [0.99, 1, 1.003]) {
    const x = r * a;
    let term = 1 / a;
    let sum = term;
    for (let k = 1; k < 200000 && term > 1e-17 * sum; k++) {
      term *= x / (a + k);
      sum += term;
    }
    assertRel(regularizedGammaP(a, x), sum * Math.exp(a * Math.log(x) - x - lnGammaA), 1e-8, `x/a = ${r}`);
  }
  // DLMF 8.12: P(a, a) → ½ + 1/(3√(2πa)); the old 1000-term cap gave 0.34 at a = 1e6.
  assertRel(regularizedGammaP(1e6, 1e6), 0.5 + 1 / (3 * Math.sqrt(2 * Math.PI * 1e6)), 1e-8, "P(1e6, 1e6)");
});
