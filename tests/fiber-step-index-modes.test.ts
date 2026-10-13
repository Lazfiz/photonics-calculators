import test from "node:test";
import assert from "node:assert/strict";

import { lp01Mode, modeFieldRadius, vNumber } from "../src/physics/fiber-optics/macro-bending-loss";
import { claddingMismatch } from "../src/physics/fiber-optics/microbend";
import {
  asymptoticModeCount, besselJZeros, coreConfinement, effectiveIndex, guidedLpModes, guidedModeCount, lp01Field,
  normalizedB, petermannIIRadius,
} from "../src/physics/fiber-optics/step-index-modes";
import { besselJ, besselK } from "../src/physics/math";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

/** Composite Simpson rule, n even. */
function simpson(f: (x: number) => number, a: number, b: number, n = 2000) {
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return (s * h) / 3;
}

// SMF-28-like step-index fibre with phase indices: a = 4.1 µm, n₂ = 1.4440 (silica at 1550 nm), NA = 0.1246.
const smf = { a: 4.1e-6, n1: 1.44937, NA: 0.1246 };
const lambda = 1550e-9;

test("Petermann II spot size and core power fraction match numerical integrals of the exact LP01 field", () => {
  for (const V of [1.2, 1.8, 2.0709, 2.4, 3]) {
    const mode = lp01Mode(V);
    const { U, W } = mode;
    // ψ = J₀(Uρ) in the core, J₀(U)K₀(Wρ)/K₀(W) outside; ψ' from the Bessel derivatives J₀' = −J₁, K₀' = −K₁.
    const c = besselJ(0, U) / besselK(0, W);
    const dpsi = (r: number) => (r <= 1 ? -U * besselJ(1, U * r) : -W * c * besselK(1, W * r));
    const rMax = 1 + 25 / W;
    const core = simpson((r) => lp01Field(mode, r) ** 2 * r, 0, 1);
    const all = core + simpson((r) => lp01Field(mode, r) ** 2 * r, 1, rMax, 6000);
    const grad = simpson((r) => dpsi(r) ** 2 * r, 0, 1) + simpson((r) => dpsi(r) ** 2 * r, 1, rMax, 6000);
    // Petermann II (ITU-T G.650.1 far-field definition): w² = 2∫ψ²r dr / ∫ψ'²r dr; a = 1 here.
    const f = { a: 1, n1: 1.45, NA: 0.1 };
    const lam = (2 * Math.PI * f.a * f.NA) / V;
    assertRel(petermannIIRadius(f, lam, lp01Mode(vNumber(f, lam))), Math.sqrt((2 * all) / grad), 1e-6, `w_PII at V = ${V}`);
    assertRel(coreConfinement(mode), core / all, 1e-6, `Γ at V = ${V}`);
  }
});

test("SMF-28-like fibre at 1550 nm: V, b, MFD, Γ and n_eff", () => {
  const V = vNumber(smf, lambda);
  // V = 2π · 4.1 µm · 0.1246 / 1.55 µm = 2.070857 (hand calculation).
  assertRel(V, 2.070857, 1e-6, "V");
  const mode = lp01Mode(V);
  // Rudolph–Neumann W ≈ 1.1428V − 0.996 = 1.37260 (±0.1 %, Snyder & Love) → b = W²/V² ≈ 0.4393.
  assertRel(normalizedB(mode), 0.4393, 3e-3, "b");
  // Session-18 physics review (PR #43): Marcuse-fit MFD 10.08 µm.
  assertRel(2 * modeFieldRadius(smf, lambda), 10.08e-6, 1e-3, "MFD (Marcuse fit)");
  // Petermann II is ~2 % below the Gaussian fit near V = 2 (Marcuse's fit targets the near field).
  assertRel(2 * petermannIIRadius(smf, lambda), 9.886e-6, 1e-3, "MFD (Petermann II)");
  // Core power fraction from Gloge's closed form (checked against the integrals in the test above): 76 % at
  // V = 2.07, 83 % at the LP11 cutoff.
  assertRel(coreConfinement(mode), 0.7595, 1e-3, "Γ(2.07)");
  assertRel(coreConfinement(lp01Mode(2.405)), 0.8276, 1e-3, "Γ(2.405)");
  // n_eff = n₂ + (β − kn₂)/k with δ = β − kn₂ from the microbend module.
  const n2 = Math.sqrt(smf.n1 ** 2 - smf.NA ** 2);
  const nEff = effectiveIndex(smf, lambda);
  assertRel(nEff, n2 + (claddingMismatch(smf, lambda) * lambda) / (2 * Math.PI), 1e-12, "n_eff");
  assert.ok(nEff > n2 && nEff < smf.n1);
  // Domain: NaN for an invalid fibre.
  assert.ok(Number.isNaN(petermannIIRadius({ a: 4e-6, n1: 1.45, NA: 2 }, lambda)));
});

test("Bessel zeros and the exact LP mode count", () => {
  // Abramowitz & Stegun Table 9.5.
  const table: [number, number[]][] = [
    [0, [2.404825558, 5.520078110, 8.653727913]],
    [1, [3.831705970, 7.015586670]],
    [2, [5.135622302, 8.417244140]],
    [5, [8.771483816]],
  ];
  for (const [n, zs] of table) {
    const got = besselJZeros(n, 9);
    assert.equal(got.length, zs.length, `count of J_${n} zeros below 9`);
    zs.forEach((z, i) => assert.ok(Math.abs(got[i] - z) < 1e-9, `j_${n},${i + 1}: ${got[i]}`));
  }
  // LP01 is always guided (2 modes, not ⌊V²/2⌋ = 0); LP11 appears at 2.4048 (4 more).
  assert.equal(guidedModeCount(0.5), 2);
  assert.equal(guidedModeCount(2.4048), 2);
  assert.equal(guidedModeCount(2.4049), 6);
  // V = 5: LP01, LP11, LP21, LP02 → 2 + 4 + 4 + 2 = 12 (V²/2 = 12.5).
  assert.deepEqual(guidedLpModes(5).map(({ l, m }) => `${l}${m}`).sort(), ["01", "02", "11", "21"]);
  assert.equal(guidedModeCount(5), 12);
  // Large V: within 2 % of Gloge's V²/2.
  assertRel(guidedModeCount(40), asymptoticModeCount(40), 0.02, "V = 40");
  assert.ok(Number.isNaN(guidedModeCount(41)) && Number.isNaN(guidedModeCount(0)));
});

test("weak guidance and very large V", () => {
  // V = 1 (independent evaluation by the physics review): Γ = 0.17172, w_PII/a = 3.9107.
  const m1 = lp01Mode(1);
  assertRel(coreConfinement(m1), 0.17172, 1e-4, "Γ(V = 1)");
  assertRel(petermannIIRadius({ a: 1, n1: 1.5, NA: 1 / (2 * Math.PI) }, 1, m1), 3.9107, 1e-4, "w_PII/a (V = 1)");
  // V = 800: K₀ and K₁ underflow (W ≈ 800), so the solver and the field use the scaled K. U → 2.4048(1 − 1/V);
  // w_PII/a = √2 K₁/(U K₀) with K₁/K₀ ≈ 1 + 1/(2W) − 1/(8W²) (DLMF 10.40.2).
  const m = lp01Mode(800);
  assert.ok(Number.isFinite(m.U) && m.U < 2.4048 && m.U > 2.4);
  const expected = (Math.SQRT2 / m.U) * (1 + 1 / (2 * m.W) - 1 / (8 * m.W ** 2));
  assertRel(petermannIIRadius({ a: 1, n1: 1000, NA: 800 / (2 * Math.PI) }, 1, m), expected, 1e-8, "w_PII/a (V = 800)");
  assertRel(lp01Field(m, 1 + 1e-12), lp01Field(m, 1), 1e-8, "field continuous at r = a");
  // Cladding tail K₀(Wρ)/K₀(W) ≈ e^(−W(ρ−1))/√ρ (DLMF 10.40.2).
  assertRel(lp01Field(m, 1.01), (lp01Field(m, 1) * Math.exp(-m.W * 0.01)) / Math.sqrt(1.01), 1e-5, "tail at ρ = 1.01");
});
