import test from "node:test";
import assert from "node:assert/strict";

import { besselJ, besselKScaled01 } from "../src/physics/math";
import {
  adiabaticityScan, coreCladdingTransitionRatio, delineationAngle, lp0Modes, taperAngle, taperRadiusAt, taperShape,
  transitionVEstimate, type ThreeLayerFibre,
} from "../src/physics/fiber-optics/fiber-taper";
import { lp01Mode, vNumber } from "../src/physics/fiber-optics/macro-bending-loss";
import { effectiveIndex } from "../src/physics/fiber-optics/step-index-modes";

const assertRel = (actual: number, expected: number, tol: number, msg: string) =>
  assert.ok(Math.abs(actual - expected) <= tol * Math.abs(expected), `${msg}: ${actual} vs ${expected}`);

// SMF-28-like step-index equivalent used across the fibre pages: a = 4.1 µm, NA 0.1246, pure-silica cladding
// n₂ = 1.444 at 1550 nm, 125 µm cladding, in air.
const lambda = 1.55e-6;
const n2 = 1.444;
const NA = 0.1246;
const n1 = Math.sqrt(n2 * n2 + NA * NA);
const smf: ThreeLayerFibre = { a: 4.1e-6, rho: 62.5e-6, n1, n2, n3: 1 };
const scaled = (t: number): ThreeLayerFibre => ({ ...smf, a: smf.a * t, rho: smf.rho * t });

test("Birks–Li constant hot zone: 125 µm, x = 5 mm, L₀ = 2 mm → 35.8 µm waist", () => {
  // Birks & Li, J. Lightwave Technol. 10, 432 (1992): r_w = r₀ e^(−x/2L₀); by hand 125·e^(−1.25) = 35.8131 µm.
  const s = taperShape({ r0: 62.5e-6, L0: 2e-3, x: 5e-3, alpha: 0 });
  assertRel(2 * s.waistRadius, 125e-6 * Math.exp(-1.25), 1e-14, "waist Ø");
  assertRel(2 * s.waistRadius * 1e6, 35.8131, 1e-5, "waist Ø µm");
  assertRel(s.waistLength, 2e-3, 1e-14, "L_w = L₀");
  assertRel(s.transitionLength, 2.5e-3, 1e-14, "z₀ = x/2");
  assertRel(s.totalLength, 7e-3, 1e-14, "L₀ + x");
});

test("Birks–Li growing hot zone (α = 0.3) and continuity at α → 0", () => {
  // r_w = r₀(1 + αx/L₀)^(−1/2α) = 62.5·1.75^(−5/3) µm; L_w = L₀ + αx = 3.5 mm; z₀ = (1 − α)x/2 = 1.75 mm.
  const p = { r0: 62.5e-6, L0: 2e-3, x: 5e-3, alpha: 0.3 };
  const s = taperShape(p);
  assertRel(s.waistRadius, 62.5e-6 * Math.pow(1.75, -5 / 3), 1e-13, "r_w");
  assertRel(s.waistLength, 3.5e-3, 1e-13, "L_w");
  assertRel(s.transitionLength, 1.75e-3, 1e-13, "z₀");
  assertRel(taperRadiusAt(p, s.transitionLength), s.waistRadius, 1e-13, "profile ends at the waist");
  assert.equal(taperRadiusAt(p, -1e-3), p.r0);
  const r0 = taperShape({ ...p, alpha: 0 }).waistRadius;
  assertRel(taperShape({ ...p, alpha: 1e-9 }).waistRadius, r0, 1e-8, "α → 0");
  assertRel(taperShape({ ...p, alpha: -1e-9 }).waistRadius, r0, 1e-8, "α → 0⁻");
});

test("Taper angle is −dr/dz of the profile; α = −0.5 gives a linear taper", () => {
  for (const alpha of [0, 0.4, -0.5]) {
    const p = { r0: 62.5e-6, L0: 3e-3, x: 4e-3, alpha }; // L₀ + αx > 0 for α = −0.5
    const z = 0.6 * taperShape(p).transitionLength;
    const h = 1e-7;
    const slope = -(taperRadiusAt(p, z + h) - taperRadiusAt(p, z - h)) / (2 * h);
    assertRel(taperAngle(p, taperRadiusAt(p, z)), slope, 1e-6, `Ω(α = ${alpha})`);
  }
  // Linear profile: Ω = r₀/(1.5 L₀) everywhere.
  const lin = { r0: 62.5e-6, L0: 3e-3, x: 4e-3, alpha: -0.5 };
  for (const r of [60e-6, 45e-6, 36e-6]) assertRel(taperAngle(lin, r), 62.5e-6 / 4.5e-3, 1e-13, "linear");
});

test("Constant hot zone conserves volume: the taper holds the glass of the original hot zone, π r₀² L₀", () => {
  // Independent check of the profile: Simpson quadrature of π r² over both transitions plus the waist.
  const p = { r0: 62.5e-6, L0: 2e-3, x: 5e-3, alpha: 0 };
  const s = taperShape(p);
  const n = 2000;
  const h = s.transitionLength / n;
  let sum = 0;
  for (let i = 0; i <= n; i++) {
    const w = i === 0 || i === n ? 1 : i % 2 ? 4 : 2;
    sum += w * Math.PI * taperRadiusAt(p, i * h) ** 2;
  }
  const volume = 2 * (sum * h) / 3 + Math.PI * s.waistRadius ** 2 * s.waistLength;
  assertRel(volume, Math.PI * p.r0 ** 2 * p.L0, 1e-10, "volume");
});

test("Three-layer LP0m solver reduces to the infinite-cladding fibre and to a bare silica rod", () => {
  // Untapered: the cladding (W·S ≈ 24) is effectively infinite, so LP01 is the ordinary step-index mode.
  const [n01] = lp0Modes(smf, lambda);
  assertRel(n01, effectiveIndex({ a: smf.a, n1, NA }, lambda), 1e-12, "full-size LP01");
  // A vanishing core leaves a silica rod (radius 10 µm) in air: scalar LP01 of a step fibre with NA = √(n₂² − 1).
  const rod = { a: 1e-9, rho: 10e-6, n1, n2, n3: 1 };
  const rodFibre = { a: 10e-6, n1: n2, NA: Math.sqrt(n2 * n2 - 1) };
  assert.ok(lp01Mode(vNumber(rodFibre, lambda)).V > 40);
  assertRel(lp0Modes(rod, lambda, 1)[0], effectiveIndex(rodFibre, lambda), 1e-9, "rod LP01");
});

test("Multimode core (62.5/125 µm, NA 0.275, 850 nm, V ≈ 63): the scan finds LP01 and LP02, not higher LP0m", () => {
  // Regression: a scan even in s put LP01 and LP02 in one step for V ≳ 30 and returned LP03/LP04 instead.
  const lam = 850e-9;
  const mmNA = 0.275;
  const mm: ThreeLayerFibre = { a: 31.25e-6, rho: 62.5e-6, n1: Math.sqrt(n2 * n2 + mmNA * mmNA), n2, n3: 1 };
  const [n01, n02] = lp0Modes(mm, lam);
  // W·(S − 1) ≈ 63, so both are ordinary step-index modes of an infinite cladding.
  assertRel(n01, effectiveIndex({ a: mm.a, n1: mm.n1, NA: mmNA }, lam), 1e-9, "LP01");
  // LP02 satisfies the step-index LP0m equation u J₁(u)/J₀(u) = w K₁(w)/K₀(w) (Snyder & Love, Table 14-6)
  // with u near the second zero of J₁ shifted down, 3.8317 < u < 5.5201.
  const k = (2 * Math.PI) / lam;
  const u = k * mm.a * Math.sqrt(mm.n1 ** 2 - n02 ** 2);
  const w = k * mm.a * Math.sqrt(n02 ** 2 - n2 ** 2);
  assert.ok(u > 3.8317 && u < 5.5201, `LP02 u = ${u}`);
  const [K0s, K1s] = besselKScaled01(w);
  assertRel((u * besselJ(1, u)) / besselJ(0, u), (w * K1s) / K0s, 1e-6, "LP02 eigenvalue equation");
});

/**
 * Independent eigenvalue: RK4 of ψ'' + ψ'/r + (k²n(r)² − β²)ψ = 0 from the axis to r = ρ, then bisection of the
 * mismatch ρψ' + w₃ρ (K₁/K₀)(w₃ρ) ψ with the outer K₀ field, near the solver's n_eff.
 */
function shootNeff(f: ThreeLayerFibre, guess: number): number {
  const k = (2 * Math.PI) / lambda;
  const mismatch = (nEff: number) => {
    const b2 = (k * nEff) ** 2;
    const q = (r: number) => (k * (r < f.a ? f.n1 : f.n2)) ** 2 - b2;
    const deriv = (r: number, y: number, dy: number) => -dy / r - q(r) * y;
    const r0 = 1e-3 * f.a;
    let y = 1 - (q(0) * r0 * r0) / 4;
    let dy = (-q(0) * r0) / 2;
    const integrate = (from: number, to: number, steps: number) => {
      const h = (to - from) / steps;
      let r = from;
      for (let i = 0; i < steps; i++) {
        const k1y = dy, k1d = deriv(r, y, dy);
        const k2y = dy + (h / 2) * k1d, k2d = deriv(r + h / 2, y + (h / 2) * k1y, dy + (h / 2) * k1d);
        const k3y = dy + (h / 2) * k2d, k3d = deriv(r + h / 2, y + (h / 2) * k2y, dy + (h / 2) * k2d);
        const k4y = dy + h * k3d, k4d = deriv(r + h, y + h * k3y, dy + h * k3d);
        y += (h / 6) * (k1y + 2 * k2y + 2 * k3y + k4y);
        dy += (h / 6) * (k1d + 2 * k2d + 2 * k3d + k4d);
        r += h;
      }
    };
    integrate(r0, f.a * (1 - 1e-12), 4000); // stop just inside the step so q(r) is the core value throughout
    integrate(f.a, f.rho, 20000);
    const w3 = Math.sqrt(b2 - (k * f.n3) ** 2);
    const [K0, K1] = besselKScaled01(w3 * f.rho);
    return f.rho * dy + w3 * f.rho * (K1 / K0) * y;
  };
  let lo = guess - 2e-7;
  let hi = guess + 2e-7;
  let fLo = mismatch(lo);
  assert.ok(fLo * mismatch(hi) < 0, "RK4 bracket");
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    const fm = mismatch(mid);
    if (fLo * fm <= 0) hi = mid;
    else {
      lo = mid;
      fLo = fm;
    }
  }
  return (lo + hi) / 2;
}

test("LP01 and LP02 agree with an RK4 shooting solution, core-guided (Ø 80 µm) and cladding-guided (Ø 30 µm)", () => {
  for (const d of [80, 30]) {
    const f = scaled(d / 125);
    const modes = lp0Modes(f, lambda, 2);
    assert.equal(modes.length, 2);
    for (const nEff of modes) assert.ok(Math.abs(shootNeff(f, nEff) - nEff) < 2e-10, `Ø ${d}: ${nEff}`);
  }
  // LP01 is above n₂ (in the core) at Ø 80 µm and below it (cladding-guided) at Ø 30 µm.
  assert.ok(lp0Modes(scaled(80 / 125), lambda)[0] > n2);
  assert.ok(lp0Modes(scaled(30 / 125), lambda)[0] < n2);
});

test("Core–cladding transition: LP01 reaches n_eff = n₂ at Ø 49.36 µm for SMF-28 in air", () => {
  const t = coreCladdingTransitionRatio(smf, lambda);
  assertRel(125 * t, 49.359, 1e-4, "transition Ø (regression; consistency below)");
  // The closed-form condition and the mode solver are separate code paths (ln-form vs I/K, J/Y bases).
  assert.ok(Math.abs(lp0Modes(scaled(t), lambda, 1)[0] - n2) < 1e-12);
  // V_cc = 0.818 against the small-V estimate √(2/(ln S + 1/4)) = 0.820 (S = 62.5/4.1).
  const V0 = ((2 * Math.PI) / lambda) * smf.a * NA;
  assertRel(V0 * t, 0.81772, 1e-4, "V_cc");
  assertRel(transitionVEstimate(62.5 / 4.1), Math.sqrt(2 / (Math.log(62.5 / 4.1) + 0.25)), 1e-15, "estimate");
  assertRel(transitionVEstimate(62.5 / 4.1), 0.81772, 0.005, "estimate near exact");
  // For a very thick cladding (S = 1e6) the exact V approaches the estimate: 2/V² = ln S + 1/4 + O(V²).
  const thick = { ...smf, rho: smf.a * 1e6 };
  const Vthick = V0 * coreCladdingTransitionRatio(thick, lambda);
  assertRel(Vthick, transitionVEstimate(1e6), 1e-3, "small-V limit");
  // A core that is already below the transition (tiny V) reports ratio 1.
  assert.equal(coreCladdingTransitionRatio({ ...smf, n1: Math.sqrt(n2 * n2 + 0.01 ** 2) }, lambda), 1);
});

test("Love delineation and adiabaticity scan", () => {
  const f = scaled(0.5);
  const [m1, m2] = lp0Modes(f, lambda, 2);
  assertRel(delineationAngle(f, lambda), (f.rho * (m1 - m2)) / lambda, 1e-14, "Ω_d = ρ(β₁ − β₂)/2π");
  // Regression values (page defaults and the Birks–Li example): worst Ω/Ω_d along the taper.
  const worst = (L0: number, x: number) => {
    const scan = adiabaticityScan({ r0: smf.rho, L0, x, alpha: 0 }, smf, lambda, 40);
    return Math.max(...scan.map((s) => s.angle / s.delineation));
  };
  assertRel(worst(5e-3, 15e-3), 0.503, 0.01, "L₀ 5 mm, x 15 mm (adiabatic)");
  assertRel(worst(2e-3, 5e-3), 1.258, 0.01, "L₀ 2 mm, x 5 mm (above the curve)");
  // No pull: one sample at r₀.
  assert.equal(adiabaticityScan({ r0: smf.rho, L0: 2e-3, x: 0, alpha: 0 }, smf, lambda).length, 1);
});

test("Domain guards", () => {
  assert.ok(Number.isNaN(taperShape({ r0: 62.5e-6, L0: 2e-3, x: 5e-3, alpha: 1 }).waistRadius));
  assert.ok(Number.isNaN(taperShape({ r0: 62.5e-6, L0: 2e-3, x: 5e-3, alpha: -0.5 }).waistRadius)); // L₀ + αx < 0
  assert.ok(Number.isNaN(taperAngle({ r0: 62.5e-6, L0: 2e-3, x: 5e-3, alpha: 0 }, 70e-6)));
  assert.deepEqual(lp0Modes({ ...smf, n3: n2 }, lambda), []); // surround as dense as the cladding
  assert.deepEqual(lp0Modes({ ...smf, rho: smf.a }, lambda), []);
  assert.ok(Number.isNaN(coreCladdingTransitionRatio({ ...smf, n1: n2 }, lambda)));
  assert.deepEqual(adiabaticityScan({ r0: 60e-6, L0: 2e-3, x: 5e-3, alpha: 0 }, smf, lambda), []); // r₀ ≠ ρ
});
