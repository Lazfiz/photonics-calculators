import test from "node:test";
import assert from "node:assert/strict";

import {
  VARSHNI,
  darkCurrentRatio,
  doublingLawRatio,
  localDoublingTemperature,
  varshniBandGap,
} from "../src/physics/detectors/dark-current";
import { lockinSnrGain, lowPassEnbw, lowPassMagnitude } from "../src/physics/detectors/lockin";
import { gateNoiseBandwidth, gateNoiseRms, gaussianGateAverage, optimalGateWidthRatio } from "../src/physics/detectors/boxcar";

const close = (actual: number, expected: number, rel: number, msg = "") =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${msg} ${actual} vs ${expected}`);

const T25 = 298.15;

test("doubling law: 0.1 e⁻/s at 25 °C, T_d = 6 K → 5.3948e-7 e⁻/s at −80 °C (dark-current page defaults)", () => {
  // Hand calculation: 2^(−105/6) = 2^(−17.5) = 1/185363.8.
  close(0.1 * doublingLawRatio(T25 - 105, T25, 6), 5.39480e-7, 1e-5);
  assert.equal(doublingLawRatio(T25, T25, 6), 1);
  assert.ok(Number.isNaN(doublingLawRatio(300, T25, 0)));
});

test("Varshni E_g(300 K): Si 1.12452 eV, Ge 0.66339 eV (Sze 1981 coefficients)", () => {
  // Hand: Si 1.17 − 4.73e-4·9e4/936 = 1.124519; Ge 0.7437 − 4.774e-4·9e4/535 = 0.663390. Sze quotes 1.12 and 0.66 eV.
  close(varshniBandGap(300, VARSHNI.si), 1.124519, 1e-6);
  close(varshniBandGap(300, VARSHNI.ge), 0.663390, 1e-6);
  assert.equal(varshniBandGap(0, VARSHNI.si), 1.17);
  assert.ok(Number.isNaN(varshniBandGap(-1, VARSHNI.si)));
});

test("cooling 25 → −40 °C: Si generation ×629.8, InGaAs diffusion ×7158 (fixed gap), Si Varshni ×949.9", () => {
  // Hand: (233.15/298.15)^1.5 = 0.69151; E_g/2k·(1/233.15 − 1/298.15) = 6.0767 for 1.12 eV → e^6.0767/0.69151 = 629.8.
  // InGaAs 0.75 eV, n_i²: 0.47818 and e^8.1383 → 7158. Varshni: E_g = 1.140417 / 1.124989 eV, exponent difference
  // 28.3810 − 21.8935 = 6.4875 → 656.9/0.69151 = 949.9.
  close(1 / darkCurrentRatio(233.15, T25, 1.12, "generation"), 629.82, 1e-4);
  close(1 / darkCurrentRatio(233.15, T25, 0.75, "diffusion"), 7158.1, 1e-4);
  const si = VARSHNI.si;
  close(1 / darkCurrentRatio(233.15, T25, varshniBandGap(233.15, si), "generation", varshniBandGap(T25, si)), 949.9, 2e-4);
  // dark-noise-temperature defaults: 0.5 nA at 25 °C → 7.9387e-4 nA at −40 °C
  close(0.5 * darkCurrentRatio(233.15, T25, 1.12, "generation"), 7.9387e-4, 1e-4);
});

test("local doubling temperature at 25 °C: Si 8.871 K (fixed 1.12 eV) and 8.311 K (Varshni); diffusion halves it", () => {
  // Hand: ln2 / [1.5/T + E_a/(2k_B T²)], E_a = 1.12 eV → 8.871 K; Varshni E_a = E_g(0) + αβT²/(T+β)² = 1.200644 eV → 8.311 K.
  close(localDoublingTemperature(T25, 1.12, "generation"), 8.8711, 1e-4);
  close(localDoublingTemperature(T25, VARSHNI.si, "generation"), 8.3112, 1e-4);
  close(localDoublingTemperature(T25, 1.12, "diffusion"), 8.8711 / 2, 1e-4);
  // the doubling law with this T_d reproduces the n_i scaling over ±1 K to 3e-4 (curvature of ln I_d)
  close(doublingLawRatio(T25 + 1, T25, localDoublingTemperature(T25, 1.12, "generation")), darkCurrentRatio(T25 + 1, T25, 1.12, "generation"), 3e-4);
});

test("lock-in ENBW: RC cascade 1/4τ, 1/8τ, 3/32τ, 5/64τ; Butterworth (1/4Nτ)/sin(π/2N) (Scofield 1994, SR830 manual)", () => {
  const rc = [1 / 4, 1 / 8, 3 / 32, 5 / 64];
  rc.forEach((v, i) => close(lowPassEnbw(1, i + 1, "rc"), v, 1e-12, `rc N=${i + 1}`));
  close(lowPassEnbw(1, 2, "butterworth"), 0.1767767, 1e-6);
  close(lowPassEnbw(1, 3, "butterworth"), 1 / 6, 1e-12);
  close(lowPassEnbw(0.1, 1, "butterworth"), 2.5, 1e-12);
  // −3 dB at 1/(2πτ) for the RC stage and the Butterworth corner
  close(lowPassMagnitude(1 / (2 * Math.PI), 1, 1, "rc"), Math.SQRT1_2, 1e-12);
  close(lowPassMagnitude(1 / (2 * Math.PI), 1, 4, "butterworth"), Math.SQRT1_2, 1e-12);
  assert.ok(Number.isNaN(lowPassEnbw(1, 0, "rc")));
  assert.ok(Number.isNaN(lowPassEnbw(0, 1, "rc")));
});

test("lock-in SNR gain: √(B_in/ENBW) for a sine reference, ×2√2/π for a square one", () => {
  // Hand: √(1e5/0.25) = 632.456; square, 2nd-order Butterworth: 0.900316·√(1e5/0.1767767) = 677.15.
  const base = { phase_rad: 0, detuning_Hz: 0, tau: 1, inputBandwidth_Hz: 1e5 } as const;
  close(lockinSnrGain({ ...base, order: 1, filter: "rc", reference: "sine" }), 632.456, 1e-6);
  close(lockinSnrGain({ ...base, order: 2, filter: "butterworth", reference: "square" }), 677.15, 1e-5);
  assert.equal(lockinSnrGain({ ...base, phase_rad: Math.PI / 2, order: 1, filter: "rc", reference: "sine" }) < 1e-12, true);
});

test("boxcar gate average of a Gaussian pulse: 0.990834 for a 100 ns gate on a 500 ns pulse; → peak for a narrow gate", () => {
  // Hand: σ = 500/2.35482 = 212.330 ns; σ√(π/2)/T·2·erf(50/(σ√2)) = 2.66116·2·erf(0.166516)/1 … = 0.990834
  // (trapezoid with 2e4 steps agrees to 1e-10).
  close(gaussianGateAverage(1, 500, 100, 0), 0.990834, 1e-6);
  close(gaussianGateAverage(2, 500, 1e-3, 0), 2, 1e-9);
  // gate centred at the half-maximum point of a narrow gate reads half the peak
  close(gaussianGateAverage(1, 500, 1e-3, 250), 0.5, 1e-6);
  assert.ok(Number.isNaN(gaussianGateAverage(1, 0, 100, 0)));
});

test("boxcar gate noise: e_n/√(2T) for B ≫ 1/T, σ_in for B ≪ 1/T; optimum centred gate 1.18904·FWHM", () => {
  // White limit: 100 nV/√Hz, 100 ns gate → NEB 5 MHz, 223.6 µV; B = 100 MHz (x = 40): ×√(1 − 1/40)·… = 220.794 µV
  // (numerical (2/T)∫(1 − u/T)R(u)du agrees to 1e-9).
  close(gateNoiseBandwidth(100e-9), 5e6, 1e-12);
  close(gateNoiseRms(100e-9, 100e6, 100e-9), 220.794e-6, 1e-5);
  close(gateNoiseRms(100e-9, 1e12, 100e-9), 100e-9 * Math.sqrt(5e6), 1e-5);
  close(gateNoiseRms(1, 1, 1e-6), 1, 1e-6); // B·T ≪ 1: the gate does not average
  // Optimum: erf(u) = (4u/√π)e^(−u²) at u = 0.98994 → T = 2√2·u·σ = 1.18904·FWHM (brute-force scan agrees to 1e-5).
  close(optimalGateWidthRatio(), 1.18904, 1e-5);
});
