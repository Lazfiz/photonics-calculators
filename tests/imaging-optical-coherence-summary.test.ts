import assert from "node:assert/strict";
import { test } from "node:test";
import { OCT_NARROWBAND_LIMIT, exceedsNarrowbandLimit, opticalCoherenceSummary } from "../src/physics/imaging/optical-coherence";

const close = (actual: number, expected: number, rel = 1e-8) =>
  assert.ok(Math.abs(actual / expected - 1) <= rel, `${actual} vs ${expected}`);

// λ₀ = 1310 nm, Δλ = 100 nm, n = 1.33, P = 10 mW, R_s = 0.01, κ = 0.6, ρ = 0.8 A/W, 20 kHz; independent script:
//  Δz = (2 ln 2/π) λ₀²/(nΔλ) = 0.4412712 · 1.7161 µm²/(1.33 · 0.1 µm) = 5.693726 µm, 7.572655 µm in air
//  (Fercher et al., Rep. Prog. Phys. 66, 239, 2003); l_c = 2 · 7.572655 = 15.145310 µm; τ_c = l_c/c = 50.519317 fs;
//  Δν = cΔλ/λ₀² = 17.469405 THz; P_s = κ R_s P = 60 µW;
//  SNR = ρ P_s Δt/(2e) = 0.8 · 6e-5 · 5e-5/(2 · 1.602176634e-19) = 7.48978e9 (Choma et al., Opt. Express 11, 2183, 2003, eq. 10).
test("optical coherence summary matches the hand-worked values", () => {
  const r = opticalCoherenceSummary(1310e-9, 100e-9, 1.33, 10e-3, 0.01, 0.6, 0.8, 20e3);
  close(r.axialResolutionAir, 7.572655068e-6);
  close(r.axialResolutionSample, 5.6937256153e-6);
  close(r.coherenceLength, 15.145310137e-6);
  close(r.coherenceTime, 50.519316723e-15);
  close(r.spectralWidth, 17.469404930e12);
  close(r.signalPower, 60e-6);
  close(10 * Math.log10(r.snr), 98.744708523);
});

test("optical coherence sensitivity is the SNR of a perfect mirror, 1/R_s above the SNR", () => {
  const r = opticalCoherenceSummary(1310e-9, 100e-9, 1.33, 10e-3, 0.01, 0.6, 0.8, 20e3);
  close(r.sensitivity / r.snr, 100, 1e-12);
  // Edge case: zero bandwidth has no coherence gate.
  assert.ok(Number.isNaN(opticalCoherenceSummary(1310e-9, 0, 1.33, 10e-3, 0.01, 0.6, 0.8, 20e3).axialResolutionAir));
});

// The Gaussian, Δλ ≪ λ₀ formulas are flagged above Δλ/λ₀ = 0.1: 100/1310 = 0.0763 is inside, 200/1310 = 0.153 and 150/1310 = 0.114 are outside,
// and the ratio is dimensionless (same answer in nm and m).
test("optical coherence narrow-band limit", () => {
  assert.equal(OCT_NARROWBAND_LIMIT, 0.1);
  assert.equal(exceedsNarrowbandLimit(1310, 100), false);
  assert.equal(exceedsNarrowbandLimit(1310, 150), true);
  assert.equal(exceedsNarrowbandLimit(1310e-9, 200e-9), true);
});
