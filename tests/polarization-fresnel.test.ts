import test from "node:test";
import assert from "node:assert/strict";

import { brewsterAngle, criticalAngle, fresnel, phaseDifference, phaseOf } from "../src/physics/polarization/fresnel";
import { tirPhaseDifference } from "../src/physics/polarization/retarders";
import { pseudoOpticalConstants } from "../src/physics/thin-film/ellipsometry";
import { stackResponse } from "../src/physics/thin-film/transfer-matrix";

const deg = Math.PI / 180;

function assertAbs(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual - expected) <= tol, `${label}: ${actual} vs ${expected}`);
}

test("air → glass n = 1.5: normal incidence r_s = −0.2, r_p = +0.2 (Hecht eqs. 4.42–4.43), R = 4 %", () => {
  const f = fresnel(1, 1.5, 0);
  assertAbs(f.rs.re, -0.2, 1e-15, "r_s");
  assertAbs(f.rp.re, 0.2, 1e-15, "r_p");
  assertAbs(f.Rs, 0.04, 1e-15, "R_s");
  assertAbs(f.Ts, 0.96, 1e-15, "T_s");
  assertAbs(f.ts.re, 0.8, 1e-15, "t_s = 2/(1 + n)");
  assertAbs(phaseDifference(f.rp, f.rs), Math.PI, 1e-15, "Δ = 180° at normal incidence");
});

test("air → glass n = 1.5 at 45°: r_s = −sin(θ₁ − θ₂)/sin(θ₁ + θ₂), r_p = tan(θ₁ − θ₂)/tan(θ₁ + θ₂) (Born & Wolf §1.5.2)", () => {
  const t1 = 45 * deg, t2 = Math.asin(Math.sin(t1) / 1.5);
  const f = fresnel(1, 1.5, t1);
  assertAbs(f.rs.re, -Math.sin(t1 - t2) / Math.sin(t1 + t2), 1e-15, "r_s");
  assertAbs(f.rp.re, Math.tan(t1 - t2) / Math.tan(t1 + t2), 1e-15, "r_p");
  // Hand values: R_s = 0.092013, R_p = R_s cos²(θ₁ + θ₂)/cos²(θ₁ − θ₂) = 0.0084665.
  assertAbs(f.Rs, 0.092013, 1e-6, "R_s");
  assertAbs(f.Rp, 0.0084665, 1e-7, "R_p");
  assertAbs(f.Rs + f.Ts, 1, 1e-14, "s energy");
  assertAbs(f.Rp + f.Tp, 1, 1e-14, "p energy");
  assertAbs(f.thetaT, t2, 1e-15, "θ₂");
});

test("Brewster angle atan(1.5) = 56.31°: R_p = 0, r_s = −(n² − 1)/(n² + 1)", () => {
  const b = brewsterAngle(1, 1.5);
  assertAbs(b / deg, 56.30993, 1e-5, "θ_B");
  const f = fresnel(1, 1.5, b);
  assertAbs(f.Rp, 0, 1e-30, "R_p");
  assertAbs(f.rs.re, -1.25 / 3.25, 1e-15, "r_s");
});

test("glass 1.5 → air at 30° (below θ_c): t_p = 2n₁cos θ₁/(n₂cos θ₁ + n₁cos θ₂) (Hecht eq. 4.43), R + T = 1", () => {
  const t1 = 30 * deg, t2 = Math.asin(1.5 * Math.sin(t1));
  const f = fresnel(1.5, 1, t1);
  assertAbs(f.tp.re, (2 * 1.5 * Math.cos(t1)) / (Math.cos(t1) + 1.5 * Math.cos(t2)), 1e-15, "t_p");
  assertAbs(f.ts.re, (2 * 1.5 * Math.cos(t1)) / (1.5 * Math.cos(t1) + Math.cos(t2)), 1e-15, "t_s");
  assertAbs(f.Rp + f.Tp, 1, 1e-14, "p energy");
  assertAbs(f.Rs + f.Ts, 1, 1e-14, "s energy");
});

test("total internal reflection, glass 1.5 → air at 45°: |r| = 1, T = 0, phases from Born & Wolf §1.5.4", () => {
  const f = fresnel(1.5, 1, 45 * deg);
  assert.equal(f.tir, true);
  assert.ok(Number.isNaN(f.thetaT));
  assertAbs(f.Rs, 1, 1e-15, "R_s");
  assertAbs(f.Rp, 1, 1e-15, "R_p");
  assertAbs(f.Ts, 0, 1e-15, "T_s");
  assertAbs(f.Tp, 0, 1e-15, "T_p");
  // tan(δ_s/2) = √(sin²θ − n²)/cos θ = 1/3, tan(δ_p/2) = √(sin²θ − n²)/(n² cos θ) = 3/4 (n = 1/1.5).
  assertAbs(phaseOf(f.rs), 2 * Math.atan(1 / 3), 1e-14, "δ_s (advance, e^{iωt})");
  assertAbs(phaseOf(f.rp), 2 * Math.atan(3 / 4), 1e-14, "δ_p");
  assertAbs(phaseDifference(f.rp, f.rs), tirPhaseDifference(1.5, 45 * deg), 1e-14, "δ = δ_p − δ_s");
  // Edge: δ = 0 at the critical angle, so the phase difference is continuous from partial to total reflection.
  const c = criticalAngle(1.5, 1);
  assertAbs(c / deg, 41.81031, 1e-5, "θ_c");
  assertAbs(phaseDifference(fresnel(1.5, 1, c + 1e-9).rp, fresnel(1.5, 1, c + 1e-9).rs), 0, 1e-3, "δ just above θ_c");
  assertAbs(phaseDifference(fresnel(1.5, 1, c - 1e-6).rp, fresnel(1.5, 1, c - 1e-6).rs), 0, 1e-12, "δ just below θ_c");
  assert.ok(Number.isNaN(criticalAngle(1, 1.5)));
});

test("absorbing medium: normal-incidence R = ((n − 1)² + κ²)/((n + 1)² + κ²), and R + T = 1 at 60°", () => {
  const f = fresnel(1, 1.2, 0, 7);
  assertAbs(f.Rs, (0.04 + 49) / (4.84 + 49), 1e-14, "R");
  const g = fresnel(1, 1.2, 60 * deg, 7);
  assertAbs(g.Rs + g.Ts, 1, 1e-13, "s energy");
  assertAbs(g.Rp + g.Tp, 1, 1e-13, "p energy");
  assert.ok(Number.isNaN(g.thetaT));
});

test("conventions agree with the other modules: ellipsometry inverts ρ = r_p/r_s; transfer matrix gives the same R", () => {
  // Nebraska convention (N = n − ik): inverting tan Ψ e^{iΔ} recovers the substrate's n and k.
  const N = { n: 3.88, k: 0.02 }, theta = 70 * deg;
  const f = fresnel(1, N.n, theta, N.k);
  const psi = Math.atan(Math.sqrt(f.Rp / f.Rs));
  const delta = phaseDifference(f.rp, f.rs);
  const back = pseudoOpticalConstants(psi, delta, theta);
  assertAbs(back.n, N.n, 1e-10, "n");
  assertAbs(back.k, N.k, 1e-10, "k");
  // A bare substrate in the transfer-matrix module (κ is the same magnitude in either time convention).
  for (const pol of ["s", "p"] as const) {
    const tm = stackResponse({ incident: 1, layers: [], substrate: N }, 600e-9, theta, pol);
    assertAbs(pol === "s" ? f.Rs : f.Rp, tm.R, 1e-13, `R_${pol}`);
  }
});

test("invalid input gives NaN", () => {
  assert.ok(Number.isNaN(fresnel(1, 1.5, Math.PI / 2).Rs));
  assert.ok(Number.isNaN(fresnel(0, 1.5, 0).Rs));
  assert.ok(Number.isNaN(fresnel(1, 1.5, 0, -1).Rs));
});
