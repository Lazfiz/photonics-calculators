import test from "node:test";
import assert from "node:assert/strict";

import { nonlinearCoefficient } from "../src/physics/fiber-optics/fiber-nonlinear";
import {
  fwmDetuning, fwmGainCoefficient, fwmIdlerPower, fwmIdlerWavelength, fwmLinearMismatch, fwmPhaseMatchedDetuning, fwmSignalGain,
} from "../src/physics/wave-optics/four-wave-mixing";
import { lockingRange } from "../src/physics/wave-optics/injection-locking";
import { slabEffectiveIndex, slabModeB, slabModeCount, slabTEConfinement, slabTEField, slabV } from "../src/physics/wave-optics/slab-waveguide";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Page defaults: HNLF, 1 W pump at 1550 nm, signal 1560 nm, n₂ 2.6e-20 m²/W, A_eff 11 µm², 500 m, β₂ −0.1 ps²/km.
const LP = 1550e-9;
const LS = 1560e-9;
const GAMMA = nonlinearCoefficient(2.6e-20, LP, 11e-12);
const BETA2 = -0.1e-27;
const L = 500;

/**
 * Independent model: RK4 of the linearized FWM equations with an undepleted pump A_p = √P e^(iγPz) (Agrawal NFO ch. 10):
 * dA_s/dz = iγ[2P A_s + P e^(i(2γP − Δβ)z) A_i*], dA_i/dz = iγ[2P A_i + P e^(i(2γP − Δβ)z) A_s*]. Returns |A_s(L)|².
 */
function rk4Gain(gammaP: number, deltaBeta: number, length: number, steps: number): number {
  type S = [number, number, number, number]; // Re A_s, Im A_s, Re A_i, Im A_i
  const f = (z: number, [sr, si, ir, ii]: S): S => {
    const th = (2 * gammaP - deltaBeta) * z;
    const er = Math.cos(th);
    const ei = Math.sin(th);
    // i·γP·(2A + E·conj(B)) for (A, B) = (s, i) and (i, s).
    const rhs = (ar: number, ai: number, br: number, bi: number): [number, number] => {
      const xr = 2 * ar + (er * br + ei * bi);
      const xi = 2 * ai + (ei * br - er * bi);
      return [-gammaP * xi, gammaP * xr];
    };
    return [...rhs(sr, si, ir, ii), ...rhs(ir, ii, sr, si)] as S;
  };
  let y: S = [1, 0, 0, 0];
  const h = length / steps;
  const add = (a: S, b: S, k: number): S => a.map((v, j) => v + k * b[j]) as S;
  for (let n = 0; n < steps; n++) {
    const z = n * h;
    const k1 = f(z, y);
    const k2 = f(z + h / 2, add(y, k1, h / 2));
    const k3 = f(z + h / 2, add(y, k2, h / 2));
    const k4 = f(z + h, add(y, k3, h));
    y = y.map((v, j) => v + (h / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j])) as S;
  }
  return y[0] * y[0] + y[1] * y[1];
}

test("FWM: idler wavelength, detuning and linear mismatch at the page defaults", () => {
  // Hand: 1/(2/1550 − 1/1560) = 1/(1.2903226e-3 − 6.4102564e-4) nm = 1540.1274 nm.
  assertRel(fwmIdlerWavelength(LP, LS), 1540.1274e-9, 1e-7, "λ_i");
  // Hand: Ω = 2πc(1/1560 − 1/1550) nm⁻¹ = 2π·299792458·(−4.1356493e6) = −7.790122e12 rad/s; Δβ = β₂Ω² = −6.068601e-3 /m.
  const om = fwmDetuning(LP, LS);
  assertRel(om, -7.790122e12, 1e-6, "Ω");
  assertRel(fwmLinearMismatch(BETA2, om), -6.068601e-3, 1e-6, "Δβ");
  // Odd orders cancel about the pump: β₄ adds β₄Ω⁴/12.
  assertRel(fwmLinearMismatch(0, 1e13, -1.2e-55), -1e-4, 1e-12, "β₄ term");
  // Edge: no idler once the signal frequency exceeds twice the pump (the old page went negative).
  assert.ok(Number.isNaN(fwmIdlerWavelength(1064e-9, 500e-9)));
});

test("FWM parametric gain (Stolen–Bjorkholm, Hansryd 2002) against RK4 of the coupled equations", () => {
  assertRel(GAMMA, 9.581397e-3, 1e-6, "γ");
  const gammaP = GAMMA * 1;
  const db = fwmLinearMismatch(BETA2, fwmDetuning(LP, LS));
  // Hand: κ = Δβ + 2γP = 0.0130942; g² = (γP)² − (κ/2)² = 9.18032e-5 − 4.28645e-5 → g = 6.99562e-3 /m;
  // G = 1 + (γP/g)² sinh²(gL) = 1 + 1.87589 · sinh²(3.49781) ≈ 512.1 (27.09 dB).
  assertRel(fwmGainCoefficient(gammaP, db), 6.99562e-3, 1e-5, "g");
  const G = fwmSignalGain(gammaP, db, L);
  assertRel(G, 512.103, 1e-5, "G_s");
  assertRel(rk4Gain(gammaP, db, L, 4000), G, 1e-6, "RK4 at the defaults");
  // Outside the gain band (normal dispersion, Δβ ≫ 4γP) the gain oscillates; RK4 agrees there too.
  assertRel(rk4Gain(gammaP, 0.2, 100, 4000), fwmSignalGain(gammaP, 0.2, 100), 1e-6, "RK4 off band");
  // Peak where κ = 0: Ω = √(2γP/|β₂|) = √1.916279e26 = 1.384297e13 rad/s, gain cosh²(γPL) = cosh²(4.790699) = 3623.66.
  const omPk = fwmPhaseMatchedDetuning(BETA2, gammaP);
  assertRel(omPk, 1.384297e13, 1e-6, "Ω_pk");
  assertRel(fwmSignalGain(gammaP, fwmLinearMismatch(BETA2, omPk), L), Math.cosh(gammaP * L) ** 2, 1e-9, "cosh²");
  assertRel(Math.cosh(gammaP * L) ** 2, 3623.66, 1e-5, "peak gain");
  // With β₄ the κ = 0 root still zeroes κ.
  const pk4 = fwmPhaseMatchedDetuning(1e-28, gammaP, -1e-55);
  assert.ok(Math.abs(fwmLinearMismatch(1e-28, pk4, -1e-55) + 2 * gammaP) < 1e-12);
  // Normal dispersion everywhere: no phase-matched detuning.
  assert.ok(Number.isNaN(fwmPhaseMatchedDetuning(1e-28, gammaP)));
});

test("FWM limits: Δβ = 0 gives 1 + (γPL)², weak pump gives (γPL)² sinc²(ΔβL/2), idler photon count", () => {
  assertRel(fwmSignalGain(0.01, 0, 100), 2, 1e-12, "1 + (γPL)², κ = 2γP");
  // Weak pump γP = 1e-6/m, Δβ 0.05/m, L 100 m: (1e-4)² · (sin 2.5/2.5)² = 1e-8 · 0.0573068 = 5.73068e-10.
  assertRel(fwmSignalGain(1e-6, 0.05, 100) - 1, 5.73068e-10, 1e-3, "low conversion");
  // P_i = (λ_s/λ_i)(G − 1)P_s: G 512.103 and 1 mW seed → (1560/1540.1274)·511.103 mW = 517.698 mW.
  assertRel(fwmIdlerPower(512.103, 1e-3, LS, 1540.1274e-9), 0.517698, 1e-5, "P_i");
  // Edge: no pump, no gain.
  assert.equal(fwmSignalGain(0, 1, 100), 1);
});

test("symmetric slab TE/TM modes (Kogelnik & Ramaswamy 1974, half-thickness V)", () => {
  // Bisection values from the part-0 audit: V = 1 → b 0.4538, V = 2.4 → 0.7913.
  assertRel(slabModeB(1, 0), 0.453753, 1e-5, "b(1)");
  assertRel(slabModeB(2.4, 0), 0.791313, 1e-5, "b(2.4)");
  // Independent residual: w = u tan u (even TE), w = −u cot u (odd TE).
  for (const [V, m] of [[3.7, 0], [3.7, 1], [7.7842, 4], [7.7842, 3]] as const) {
    const b = slabModeB(V, m);
    const u = V * Math.sqrt(1 - b);
    const w = V * Math.sqrt(b);
    const rhs = m % 2 === 0 ? u * Math.tan(u) : -u / Math.tan(u);
    assert.ok(Math.abs(rhs - w) < 1e-9 * V, `residual V ${V} m ${m}`);
  }
  // TM: u tan u = (n₁²/n₂²) w, below TE; r = 1 reproduces TE.
  const r = (1.5 / 1.45) ** 2;
  const bTM = slabModeB(1, 0, r);
  const u = Math.sqrt(1 - bTM);
  assert.ok(Math.abs(u * Math.tan(u) - r * Math.sqrt(bTM)) < 1e-12, "TM residual");
  assert.ok(bTM < slabModeB(1, 0));
  // Page defaults: n 1.5/1.45, 10 µm, 1550 nm. Hand: NA = √(2.25 − 2.1025) = 0.384057, V = π·10/1.55·NA = 7.784204.
  const V = slabV(1.5, 1.45, 10e-6, 1550e-9);
  assertRel(V, 7.784204, 1e-6, "V");
  assert.equal(slabModeCount(V), 5);
  assertRel(slabEffectiveIndex(slabModeB(V, 0), 1.5, 1.45), 1.4984289, 1e-7, "n_eff TE0");
  // Cutoff edges: TE1 appears at V = π/2; no guidance when n₁ ≤ n₂.
  assert.ok(Number.isNaN(slabModeB(Math.PI / 2, 1)));
  assert.ok(slabModeB(Math.PI / 2 + 1e-6, 1) < 1e-11);
  assert.ok(Number.isNaN(slabV(1.45, 1.5, 10e-6, 1550e-9)));
});

test("slab TE confinement: closed form against a numerical integral of E²", () => {
  for (const [V, m] of [[1, 0], [2.4, 0], [3.7, 1]] as const) {
    const b = slabModeB(V, m);
    const n = 200_000;
    const span = 1 + 40 / (V * Math.sqrt(b)); // tails out to e^(−80) in power
    let core = 0;
    let all = 0;
    for (let k = 0; k < n; k++) {
      const x = -span + ((k + 0.5) * 2 * span) / n;
      const e2 = slabTEField(x, 1, V, b, m) ** 2;
      all += e2;
      if (Math.abs(x) <= 1) core += e2;
    }
    assertRel(slabTEConfinement(V, b, m), core / all, 2e-4, `Γ V ${V} m ${m}`);
  }
});

test("injection locking range (Lang 1982, Mogensen 1985; Adler 1946 for α = 0)", () => {
  // k_c/2π 10 GHz, ρ = 0.01: upper +1 GHz, lower −1·√10 = −3.162278 GHz (part-0 audit value).
  const r = lockingRange(10, 0.01, 3);
  assertRel(r.upper, 1, 1e-12, "upper");
  assertRel(r.lower, -3.16227766, 1e-9, "lower");
  const adler = lockingRange(10, 0.01, 0);
  assert.equal(adler.lower, -adler.upper);
  // Edge: no injection, no range; invalid inputs give NaN.
  assert.equal(lockingRange(10, 0, 3).upper, 0);
  assert.ok(Number.isNaN(lockingRange(-1, 0.01, 3).upper));
});
