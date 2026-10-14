import test from "node:test";
import assert from "node:assert/strict";

import { johnsonNoise, noiseEquivalentPower, responsivity, shotNoiseCurrent, specificDetectivity } from "../src/physics/detectors/noise";
import {
  GRADING_EXPONENT,
  TRANSIT_FACTOR,
  combinedBandwidth,
  depletionWidth,
  junctionCapacitance,
  rcBandwidth,
  rcFilteredNoise,
  transitBandwidth,
} from "../src/physics/detectors/photodiode-rc";
import { closedLoopMagnitude, singlePoleClosedLoop, tiaBandNoise, tiaBandwidth, tiaButterworthCf, tiaSpotNoise } from "../src/physics/detectors/tia";
import { darkCurrentRatio, intrinsicDensityRatio } from "../src/physics/detectors/dark-current";

const close = (actual: number, expected: number, rel: number, msg = "") =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${msg} ${actual} vs ${expected}`);

const kB = 1.380649e-23;

test("NEP and D*: 10 nA dark current, 50 Ω at 300 K, 0.8 A/W, 1 Hz, 1 mm² (nep page defaults)", () => {
  // Hand calculation: 2qI = 3.2044e-27 A²/Hz, 4kT/R = 3.313558e-22 A²/Hz, i_n = 1.820327e-11 A,
  // NEP = i_n/0.8 = 2.275409e-11 W, D* = √(0.01 cm² × 1 Hz)/NEP = 4.39481e9 Jones.
  const i = Math.hypot(shotNoiseCurrent(10e-9, 1), johnsonNoise(50, 300, 1).i);
  close(i, 1.820327e-11, 1e-6);
  const nep = noiseEquivalentPower(i, 0.8);
  close(nep, 2.275409e-11, 1e-6);
  close(specificDetectivity(0.01, 1, nep), 4.39481e9, 1e-5);
  // Gain M divides the NEP; D* is independent of B when the noise is white.
  close(noiseEquivalentPower(i, 0.8, 10), nep / 10, 1e-12);
  close(specificDetectivity(0.01, 100, noiseEquivalentPower(i * 10, 0.8)), 4.39481e9, 1e-5);
  assert.ok(Number.isNaN(noiseEquivalentPower(i, 0)));
});

test("responsivity ηqλ/(hc): η = 0.7 at 850 nm gives 0.4799 A/W; detectivity page D* = 2.668e9 Jones", () => {
  // hc/q = 1239.84198 nm·eV, so ℛ = 0.7 × 850/1239.84198 = 0.479900 A/W.
  close(responsivity(0.7, 850e-9), 0.7 * 850 / 1239.84198, 1e-8);
  // Detectivity page: 1 nA, 1 MHz, 293 K, 50 Ω, 1 mm²: i_n = √(3.2044e-22 + 3.23624e-16) = 1.79896e-8 A,
  // spectral NEP = i_n/(ℛ·√B) = 3.74862e-11 W/√Hz, D* = √0.01/NEP = 2.6677e9 Jones (ROADMAP 2.668e9).
  const i = Math.hypot(shotNoiseCurrent(1e-9, 1e6), johnsonNoise(50, 293, 1e6).i);
  const nep = noiseEquivalentPower(i, responsivity(0.7, 850e-9));
  close(specificDetectivity(0.01, 1e6, nep), 2.6677e9, 1e-4);
});

test("junction capacitance C_j0/(1 + V_R/V_bi)^m: 10 pF, 0.6 V, 5 V abrupt gives 3.273 pF and 810.4 MHz with 60 Ω", () => {
  // Sze & Ng ch. 2. 1 + 5/0.6 = 9.3333, √ = 3.05505, 10/3.05505 = 3.27327 pF; 1/(2π·60 Ω·3.27327 pF) = 810.38 MHz.
  close(junctionCapacitance(10, 5, 0.6, GRADING_EXPONENT.abrupt), 3.27327, 1e-5);
  close(rcBandwidth(60, junctionCapacitance(10e-12, 5, 0.6, 0.5)), 810.38e6, 1e-5);
  // Linearly graded: 9.3333^(−1/3) × 10 = 4.74957 pF. Zero bias returns C_j0; negative bias is out of the model.
  close(junctionCapacitance(10, 5, 0.6, GRADING_EXPONENT.graded), 4.74957, 1e-5);
  assert.equal(junctionCapacitance(10, 0, 0.6, 0.5), 10);
  assert.ok(Number.isNaN(junctionCapacitance(10, -1, 0.6, 0.5)));
});

test("transit-time factor 0.443 is the root of sin x/x = 1/√2 and the quadrature sum tracks the exact response", () => {
  // Bisection on |sin x/x| = 1/√2 for x in (0.5, 2.5); f·τ = x/π.
  let a = 0.5, b = 2.5;
  for (let k = 0; k < 100; k++) { const m = (a + b) / 2; if (Math.sin(m) / m > Math.SQRT1_2) a = m; else b = m; }
  close(TRANSIT_FACTOR, a / Math.PI, 1e-7);
  // Photodiode-speed defaults: 10 pF/mm², 1 mm², 50 Ω → 318.31 MHz; ε_r = 11.9 → W = 10.536 µm; v = 1e5 m/s → 4.204 GHz.
  close(rcBandwidth(50, 10e-12), 318.3099e6, 1e-6);
  const W = depletionWidth(1e-5, 11.9);
  close(W, 11.9 * 8.8541878188e-12 / 1e-5, 1e-12);
  close(transitBandwidth(1e5, W), 4.20393e9, 1e-5);
  // Independent check of 1/f² = 1/f_RC² + 1/f_tr² (Bowers & Burrus 1987): scan |sinc(πfτ)|/√(1 + (f/f_RC)²) for its
  // −3 dB point. With f_tr = f_RC the exact value is 0.6828·f_RC against 0.7071: the approximation is within 4 %.
  for (const ratio of [0.3, 1, 3]) {
    const tau = TRANSIT_FACTOR / ratio;
    const H = (f: number) => Math.abs(Math.sin(Math.PI * f * tau) / (Math.PI * f * tau)) / Math.hypot(1, f);
    let lo = 1e-6, hi = 10;
    for (let k = 0; k < 100; k++) { const m = (lo + hi) / 2; if (H(m) > Math.SQRT1_2) lo = m; else hi = m; }
    close(combinedBandwidth(1, ratio), lo, 0.04, `ratio ${ratio}`);
  }
  close(combinedBandwidth(1, 1), Math.SQRT1_2, 1e-12);
});

test("RC-filtered Johnson noise 4kTR·f_c·atan(B/f_c) tends to √(kT/C) = 20.35 µV (1 kΩ, 10 pF, 300 K)", () => {
  const S = 4 * kB * 300 * 1e3; // V²/Hz
  const fc = rcBandwidth(1e3, 10e-12);
  close(Math.sqrt(rcFilteredNoise(S, fc, 1e15)), Math.sqrt(kB * 300 / 10e-12), 1e-6);
  close(Math.sqrt(kB * 300 / 10e-12), 20.3518e-6, 1e-5);
  // Bandwidth page default Δf = 1 MHz: trapezoid integral of S/(1 + (f/f_c)²) over 0…1 MHz.
  let sum = 0;
  const n = 20000;
  for (let k = 0; k <= n; k++) { const f = (k / n) * 1e6; sum += (k === 0 || k === n ? 0.5 : 1) * S / (1 + (f / fc) ** 2); }
  close(rcFilteredNoise(S, fc, 1e6), sum * (1e6 / n), 1e-8);
  close(Math.sqrt(rcFilteredNoise(S, fc, 1e6)), 4.06768e-6, 1e-5);
  assert.equal(rcFilteredNoise(S, fc, 0), 0);
});

test("single-pole closed loop: A₀ = 1000, GBW = 1 MHz, β = 0.01 gives 90.91 V/V and 11.00 kHz (Franco ch. 6)", () => {
  const cl = singlePoleClosedLoop(1000, 1e6, 0.01);
  close(cl.gain, 1000 / 11, 1e-12);
  close(cl.bandwidth, 11000, 1e-12);
  close(cl.openLoopBandwidth, 1000, 1e-12);
  // The magnitude is down by √2 at the closed-loop bandwidth; β = 0 is the open loop.
  close(closedLoopMagnitude(1000, 1e6, 0.01, 11000), (1000 / 11) / Math.SQRT2, 1e-12);
  close(closedLoopMagnitude(1000, 1e6, 0, 1000), 1000 / Math.SQRT2, 1e-12);
});

test("TIA: √(GBW/2πR_F·C_S) = 3.989 MHz for 1 GHz, 1 MΩ, 10 pF; the Butterworth C_F gives that −3 dB point (SBOA122)", () => {
  const gbw = 1e9, rf = 1e6, cs = 10e-12;
  const f0 = tiaBandwidth(gbw, rf, cs);
  close(f0, 3.98942e6, 1e-5);
  const cf = tiaButterworthCf(gbw, rf, cs);
  close(cf, Math.sqrt(cs / (Math.PI * rf * gbw)), 0.005); // large-loop-gain limit
  // Independent check: full closed loop V_o/I = −Z_F·A/(1 + A + jωC_S·Z_F), A = 2π·GBW/(jω), Z_F = R_F/(1 + jωR_F·C_F).
  const T = (f: number) => {
    const w = 2 * Math.PI * f;
    // Multiply through by jω(1 + jωR_F·C_F): V_o/I = −R_F·2π·GBW / [(jω + 2π·GBW)(1 + jωR_F·C_F) − ω²·C_S·R_F].
    const re = 2 * Math.PI * gbw - w * w * rf * cf - w * w * cs * rf;
    const im = w + 2 * Math.PI * gbw * w * rf * cf;
    return (2 * Math.PI * gbw) / Math.hypot(re, im);
  };
  let lo = 1e3, hi = 1e9;
  for (let k = 0; k < 200; k++) { const m = Math.sqrt(lo * hi); if (T(m) > Math.SQRT1_2) lo = m; else hi = m; }
  close(lo, f0, 1e-4);
  for (let k = 0; k <= 400; k++) assert.ok(T(1e4 * 1e4 ** (k / 400)) < 1.001, "no peaking");
});

test("TIA input noise: band average of (e_n·2πf·C_S)² is F²/3 of it (SBOA122 eq. 13)", () => {
  const p = { currentNoise: 5e-15, voltageNoise: 5e-9, feedbackR: 1e6, inputC: 10e-12, temperature: 300 };
  const F = 3.98942e6;
  // Trapezoid integral of the spot density over 0…F equals the band-averaged density × F.
  let sum = 0;
  const n = 10000;
  for (let k = 0; k <= n; k++) sum += (k === 0 || k === n ? 0.5 : 1) * tiaSpotNoise(p, (k / n) * F).total;
  close(tiaBandNoise(p, F).total * F, sum * (F / n), 1e-7);
  // Hand values: 4kT/R_F = 1.65678e-26 A²/Hz; (5e-9·2π·10e-12)²·F²/3 = 5.2360e-25 A²/Hz; i_rms = 1.46804 nA.
  close(tiaBandNoise(p, F).johnson, 1.656779e-26, 1e-6);
  close(Math.sqrt(tiaBandNoise(p, F).total * F), 1.46804e-9, 1e-5);
  assert.ok(Number.isNaN(tiaBandNoise({ ...p, feedbackR: 0 }, F).total));
});

test("dark current: generation ∝ n_i roughly doubles from 300 to 310 K in Si (E_g = 1.12 eV); diffusion ∝ n_i²", () => {
  // Hand: (310/300)^1.5 = 1.05042; E_g/2k = 6498.6 K; 1/310 − 1/300 = −1.07527e-4 K⁻¹; exp(0.698770) = 2.01126 → 2.1127.
  close(darkCurrentRatio(310, 300, 1.12, "generation"), 2.11267, 1e-4);
  close(darkCurrentRatio(310, 300, 1.12, "diffusion"), 2.11267 ** 2, 1e-4);
  assert.equal(intrinsicDensityRatio(300, 300, 1.12), 1);
  assert.ok(Number.isNaN(darkCurrentRatio(0, 300, 1.12, "generation")));
});
