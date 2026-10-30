import test from "node:test";
import assert from "node:assert/strict";

import { c } from "../src/physics/constants";
import {
  SECH_FWHM_FACTOR, dispersionLength, dispersiveWaveShift, dispersiveWaveShiftNonlinear, fissionLength, fundamentalSolitonPower, nonlinearLength,
  sechPeakPower, sechT0, solitonContent, solitonOrder, solitonPeriod, solveNls,
} from "../src/physics/wave-optics/soliton";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}
const maxDiff = (a: number[], b: number[]) => a.reduce((m, x, i) => Math.max(m, Math.abs(x - b[i])), 0);

test("sech pulse: FWHM = 2 ln(1 + √2) T₀, energy 2P₀T₀ (Agrawal, Nonlinear Fiber Optics, ch. 3)", () => {
  assertRel(SECH_FWHM_FACTOR, 1.762747, 1e-6, "FWHM factor");
  // Part 0 audit: a 100 fs sech² pulse has T₀ = 56.73 fs.
  assertRel(sechT0(100e-15), 56.7296e-15, 1e-5, "T₀");
  assertRel(sechPeakPower(1e-9, 1e-12), 500, 1e-12, "P₀ = E/2T₀");
  assert.ok(Number.isNaN(sechT0(0)));
  assert.ok(Number.isNaN(sechPeakPower(-1, 1e-12)));
});

test("soliton page defaults: L_D 0.2720 m, P₁ 2828 W, N 1.330 (part 0 audit, hand calculation)", () => {
  // 100 fs FWHM, β₂ = −11.83 ps²/km, γ = 1.3 /(W km), P₀ = 5 kW.
  const t0 = sechT0(100e-15);
  const beta2 = -11.83e-27;
  const gamma = 1.3e-3;
  assertRel(dispersionLength(t0, beta2), 0.272042, 1e-5, "L_D");
  assertRel(fundamentalSolitonPower(beta2, gamma, t0), 2827.62, 1e-5, "P₁");
  assertRel(solitonOrder(5000, beta2, gamma, t0), 1.32976, 1e-5, "N");
  assertRel(nonlinearLength(gamma, 5000), 1 / 6.5, 1e-12, "L_NL");
  assertRel(solitonPeriod(t0, beta2), (Math.PI / 2) * 0.272042, 1e-5, "z₀");
  // N² = L_D/L_NL by definition.
  assertRel(solitonOrder(5000, beta2, gamma, t0) ** 2, dispersionLength(t0, beta2) / nonlinearLength(gamma, 5000), 1e-12, "N²");
  assert.equal(dispersionLength(t0, 0), Infinity);
  assert.equal(solitonOrder(0, beta2, gamma, t0), 0);
  assert.ok(Number.isNaN(fundamentalSolitonPower(beta2, 0, t0)));
});

test("supercontinuum defaults: L_D 32.18 cm, P₁ 31.07 W, N 53.3, L_fiss 0.60 cm (part 0 audit; Dudley et al. 2006)", () => {
  // 10 nJ, 100 fs sech², β₂ = −10 ps²/km, γ = 100 /(W km).
  const t0 = sechT0(100e-15);
  const peak = sechPeakPower(10e-9, t0);
  assertRel(peak, 88137.4, 1e-5, "peak power");
  assertRel(dispersionLength(t0, -1e-26), 0.321825, 1e-5, "L_D");
  assertRel(fundamentalSolitonPower(-1e-26, 0.1, t0), 31.0728, 1e-5, "P₁");
  const N = solitonOrder(peak, -1e-26, 0.1, t0);
  assertRel(N, 53.2586, 1e-5, "N");
  assertRel(fissionLength(t0, -1e-26, N), 0.321825 / 53.2586, 1e-5, "L_fiss");
  assert.ok(Number.isNaN(fissionLength(t0, -1e-26, 0)));
});

test("dispersive wave: Ω ≈ −3β₂/β₃ (Akhmediev & Karlsson 1995)", () => {
  // β₂ = −10 ps²/km, β₃ = 0.1 ps³/km: Ω = 3e14 rad/s; from a 1064 nm pump that is 909.8 nm (hand calculation).
  const shift = dispersiveWaveShift(-1e-26, 1e-40);
  assertRel(shift, 3e14, 1e-12, "Ω");
  assertRel((2 * Math.PI * c) / ((2 * Math.PI * c) / 1064e-9 + shift), 909.823e-9, 1e-5, "λ_DW");
  assert.ok(Number.isNaN(dispersiveWaveShift(-1e-26, 0)));
});

test("dispersive wave: full phase matching β₂Ω²/2 + β₃Ω³/6 = γP/2 (Akhmediev & Karlsson 1995)", () => {
  // Golden values from an independent Newton solve of the cubic (scratchpad probe, agrees to 1e-13).
  // β₂ = −10 ps²/km, β₃ = 0.1 ps³/km, γ = 0.1 /W/m, P = 88.137 kW: γP ≈ 9.8|β₂|Ω₀², so the leading order fails.
  const omega0 = (2 * Math.PI * c) / 1064e-9;
  const shift = dispersiveWaveShiftNonlinear(-1e-26, 1e-40, 0.1, 88137.1);
  assertRel(shift, 7.58992e14, 1e-5, "Ω");
  assertRel((2 * Math.PI * c) / (omega0 + shift), 744.720e-9, 1e-5, "λ_DW (leading order 909.8 nm)");
  // 835 nm PCF case (Dudley et al. 2006): β₂ = −11.83 ps²/km, β₃ = 0.081038 ps³/km, γ = 0.11 /W/m, 10 kW → 667.67 nm.
  const pcf = dispersiveWaveShiftNonlinear(-11.83e-27, 8.1038e-41, 0.11, 1e4);
  assertRel((2 * Math.PI * c) / ((2 * Math.PI * c) / 835e-9 + pcf), 667.673e-9, 1e-5, "λ_DW PCF");
  // β₃ < 0 mirrors the offset to the red side.
  assertRel(dispersiveWaveShiftNonlinear(-1e-26, -1e-40, 0.1, 88137.1), -7.58992e14, 1e-5, "Ω, β₃ < 0");
  // P → 0 recovers −3β₂/β₃; small P adds γPβ₃/(3β₂²) = 3.333e10 rad/s to first order.
  assertRel(dispersiveWaveShiftNonlinear(-1e-26, 1e-40, 0.1, 0), 3e14, 1e-12, "Ω(P = 0)");
  assertRel(dispersiveWaveShiftNonlinear(-1e-26, 1e-40, 0.1, 1) - 3e14, 3.3333e10, 1e-3, "first-order shift");
  assert.ok(Number.isNaN(dispersiveWaveShiftNonlinear(1e-26, 1e-40, 0.1, 1)), "normal dispersion");
  assert.ok(Number.isNaN(dispersiveWaveShiftNonlinear(-1e-26, 0, 0.1, 1)), "β₃ = 0");
});

test("soliton content of N sech τ: ⌊N + ½⌋ solitons, strongest amplitude 2N − 1 (Satsuma & Yajima 1974)", () => {
  assert.deepEqual(solitonContent(1), { count: 1, amplitude: 1 });
  assert.deepEqual(solitonContent(2), { count: 2, amplitude: 3 });
  const s = solitonContent(1.33);
  assert.equal(s.count, 1);
  assertRel(s.amplitude, 1.66, 1e-12, "amplitude");
  assert.deepEqual(solitonContent(0.4), { count: 0, amplitude: 0 });
  assert.ok(Number.isNaN(solitonContent(-1).count));
});

test("split-step NLS: N = 1 keeps its sech shape and energy over 20 L_D (Agrawal eq. 5.2.5)", () => {
  const r = solveNls(1, -1, 20);
  assert.ok(maxDiff(r.output, r.input) < 1e-4, `shape error ${maxDiff(r.output, r.input)}`);
  assert.ok(Math.abs(r.energyRatio - 1) < 1e-10);
  assert.ok(Math.abs(r.peak.at(-1)! - 1) < 1e-4);
  assert.equal(r.xi.at(-1), 20);
});

test("split-step NLS: N = 2 matches the exact Satsuma–Yajima breather and recovers at z₀ = (π/2) L_D", () => {
  // |u(π/4, τ)|² with u = 4[cosh 3τ + 3e^{4iξ} cosh τ] e^{iξ/2}/[cosh 4τ + 4 cosh 2τ + 3 cos 4ξ], |U|² = |u|²/4.
  const xi = Math.PI / 4;
  const r = solveNls(2, -1, xi, { step: 0.005 });
  const exact = r.tau.map((t) => {
    const re = 4 * (Math.cosh(3 * t) + 3 * Math.cos(4 * xi) * Math.cosh(t));
    const im = 12 * Math.sin(4 * xi) * Math.cosh(t);
    const d = Math.cosh(4 * t) + 4 * Math.cosh(2 * t) + 3 * Math.cos(4 * xi);
    return (re * re + im * im) / (4 * d * d);
  });
  assert.ok(maxDiff(r.output, exact) < 3e-3, `breather error ${maxDiff(r.output, exact)}`);
  assertRel(Math.max(...r.output), 4, 1e-3, "peak at z₀/2");
  const back = solveNls(2, -1, Math.PI / 2, { step: 0.005 });
  assert.ok(maxDiff(back.output, back.input) < 2e-3, `recovery error ${maxDiff(back.output, back.input)}`);
});

test("split-step NLS: N = 0 is linear dispersion, σ² = π²/12 + ξ²/3 for either sign of β₂", () => {
  // An unchirped pulse broadens as σ²(ξ) = σ₀² + ξ²⟨ω²⟩; for sech τ, σ₀² = π²/12 and ⟨ω²⟩ = 1/3.
  for (const sign of [-1, 1] as const) {
    const r = solveNls(0, sign, 5);
    assertRel(r.rmsWidth[0], Math.PI / Math.sqrt(12), 1e-9, "σ₀");
    assertRel(r.rmsWidth.at(-1)!, Math.sqrt(Math.PI ** 2 / 12 + 25 / 3), 1e-4, `σ(5), sign ${sign}`);
  }
  const zero = solveNls(1.5, -1, 0);
  assert.ok(maxDiff(zero.output, zero.input) < 1e-12);
  assert.ok(Number.isNaN(solveNls(-1, -1, 1).energyRatio));
});
