import test from "node:test";
import assert from "node:assert/strict";

import { c, h, q } from "../src/physics/constants";
import { vNumber } from "../src/physics/fiber-optics/macro-bending-loss";
import { guidedModeCount } from "../src/physics/fiber-optics/step-index-modes";
import {
  differentialEfficiency, facetShare, gaussianFarField, logGainCarrierDensity, mirrorLoss, modeSpacing, radiativeShare,
  recombinationRate, slopeEfficiency, thresholdCurrent, thresholdModalGain,
} from "../src/physics/wave-optics/diode-laser";
import { fourLevelSlopeEfficiency, fourLevelThreshold, laserOutput, roundTripLoss, saturationIntensity } from "../src/physics/wave-optics/laser-resonator";
import {
  diskTemperatureRise, multipassAbsorption, pumpAbsorption, quasiThreeLevelSlope, quasiThreeLevelThreshold, thresholdInversion,
} from "../src/physics/wave-optics/quasi-three-level";
import { slabTemperatureRise, slabThermalLens, totalInternalReflection, zigzagAngle } from "../src/physics/wave-optics/slab-laser";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const deg = (rad: number) => (rad * 180) / Math.PI;

test("diode laser: part 0 audit threshold gain and differential efficiency (Coldren ch. 2)", () => {
  // Audit (session 110): L = 300 µm, cleaved facets R = 0.32, α_i = 10/cm, η_i = 0.8:
  // α_m = ln(1/0.1024)/(0.06 cm) = 37.98/cm, Γg_th = 47.98/cm, η_d = 0.8·37.98/47.98 = 0.633.
  const L = 300e-6;
  assertRel(mirrorLoss(L, 0.32, 0.32), 3798.11, 1e-5, "α_m (1/m)");
  assertRel(thresholdModalGain(1000, L, 0.32, 0.32), 4798.11, 1e-5, "Γg_th (1/m)");
  assertRel(differentialEfficiency(0.8, 1000, mirrorLoss(L, 0.32, 0.32)), 0.63327, 1e-4, "η_d");
  // Slope η_d hc/(qλ) at 980 nm: 0.63327 × 1.26514 V = 0.80118 W/A.
  assertRel(slopeEfficiency(0.63327, 980e-9), (0.63327 * h * c) / (q * 980e-9), 1e-12, "slope formula");
  assertRel(slopeEfficiency(0.63327, 980e-9), 0.80118, 1e-4, "slope (W/A)");
  // A lossless facet pair has no mirror loss.
  assert.equal(mirrorLoss(L, 1, 1), 0);
  assert.ok(Number.isNaN(mirrorLoss(L, 0, 0.32)));
});

test("diode laser: threshold carrier density and current, logarithmic gain and ABC recombination", () => {
  // Page defaults: 3 × 8 nm wells (d = 24 nm), Γ = 0.06, g₀ = 1800/cm, N_tr = 1.8e18 cm⁻³; material gain at threshold
  // 47.981/0.06 = 799.69/cm, N_th = 1.8e18·e^(799.69/1800) = 2.8068e18 cm⁻³.
  const nTh = logGainCarrierDensity(4798.11 / 0.06, 1800e2, 1.8e24);
  assertRel(nTh, 1.8e24 * Math.exp(799.685 / 1800), 1e-5, "N_th formula");
  assertRel(nTh, 2.80683e24, 1e-5, "N_th (1/m³)");
  // A = 1e8/s, B = 1e-10 cm³/s, C = 3.5e-30 cm⁶/s: R = 2.8068e26 + 7.8783e26 + 7.7397e25 = 1.14591e27 cm⁻³s⁻¹.
  assertRel(recombinationRate(nTh, 1e8, 1e-16, 3.5e-42), 1.14591e33, 1e-4, "R(N_th) (1/(m³ s))");
  // V = 3 µm × 24 nm × 300 µm = 2.16e-17 m³: I_th = qVR/η_i = 1.602177e-19·2.16e-17·1.14591e33/0.8 = 4.957 mA.
  assertRel(thresholdCurrent(2.16e-17, nTh, 1e8, 1e-16, 3.5e-42, 0.8), 4.9571e-3, 1e-4, "I_th (A)");
  // At transparency gain the density is N_tr; beyond g/g₀ = 20 the fit is refused.
  assert.equal(logGainCarrierDensity(0, 1800e2, 1.8e24), 1.8e24);
  assert.ok(Number.isNaN(logGainCarrierDensity(21 * 1800e2, 1800e2, 1.8e24)));
  // Edge: the cap g/g₀ = 3 (N = e³ N_tr = 3.615e25 m⁻³) is kept; just above it is NaN.
  assert.ok(Math.abs(logGainCarrierDensity(3 * 1800e2, 1800e2, 1.8e24) / (1.8e24 * Math.exp(3)) - 1) < 1e-12);
  assert.ok(Number.isNaN(logGainCarrierDensity(3.01 * 1800e2, 1800e2, 1.8e24)));
});

test("diode laser: sourced defaults (De Koninck et al. 2025 Table S1, Wenzel et al. 2021 Table I) and radiative share", () => {
  // g₀ 1200/cm, N_tr 1.8e18 cm⁻³, B 1e-10 cm³/s, C 3.5e-30 cm⁶/s (De Koninck, Nature 637, 63, Suppl. Table 1); A 4e8/s
  // (Wenzel, Appl. Sci. 11, 6004, Table I). N_th = 1.8e18·e^(799.686/1200) = 3.50500e18 cm⁻³.
  const nTh = logGainCarrierDensity(4798.114 / 0.06, 1200e2, 1.8e24);
  assertRel(nTh, 3.50500e24, 1e-5, "N_th (1/m³)");
  // R = 1.40200e27 + 1.22850e27 + 1.50715e26 cm⁻³s⁻¹ = 2.78122e27; I_th = qVR/η_i with V = 2.16e-17 m³: 12.0312 mA.
  assertRel(thresholdCurrent(2.16e-17, nTh, 4e8, 1e-16, 3.5e-42, 0.8), 12.0312e-3, 1e-4, "I_th (A)");
  // Radiative share 1.22850/2.78122 = 0.44172; η_i times it, 0.353, is below the 40–54 % Tsvid et al. 2008 measured at 0.98 µm.
  assertRel(radiativeShare(nTh, 4e8, 1e-16, 3.5e-42), 0.441715, 1e-4, "radiative share");
  // Hand case: A N = B N² at N = 1e24 with A 1e8, B 1e-16, C 0 → 1/2; with no recombination at all, NaN.
  assert.equal(radiativeShare(1e24, 1e8, 1e-16, 0), 0.5);
  assert.ok(Number.isNaN(radiativeShare(0, 1e8, 1e-16, 3.5e-42)));
});

test("diode laser: facet split, Gaussian far field and mode spacing", () => {
  // Equal facets share the output equally; an HR/AR pair (95 %/5 %) sends 98.8 % out of the AR facet.
  assertRel(facetShare(0.32, 0.32), 0.5, 1e-12, "equal facets");
  assertRel(facetShare(0.95, 0.05), (0.95 * Math.sqrt(0.95)) / (0.95 * Math.sqrt(0.95) + 0.05 * Math.sqrt(0.05)), 1e-12, "HR/AR");
  assertRel(facetShare(0.95, 0.05), 0.98807, 1e-4, "HR/AR share");
  assert.ok(Number.isNaN(facetShare(1, 1)));
  // w⊥ = 0.5 µm at 980 nm: θ₀ = atan(0.62389) = 0.55784 rad, FWHM √(2 ln 2) θ₀ = 37.63° (audit: 30–40° usual).
  assertRel(deg(gaussianFarField(980e-9, 0.5e-6).fwhm), 37.629, 1e-4, "θ⊥ FWHM (deg)");
  assertRel(deg(gaussianFarField(980e-9, 2e-6).fwhm), 10.438, 1e-4, "θ∥ FWHM (deg)");
  // Δλ = λ²/(2 n_g L) = (980 nm)²/(2·3.7·300 µm) = 0.43261 nm.
  assertRel(modeSpacing(980e-9, 3.7, 300e-6), 0.43261e-9, 1e-4, "Δλ (m)");
});

test("slab laser: part 0 audit bounce angle and temperature rise (Eggleston 1984)", () => {
  // Audit: t = 2 mm, L = 50 mm, 8 crossings: θ = atan(8·2/50) = 17.74°; Q = 5 W/cm³, κ = 11 W/(m K):
  // centre rise Q t²/(8κ) = 0.227 K.
  const theta = zigzagAngle(0.05, 0.002, 8);
  assertRel(deg(theta), 17.7447, 1e-5, "θ (deg)");
  assertRel(slabTemperatureRise(5e6, 0.002, 11), 0.22727, 1e-4, "ΔT centre (K)");
  // The profile is parabolic: zero at the faces, mean = 2/3 of the centre rise.
  assert.equal(slabTemperatureRise(5e6, 0.002, 11, 0.001), 0);
  const mean = Array.from({ length: 2001 }, (_, i) => slabTemperatureRise(5e6, 0.002, 11, -0.001 + i * 1e-6)).reduce((s, x) => s + x, 0) / 2001;
  assertRel(mean, (5e6 * 0.002 ** 2) / (12 * 11), 1e-3, "mean ΔT");
  // Face incidence 72.3° beats the YAG critical angle asin(1/1.82) = 33.3°; a 60° zigzag in n = 1.5 glass does not.
  assert.equal(totalInternalReflection(theta, 1.82), true);
  assert.equal(totalInternalReflection(Math.PI / 3, 1.5), false);
});

test("slab laser: page-default threshold, output and straight-through thermal lens", () => {
  // Nd:YAG σ = 2.8e-19 cm², τ = 230 µs (Koechner ch. 2). Zigzag path L/cos θ = 52.498 mm, A = W t cos θ = 1.9049e-5 m²,
  // scatter 0.002/cm: L_i = 0.0105, δ = −ln 0.9 + 2L_i = 0.12636; η_p = 0.8 at 808 nm:
  // P_th = δ h c A/(2 η_p σ τ λ_p) = 57.43 W (hand calculation).
  const theta = zigzagAngle(0.05, 0.002, 8);
  const A = 0.01 * 0.002 * Math.cos(theta);
  const Li = 0.2 * (0.05 / Math.cos(theta));
  const delta = roundTripLoss(1, 0.9, Li);
  assertRel(delta, 0.12636, 1e-4, "δ");
  assertRel(fourLevelThreshold(delta, 808e-9, 2.8e-23, 230e-6, A, 0.8), 57.429, 1e-4, "P_th (W)");
  const slope = fourLevelSlopeEfficiency(1064e-9, 808e-9, 1, 0.9, Li, A, A, 0.8);
  assertRel(slope, 0.50660, 1e-4, "slope");
  // Uniform fill: Rigrod output is linear above threshold, slope × (200 − 57.43) = 72.23 W.
  const pSat = saturationIntensity(1064e-9, 2.8e-23, 230e-6) * A;
  const g0l = (200 / 57.4286) * (delta / 2);
  assertRel(laserOutput(g0l, 1, 0.9, Li, pSat), slope * (200 - 57.4286), 1e-4, "P_out (W)");
  // Heat 0.32 × 200 W in 1 cm³: Q = 6.4e7 W/m³, κ = 14 W/(m K), dn/dT = 7.3e-6/K, L = 50 mm: f = κ/(dn/dT Q L) = 0.5993 m.
  assertRel(slabThermalLens(6.4e7, 14, 7.3e-6, 0.05), 0.59932, 1e-4, "f (m)");
  assert.equal(slabThermalLens(0, 14, 7.3e-6, 0.05), Infinity);
});

test("thin disk: part 0 audit pump absorption and temperature rise (Giesen 1994)", () => {
  // Audit: 10 at.% Yb:YAG, N = 1.38e21 cm⁻³, σ_a(940) = 0.75e-20 cm²: α = 10.35/cm; 200 µm, 16 passes,
  // unbleached: 1 − e^(−16·0.207) = 0.964.
  const N = 1.38e27;
  assertRel(pumpAbsorption(N, 0.75e-24, 0.16e-24, 0), 1035, 1e-9, "α_p (1/m)");
  assertRel(multipassAbsorption(1035, 200e-6, 16), 0.96356, 1e-4, "η_abs (16 passes)");
  // 1 kW/cm² all turned into heat through 200 µm of YAG (κ = 11): ΔT = I d/(2κ) = 90.9 K.
  assertRel(diskTemperatureRise(1e7, 1, 200e-6, 11), 90.909, 1e-4, "ΔT (K)");
  // A bleached pump (α ≤ 0) is not absorbed.
  assert.equal(multipassAbsorption(-5, 200e-6, 16), 0);
});

test("thin disk: quasi-three-level threshold and slope at the page defaults (Fan & Byer 1987)", () => {
  // Defaults: 300 K cross sections of Chanteloup et al., HPLSE 2, e35 (2014), Table 1; τ 0.951 ms (Sumida & Fan 1994);
  // κ 7 W/(m K) at 8 at.% Yb (Chénais et al. 2006, §II).
  // δ = −ln 0.97 − ln 0.99 = 0.040510; two laser passes through 200 µm, σ_e(1030) = 2.4e-20 cm², σ_a(1030) = 0.16e-20 cm²:
  // β_th = (δ/(2dN) + σ_a)/(σ_e + σ_a) = (7.3387e-26 + 1.6e-25)/2.56e-24 = 0.091167.
  const N = 1.38e27;
  const delta = -Math.log(0.97) - Math.log(0.99);
  const beta = thresholdInversion(delta, 2, 200e-6, N, 2.4e-24, 0.16e-24);
  assertRel(beta, 0.091167, 1e-4, "β_th");
  // Zero loss: the transparency inversion σ_a/(σ_a + σ_e).
  assertRel(thresholdInversion(0, 2, 200e-6, N, 2.4e-24, 0.16e-24), 0.16 / 2.56, 1e-12, "β_tr");
  // Pump bleached at β_th: α_p = N(σ_ap − β(σ_ap + σ_ep)) = 1.38e27 · 0.670656e-24 = 925.51/m (σ_ap 0.76, σ_ep 0.22 × 1e-20 cm²);
  // η_abs = 1 − e^(−16·0.185101) = 0.94826.
  const alpha = pumpAbsorption(N, 0.76e-24, 0.22e-24, beta);
  assertRel(alpha, 925.51, 1e-4, "α_p(β_th)");
  const eta = multipassAbsorption(alpha, 200e-6, 16);
  assertRel(eta, 0.94826, 1e-4, "η_abs");
  // P_th = h c N d β A/(λ_p τ η_abs), 3 mm pump spot, τ = 0.951 ms: 41.68 W (≈ 0.59 kW/cm²).
  const A = Math.PI * 1.5e-3 ** 2;
  const pTh = quasiThreeLevelThreshold(N, 200e-6, beta, A, 940e-9, 0.951e-3, eta);
  assertRel(pTh, (h * c * N * 200e-6 * beta * A) / (940e-9 * 0.951e-3 * eta), 1e-12, "P_th formula");
  assertRel(pTh, 41.679, 1e-4, "P_th (W)");
  // Slope η_abs (λ_p/λ)(−ln R)/δ = 0.94826 · 0.91262 · 0.75190 = 0.65070.
  assertRel(quasiThreeLevelSlope(eta, 940e-9, 1030e-9, 0.97, delta), 0.65070, 1e-4, "slope");
  // 200 W pump, heat fraction 1 − 940/1030 = 0.087 (lasing, Chénais Eq. V.1), κ = 7:
  // ΔT = 0.087 · (0.94826 · 200 W/7.0686e-6 m²) · 200 µm/(2 · 7) = 33.35 K.
  assertRel(diskTemperatureRise((eta * 200) / A, 0.087, 200e-6, 7), 33.346, 1e-4, "ΔT (K)");
  // No absorbed pump: no threshold.
  assert.ok(Number.isNaN(quasiThreeLevelThreshold(N, 200e-6, beta, A, 940e-9, 0.951e-3, 0)));
});

test("fiber laser: V number and mode count of the merged resonator page's fibre (Gloge 1971)", () => {
  // Audit: 10 µm core, NA 0.12 at 1064 nm: V = 2π·5 µm·0.12/1.064 µm = 3.543, LP01 + LP11 = 6 modes (multimode).
  const V = vNumber({ a: 5e-6, n1: 1.45, NA: 0.12 }, 1064e-9);
  assertRel(V, 3.54315, 1e-5, "V");
  assert.equal(guidedModeCount(V), 6);
  // NA 0.08: V = 2.362 < 2.405, single mode (2 polarizations).
  assert.equal(guidedModeCount(vNumber({ a: 5e-6, n1: 1.45, NA: 0.08 }, 1064e-9)), 2);
});
