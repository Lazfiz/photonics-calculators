import test from "node:test";
import assert from "node:assert/strict";

import {
  coneSolidAngle, fieldStopDiameter, ftsMaxHalfAngle, ftsMaxSolidAngle, jacquinotRatio, mirrorRimHalfAngle,
  projectedSolidAngle, slitResolvingPower,
} from "../src/physics/spectroscopy/throughput";
import { airyFringe, etalonOrder, fsrFrequency, fsrWavelength, fwhmFrequency, gapAngle } from "../src/physics/spectroscopy/etalon";
import {
  absorptionFromRingDown, cavityFinesse, minDetectableAbsorption, noiseEquivalentAbsorption, ringDownTime, roundTripLoss,
} from "../src/physics/spectroscopy/cavity-ring-down";
import { coefficientOfFinesse, reflectingFinesse } from "../src/physics/thin-film/interference";

const close = (actual: number, expected: number, rel: number, msg?: string) =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${msg ?? ""} ${actual} vs ${expected}`);

const DEG = Math.PI / 180;
const C = 299792458;

test("Jacquinot: FTS field of view, field stop and the étendue ratio to a slit spectrometer", () => {
  // Griffiths & de Haseth ch. 7: Ω_max = 2πΔν̃/ν̃; 1000 cm⁻¹ at 1 cm⁻¹ → 6.283·10⁻³ sr (part 0 audit, PR #127).
  close(ftsMaxSolidAngle(1000, 1), 6.283185e-3, 1e-6);
  // The cone with 1 − cos α = Δν̃/ν̃ has exactly that solid angle; α ≈ √(2Δν̃/ν̃) = 0.044721 rad (hand: 0.0447251).
  const a = ftsMaxHalfAngle(1000, 1);
  close(coneSolidAngle(a), ftsMaxSolidAngle(1000, 1), 1e-12);
  close(a, 0.0447251, 1e-5);
  close(fieldStopDiameter(a, 0.1), 8.95099e-3, 1e-5); // 2·100 mm·tan α
  assert.ok(Number.isNaN(ftsMaxSolidAngle(1000, 2000)), "Δν̃ > ν̃ has no cone");
  // Littrow: π f/(h tan θ); Jacquinot's 2πf/h at tan θ = ½: f/h = 25 → 157.08 (part 0 audit golden).
  close(jacquinotRatio(0.025, 0.001, Math.atan(0.5), Math.atan(0.5)), 50 * Math.PI, 1e-12);
  close(jacquinotRatio(0.025, 0.001, 30 * DEG, 30 * DEG), (25 * Math.PI) / Math.tan(30 * DEG), 1e-12);
  // Slit-limited R = 2f tan θ/w: 25 mm, 50 µm, 30° → 577.35.
  close(slitResolvingPower(0.025, 50e-6, 30 * DEG, 30 * DEG), 1000 * Math.tan(30 * DEG), 1e-12);
});

test("concave mirror: rim cone, exact vs small-angle solid angle", () => {
  // f/1 cone (tan α = ½): 2π(1 − 2/√5) = 0.66333 sr; πα² ≈ π/4 is 18.4 % high (part 0 audit finding).
  close(coneSolidAngle(Math.atan(0.5)), 2 * Math.PI * (1 - 2 / Math.sqrt(5)), 1e-12);
  close(Math.PI / 4 / coneSolidAngle(Math.atan(0.5)), 1.18402, 1e-5);
  close(projectedSolidAngle(Math.atan(0.5)), Math.PI / 5, 1e-12); // π sin²α, sin²α = 1/5
  // R_c = 50 mm, D = 25 mm: sag 50 − √2343.75 = 1.5877 mm, rim at 23.4123 mm from the focus → α = 28.098°.
  close(mirrorRimHalfAngle(0.05, 0.025) / DEG, 28.0981, 1e-5);
  // Edge: rim at the focal plane (D = √3 R_c) or wider has no cone.
  assert.ok(Number.isNaN(mirrorRimHalfAngle(0.05, 0.09)));
});

test("etalon: FSR, finesse, exact Airy width and the fringe sampling", () => {
  // Part 0 audit golden: n = 1, d = 10 µm, λ = 1550 nm → FSR λ²/(2nd) = 120.125 nm, ℱ(R = 0.8) = π√0.8/0.2 = 14.05.
  close(fsrWavelength(1550e-9, 1, 10e-6, 1), 120.125e-9, 1e-12);
  const F = coefficientOfFinesse(0.8);
  close(F, 80, 1e-12);
  close(reflectingFinesse(F), 14.0496, 1e-5);
  close(fsrFrequency(1, 10e-6, 1), C / 2e-5, 1e-12); // 14.9896 THz
  close(etalonOrder(1, 10e-6, 1, 1550e-9), 12.9032, 1e-5);
  // Born & Wolf §7.6.1: FWHM 4 asin(1/√F) in phase; F = 80 → 0.44815 rad → 1.06914 THz (FSR/ℱ = 1.0669 THz).
  close(fwhmFrequency(fsrFrequency(1, 10e-6, 1), F), 1.06914e12, 1e-5);
  // Snell into n = 1.5 at 30°: sin θ = 1/3.
  close(Math.sin(gapAngle(30 * DEG, 1.5)), 1 / 3, 1e-12);
  // The ψ-grid keeps a peak sample at T = 1 in every order even at R = 0.999 (ℱ ≈ 3140), where a 2 nm grid aliased.
  const fr = airyFringe(1e-3, 1550e-9, coefficientOfFinesse(0.999), 1, 240);
  assert.equal(fr.T.filter((t) => t > 0.999999).length, 3);
  assert.ok(fr.lambda.every((x, i) => i === 0 || x > fr.lambda[i - 1]), "wavelengths ascend");
  close(Math.min(...fr.T), 1 / (1 + coefficientOfFinesse(0.999)), 1e-9);
});

test("cavity ring-down: decay time, absorption, sensitivity and finesse", () => {
  // Part 0 audit goldens: R = 99.99 %, L = 1 m: τ₀ = 2L/(c·2·(−ln R)) = 33.355 µs; A = 0.001 per pass → τ = 1.3884 µs.
  const L0 = roundTripLoss(0.9999, 0.9999, 0, 0);
  const L1 = roundTripLoss(0.9999, 0.9999, 0, 0.001);
  const tau0 = ringDownTime(1, L0);
  const tau = ringDownTime(1, L1);
  close(tau0, 33.3547e-6, 1e-5);
  close(tau, 1.38835e-6, 1e-5);
  // Berden, Peeters & Meijer 2000: α = (1/c)(1/τ − 1/τ₀) returns the filled-cavity α = A ln 10/L.
  close(absorptionFromRingDown(tau, tau0), 0.001 * Math.LN10, 1e-9);
  // α_min = (Δτ/τ)/(cτ₀) = (Δτ/τ)(−ln R)/L: 1 % → 1.00005·10⁻⁶ m⁻¹; 10 Hz averaging → /√10.
  const aMin = minDetectableAbsorption(tau0, 0.01);
  close(aMin, 0.01 * -Math.log(0.9999), 1e-9);
  close(noiseEquivalentAbsorption(aMin, 10), aMin / Math.sqrt(10), 1e-12);
  // ℱ → 2π/Λ for small loss, and FSR/ℱ equals the mode width 1/(2πτ) to O(Λ²).
  close(cavityFinesse(L0), (2 * Math.PI) / L0, 1e-8);
  close(C / 2 / cavityFinesse(L0), 1 / (2 * Math.PI * tau0), 1e-8);
  // Lossless symmetric mirrors: ρ = R, so ℱ = π√R/(1 − R) as for an etalon (R = 0.8 → 14.05).
  close(cavityFinesse(roundTripLoss(0.8, 0.8, 0, 0)), reflectingFinesse(coefficientOfFinesse(0.8)), 1e-12);
  // Edge: R > 1 (a gain medium, not a passive cavity) is rejected instead of giving a growing decay.
  assert.ok(Number.isNaN(roundTripLoss(1.0001, 0.9999, 0, 0)));
  assert.ok(Number.isNaN(ringDownTime(1, roundTripLoss(1, 1, 0, 0))), "lossless cavity has no ring-down");
});
