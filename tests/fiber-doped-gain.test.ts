import test from "node:test";
import assert from "node:assert/strict";

import {
  absorptionDbPerM, amplifier, coreOverlap, efficiencyBeyondStokes, fullInversionGainDb, intrinsicSaturationPower,
  ionDensityFromWtPpm, optimumOutputCoupler, photonEnergy, rigrodOutput, twoLevelAt, type Beam,
} from "../src/physics/fiber-optics/doped-fiber-gain";
import { lp01Mode } from "../src/physics/fiber-optics/macro-bending-loss";
import { besselJ, besselK } from "../src/physics/math";

// Two-level model: Giles & Desurvire, JLT 9, 271 (1991), doi:10.1109/50.65886, eqs. (6)–(9); closed form: Saleh et
// al., IEEE PTL 2, 714 (1990), doi:10.1109/68.60769. Rigrod, J. Appl. Phys. 36, 2487 (1965), doi:10.1063/1.1714517.
// Golden values for the old pages: PR #43 review (P_sat 0.2711 mW, L₉₀ 12.28 m, η 0.8721).

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const fiber = { N: 1e24, area: Math.PI * 2.2e-6 ** 2, tau: 10e-3 };
const edfa = (pump: number, signal: number): Beam[] => [
  { lambda: 980e-9, sigmaA: 2.5e-25, sigmaE: 0, overlap: 0.8, power: pump },
  { lambda: 1550e-9, sigmaA: 2.5e-25, sigmaE: 3.5e-25, overlap: 0.8, power: signal },
];

// Independent check: RK4 of the rate equations dP_k/dz = Γ_k(σ_ek n₂ − σ_ak n₁)NP_k with the local steady-state n₂.
function rk4(beams: Beam[], L: number, n = 20000): number[] {
  const d = (P: number[]) => {
    let num = 0;
    let den = 1 / fiber.tau;
    beams.forEach((b, k) => {
      const phi = (b.overlap * P[k]) / (photonEnergy(b.lambda) * fiber.area);
      num += b.sigmaA * phi;
      den += (b.sigmaA + b.sigmaE) * phi;
    });
    const n2 = num / den;
    return beams.map((b, k) => b.overlap * (b.sigmaE * n2 - b.sigmaA * (1 - n2)) * fiber.N * P[k]);
  };
  let P = beams.map((b) => b.power);
  const dz = L / n;
  for (let i = 0; i < n; i++) {
    const k1 = d(P);
    const k2 = d(P.map((p, j) => p + (dz / 2) * k1[j]));
    const k3 = d(P.map((p, j) => p + (dz / 2) * k2[j]));
    const k4 = d(P.map((p, j) => p + dz * k3[j]));
    P = P.map((p, j) => p + (dz / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
  }
  return P;
}

test("the closed form matches an RK4 integration of the rate equations", () => {
  for (const [pump, signal, L] of [[0.2, 1e-4, 10], [0.2, 1e-2, 20], [0.02, 1e-4, 30]]) {
    const beams = edfa(pump, signal);
    const ref = rk4(beams, L);
    const out = twoLevelAt(fiber, beams, L).powers;
    assertRel(out[0], ref[0], 1e-6, `pump out (${pump} W, ${L} m)`);
    assertRel(out[1], ref[1], 1e-6, `signal out (${pump} W, ${L} m)`);
  }
  // 200 mW at 980 nm, −10 dBm at 1550 nm, 10 m: 11.879 dB (σ 2.5/3.5, τ 10 ms; not the page's default cross-sections).
  assertRel(10 * Math.log10(amplifier(fiber, edfa(0.2, 1e-4), 10, 1).gain), 11.8792, 1e-4, "gain dB");
});

test("limits: unpumped fibre absorbs as e^(−ΓσaNL); a strong pump approaches full inversion", () => {
  // A 1 pW probe (P/P_sat ≈ 5e-9) leaves the ions in the ground state.
  const dark = amplifier(fiber, edfa(0, 1e-12), 5, 1);
  assertRel(dark.gain, Math.exp(-0.8 * 2.5e-25 * 1e24 * 5), 1e-6, "small-signal absorption");
  // σ_e = 0 at 980 nm, so n₂ → 1 and G → exp(Γσ_eNL) and NF → (1 + 2(G − 1))/G (n_sp = 1).
  const bright = amplifier(fiber, edfa(1e3, 1e-9), 5, 1);
  assertRel(10 * Math.log10(bright.gain), fullInversionGainDb(0.8, 3.5e-25, 1e24, 5), 1e-3, "full-inversion gain");
  assertRel(bright.noiseFigure, 2 - 1 / bright.gain, 1e-3, "quantum-limited NF");
  // Photons are only lost (spontaneous decay): the total output flux is below the input.
  const sol = twoLevelAt(fiber, edfa(0.2, 1e-4), 10);
  const q = (p: readonly number[]) => p[0] / photonEnergy(980e-9) + p[1] / photonEnergy(1550e-9);
  assert.ok(q(sol.powers) < q([0.2, 1e-4]));
});

test("design values of the old rare-earth pages", () => {
  // rare-earth-doped defaults: hνA/((σa + σe)τ), r 2.5 µm, σ 2.5e-25 + 6.6e-25, τ 10.2 ms, Γ = 1 → 0.2711 mW.
  assertRel(intrinsicSaturationPower(1550e-9, Math.PI * 2.5e-6 ** 2, 1, 2.5e-25, 6.6e-25, 10.2e-3), 0.2711e-3, 1e-4, "P_sat");
  // rare-earth-fiber: Γ 0.75, σa 2.5e-25, N 1e24 → 0.8143 dB/m; 90 % absorbed after 10 dB → 12.28 m (not 2.3/α_dB).
  const alpha = absorptionDbPerM(0.75, 2.5e-25, 1e24);
  assertRel(alpha, 0.8143, 1e-4, "α dB/m");
  assertRel(10 / alpha, 12.28, 1e-3, "L₉₀");
  // 1000 wt-ppm Er in silica: 1e-3 · 2201 kg/m³ · N_A / 0.167259 kg/mol.
  assertRel(ionDensityFromWtPpm(1000, 0.167259), 7.9247e24, 1e-4, "ion density");
  assert.ok(Number.isNaN(intrinsicSaturationPower(1550e-9, 0, 1, 1e-25, 1e-25, 1e-2)));
});

test("fiber laser: efficiency beyond Stokes and the Rigrod output coupler", () => {
  // η_s 80 %, 976 → 1064 nm: 0.8/(976/1064) = 0.8721 (the page multiplied them: 73 %).
  assertRel(efficiencyBeyondStokes(0.8, 976e-9, 1064e-9), 0.8721, 1e-4, "η beyond Stokes");
  // Low gain and loss: Rigrod tends to Siegman's T_opt = √(g_rt·L_i) − L_i with round-trip gain g_rt = 2g₀L
  // (g₀L 0.05, L_i 0.01 → 0.02162).
  const opt = optimumOutputCoupler(0.05, Math.exp(-0.01));
  assertRel(1 - opt.R2, Math.sqrt(2 * 0.05 * 0.01) - 0.01, 0.02, "T_opt low gain");
  // Threshold: g₀L = −ln√(R₁R₂) gives no output.
  assert.equal(rigrodOutput(-Math.log(Math.sqrt(0.9 * 0.5)), 0.9, 0.5), 0);
  // Lossless rear mirror and R₂ → 1: all the gain is extracted, P/P_sat → g₀L.
  assertRel(rigrodOutput(2, 1, 1 - 1e-9), 2, 1e-6, "lossless limit");
  assert.ok(Number.isNaN(optimumOutputCoupler(0.01, Math.exp(-0.1)).R2)); // rear loss above the gain
});

test("core overlap: Gloge's closed form against an integral of the LP01 field", () => {
  // ψ = J₀(UR)/J₀(U) in the core, K₀(WR)/K₀(W) outside (R = r/a); Γ = ∫₀¹ψ²R dR / ∫₀^∞ψ²R dR (Simpson, R ≤ 1 + 40/W).
  const simpson = (g: (x: number) => number, lo: number, hi: number, n = 4000) => {
    const dx = (hi - lo) / n;
    let s = g(lo) + g(hi);
    for (let i = 1; i < n; i++) s += g(lo + i * dx) * (i % 2 ? 4 : 2);
    return (s * dx) / 3;
  };
  for (const V of [1.2, 2.0, 2.405, 3.5]) {
    const { U, W } = lp01Mode(V);
    const inner = simpson((R) => (besselJ(0, U * R) / besselJ(0, U)) ** 2 * R, 0, 1);
    const outer = simpson((R) => (besselK(0, W * R) / besselK(0, W)) ** 2 * R, 1, 1 + 40 / W, 20000);
    // a = 1 µm and NA chosen so that V = 2π·a·NA/λ at λ = 1 µm.
    const overlap = coreOverlap({ a: 1e-6, n1: 1.45, NA: V / (2 * Math.PI) }, 1e-6);
    assertRel(overlap, inner / (inner + outer), 1e-6, `Γ at V = ${V}`);
  }
  // At the LP11 cutoff about 83 % of the power travels in the core, the commonly quoted figure.
  assertRel(coreOverlap({ a: 1e-6, n1: 1.45, NA: 2.405 / (2 * Math.PI) }, 1e-6), 0.83, 0.01, "Γ at cutoff");
  assert.ok(Number.isNaN(coreOverlap({ a: 1e-6, n1: 1.45, NA: 0.4 / (2 * Math.PI) }, 1e-6))); // V < 0.5
});

test("edge: an unlaunched pump changes nothing, and a fully absorbed signal has no noise figure", () => {
  // Yb σ in a 0.5 µm core: Γσ_aQτ/A puts the pump's exponent past e^709, where 0·∞ used to give 3e50 W out.
  const yb = { N: 3e25, area: Math.PI * 0.5e-6 ** 2, tau: 0.85e-3 };
  const signal = { lambda: 1064e-9, sigmaA: 6e-27, sigmaE: 2.5e-25, overlap: 0.8, power: 0.1 };
  const withPump = twoLevelAt(yb, [{ lambda: 976e-9, sigmaA: 2.5e-24, sigmaE: 2.5e-24, overlap: 0.8, power: 0 }, signal], 1);
  const alone = twoLevelAt(yb, [signal], 1);
  assert.equal(withPump.powers[0], 0);
  assertRel(withPump.powers[1], alone.powers[0], 1e-12, "signal with a dark pump");
  assert.ok(alone.powers[0] < 0.1 * Math.exp(0.8 * 2.5e-25 * 3e25 * 1));
  const dark = amplifier({ N: 1e26, area: fiber.area, tau: 10e-3 }, edfa(0, 1e-6), 200, 1);
  assert.ok(dark.gain < 1e-300 && Number.isNaN(dark.noiseFigure));
});

test("Rigrod at high gain: golden-section optimum against a brute-force scan", () => {
  // Single-pass 13 dB (g₀L = 2.9934 Np), 0.5 dB round-trip loss in R₁: T_opt 51.51 %, far from the low-gain rule.
  const g0L = 13 / (10 / Math.LN10);
  const R1 = 10 ** -0.05;
  let best = 0;
  let bestT = 0;
  for (let i = 1; i < 100000; i++) {
    const p = rigrodOutput(g0L, R1, 1 - i / 100000);
    if (p > best) { best = p; bestT = i / 100000; }
  }
  const opt = optimumOutputCoupler(g0L, R1);
  assert.ok(Math.abs(1 - opt.R2 - bestT) < 2e-4, `T_opt ${1 - opt.R2} vs ${bestT}`);
  assertRel(opt.output, best, 1e-8, "optimum output");
  assertRel(1 - opt.R2, 0.51506, 1e-4, "T_opt");
});
