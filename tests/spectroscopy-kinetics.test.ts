import test from "node:test";
import assert from "node:assert/strict";

import { erfcx, integrateSimpson } from "../src/physics/math";
import { convolvedDecay, emgDecay, gaussianPulseBandwidth, periodicDecay } from "../src/physics/spectroscopy/fluorescence-lifetime";
import {
  deltaA, deltaTOverT, excitationFraction, intermediatePeakTime, sequentialPopulations, type TransientBands,
} from "../src/physics/spectroscopy/pump-probe";
import { absorptance, relativeQuantumYield } from "../src/physics/spectroscopy/quantum-yield";
import {
  absorptiveLineshape, dimer, dimerPeaks, homogeneousFwhm, orientationalAverage, spectrum2D, transferMatrix,
} from "../src/physics/spectroscopy/two-dimensional";

const close = (actual: number, expected: number, rel: number, msg?: string) =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${msg ?? ""} ${actual} vs ${expected}`);

const ps = 1e-12, ns = 1e-9;

/** Independent check: Gaussian (σ) convolved with f(s), s ≥ 0, by Simpson's rule. */
const convolve = (t: number, sigma: number, f: (s: number) => number) =>
  integrateSimpson((s) => (Math.exp(-((t - s) ** 2) / (2 * sigma * sigma)) / (sigma * Math.sqrt(2 * Math.PI))) * f(s), 0, Math.max(t, 0) + 12 * sigma, 20000);

test("erfcx and the exponentially modified Gaussian", () => {
  // DLMF 7.2.3 / A&S table 7.1: erfc(1) = 0.157299207050285, so erfcx(1) = e·erfc(1); erfcx(10) = 0.0561409927438226.
  close(erfcx(1), Math.E * 0.157299207050285, 1e-14);
  close(erfcx(10), 0.0561409927438226, 1e-13);
  assert.equal(erfcx(0), 1);
  // far after the IRF the EMG is the exponential times e^(σ²/2τ²): τ = 2 ns, σ = 85 ps, t − t₀ = 4.5 ns
  close(emgDecay(5 * ns, 2 * ns, 0.085 * ns, 0.5 * ns), Math.exp(0.085 ** 2 / 8 - 4.5 / 2), 1e-13);
  // against direct numerical convolution, before, at and after t₀
  for (const t of [-0.2, 0, 0.1, 0.5, 2]) {
    close(emgDecay(t * ps, 0.5 * ps, 0.1 * ps), convolve(t * ps, 0.1 * ps, (s) => Math.exp(-s / (0.5 * ps))), 1e-10, `t=${t}`);
  }
  // σ = 0: the plain decay, zero before t₀
  assert.equal(emgDecay(-1, 1, 0), 0);
  close(convolvedDecay([{ amplitude: 2, lifetime: 1 }, { amplitude: 1, lifetime: 3 }], 1, 0), 2 * Math.exp(-1) + Math.exp(-1 / 3), 1e-15);
});

test("TCSPC incomplete decay and transform-limited bandwidth", () => {
  // σ = 0 at repetition period T: the geometric series e^(−x/τ)/(1 − e^(−T/τ)) (Becker 2005); 80 MHz → T = 12.5 ns
  const T = 1 / 80e6;
  close(T, 12.5 * ns, 1e-15);
  close(periodicDecay([{ amplitude: 1, lifetime: 5 * ns }], 3 * ns, 0, 0, T), Math.exp(-3 / 5) / (1 - Math.exp(-12.5 / 5)), 1e-13);
  // with an IRF the tail of earlier pulses is unchanged: τ 2 ns, σ 85 ps, t₀ 0.5 ns, t 5 ns
  close(periodicDecay([{ amplitude: 1, lifetime: 2 * ns }], 5 * ns, 0.085 * ns, 0.5 * ns, T),
    Math.exp(0.085 ** 2 / 8 - 4.5 / 2) / (1 - Math.exp(-6.25)), 1e-12);
  // Gaussian pulse, 100 fs: Δν = 2 ln 2/(π · 100 fs) = 4.413 THz; at 800 nm Δλ = 9.421 nm (audit: 4.40 THz with 0.44)
  const bw = gaussianPulseBandwidth(100e-15, 800e-9);
  close(bw.hz, 4.4127e12, 1e-4);
  close(bw.lambda, 9.4211e-9, 1e-4);
});

test("TCSPC pulse train is periodic (Codex review 2026-10-24)", () => {
  // 100 MHz, τ 1 ns, IRF FWHM 200 ps, t₀ 0: the old sum from n = −1 gave 0.4679 at 0 and 10 ns but 4.6e-5 at 20 ns.
  // Reference: the brute-force Σₙ y(t + nT) over n = −60…60 of the exact EMG terms.
  const T = 10 * ns, tau = ns, sigma = 0.2 * ns / (2 * Math.sqrt(2 * Math.LN2)), comp = [{ amplitude: 1, lifetime: tau }];
  const brute = (t: number) => {
    let s = 0;
    for (let n = -60; n <= 60; n++) s += emgDecay(t + n * T, tau, sigma, 0);
    return s;
  };
  for (const t of [0, 0.3 * ns, 4 * ns, 9.95 * ns]) {
    const ref = brute(t);
    for (const k of [-3, 0, 1, 2, 7]) close(periodicDecay(comp, t + k * T, sigma, 0, T), ref, 1e-12);
  }
  close(periodicDecay(comp, 20 * ns, sigma, 0, T), 0.4679, 1e-3);
  // σ comparable to T: pulses more than one period ahead still count (σ 4 ns, T 10 ns)
  for (const t of [0, 5 * ns]) {
    let s = 0;
    for (let n = -60; n <= 60; n++) s += emgDecay(t + n * T, tau, 4 * ns, 0);
    close(periodicDecay(comp, t + 30 * ns, 4 * ns, 0, T), s, 1e-12);
  }
});

test("pump-probe: sequential A → B → GS populations", () => {
  // part 0 audit golden: τ₁ 0.5 ps, τ₂ 5 ps, t 2 ps → bleach n_A + n_B = e^(−4) + (10/9)(e^(−0.4) − e^(−4)) = 0.7428
  const p = sequentialPopulations(2 * ps, 0.5 * ps, 5 * ps);
  close(p.a, Math.exp(-4), 1e-14);
  close(p.b, (10 / 9) * (Math.exp(-0.4) - Math.exp(-4)), 1e-13);
  close(p.bleach, 0.742765, 1e-6);
  // k₁ = k₂ limit: n_B = (t/τ) e^(−t/τ) = 2e^(−2), continuous across the switch to the degenerate form
  close(sequentialPopulations(2 * ps, ps, ps).b, 2 * Math.exp(-2), 1e-14);
  close(sequentialPopulations(2 * ps, ps, 1.000001 * ps).b, 2 * Math.exp(-2), 2e-6);
  // B maximum ln(k₁/k₂)/(k₁ − k₂) = ln 10 / 1.8 ps⁻¹
  close(intermediatePeakTime(0.5 * ps, 5 * ps), (Math.LN10 / 1.8) * ps, 1e-14);
  // with a 100 fs cross-correlation: against numerical convolution, including negative delays
  for (const t of [-0.2, 0, 0.5, 2]) {
    const q = sequentialPopulations(t * ps, 0.5 * ps, 5 * ps, 0.1 * ps);
    const nB = (s: number) => (2 / 1.8) * (Math.exp(-s / (5 * ps)) - Math.exp(-s / (0.5 * ps)));
    close(q.b, convolve(t * ps, 0.1 * ps, nB), 1e-10, `nB t=${t}`);
    const qd = sequentialPopulations(t * ps, ps, ps, 0.1 * ps);
    close(qd.b, convolve(t * ps, 0.1 * ps, (s) => (s / ps) * Math.exp(-s / ps)), 1e-10, `degenerate t=${t}`);
  }
});

test("pump-probe: excitation fraction and ΔA", () => {
  // ε = 10⁴ L mol⁻¹ cm⁻¹ (10³ m²/mol): σ = 3.8235e-17 cm²; 100 µJ/cm² at 400 nm = 2.0136e14 photons/cm² → σJ = 7.699e-3
  close(excitationFraction(1, 400e-9, 1000, 0), 7.6992e-3, 1e-4);
  // depth average over A_p = 0.3: × (1 − 10^(−0.3))/(0.3 ln 10) = 0.72211
  close(excitationFraction(1, 400e-9, 1000, 0.3), 7.6992e-3 * 0.72211, 1e-4);
  const band = (centre: number, strength: number) => ({ centre: centre * 1e-9, fwhm: 50e-9, strength });
  const bands: TransientBands = { groundState: band(500, 1), esaA: band(700, 0.8), se: band(570, 0.6), esaB: band(420, 0.5) };
  const p = sequentialPopulations(0, 0.5 * ps, 5 * ps);
  // at t = 0 (no IRF) only A: bleach −f A at the GS peak, plus the SE and ESA Gaussian tails
  const parts = deltaA(500e-9, p, bands, 0.01, 0.5);
  close(parts.bleach, -0.005, 1e-14);
  close(parts.se, -0.005 * 0.6 * Math.exp(-4 * Math.LN2 * (70 / 50) ** 2), 1e-13);
  assert.equal(parts.esaB, 0);
  // ΔT/T = 10^(−ΔA) − 1: ΔA = −1 mOD → +0.2305 %
  close(deltaTOverT(-1e-3), 10 ** 1e-3 - 1, 1e-12);
});

test("relative quantum yield with absorptances (Würth 2013)", () => {
  const q = { sampleEmission: 50000, referenceEmission: 80000, sampleAbsorbance: 0.1, referenceAbsorbance: 0.1, sampleIndex: 1.333, referenceIndex: 1.333, referenceYield: 0.546 };
  // equal absorbances: both forms give 0.546 · 0.625
  close(relativeQuantumYield(q), 0.34125, 1e-14);
  close(relativeQuantumYield(q, "absorbance"), 0.34125, 1e-14);
  // A_ref = 2 A_s: f_ref/f_s = (1 − x²)/(1 − x) = 1 + x, x = 10^(−0.05); the absorbance ratio says 2
  const q2 = { ...q, sampleAbsorbance: 0.05 };
  close(relativeQuantumYield(q2), 0.34125 * (1 + 10 ** -0.05), 1e-13);
  close(relativeQuantumYield(q2, "absorbance"), 0.6825, 1e-14);
  // n² correction: ethanol 1.361 vs water 1.333
  close(relativeQuantumYield({ ...q, sampleIndex: 1.361 }), 0.34125 * (1.361 / 1.333) ** 2, 1e-14);
  close(absorptance(1), 0.9, 1e-14);
  // invalid inputs give NaN, not 0
  assert.ok(Number.isNaN(relativeQuantumYield({ ...q, referenceEmission: 0 })));
  assert.ok(Number.isNaN(relativeQuantumYield({ ...q, referenceYield: 1.2 })));
});

test("2D spectrum of a coupled dimer", () => {
  // homogeneous FWHM 1/(πcT₂): 200 fs → 53.09 cm⁻¹ (part 0 audit)
  close(homogeneousFwhm(200e-15) / 100, 53.0884, 1e-5);
  // exciton splitting √(Δ² + 4J²): Δ 200, J 100 cm⁻¹ → 282.84 cm⁻¹; total dipole strength conserved (= 2)
  const d = dimer(12500e2, 200e2, 100e2, Math.PI / 3);
  close(d.splitting, Math.sqrt(200 ** 2 + 4 * 100 ** 2) * 100, 1e-14);
  close(d.mu0.reduce((s, m) => s + m[0] ** 2 + m[1] ** 2, 0), 2, 1e-14);
  // ZZZZ isotropic averages ⟨cos⁴⟩ = 1/5 and parallel-perpendicular 1/15 (Hamm & Zanni 2011)
  close(orientationalAverage([1, 0], [1, 0], [1, 0], [1, 0]), 1 / 5, 1e-15);
  close(orientationalAverage([1, 0], [1, 0], [0, 1], [0, 1]), 1 / 15, 1e-15);
  // J = 0: GSB and ESA cross peaks cancel exactly
  const d0 = dimer(12500e2, 200e2, 0, Math.PI / 3);
  const cross = dimerPeaks(d0).filter((p) => p.w1 === d0.energies[0] && p.w3 === d0.energies[1]).reduce((s, p) => s + p.amplitude, 0);
  assert.ok(Math.abs(cross) < 1e-16, `cross ${cross}`);
  // lineshape against direct quadrature of ∫ G L L du, off and on the diagonal; σ = 0 gives the Lorentzian product
  const brute = (x1: number, x3: number, s: number, g: number) => integrateSimpson(
    (u) => (Math.exp(-u * u / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI))) * (g / ((x1 - u) ** 2 + g * g)) * (g / ((x3 - u) ** 2 + g * g)), -12 * s, 12 * s, 200000);
  for (const [x1, x3] of [[30, -20], [30, 30], [0, 1e-4]]) close(absorptiveLineshape(x1, x3, 50, 10), brute(x1, x3, 50, 10), 1e-10, `${x1},${x3}`);
  close(absorptiveLineshape(3, 4, 0, 10), (10 / 109) * (10 / 116), 1e-15);
  // spectrum2D sums the same lineshapes
  const peaks = dimerPeaks(d);
  const z = spectrum2D([d.energies[0]], [d.energies[1]], peaks, 150e2, 53e2);
  const sigma = 150e2 / (2 * Math.sqrt(2 * Math.LN2));
  const direct = peaks.reduce((s, p) => s + p.amplitude * absorptiveLineshape(d.energies[0] - p.w1, d.energies[1] - p.w3, sigma, 26.5e2), 0);
  close(z[0][0], direct, 1e-12);
});

test("dimer population transfer: two-state relaxation golden value", () => {
  // Hand calculation. Δ = 200 cm⁻¹, J = 100 cm⁻¹: splitting = √(Δ² + 4J²) = 282.84 cm⁻¹.
  // Uphill/downhill ratio e^(−hcΔE/kT) = e^(−1.4388 · 282.84 / 300) = 0.2576 (300 K, c₂ = 1.4388 cm·K).
  // Two-state kinetics with k↓ = 1/τ, k↑ = 0.2576 k↓: K = 1.2576/τ, equilibrium P(−) = 1/1.2576 = 0.7952.
  // P(−|+)(T_w) = P_eq(−) (1 − e^(−K T_w)); at T_w = τ: 0.7952 · (1 − e^(−1.2576)) = 0.7952 · 0.7157 = 0.5691.
  const d = dimer(12500e2, 200e2, 100e2, Math.PI / 3);
  const t = transferMatrix(d, 300e-15, 300e-15, 300);
  close(t[1][0], 0.56908, 1e-4);
  close(t[0][0] + t[0][1], 1, 1e-12); // rows are probabilities
  assert.deepEqual(transferMatrix(d, 0, 300e-15, 300), [[1, 0], [0, 1]]); // T_w = 0: identity, no cross-peak transfer
});
