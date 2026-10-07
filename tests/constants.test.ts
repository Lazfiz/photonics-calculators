import test from "node:test";
import assert from "node:assert/strict";

import * as K from "../src/physics/constants";
import * as cx from "../src/physics/complex";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Derived exact constants against the values printed in the CODATA 2022 table
// (https://physics.nist.gov/cuu/Constants/Table/allascii.txt), which are truncated to 10 digits.
test("constants: derived exact values match CODATA 2022", () => {
  assertRel(K.hbar, 1.054571817e-34, 1e-9, "ħ");
  assertRel(K.R_gas, 8.314462618, 1e-9, "R");
  assertRel(K.F_faraday, 96485.33212, 1e-9, "F");
  assertRel(K.sigma_SB, 5.670374419e-8, 1e-9, "σ");
  assertRel(K.c1_radiation, 3.741771852e-16, 1e-9, "c₁");
  assertRel(K.c2_radiation, 1.438776877e-2, 1e-9, "c₂");
  assertRel(K.b_Wien, 2.897771955e-3, 1e-9, "b");
  // Edge: WIEN_X is the root of x = 5(1 − e^(−x)).
  assert.ok(Math.abs(K.WIEN_X - 5 * -Math.expm1(-K.WIEN_X)) < 1e-14);
});

// The measured CODATA values must agree with the exact relations between them, to within the
// rounding of the published digits: μ₀ε₀c² = 1, μ₀ = 2αh/(e²c), Z₀ = μ₀c, a₀ = 4πε₀ħ²/(m_e e²).
test("constants: measured values are mutually consistent", () => {
  assertRel(K.mu_0 * K.epsilon_0 * K.c ** 2, 1, 1e-10, "μ₀ε₀c²");
  assertRel(K.mu_0, (2 * K.alpha * K.h) / (K.q ** 2 * K.c), 1e-10, "μ₀ from α");
  assertRel(K.Z_0, K.mu_0 * K.c, 1e-10, "Z₀");
  assertRel(K.a_0, (4 * Math.PI * K.epsilon_0 * K.hbar ** 2) / (K.m_e * K.q ** 2), 1e-9, "a₀");
  assertRel(K.m_p / K.m_e, 1836.152673426, 1e-9, "m_p/m_e");
});

test("complex sqrt: principal branch, no cancellation, decaying root on the cut", () => {
  const cases: [cx.Complex, cx.Complex][] = [
    [{ re: 3, im: 4 }, { re: 2, im: 1 }],
    [{ re: -3, im: 4 }, { re: 1, im: 2 }],
    [{ re: -3, im: -4 }, { re: 1, im: -2 }],
    [{ re: -4, im: 0 }, { re: 0, im: 2 }],
    [{ re: -4, im: -0 }, { re: 0, im: 2 }],
    [{ re: 0, im: 0 }, { re: 0, im: 0 }],
  ];
  for (const [z, w] of cases) {
    const s = cx.sqrt(z);
    assert.ok(Math.abs(s.re - w.re) < 1e-15 && Math.abs(s.im - w.im) < 1e-15, `sqrt(${z.re}, ${z.im}) = (${s.re}, ${s.im})`);
  }
  // Tiny imaginary part next to a large negative real part: Re √z = |Im z| / (2√|z|) exactly.
  const s = cx.sqrt({ re: -1e8, im: 1e-8 });
  assertRel(s.re, 1e-8 / (2 * 1e4), 1e-15, "Re √(−1e8 + 1e-8 i)");
});
