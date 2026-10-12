import test from "node:test";
import assert from "node:assert/strict";

import {
  SBS_POLARIZATION_FACTOR, SRS_POLARIZATION_FACTOR, alphaFromDbPerKm, brillouinShift, effectiveLength,
  fwmEfficiency, fwmPhaseMismatch, fwmProductRatio, nonlinearCoefficient, nonlinearPhase, ramanGainAt,
  ramanOnOffGain, sbsLinewidthFactor, sbsThreshold, spmRmsBroadening, srsThreshold, stokesWavelength, xpmPhaseMax,
} from "../src/physics/fiber-optics/fiber-nonlinear";
import { beta2FromD } from "../src/physics/fiber-optics/chromatic-dispersion";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// 0.2 dB/km: α = 0.2/(10 log₁₀ e)/1000 = 4.60517e-5 1/m.
const ALPHA = alphaFromDbPerKm(0.2);

test("effective length: hand values and the α → 0 limit", () => {
  assertRel(ALPHA, 4.605170186e-5, 1e-9, "α");
  // Hand: (1 − e^(−0.460517))/4.60517e-5 = 0.369043/4.60517e-5 = 8013.66 m; 80 km → 21169.3 m.
  assertRel(effectiveLength(ALPHA, 10e3), 8013.66, 1e-6, "L_eff 10 km");
  assertRel(effectiveLength(ALPHA, 80e3), 21169.27, 1e-6, "L_eff 80 km");
  // Lossless fibre: L_eff = L (the old pages gave NaN), and the limit is continuous.
  assert.equal(effectiveLength(0, 10e3), 10e3);
  assertRel(effectiveLength(1e-15, 10e3), 10e3, 1e-10, "α → 0");
  assert.ok(Number.isNaN(effectiveLength(-1e-5, 10e3)));
});

test("γ = 2πn₂/(λA_eff) ≈ 1.32 /(W·km) for SMF at 1550 nm", () => {
  // Hand: 2π·2.6e-20/(1550e-9·80e-12) = 1.63363e-19/1.24e-16 = 1.31744e-3 /(W·m). Agrawal NFO §2.3 quotes ≈ 1.3.
  assertRel(nonlinearCoefficient(2.6e-20, 1550e-9, 80e-12), 1.317442e-3, 1e-6, "γ");
  assert.ok(Number.isNaN(nonlinearCoefficient(2.6e-20, 1550e-9, 0)));
});

test("Smith SBS threshold: 4.193 mW co-polarized for 80 µm², g_B 5e-11 m/W, 10 km, 0.2 dB/km", () => {
  // Smith 1972 (doi:10.1364/AO.11.002489): P = 21 A_eff/(g_B L_eff) = 21·80e-12/(5e-11·8013.66) = 4.1928 mW.
  const Leff = effectiveLength(ALPHA, 10e3);
  const co = sbsThreshold({ Aeff: 80e-12, gB: 5e-11, Leff });
  assertRel(co, 4.19284e-3, 1e-5, "co-polarized");
  // Linear linewidth factor 1 + 1/35 = 1.028571 (1 MHz source, 35 MHz Brillouin bandwidth).
  assertRel(sbsLinewidthFactor(1e6, 35e6), 36 / 35, 1e-12, "linewidth factor");
  assertRel(sbsThreshold({ Aeff: 80e-12, gB: 5e-11, Leff, sourceLinewidth: 1e6, brillouinLinewidth: 35e6 }),
    4.19284e-3 * (36 / 35), 1e-5, "with linewidth");
  // van Deventer & Boot 1994: standard fibre K = 1.5, scrambled K = 2.
  assertRel(sbsThreshold({ Aeff: 80e-12, gB: 5e-11, Leff, K: SBS_POLARIZATION_FACTOR.randomBirefringence }), 6.28926e-3, 1e-5, "K 1.5");
  assertRel(sbsThreshold({ Aeff: 80e-12, gB: 5e-11, Leff, K: SBS_POLARIZATION_FACTOR.scrambled }), 2 * co, 1e-12, "K 2");
  // Lossless 10 km: L_eff = L, P = 21·80e-12/(5e-11·1e4) = 3.36 mW (finite, not NaN).
  assertRel(sbsThreshold({ Aeff: 80e-12, gB: 5e-11, Leff: effectiveLength(0, 10e3) }), 3.36e-3, 1e-12, "α = 0");
  assert.ok(Number.isNaN(sbsThreshold({ Aeff: 80e-12, gB: 5e-11, Leff, sourceLinewidth: 1e6 })), "linewidth needs Δν_B");
  assert.ok(Number.isNaN(sbsLinewidthFactor(-1, 35e6)), "negative linewidth");
  // Agrawal NFO §9.2.1 example: A_eff 50 µm², L_eff 20 km, g_B 5e-11 m/W → P_th ≈ 1 mW (21·50e-12/(5e-11·2e4) = 1.05 mW).
  assertRel(sbsThreshold({ Aeff: 50e-12, gB: 5e-11, Leff: 20e3 }), 1.05e-3, 1e-12, "Agrawal example");
});

test("Smith SRS threshold: 1.5973 W co-polarized, Stokes at 1663.5 nm", () => {
  // P = 16·80e-12/(1e-13·8013.66) = 1.59727 W; ×2 in non-PM fibre (Agrawal NFO §8.1).
  const Leff = effectiveLength(ALPHA, 10e3);
  assertRel(srsThreshold(80e-12, 1e-13, Leff), 1.597273, 1e-6, "co-polarized");
  assertRel(srsThreshold(80e-12, 1e-13, Leff, SRS_POLARIZATION_FACTOR.standard), 3.194545, 1e-6, "standard fibre");
  // 1/λ_s = 1/1550 nm − 13.2 THz/c = 645161.3 − 44030.5 = 601130.8 1/m → 1663.53 nm.
  assertRel(stokesWavelength(1550e-9, 13.2e12), 1663.531e-9, 1e-6, "λ_s");
  assert.ok(Number.isNaN(stokesWavelength(1550e-9, 1e15)), "Stokes frequency ≤ 0");
  // g_R ∝ 1/λ_p: 1e-13·(1/1.55) = 6.4516e-14 m/W.
  assertRel(ramanGainAt(1550e-9), 6.4516129e-14, 1e-7, "g_R(1550)");
  // On-off gain at the co-polarized threshold: exp(16) = 8.886e6 (Smith's definition of the critical power).
  assertRel(ramanOnOffGain(1e-13, srsThreshold(80e-12, 1e-13, Leff), Leff, 80e-12), Math.exp(16), 1e-12, "G at P_th");
});

test("Brillouin shift ≈ 11.1 GHz at 1550 nm (Agrawal NFO §9.1)", () => {
  // 2·1.45·5960/1550e-9 = 11.151 GHz.
  assertRel(brillouinShift(1550e-9), 11.15097e9, 1e-6, "ν_B");
});

test("SPM: φ_NL, XPM bound and the Gaussian rms broadening against a numerical moment integral", () => {
  const g = nonlinearCoefficient(2.6e-20, 1550e-9, 80e-12);
  const phi = nonlinearPhase(g, 10e-3, effectiveLength(ALPHA, 80e3));
  // 1.317442e-3 · 0.01 · 21169.27 = 0.278893 rad.
  assertRel(phi, 0.278893, 1e-5, "φ_NL");
  assertRel(xpmPhaseMax(g, 10e-3, effectiveLength(ALPHA, 80e3), 3), 6 * phi, 1e-12, "XPM 3 neighbours");
  // Independent: ⟨ω²⟩ = ∫|dA/dT|² / ∫|A|² for A = e^(−T²/2) e^(iφ e^(−T²)) (T₀ = 1, unchirped Δω₀² = 1/2),
  // by finite differences and the trapezoid rule on [−10, 10].
  for (const phiMax of [0.5, 1.5 * Math.PI]) {
    const N = 40000;
    const h = 20 / N;
    let num = 0;
    let den = 0;
    for (let i = 0; i <= N; i++) {
      const T = -10 + i * h;
      const amp = (t: number) => Math.exp(-t * t / 2);
      const ph = (t: number) => phiMax * Math.exp(-t * t);
      const dRe = (amp(T + h) * Math.cos(ph(T + h)) - amp(T - h) * Math.cos(ph(T - h))) / (2 * h);
      const dIm = (amp(T + h) * Math.sin(ph(T + h)) - amp(T - h) * Math.sin(ph(T - h))) / (2 * h);
      const w = i === 0 || i === N ? 0.5 : 1;
      num += w * (dRe * dRe + dIm * dIm);
      den += w * amp(T) ** 2;
    }
    assertRel(spmRmsBroadening(phiMax), Math.sqrt(num / den / 0.5), 1e-6, `rms broadening φ ${phiMax}`);
  }
  assert.equal(spmRmsBroadening(0), 1);
});

test("FWM phase mismatch agrees with the Taylor-expanded propagation constant", () => {
  // Independent: Δβ = β(ω_i) + β(ω_j) − β(ω_k) − β(ω_i + ω_j − ω_k) with β(x) = β₂x²/2 + β₃x³/6 about ω_k.
  const beta2 = -21.7e-27;
  const beta3 = 0.127e-39;
  const beta = (x: number) => (beta2 * x * x) / 2 + (beta3 * x ** 3) / 6;
  const fi = 200e9, fj = -100e9; // offsets from f_k, Hz
  const [a, b] = [2 * Math.PI * fi, 2 * Math.PI * fj];
  const direct = beta(a) + beta(b) - beta(0) - beta(a + b);
  assertRel(fwmPhaseMismatch(beta2, fi, fj, beta3), direct, 1e-9, "Δβ");
});

test("Inoue FWM efficiency: closed form against the field integral, and its limits", () => {
  // Independent: η = |∫₀ᴸ e^((−α + iΔβ)z) dz|²/L_eff² by Simpson's rule (Inoue 1992, doi:10.1109/50.184893).
  const L = 80e3;
  const Leff = effectiveLength(ALPHA, L);
  for (const db of [0, 2e-4, 1e-3, 8.56e-3]) {
    const N = 200000;
    const h = L / N;
    let re = 0;
    let im = 0;
    for (let i = 0; i <= N; i++) {
      const z = i * h;
      const w = i === 0 || i === N ? 1 : i % 2 ? 4 : 2;
      re += w * Math.exp(-ALPHA * z) * Math.cos(db * z);
      im += w * Math.exp(-ALPHA * z) * Math.sin(db * z);
    }
    const eta = ((re * h) / 3) ** 2 / Leff ** 2 + ((im * h) / 3) ** 2 / Leff ** 2;
    assertRel(fwmEfficiency(ALPHA, L, db), eta, 1e-6, `η at Δβ ${db}`);
  }
  // Golden: SMF D 17 ps/(nm·km) at 1550 nm, 100 GHz spacing → β₂ = −21.683 ps²/km, Δβ = β₂(2π·1e11)² = 8.560e-3 1/m,
  // η ≈ α²/Δβ² = (4.605e-5/8.560e-3)² = 2.894e-5 (the oscillating term adds 0.02 %).
  const db = fwmPhaseMismatch(beta2FromD(17e-6, 1550e-9), 100e9, 100e9);
  assertRel(Math.abs(db), 8.55996e-3, 1e-5, "Δβ 100 GHz");
  assertRel(fwmEfficiency(ALPHA, L, db), 2.8946e-5, 1e-4, "η 100 GHz");
  // Lossless limit: sinc²(ΔβL/2), continuous with α → 0.
  assertRel(fwmEfficiency(0, 10e3, 2e-4), (Math.sin(1) / 1) ** 2, 1e-12, "α = 0");
  assertRel(fwmEfficiency(1e-14, 10e3, 2e-4), (Math.sin(1) / 1) ** 2, 1e-6, "α → 0");
  // Product power: degenerate η(γPL_eff)², non-degenerate 4× (degeneracy 6 vs 3).
  assertRel(fwmProductRatio(0.5, 0.2, true), 0.02, 1e-12, "degenerate");
  assertRel(fwmProductRatio(0.5, 0.2, false), 0.08, 1e-12, "non-degenerate");
});
