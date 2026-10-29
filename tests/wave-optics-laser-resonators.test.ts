import test from "node:test";
import assert from "node:assert/strict";

import { c, h } from "../src/physics/constants";
import { optimumOutputCoupler, rigrodOutput } from "../src/physics/fiber-optics/doped-fiber-gain";
import { gParameter, twoMirrorMode } from "../src/physics/wave-optics/two-mirror-resonator";
import {
  flowTripletLifetime, fourLevelGain, fourLevelSlopeEfficiency, fourLevelThreshold, gaussianOverlapArea, gaussianSlopeSaturationArea,
  laserOutput, logarithmicLoss, meanSquareRadius, rigrodSlope, roundTripLoss, saturationIntensity, tripletGainFactor,
} from "../src/physics/wave-optics/laser-resonator";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Nd:YAG at 1064 nm: σ = 2.8e-19 cm², τ = 230 µs (Koechner, Solid-State Laser Engineering, ch. 2).
const SIGMA = 2.8e-23;
const TAU = 230e-6;
const ROD = Math.PI * 1.5e-3 ** 2; // 3 mm rod

test("four-level threshold: part 0 audit value and Svelto's uniform-pumping formula", () => {
  // Audit (session 110): δ = αl + ln(1/R_oc) + (1 − R_hr) = 0.001 + 0.051293 + 0.001, pumped at the laser photon
  // energy over the whole 3 mm rod: P_th = δ hν A/(2στ) = 5.46 W (the old page showed 100× that).
  const delta = 0.002 - Math.log(0.95);
  const pTh = fourLevelThreshold(delta, 1064e-9, SIGMA, TAU, ROD);
  assertRel(pTh, (delta * h * c * ROD) / (1064e-9 * 2 * SIGMA * TAU), 1e-12, "P_th formula");
  assertRel(pTh, 5.4604, 1e-4, "P_th (W)");
  // At threshold the single-pass small-signal gain equals half the round-trip loss.
  assertRel(fourLevelGain(pTh, 1064e-9, SIGMA, TAU, ROD), delta / 2, 1e-12, "g₀l at threshold");
  // Page defaults: 808 nm pump, round-trip crystal loss 2αl: δ = 0.0542938, P_th = 7.3254 W.
  const d = roundTripLoss(0.999, 0.95, 0.001);
  assertRel(d, 0.002 - Math.log(0.999 * 0.95), 1e-12, "δ");
  assertRel(fourLevelThreshold(d, 808e-9, SIGMA, TAU, ROD), 7.3254, 1e-4, "P_th at 808 nm");
});

test("saturation intensity of Nd:YAG: hc/(λστ) = 2.9 kW/cm² (Koechner)", () => {
  assertRel(saturationIntensity(1064e-9, SIGMA, TAU) / 1e7, 2.899, 1e-3, "I_sat (kW/cm²)");
});

test("Rigrod output: slope K, the T/2 low-loss form and the lossless-rear limit", () => {
  // rigrodOutput = K (g₀l + ln√(R₁R₂)) above threshold.
  const K = rigrodSlope(0.98, 0.95);
  assertRel(rigrodOutput(0.2, 0.98, 0.95), K * (0.2 + 0.5 * Math.log(0.98 * 0.95)), 1e-12, "linear in g₀l");
  // Lossless rear mirror: (√R₁ + √R₂)(1 − √R₂) = 1 − R₂, so K = 1 exactly.
  assertRel(rigrodSlope(1, 0.99), 1, 1e-12, "K at R₁ = 1");
  // Small losses: P/P_sat → (T/2)(2g₀l/δ − 1) (Siegman, Lasers, ch. 12): T = 1e-3, δᵢ = 1e-3, g₀l = 0.01.
  const T = 1e-3;
  const di = 1e-3;
  assertRel(rigrodOutput(0.01, Math.exp(-di), 1 - T), (T / 2) * ((2 * 0.01) / (T + di) - 1), 2e-3, "T/2 form");
  // laserOutput folds the single-pass internal loss into the rear mirror.
  assertRel(laserOutput(0.2, 0.99, 0.95, 0.01, 3), 3 * rigrodOutput(0.2, 0.99 * Math.exp(-0.02), 0.95), 1e-12, "laserOutput");
  assert.equal(laserOutput(0.01, 0.99, 0.95, 0.01, 3), 0); // below threshold
});

test("optimum coupling approaches T = √(2g₀L δᵢ) − δᵢ for small losses (part 0 audit: 0.0247)", () => {
  // Round-trip gain 2g₀L = 0.1, round-trip internal loss δᵢ = 0.02 (Siegman, Lasers, ch. 12).
  const lowLoss = Math.sqrt(0.1 * 0.02) - 0.02;
  assertRel(lowLoss, 0.024721, 1e-4, "low-loss T_opt");
  assertRel(1 - optimumOutputCoupler(0.05, Math.exp(-0.02)).R2, lowLoss, 0.02, "exact Rigrod optimum");
});

test("slope efficiency η_p(λ_p/λ)K matches the derivative of the output", () => {
  const lp = 808e-9;
  const pSat = saturationIntensity(1064e-9, SIGMA, TAU) * ROD;
  const out = (p: number) => laserOutput(fourLevelGain(p, lp, SIGMA, TAU, ROD), 0.999, 0.95, 0.001, pSat);
  const slope = fourLevelSlopeEfficiency(1064e-9, lp, 0.999, 0.95, 0.001, ROD, ROD);
  assertRel(slope, (out(21) - out(20)) / 1, 1e-9, "dP/dP_p");
  assertRel(slope, 0.71744, 1e-4, "slope at the solid-state defaults");
  assertRel(out(20), 9.0932, 1e-4, "solid-state default output (W)");
});

test("Gaussian overlap area and the triplet gain factor of a CW dye laser", () => {
  assertRel(gaussianOverlapArea(30e-6, 40e-6), (Math.PI * (9e-10 + 1.6e-9)) / 2, 1e-12, "π(w₀² + wₚ²)/2");
  // σ_T k_ST τ_eff/σₑ = 1e-21 × 5e6 × 0.923e-6/2e-20 = 0.2308.
  assertRel(tripletGainFactor(2e-20, 1e-21, 5e6, 0.923e-6), 1 - 0.23075, 1e-12, "factor");
  assert.equal(tripletGainFactor(2e-20, 0, 5e6, 1e-6), 1); // no triplet absorption
  // CW limit (Peterson et al. 1970): σₑ = σ_T k_ST τ_T with no flow removal → factor 0.
  assert.ok(Math.abs(tripletGainFactor(2e-20, 4e-21, 5e6, 1e-6)) < 1e-12, "σₑ = σ_T k_ST τ_T");
});

test("flow-swept triplet lifetime: closed form against the integral and its limits", () => {
  // τ_eff = (1/v)∫₀^∞ exp(−s²/c² − s/(vτ_T)) ds, c² = (w₀² + wₚ²)/2: midpoint rule against the erfcx closed form.
  const w0 = 25e-6, wp = 35e-6, v = 5, tauT = 2e-6;
  const c2 = (w0 * w0 + wp * wp) / 2;
  const n = 200000, sMax = 20 * Math.sqrt(c2);
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const s = ((i + 0.5) * sMax) / n;
    sum += Math.exp(-(s * s) / c2 - s / (v * tauT));
  }
  assertRel(flowTripletLifetime(tauT, v, w0, wp), (sum * sMax) / n / v, 1e-6, "τ_eff");
  // Fast flow: transit time √(π/8)√(w₀² + wₚ²)/v, 0.8862 wₚ/v at w₀ = wₚ (30 µm, 5 m/s → 5.3174 µs).
  assertRel(flowTripletLifetime(1, 5, 30e-6, 30e-6), (Math.sqrt(Math.PI) / 2) * 30e-6 / 5, 1e-5, "fast-flow limit");
  // Slow flow and no flow: τ_T.
  assertRel(flowTripletLifetime(250e-9, 1e-6, 30e-6, 30e-6), 250e-9, 1e-9, "slow-flow limit");
  assert.equal(flowTripletLifetime(250e-9, 0, 30e-6, 30e-6), 250e-9);
  assert.ok(Number.isNaN(flowTripletLifetime(250e-9, -1, 30e-6, 30e-6)));
});

test("Laporta–Brussard near-threshold slope overlap for Gaussian mode and pump", () => {
  // A_s/A = w₀²(w₀² + 2wₚ²)/(w₀² + wₚ²)² (Laporta & Brussard 1991; Shayeganrad 2012 eq. 12): ¾ matched, → 1 for a small
  // pump, → 2w₀²/wₚ² for a large one.
  const ratio = (w0: number, wp: number) => gaussianSlopeSaturationArea(w0, wp) / gaussianOverlapArea(w0, wp);
  assertRel(ratio(30e-6, 30e-6), 0.75, 1e-12, "matched");
  assertRel(ratio(30e-6, 30e-9), 1, 1e-5, "small pump");
  assertRel(ratio(30e-6, 30e-3), 2e-6, 1e-5, "large pump");
  // Same ratio from the overlap integrals (∫s r dV)²/(∫s² r dV), s ∝ e^(−2r²/w₀²), r ∝ e^(−2r²/wₚ²), radial midpoint rule.
  const w0 = 30e-6, wp = 45e-6, n = 20000, rMax = 8 * wp;
  let sr = 0, ssr = 0, rNorm = 0;
  for (let i = 0; i < n; i++) {
    const r = ((i + 0.5) * rMax) / n;
    const sv = Math.exp((-2 * r * r) / (w0 * w0));
    const rv = Math.exp((-2 * r * r) / (wp * wp));
    rNorm += rv * r; sr += sv * rv * r; ssr += sv * sv * rv * r;
  }
  // With s and r normalized, (∫s r)²/(∫s² r) = (Σ s r)²/(Σ r · Σ s² r): the norm of s, the radial step and 2π cancel.
  assertRel(ratio(w0, wp), (sr * sr) / (rNorm * ssr), 1e-6, "integral");
});

test("dye page defaults: sourced rhodamine 6G triplet parameters", () => {
  // σₑ(590 nm) 1.1e-16 cm² (Falkenstein et al. 1978 Fig. 6), σ_T 3.7e-17 cm² (Pavlopoulos & Golich 1988, ε_T 9.7e3 /(M cm)),
  // k_ST 3.4e6 /s and τ_T 250 ns in air-saturated ethanol (Webb et al. 1970). Jet: wₚ = w₀ = 30 µm, v = 5 m/s gives
  // c = 30 µm, x = c/(2vτ_T) = 12, τ_eff = (c√π/(2v)) erfcx(12) = 5.31736 µs × 0.046854 = 249.141 ns;
  // 3.7e-21 · 3.4e6 · 249.141e-9/1.1e-20 = 0.284927.
  assertRel(flowTripletLifetime(250e-9, 5, 30e-6, 30e-6), 249.141e-9, 1e-5, "τ_eff");
  assertRel(tripletGainFactor(1.1e-20, 3.7e-21, 3.4e6, flowTripletLifetime(250e-9, 5, 30e-6, 30e-6)), 0.715073, 1e-5, "factor");
  // Without flow, K_T = k_ST τ_T σ_T/σₑ = 0.2859, within 20 % of 0.35 ± 0.02 measured in a CW Rh6G laser
  // (Phillion, Kuizenga & Siegman, J. Chem. Phys. 61, 3828 (1974); water with Triton X-100).
  const kT = 1 - tripletGainFactor(1.1e-20, 3.7e-21, 3.4e6, 250e-9);
  assertRel(kT, 0.285909, 1e-5, "K_T");
  assert.ok(Math.abs(kT / 0.35 - 1) < 0.2, `K_T ${kT}`);
});

test("mean-square radius over the cavity: closed form against a numerical average", () => {
  const L = 0.5;
  const mode = twoMirrorMode(632.8e-9, L, gParameter(L, 1), gParameter(L, 5));
  const n = 20000;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const z = ((i + 0.5) * L) / n;
    sum += mode.w0 ** 2 * (1 + ((z - mode.z1) / mode.zR) ** 2);
  }
  assertRel(meanSquareRadius(mode.w0, mode.zR, mode.z1, L), sum / n, 1e-8, "⟨w²⟩");
  // Gas page defaults: HeNe, g₀ = 0.15 /m, I_sat = 25 W/cm², 1 % per pass → 0.9437 mW.
  const pSat = (25e4 * Math.PI * meanSquareRadius(mode.w0, mode.zR, mode.z1, L)) / 2;
  assertRel(laserOutput(0.075, 0.999, 0.99, 0.01, pSat) * 1e3, 0.94372, 1e-4, "HeNe output (mW)");
});

test("domain guards", () => {
  assert.ok(Number.isNaN(roundTripLoss(1.1, 0.9)));
  assert.ok(Number.isNaN(roundTripLoss(0.9, 0.9, -0.1)));
  assert.ok(Number.isNaN(fourLevelThreshold(0.05, 808e-9, 0, TAU, ROD)));
  assert.ok(Number.isNaN(rigrodSlope(1, 1)));
  assert.ok(Number.isNaN(tripletGainFactor(2e-20, 1e-21, 5e6, -1e-6)));
  assert.ok(Number.isNaN(gaussianSlopeSaturationArea(0, 30e-6)));
  assert.ok(Number.isNaN(meanSquareRadius(NaN, 1, 0, 1)));
});

test("logarithmicLoss: −ln(1 − f) per pass", () => {
  // Hand calculation: −ln 0.99 = 0.01005034; −ln 0.5 = ln 2.
  assertRel(logarithmicLoss(0.01), 0.01005034, 1e-6, "1 %");
  assertRel(logarithmicLoss(0.5), Math.LN2, 1e-15, "50 %");
  assert.equal(logarithmicLoss(0), 0);
  assert.ok(Number.isNaN(logarithmicLoss(1)));
  assert.ok(Number.isNaN(logarithmicLoss(-0.1)));
});
