import test from "node:test";
import assert from "node:assert/strict";

import {
  BEND_C_SILICA, beatLength, bendBirefringence, crossPolarizedRatio, dgdPerLength, fibreCrosstalkDb, geometricBirefringence,
  geometricG, geometricGroupG, lengthToRatio, loopDiameterFor, loopRetardance, paddleStates, ratioFromDb, ratioToDb,
} from "../src/physics/fiber-optics/fiber-birefringence";
import { lp01Mode } from "../src/physics/fiber-optics/macro-bending-loss";
import { besselJ as J, besselK as K } from "../src/physics/math";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

/**
 * Independent check of Sakai–Kimura G(V): first-order vector perturbation of the LP01 mode of a core with boundary
 * r = ρ(1 + δ cos 2φ) (ε = 2δ). The scalar field gains δ F₁ cos 2φ, F₁ = A J₂(Ur) in the core and B K₂(Wr) outside,
 * with F₁ continuous and F₁' jumping by −V² F₀(ρ) (the thin index shell). The polarization correction
 * β_p² − β̃² = −∫ F ∂_pF ∂_p ln n² dA / ∫F² dA (Snyder & Love, Optical Waveguide Theory, ch. 13) becomes a
 * boundary integral; B = n₁Δ ε q̂/V² with q̂ = d(Q_x − Q_y)/dδ, so G = q̂/V² (ρ = 1).
 */
function perturbationG(V: number): number {
  const { U, W } = lp01Mode(V);
  const dJ = (n: number, x: number) => 0.5 * (J(n - 1, x) - J(n + 1, x));
  const dK = (n: number, x: number) => -0.5 * (K(n - 1, x) + K(n + 1, x));
  const A = (-V * V) / ((W * dK(2, W) * J(2, U)) / K(2, W) - U * dJ(2, U));
  const q = (d: number, px: boolean) => {
    const N = 2000;
    let s = 0;
    for (let i = 0; i < N; i++) {
      const ph = (2 * Math.PI * (i + 0.5)) / N;
      const c2 = Math.cos(2 * ph), s2 = Math.sin(2 * ph), co = Math.cos(ph), si = Math.sin(ph);
      const rb = 1 + d * c2, drb = -2 * d * s2;
      const F = J(0, U * rb) / J(0, U) + d * A * J(2, U * rb) * c2;
      const Fr = (-U * J(1, U * rb)) / J(0, U) + d * A * U * dJ(2, U * rb) * c2;
      const Fph = -2 * d * A * J(2, U * rb) * s2;
      const dF = px ? co * Fr - (si / rb) * Fph : si * Fr + (co / rb) * Fph;
      const df = px ? -co - (si * drb) / rb : -si + (co * drb) / rb;
      s += rb * F * dF * df;
    }
    return (-s * 2 * Math.PI) / N;
  };
  let norm = 0;
  const M = 20000, rMax = 12;
  for (let i = 0; i < M; i++) {
    const r = (rMax * (i + 0.5)) / M;
    const f = r < 1 ? J(0, U * r) / J(0, U) : K(0, W * r) / K(0, W);
    norm += 2 * Math.PI * r * f * f * (rMax / M);
  }
  const d = 1e-4;
  const Q = (dd: number) => (q(dd, true) - q(dd, false)) / norm;
  return (Q(d) - Q(-d)) / (2 * d) / (V * V);
}

test("Sakai–Kimura G(V) matches an independent first-order perturbation calculation", () => {
  for (const V of [1.5, 1.8, 2.0, 2.4]) assertRel(geometricG(V), perturbationG(V), 1e-5, `G(${V})`);
  // Values of that calculation (session 49): G peaks at ≈ 0.4895 near V = 1.8.
  assertRel(geometricG(1.8), 0.48953, 1e-4, "G(1.8)");
  assertRel(geometricG(2.4), 0.42493, 1e-4, "G(2.4)");
  assert.ok(geometricG(1.8) > geometricG(1.7) && geometricG(1.8) > geometricG(1.9), "maximum near 1.8");
  assert.ok(Number.isNaN(geometricG(0.4)), "below MIN_V");
});

test("group birefringence d(VG)/dV and its sign change near V = 2.5", () => {
  // Coarser central difference (step 0.01) of V·G: ≈ 0.2959.
  const fd = (2.01 * geometricG(2.01) - 1.99 * geometricG(1.99)) / 0.02;
  assertRel(geometricGroupG(2.0), fd, 1e-4, "d(VG)/dV at 2.0");
  assertRel(geometricGroupG(2.0), 0.2959, 1e-3, "value");
  assert.ok(geometricGroupG(2.45) > 0 && geometricGroupG(2.55) < 0, "zero crossing between 2.45 and 2.55");
  // At the domain edge (V = MIN_V = 0.5) the one-sided difference stays finite and matches the central one at
  // V = 0.50001 (the first V where it applies).
  assertRel(geometricGroupG(0.5), geometricGroupG(0.50001), 1e-3, "edge");
  assert.ok(Number.isNaN(geometricGroupG(0.49)), "below MIN_V");
});

test("geometric birefringence scales with ε Δ² (page defaults)", () => {
  // a = 4.5 µm, n₁ = 1.468, n₂ = 1.463, b/a = 0.98 at 1550 nm: V = 2π·4.5·0.121058/1.55 = 2.20828.
  const f = { a: 4.5e-6, n1: 1.468, n2: 1.463, ellipticity: 0.02 };
  const r = geometricBirefringence(f, 1550e-9);
  assertRel(r.V, 2.20828, 1e-5, "V");
  const delta = 0.005 / 1.468;
  assertRel(r.B, 0.02 * 1.468 * delta ** 2 * geometricG(r.V), 1e-12, "B = ε n₁ Δ² G");
  // By hand: Δ = 3.406e-3, G(2.2083) = 0.4545 → B = 0.02·1.468·1.1601e-5·0.4545 = 1.548e-7 (beat length 10.0 m;
  // the old page showed ≈ 45 mm because B scaled with Δ).
  assertRel(r.B, 1.548e-7, 1e-3, "B");
  assertRel(beatLength(r.B, 1550e-9), 10.01, 1e-3, "beat length");
  // Doubling Δ (n₂ = 1.458) at the same V needs a/√2 … here: same V, ×4 B up to the n₁Δ² ratio.
  const f2 = { ...f, n2: 1.458, a: (4.5e-6 * Math.sqrt(1.468 ** 2 - 1.463 ** 2)) / Math.sqrt(1.468 ** 2 - 1.458 ** 2) };
  const r2 = geometricBirefringence(f2, 1550e-9);
  assertRel(r2.V, r.V, 1e-12, "same V");
  assertRel(r2.B / r.B, 4, 1e-12, "B ∝ Δ²");
  assert.equal(geometricBirefringence({ ...f, ellipticity: 0 }, 1550e-9).B, 0);
  assert.ok(Number.isNaN(geometricBirefringence({ ...f, n2: 1.468 }, 1550e-9).B), "n₁ = n₂");
  assert.ok(geometricBirefringence({ ...f, a: 6e-6 }, 1550e-9).multimode, "V > 2.405");
  assert.equal(beatLength(0, 1550e-9), Infinity);
  assert.ok(Number.isNaN(geometricBirefringence({ a: 0.5e-6, n1: 1.301, n2: 1.3, ellipticity: 0.02 }, 2000e-9).B), "V < 0.5");
  // PANDA-like B = 3.5e-4 at 1550 nm: L_B = 4.4286 mm.
  assertRel(beatLength(3.5e-4, 1550e-9), 4.4286e-3, 1e-4, "PANDA beat length");
  // DGD per length: B_g = 1e-4 → 1e-4/c = 0.333564 ps/m.
  assertRel(dgdPerLength(1e-4), 3.33564e-13, 1e-5, "DGD");
});

test("bend birefringence and Lefèvre loop retarders", () => {
  // Ulrich et al. (1980): B = 0.133 (r/R)²; r = 62.5 µm, R = 15 mm → 2.309e-6.
  assertRel(bendBirefringence(125e-6, 0.015), 0.133 * (62.5e-6 / 0.015) ** 2, 1e-12, "B_bend");
  assertRel(bendBirefringence(125e-6, 0.015), 2.309e-6, 1e-3, "B_bend value");
  // Lefèvre (1980): 2π²·0.133·(125 µm)²/(1550 nm · 30 mm) = 0.882 rad per loop (PR #43 review value).
  assertRel(loopRetardance(125e-6, 0.03, 1550e-9), 0.88209, 1e-4, "Γ per loop");
  // Same thing from B_bend × path length: 2π B πD/λ.
  assertRel(loopRetardance(125e-6, 0.03, 1550e-9, 3), (2 * Math.PI * bendBirefringence(125e-6, 0.015) * 3 * Math.PI * 0.03) / 1550e-9, 1e-12, "3 loops");
  // λ/4 with 2 loops: D = 2·0.88209·30 mm/(π/2) = 33.70 mm.
  assertRel(loopDiameterFor(Math.PI / 2, 125e-6, 1550e-9, 2), (2 * 0.88209 * 0.03) / (Math.PI / 2), 1e-4, "D(λ/4, N = 2)");
  assert.equal(BEND_C_SILICA, 0.133);
  assert.ok(Number.isNaN(bendBirefringence(125e-6, 50e-6)), "R < d/2");
  assert.ok(Number.isNaN(loopRetardance(125e-6, 0, 1550e-9)), "D = 0");
});

test("PM fibre crosstalk: exact coupled-power solution", () => {
  // PR #43 review (Noda, Okamoto & Sasaki 1986): 30 dB in, h = 1e-6 /m, 1 km → 26.99 dB.
  const out = crossPolarizedRatio(ratioFromDb(30), 1e-6, 1000);
  assert.equal(ratioToDb(out).toFixed(2), "26.99");
  // ε₀ = 0 gives tanh(hL); hL = 1e-3 → −30.00 dB.
  assertRel(crossPolarizedRatio(0, 1e-6, 1000), Math.tanh(1e-3), 1e-12, "tanh hL");
  assertRel(fibreCrosstalkDb(1e-6, 1000), -30.0, 1e-4, "fibre crosstalk dB");
  // Independent RK4 of dPx/dz = −h(Px − Py), dPy/dz = h(Px − Py) for hL = 0.5, ε₀ = 0.01.
  const h = 5e-4, L = 1000, n = 2000, dz = L / n;
  let px = 1 / 1.01, py = 0.01 / 1.01;
  const f = (x: number, y: number) => [-h * (x - y), h * (x - y)];
  for (let i = 0; i < n; i++) {
    const k1 = f(px, py), k2 = f(px + (dz / 2) * k1[0], py + (dz / 2) * k1[1]);
    const k3 = f(px + (dz / 2) * k2[0], py + (dz / 2) * k2[1]), k4 = f(px + dz * k3[0], py + dz * k3[1]);
    px += (dz / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
    py += (dz / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
  }
  assertRel(crossPolarizedRatio(0.01, h, L), py / px, 1e-9, "RK4");
  // Limits: long fibre → equal powers (0 dB); no coupling → input ratio; perfect input, L = 0 → ∞ dB.
  assertRel(crossPolarizedRatio(1e-3, 1e-3, 1e5), 1, 1e-12, "scrambled");
  assertRel(crossPolarizedRatio(1e-3, 0, 1000), 1e-3, 1e-12, "h = 0");
  assert.equal(ratioToDb(crossPolarizedRatio(0, 1e-6, 0)), Infinity);
  // Inverse: length to fall from 30 dB to 20 dB, and back.
  const Lt = lengthToRatio(ratioFromDb(30), ratioFromDb(20), 1e-6);
  assertRel(ratioToDb(crossPolarizedRatio(ratioFromDb(30), 1e-6, Lt)), 20, 1e-9, "round trip");
  assert.equal(lengthToRatio(ratioFromDb(20), ratioFromDb(30), 1e-6), 0);
  // 30 → 20 dB at h = 1e-6: 9000.3 m (≈ (ε_t − ε₀)/h = 9000 m for small ratios); h = 0 never gets there.
  assertRel(Lt, 9000.3, 1e-4, "30 → 20 dB length");
  assert.equal(lengthToRatio(ratioFromDb(30), ratioFromDb(20), 0), Infinity);
  assert.ok(Number.isNaN(crossPolarizedRatio(-0.1, 1e-6, 1)), "ε₀ < 0");
});

test("paddle chain uses mueller.ts signs", () => {
  // λ/4 paddle with the fast axis at +45° turns horizontal light into S3 = +1 (Goldstein/Collett).
  const [, q] = paddleStates([1, 1, 0, 0], [{ retardance: Math.PI / 2, fastAxis: Math.PI / 4 }]);
  assert.ok(Math.abs(q[3] - 1) < 1e-12 && Math.abs(q[1]) < 1e-12, `λ/4: ${q}`);
  // λ/2 at 22.5° rotates horizontal to +45° (S2 = 1); λ/4–λ/2–λ/4 at 0° add to a full wave (identity).
  const [, hw] = paddleStates([1, 1, 0, 0], [{ retardance: Math.PI, fastAxis: Math.PI / 8 }]);
  assert.ok(Math.abs(hw[2] - 1) < 1e-12, `λ/2: ${hw}`);
  const s = paddleStates([1, 0.6, 0, 0.8], [Math.PI / 2, Math.PI, Math.PI / 2].map((retardance) => ({ retardance, fastAxis: 0 })));
  assert.equal(s.length, 4);
  for (let i = 0; i < 4; i++) assert.ok(Math.abs(s[3][i] - [1, 0.6, 0, 0.8][i]) < 1e-12, "full wave");
});
