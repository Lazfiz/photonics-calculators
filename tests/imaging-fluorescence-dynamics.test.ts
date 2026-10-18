import test from "node:test";
import assert from "node:assert/strict";

import { besselIScaled01 } from "../src/physics/math";
import {
  axelrodPostBleach, axelrodRecovery, fcsAutocorrelation, fcsDiffusionCoefficient, fcsDiffusionCorrelation,
  fcsEffectiveVolume, fcsMeanNumber, frapDiffusionCoefficient, frapHalfTimeRatio, koppelSnr, soumpasisRecovery,
} from "../src/physics/imaging/fluorescence-dynamics";
import {
  dicContrast, dicShearPhase, objectPhase, zernikeContrast, zernikeContrastLinear,
} from "../src/physics/imaging/phase-contrast";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const um = 1e-6;
const nM = 1e-6; // mol/m³

test("FCS volume, N, G(0) and D at the page defaults (Hess & Webb 2002)", () => {
  // w₀ 0.3 µm, z₀ 1.5 µm: V = π^1.5 · 0.09 · 1.5 µm³ = 0.75172 fL; N = 50 nM · N_A · V = 22.635; D = 0.09/(4·0.05 ms).
  const V = fcsEffectiveVolume(0.3 * um, 1.5 * um);
  assertRel(V, 0.75172e-18, 1e-5, "V_eff");
  const N = fcsMeanNumber(50 * nM, V);
  assertRel(N, 22.635, 1e-4, "N");
  assertRel(1 / N, 0.044179, 1e-4, "G(0)");
  assertRel(fcsDiffusionCoefficient(0.3 * um, 0.05e-3), 450e-12, 1e-12, "D");
  assert.ok(Number.isNaN(fcsEffectiveVolume(0, 1.5 * um)), "w₀ = 0");
});

test("FCS G(τ): triplet factor T/(1 − T) and the diffusion limits (Widengren 1995)", () => {
  const p = { N: 22.635, tauD: 0.05e-3, kappa: 5, T: 0.1, tauT: 5e-6 };
  // G(0⁺) = 1/(N(1 − T)) = 0.049088; the page's old 1 + T gave 0.048597.
  assertRel(fcsAutocorrelation(0, p), 0.049088, 1e-4, "G(0+) with triplet");
  assertRel(fcsAutocorrelation(1, p), fcsDiffusionCorrelation(1, p), 1e-12, "triplet gone at τ ≫ τ_T");
  // At τ = τ_D: (1/N)·½·(1 + 1/κ²)^(−1/2), and a flat volume (κ → ∞) gives exactly ½.
  assertRel(fcsDiffusionCorrelation(p.tauD, p), 0.5 / (p.N * Math.sqrt(1.04)), 1e-12, "G(τ_D)");
  assertRel(fcsDiffusionCorrelation(p.tauD, { ...p, kappa: 1e9 }) * p.N, 0.5, 1e-12, "2D limit");
  assert.ok(Number.isNaN(fcsAutocorrelation(0, { ...p, T: 1 })), "T = 1");
});

test("Koppel SNR ε√(Δτ T)/√(1 + 1/N): independent of N for N ≫ 1", () => {
  // 30 kHz per molecule, Δτ = 1 µs, T = 10 s: 3e4 · √(1e-5) = 94.868.
  assertRel(koppelSnr(30e3, 1e-6, 10), 94.868, 1e-4, "SNR");
  // Hand derivation: for εΔτ ≪ 1 the products n_i n_(i+1) have variance ≈ mean = ⟨n⟩²(1 + G), G = 1/N.
  // N = 1: 94.868/√2 = 67.082; the page default N = 22.635: 94.868/√(1.044179) = 92.839.
  assertRel(koppelSnr(30e3, 1e-6, 10, 1), 67.082, 1e-4, "N = 1");
  assertRel(koppelSnr(30e3, 1e-6, 10, 22.635), 92.839, 1e-4, "N = 22.6");
  assertRel(koppelSnr(30e3, 1e-6, 40) / koppelSnr(30e3, 1e-6, 10), 2, 1e-12, "√T");
  assert.ok(Number.isNaN(koppelSnr(30e3, 0, 10)), "Δτ = 0");
});

test("Soumpasis disk: τ½ = 0.8946 τ_D, D = 0.112 µm²/s at w 1 µm, τ½ 2 s (Soumpasis 1983)", () => {
  // Soumpasis quotes D = 0.224 w²/τ½, i.e. γ = 4 · 0.224 = 0.896 to his three digits.
  const g = frapHalfTimeRatio("disk");
  assertRel(g, 0.89459, 1e-4, "γ disk");
  assertRel(g, 0.896, 2e-3, "Soumpasis' 0.224");
  assertRel(frapDiffusionCoefficient(1 * um, 2, g), 0.11182e-12, 1e-4, "D");
  // The old page's τ = τ½/3.7723 gave D = w²·3.7723/(4τ½) = 0.4716 µm²/s, 4.22× too high.
  assertRel(3.7723 / g, 4.217, 1e-3, "old/new");
  // Late times, series in x = 2τ_D/t: f = 1 − x/2 + x²/4 + O(x³) = 1 − 1/u + 1/u²; f(0) = 0; the asymptotic branch
  // (x > 500) meets the quadrature.
  assertRel(soumpasisRecovery(1000), 1 - 1e-3 + 1e-6, 1e-8, "late");
  assert.equal(soumpasisRecovery(0), 0);
  const x = 500.0001;
  const [i0, i1] = besselIScaled01(x);
  assertRel(soumpasisRecovery(2 / x), i0 + i1, 1e-8, "branch");
});

test("Axelrod Gaussian beam: F(0) = (1 − e^−K)/K, γ(K → 0) = 1, γ(1) = 1.097 (Axelrod 1976)", () => {
  assertRel(axelrodPostBleach(1), 0.63212, 1e-5, "F0(K = 1)");
  // K → 0: F/F_i = 1 − K/(2(1 + u)), so f = u/(1 + u) and τ½ = τ_D.
  assertRel(frapHalfTimeRatio("gaussian", 1e-4), 1, 1e-4, "K → 0");
  assertRel(axelrodRecovery(1, 1e-4), 0.5, 1e-4, "f(τ_D), K → 0");
  assertRel(frapHalfTimeRatio("gaussian", 1), 1.0967, 1e-4, "γ(1)");
  assert.ok(frapHalfTimeRatio("gaussian", 10) > frapHalfTimeRatio("gaussian", 2), "deeper bleach recovers later");
  assertRel(axelrodRecovery(Infinity, 3), 1, 1e-12, "f(∞)");
  assert.ok(Number.isNaN(axelrodRecovery(1, 0)), "K = 0");
});

test("Zernike phase contrast at Δn 0.005, t 5 µm, 550 nm (Zernike 1942)", () => {
  const phi = objectPhase(0.005, 5 * um, 550e-9);
  assertRel(phi, 0.28560, 1e-4, "φ");
  // δ = +π/2, a = 1: C = 2 − 2cos φ + 2 sin φ = 0.64448. The old page's 2 sin φ sin δ = 0.5635 is the linear limit.
  assertRel(zernikeContrast(phi, Math.PI / 2), 0.64448, 1e-4, "negative PC");
  assertRel(zernikeContrastLinear(phi, Math.PI / 2), 2 * phi, 1e-12, "linear");
  // δ = −π/2: C = 2 − 2cos φ − 2 sin φ = −0.48245; a 25 % ring: (|−0.5i + e^(iφ) − 1|² − 0.25)/0.25 = −0.80287.
  assertRel(zernikeContrast(phi, -Math.PI / 2), -0.48245, 1e-4, "positive PC");
  assertRel(zernikeContrast(phi, -Math.PI / 2, 0.25), -0.80287, 1e-4, "25 % ring");
  assert.equal(zernikeContrast(0, -Math.PI / 2, 0.25), 0, "no object");
  // Reversal: |−ia + e^(iφ) − 1|² = a² when 1 − cos φ = a sin φ, i.e. tan(φ/2) = a; a = 0.5 → φ = 0.927295.
  assert.ok(Math.abs(zernikeContrast(2 * Math.atan(0.5), -Math.PI / 2, 0.25)) < 1e-12, "reversal point");
  assert.ok(zernikeContrast(1.2, -Math.PI / 2, 0.25) > 0, "reversed past it");
  assert.ok(Number.isNaN(zernikeContrast(phi, 0, 0)), "opaque ring");
});

test("DIC sin² law with bias Γ (Salmon & Tran 2007)", () => {
  const phi = objectPhase(0.005, 5 * um, 550e-9);
  const dphi = dicShearPhase(phi, 150e-9, 500e-9);
  assertRel(dphi, 0.3 * phi, 1e-12, "Δφ over a ramp");
  assertRel(dicShearPhase(phi, 800e-9, 500e-9), phi, 1e-12, "shear past the ramp");
  const G = 2 * Math.PI * 0.1;
  // sin²(0.35702)/sin²(0.31416) − 1 = 0.27891; the other edge sin²(0.27848)/… − 1 = −0.24783.
  assertRel(dicContrast(G, dphi), 0.27891, 1e-4, "bright edge");
  assertRel(dicContrast(G, -dphi), -0.24783, 1e-4, "dark edge");
  // Small Δφ: C → Δφ cot(Γ/2).
  assertRel(dicContrast(G, 1e-7), 1e-7 / Math.tan(G / 2), 1e-5, "linear");
  assert.ok(Number.isNaN(dicContrast(0, dphi, 0)), "dark background");
  assert.ok(dicContrast(G, dphi, 1e-3) < dicContrast(G, dphi), "stray light lowers contrast");
});
