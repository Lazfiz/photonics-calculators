import test from "node:test";
import assert from "node:assert/strict";

import {
  fittingErrorVariance, friedParameter, greenwoodFrequency, isoplanaticAngle, lognormalFadeProbability, rytovVariance,
  scintillationIndex, servoLagVariance, strehlRatio, uncorrectedPhaseVariance,
} from "../src/physics/free-space-comms/turbulence";

const close = (actual: number, expected: number, rel: number, msg = "") =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${msg} ${actual} vs ${expected}`);

const lambda = 1550e-9;

test("r₀ and θ₀ agree with Fried's forms 0.185 λ^(6/5)(C_n²L)^(−3/5) and 0.314 r₀/h̄", () => {
  // Fried (1966) as quoted in Hardy, Adaptive Optics for Astronomical Telescopes: the constant 0.185 is rounded.
  const r0 = friedParameter(1e-14, lambda, 1000);
  close(r0, 0.185 * lambda ** 1.2 * (1e-14 * 1000) ** -0.6, 3e-3);
  close(r0, 0.07848, 1e-3); // hand: (0.423 · 1.6432e13 · 1e-14 · 1000)^(−3/5) = 69.51^(−0.6)
  // Uniform path: h̄ = (∫z^(5/3)dz / L)^(3/5) = (3/8)^(3/5) L, θ₀ = 0.314 r₀/h̄.
  close(isoplanaticAngle(1e-14, lambda, 1000), (0.314 * r0) / ((3 / 8) ** 0.6 * 1000), 2e-3);
});

test("Rytov variance and the unified plane-wave scintillation index (Andrews & Phillips 2005)", () => {
  // Hand: 1.23 · 1.7e-14 · k^(7/6) · L^(11/6), k^(7/6) = 5.1187e7, L^(11/6) = 10^5.5.
  close(rytovVariance(1.7e-14, lambda, 1000), 1.23 * 1.7e-14 * 5.1187e7 * 10 ** 5.5, 1e-4);
  // σ_R² = 1: exp(0.49/2.11^(7/6) + 0.51/1.69^(5/6)) − 1 = exp(0.20487 + 0.32935) − 1 = 0.7064.
  close(scintillationIndex(1, lambda, 1000), 0.7064, 1e-3);
  // Weak limit: σ_I² → σ_R²; strong limit: saturates at 1.
  close(scintillationIndex(1e-3, lambda, 1000), 1e-3, 2e-3);
  close(scintillationIndex(1e6, lambda, 1000), 1, 0.02);
  // Continuous across σ_R² = 1 (the old page jumped from 1 to 1.86 there).
  assert.ok(Math.abs(scintillationIndex(1.001, lambda, 1000) - scintillationIndex(0.999, lambda, 1000)) < 1e-3);
});

test("aperture averaging uses the Fresnel parameter d² = kD²/4L, not D/r₀", () => {
  const L = 1000, sr2 = 0.3;
  const point = scintillationIndex(sr2, lambda, L);
  // d² = 1: D = √(4L/k) = 2√(L/k).
  const D1 = 2 * Math.sqrt(L / ((2 * Math.PI) / lambda));
  // The published expression written out with d² = 1 (1 + 0.65d² = 1.65, 1 + 0.90d² = 1.9, 0.62d² = 0.62):
  const s = 0.3 ** 1.2;
  const expected = Math.expm1((0.49 * sr2) / (1.65 + 1.11 * s) ** (7 / 6) + (0.51 * sr2 * (1 + 0.69 * s) ** (-5 / 6)) / (1.9 + 0.62 * s));
  close(scintillationIndex(sr2, lambda, L, D1), expected, 1e-12);
  assert.ok(scintillationIndex(sr2, lambda, L, D1) < point);
  assert.ok(scintillationIndex(sr2, lambda, L, 10) < 1e-3 * point); // D ≫ Fresnel zone averages it out
});

test("log-normal fade probability: P(I < ⟨I⟩) = Φ(σ_ln/2)", () => {
  // σ_I² = e − 1 → σ_ln = 1 → Φ(0.5) = 0.691462 (normal table).
  close(lognormalFadeProbability(1, Math.E - 1), 0.691462, 1e-6);
  // F = 10^(−1) (−10 dB), σ_ln² = ln 2: Φ((−2.302585 + 0.346574)/0.832555) = Φ(−2.349412) = 0.009402.
  close(lognormalFadeProbability(0.1, 1), 0.009402, 1e-3);
});

test("adaptive optics: Noll variances, Greenwood servo lag without a D/r₀ factor, Parenti-Sasiela Strehl", () => {
  close(uncorrectedPhaseVariance(1, 1), 1.0299, 1e-12);
  close(fittingErrorVariance(100, 2, 1), 0.2944 * 100 ** (-Math.sqrt(3) / 2) * 2 ** (5 / 3), 1e-12);
  // f_G = 0.427 · 10 m/s / 0.1 m = 42.7 Hz; at f_3dB = f_G the servo variance is 1 rad² for any aperture.
  close(greenwoodFrequency(10, 0.1), 42.7, 1e-12);
  assert.equal(servoLagVariance(42.7, 42.7), 1);
  // Hand: D = r₀: e^(−1.0299) + (1 − e^(−1.0299))/2 = 0.35704 + 0.32148 = 0.67852.
  close(strehlRatio(uncorrectedPhaseVariance(1, 1), 1, 1), 0.67852, 1e-4);
  // D = 100 r₀ uncorrected: the seeing-limited (r₀/D)² ≈ 1e-4, not the Maréchal e^(−22) underflow.
  close(strehlRatio(uncorrectedPhaseVariance(100, 1), 100, 1), 1 / (1 + 1e4), 1e-9);
  assert.equal(strehlRatio(0, 0.5, 1), 1);
});
