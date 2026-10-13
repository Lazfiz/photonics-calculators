import test from "node:test";
import assert from "node:assert/strict";

import {
  averagePowerCoupling, couplingCoefficient, criticalBendRadius, evanescentIntensityRatio, hayashiPowerCoupling,
  lp01PowerBeyondPlane, pairCrosstalk, polishedCouplerPhase,
} from "../src/physics/fiber-optics/coupled-mode";
import { lp01Mode, vNumber } from "../src/physics/fiber-optics/macro-bending-loss";
import { effectiveIndex, lp01Field } from "../src/physics/fiber-optics/step-index-modes";
import { besselK } from "../src/physics/math";

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

const lambda = 1.55e-6;
// Hayashi et al. (Opt. Express 19, 16576 (2011)) style 7-core MCF: a = 4.5 µm, n₁ 1.468, n₂ 1.463, Λ = 45 µm.
const mcf = { a: 4.5e-6, n1: 1.468, NA: Math.sqrt(1.468 ** 2 - 1.463 ** 2) };
const mcfMode = lp01Mode(vNumber(mcf, lambda));
// SMF-like fibre of the PR #43 side-polished review: a = 4.1 µm, n₁ 1.4682, n₂ 1.4629 (V = 2.0715, b = 0.438).
const smf = { a: 4.1e-6, n1: 1.4682, NA: Math.sqrt(1.4682 ** 2 - 1.4629 ** 2) };
const smfMode = lp01Mode(vNumber(smf, lambda));

test("Snyder κ: MCF golden and a numerical overlap integral", () => {
  // PR #43 review: Snyder & Love closed form with U = 1.593, W = 1.529 gives κ = 4.45e-3 /m.
  assertRel(mcfMode.U, 1.593, 1e-3, "U");
  assertRel(mcfMode.W, 1.529, 1e-3, "W");
  const kappa = couplingCoefficient(mcf, lambda, 45e-6, mcfMode);
  assertRel(kappa, 4.45e-3, 2e-3, "κ");

  // Independent: κ = V²/(2 k n₁ a²) · ∫_core1 ψ₁ψ₂ dA / ∫ψ₁² dA (weak-guidance CMT, β ≈ k n₁), by 2-D quadrature
  // at a spacing (D = 3a) where the overlap is large enough to integrate accurately.
  const D = 3 * smf.a;
  const ratioD = D / smf.a;
  const overlap = simpson(
    (rho) => rho * lp01Field(smfMode, rho) *
      simpson((phi) => lp01Field(smfMode, Math.sqrt(rho * rho + ratioD * ratioD - 2 * rho * ratioD * Math.cos(phi))), 0, 2 * Math.PI, 200),
    0, 1, 200,
  );
  const norm = 2 * Math.PI * simpson((rho) => rho * lp01Field(smfMode, rho) ** 2, 0, 40, 8000);
  const k = (2 * Math.PI) / lambda;
  const numeric = ((smfMode.V ** 2 / (2 * k * smf.n1 * smf.a ** 2)) * overlap) / norm;
  assertRel(couplingCoefficient(smf, lambda, D, smfMode), numeric, 1e-6, "κ vs overlap integral");

  // κ grows with λ (the tail reaches further), opposite to the old κ ∝ 1/λ.
  assert.ok(couplingCoefficient(smf, 1.6e-6, 11e-6) > couplingCoefficient(smf, 1.5e-6, 11e-6));
  // Edge: overlapping cores (D < 2a) are outside the model. A huge W (V ≈ 1,800, where K₀ and K₁ underflow
  // separately) stays finite at D = 2a and underflows cleanly to 0 at D = 2.5a, never 0/0.
  assert.ok(Number.isNaN(couplingCoefficient(smf, lambda, 1.9 * smf.a)));
  const extreme = { a: 30e-6, n1: 4, NA: Math.sqrt(15) };
  const touching = couplingCoefficient(extreme, 400e-9, 60e-6);
  assert.ok(Number.isFinite(touching) && touching > 0, `κ at D = 2a: ${touching}`);
  assert.equal(couplingCoefficient(extreme, 400e-9, 75e-6), 0);
});

test("Inter-core crosstalk: Hayashi golden and the Koshiba average", () => {
  const kappa = couplingCoefficient(mcf, lambda, 45e-6, mcfMode);
  const beta = (2 * Math.PI * effectiveIndex(mcf, lambda, mcfMode)) / lambda;
  // Hayashi 2011: h = 2κ²R_b/(βΛ); R_b = 0.1 m, L = 10 km → XT = −38.3 dB (PR #43 review).
  const hH = hayashiPowerCoupling(kappa, beta, 45e-6, 0.1);
  assertRel(10 * Math.log10(pairCrosstalk(hH, 1e4)), -38.3, 2e-3, "XT dB");

  // Koshiba closed form against a direct θ-average of 2κ²d/(1 + d²(Δβ + B cos θ)²), B = βΛ/R_b.
  const B = (beta * 45e-6) / 0.1;
  for (const [d, deltaBeta] of [[0.002, 0], [0.002, 3000], [0.05, 0], [0.05, 1000], [0.05, 5000]]) {
    const N = 400000; // periodic trapezoid; the Lorentzian is ≥ 1/(d B) ≈ 7e-3 rad wide, ≥ 400 samples
    let sum = 0;
    for (let i = 0; i < N; i++) {
      const x = d * (deltaBeta + B * Math.cos((2 * Math.PI * i) / N));
      sum += 1 / (1 + x * x);
    }
    const numeric = (2 * kappa * kappa * d * sum) / N;
    const p = { kappa, beta, pitch: 45e-6, bendRadius: 0.1, correlationLength: d, deltaBeta };
    assertRel(averagePowerCoupling(p), numeric, 1e-6, `h̄ d=${d} Δβ=${deltaBeta}`);
    assertRel(averagePowerCoupling({ ...p, deltaBeta: -deltaBeta }), numeric, 1e-6, "h̄ even in Δβ");
  }
  // Δβ = 0, dB ≫ 1 reduces to Hayashi; heterogeneous cores bent above R_pk = βΛ/Δβ are suppressed.
  const homog = averagePowerCoupling({ kappa, beta, pitch: 45e-6, bendRadius: 0.1, correlationLength: 0.05, deltaBeta: 0 });
  assertRel(homog, hH, 1e-4, "Koshiba → Hayashi");
  assertRel(criticalBendRadius(beta, 45e-6, 5000), 0.05346, 1e-3, "R_pk");
  const hetero = averagePowerCoupling({ kappa, beta, pitch: 45e-6, bendRadius: 0.1, correlationLength: 0.05, deltaBeta: 5000 });
  assert.ok(hetero < homog / 100, `heterogeneous ${hetero}`);
  // Edge: tanh saturates at 1 (fully mixed pair), never above.
  assert.equal(pairCrosstalk(1, 1e3), 1);
});

test("Evanescent tail beyond a polished plane", () => {
  const rho = 1 + 2 / 4.1; // 2 µm of cladding left
  // Exact K₀ tail [K₀(Wρ)/K₀(W)]²; the old exp(−2γd) gave 26.2 %.
  const ratio = (besselK(0, smfMode.W * rho) / besselK(0, smfMode.W)) ** 2;
  assertRel(evanescentIntensityRatio(smfMode, rho), ratio, 1e-12, "intensity ratio");
  assertRel(ratio, 0.18336, 1e-4, "K₀ tail 2 µm");

  // Power beyond x = ρ₀a against a brute-force Cartesian integral of ψ² (ρ units; ψ² < e⁻⁴⁰ past ρ = 15).
  const total = 2 * Math.PI * simpson((r) => r * lp01Field(smfMode, r) ** 2, 0, 15, 3000);
  for (const rho0 of [1, rho, 2.5]) {
    const strip = (x: number) => 2 * simpson((y) => lp01Field(smfMode, Math.hypot(x, y)) ** 2, 0, 15, 200);
    const beyond = simpson(strip, rho0, 15, 200);
    assertRel(lp01PowerBeyondPlane(smfMode, rho0), beyond / total, 1e-4, `η(ρ₀ = ${rho0})`);
  }
  // D-shaped page defaults (a = 4.5 µm, n 1.4494/1.444, flat 8 µm from the centre, water): η = 0.251 % and
  // Δn_eff = η(n_ext² − n₂²)/(2n_eff) = −2.67e-4 (physics review, independent Bessel code in plain JS).
  const dFiber = { a: 4.5e-6, n1: 1.4494, NA: Math.sqrt(1.4494 ** 2 - 1.444 ** 2) };
  const dMode = lp01Mode(vNumber(dFiber, lambda));
  const dEta = lp01PowerBeyondPlane(dMode, 8 / 4.5);
  assertRel(dEta, 2.51e-3, 3e-3, "η D-shaped");
  assertRel((dEta * (1.333 ** 2 - 1.444 ** 2)) / (2 * effectiveIndex(dFiber, lambda, dMode)), -2.67e-4, 3e-3, "Δn_eff");
  // Edge: the plane cuts the core.
  assert.ok(Number.isNaN(lp01PowerBeyondPlane(smfMode, 0.9)));
  assert.ok(Number.isNaN(evanescentIntensityRatio(smfMode, 0.9)));
});

test("Polished coupler: accumulated coupling tends to Digonnet–Shaw κ₀√(πaR/W)", () => {
  const R = 0.25;
  // Wide spacing (W D₀/a = 40): the √D prefactor of K₀ hardly changes over the interaction length.
  const D0 = (40 * smf.a) / smfMode.W;
  const phi = polishedCouplerPhase(smf, lambda, D0, R, smfMode);
  const kappa0 = couplingCoefficient(smf, lambda, D0, smfMode);
  const ds = kappa0 * Math.sqrt((Math.PI * smf.a * R) / smfMode.W);
  assert.ok(phi < ds && phi / ds > 0.99, `Φ ${phi} vs ${ds}`);
  // With 2 µm of cladding left on each fibre the √D factor shortens L_eff by ≈ 5 %.
  const D = 2 * (smf.a + 2e-6);
  const ratio = polishedCouplerPhase(smf, lambda, D, R, smfMode) / couplingCoefficient(smf, lambda, D, smfMode);
  assertRel(ratio / Math.sqrt((Math.PI * smf.a * R) / smfMode.W), 0.9526, 2e-3, "L_eff / Digonnet–Shaw");
  assert.ok(Number.isNaN(polishedCouplerPhase(smf, lambda, D, 0, smfMode)));
});
