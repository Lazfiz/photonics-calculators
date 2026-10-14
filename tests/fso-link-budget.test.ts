import test from "node:test";
import assert from "node:assert/strict";

import {
  apertureGain, fraunhoferDistance, freeSpacePathLoss, friisReceivedPower, gaussianTxGain, kleinDegnanEfficiency,
  optimumTruncation, toDb, topHatGeometricLoss, truncatedGaussianFarField, truncatedGaussianWidth,
} from "../src/physics/free-space-comms/link-budget";
import { pointingCapture } from "../src/physics/free-space-comms/pointing-loss";
import { besselJ, firstCrossing } from "../src/physics/math";

const close = (actual: number, expected: number, tol: number, msg = "") =>
  assert.ok(Math.abs(actual - expected) <= tol, `${msg} ${actual} vs ${expected}`);

test("FSPL and aperture gain at 1550 nm (Friis 1946; Degnan & Klein 1974, hand)", () => {
  // 4π·1000/1.55e-6 = 8.107319e9, 20·log₁₀ = 198.1776 dB.
  close(toDb(freeSpacePathLoss(1000, 1550e-9)), 198.1776, 1e-4);
  // π·0.1/1.55e-6 = 202683.3, squared 4.108053e10 = 106.1364 dBi.
  close(toDb(apertureGain(0.1, 1550e-9)), 106.1364, 1e-4);
  // Obscuration 0.15 and η = 0.75: + 10 log₁₀(0.9775·0.75) = −1.3482 dB.
  close(toDb(apertureGain(0.1, 1550e-9, 0.15, 0.75)), 104.7881, 1e-4);
  // 1 mrad half-angle: 8/1e-6 = 8e6 = 69.0309 dBi.
  close(toDb(gaussianTxGain(1e-3)), 69.0309, 1e-4);
  assert.ok(Number.isNaN(gaussianTxGain(0)));
});

test("lasercom Friis budget, 5 cm → 10 cm over 500 km at 1550 nm: −33.42 dBm (hand)", () => {
  // G_t = 99.1467 dBi (η 0.8), G_r = 104.5873 dBi (η 0.7), FSPL = 252.1570 dB; 20 + 99.1467 + 104.5873 − 252.1570
  // − 3 (pointing) − 2 (atmosphere) = −33.4230 dBm.
  const gt = apertureGain(0.05, 1550e-9, 0, 0.8), gr = apertureGain(0.1, 1550e-9, 0, 0.7);
  const r = friisReceivedPower(0.1, gt, gr, 5e5, 1550e-9, 0.8 * 0.7);
  assert.equal(r.capped, false);
  close(toDb(r.power / 1e-3) - 5, -33.4230, 1e-4);
  // 2D²/λ = 2·0.0025/1.55e-6 = 3225.8 m.
  close(fraunhoferDistance(0.05, 1550e-9), 3225.806, 1e-3);
});

test("Friis with 8/θ² equals the small-aperture limit of the exact Gaussian capture (independent check)", () => {
  // θ = 1 mrad half-angle at 1550 nm: w₀ = λ/(πθ) = 0.4934 mm; at 2 km w ≈ 2 m ≫ a = 5 cm.
  const theta = 1e-3, lambda = 1550e-9, range = 2000, d = 0.1;
  const friis = friisReceivedPower(1, gaussianTxGain(theta), apertureGain(d, lambda), range, lambda).fraction;
  const exact = pointingCapture(lambda, lambda / (Math.PI * theta), range, d, 0, 0).alignedFraction;
  // Friis = 2a²/w², exact = 1 − exp(−2a²/w²): they differ by ≈ a²/w² ≈ 6e-4 relative.
  assert.ok(Math.abs(friis / exact - 1) < 1e-3, `${friis} vs ${exact}`);
});

test("Friis is capped at P_t·η when the receiver would catch more than the beam (edge case)", () => {
  // 10 cm apertures 10 m apart at 1550 nm: Friis fraction ≈ 3.5e5, unphysical.
  const g = apertureGain(0.1, 1550e-9);
  const r = friisReceivedPower(2, g, g, 10, 1550e-9, 0.5);
  assert.equal(r.capped, true);
  assert.equal(r.power, 1);
  assert.ok(r.fraction > 1e5);
});

test("Klein–Degnan transmit efficiency (Appl. Opt. 13, 2134 (1974))", () => {
  // Their optimum without obscuration: α = 1.12, g = 0.8145 (−0.89 dB).
  const opt = optimumTruncation(0);
  close(opt.alpha, 1.1209, 1e-3);
  close(opt.efficiency, 0.81452, 1e-4);
  // Hand: α = 1, γ = 0.15: 2·(e^−1 − e^−0.0225)² = 2·(0.367879 − 0.977751)² = 0.743887.
  close(kleinDegnanEfficiency(1, 0.15), 0.743887, 1e-6);
  // Their fit α_opt ≈ 1.12 − 1.30γ² + 2.12γ⁴ (γ < 0.4) agrees with the search to < 1 %.
  for (const g of [0.1, 0.2, 0.3]) {
    const fit = 1.12 - 1.3 * g * g + 2.12 * g ** 4;
    assert.ok(Math.abs(optimumTruncation(g).alpha / fit - 1) < 0.01, `γ = ${g}`);
  }
  // Edge cases: a fully obscured aperture radiates nothing on axis; α ≤ 0 is undefined.
  assert.equal(kleinDegnanEfficiency(1, 1), 0);
  assert.ok(Number.isNaN(kleinDegnanEfficiency(0)));
});

test("geometric loss, 5 mm exit, 1 mrad, 1 km, 10 cm receiver: top-hat 20.04 dB vs Gaussian 17.03 dB (hand)", () => {
  // Top-hat: 20·log₁₀((0.005 + 1)/0.1) = 20.0433 dB (Kim & Korevaar 2001).
  close(topHatGeometricLoss(0.005, 1e-3, 1000, 0.1), 20.0433, 1e-4);
  // Gaussian, 0.5 mrad half-angle: w₀ = 0.98676 mm, z_R = 1.9735 m, w(1 km) = 0.500001 m;
  // 1 − exp(−2·0.05²/0.25) = 0.0198013 → 17.0331 dB, 3.01 dB less than the top-hat.
  const w0 = 1550e-9 / (Math.PI * 0.5e-3);
  close(-toDb(pointingCapture(1550e-9, w0, 1000, 0.1, 0, 0).alignedFraction), 17.0331, 1e-4);
  // Edge case: a beam no wider than the receiver loses nothing.
  assert.equal(topHatGeometricLoss(0.005, 1e-3, 50, 0.1), 0);
});

test("far-field width of a truncated, obscured Gaussian (Fraunhofer Hankel transform)", () => {
  // Uniform disc (α → 0): Airy (2J₁(u)/u)² = e^−2 at u = 2.58384 (independent closed form, solved here).
  const airy = firstCrossing((u) => ((2 * besselJ(1, u)) / u) ** 2, 1e-9, 3.8, Math.exp(-2));
  close(truncatedGaussianWidth(1e-6, 0), airy, 1e-4);
  // Uniform annulus γ = 0.5: [(2J₁(u)/u − γ²·2J₁(γu)/(γu))/(1 − γ²)]² (closed form).
  const jinc = (x: number) => (2 * besselJ(1, x)) / x;
  const ann = (u: number) => ((jinc(u) - 0.25 * jinc(0.5 * u)) / 0.75) ** 2;
  for (const u of [2, 5, 10]) close(truncatedGaussianFarField(u, 0, 0.5), ann(u), 1e-8, `u = ${u}`);
  // A weakly truncated beam (α = 3) keeps the Gaussian width u = 2α.
  close(truncatedGaussianWidth(3, 0), 6, 1e-3);
  // Cut at its 1/e² radius (α = 1) the lobe is 1.44× wider: u = 2.8733 (also 2.874 from a separate scratch integral).
  close(truncatedGaussianWidth(1, 0), 2.8733, 1e-3);
  // Edge case: a fully obscured aperture has no beam.
  assert.ok(Number.isNaN(truncatedGaussianFarField(1, 1, 1)));
});

test("optical-antenna defaults: 10 cm, 1550 nm, γ = 0.15, η = 0.75, M² = 1.1, α = 1 (hand)", () => {
  const D = 0.1, lambda = 1550e-9, M2 = 1.1;
  // 106.1364 − 1.2849 (g = 0.743887) − 1.2494 (η) − 1.6557 (M⁴ = 1.4641) = 101.9463 dBi.
  close(toDb((apertureGain(D, lambda) * kleinDegnanEfficiency(1, 0.15) * 0.75) / M2 ** 4), 101.9463, 1e-4);
  // W₀ = a = 50 mm: z_R = π·0.05²/(1.1·1.55e-6) = 4606.44 m; untruncated θ = 1.1·1.55e-6/(π·0.05) = 10.854 µrad.
  close((Math.PI * 0.05 ** 2) / (M2 * lambda), 4606.44, 0.01);
  // Clipped at α = 1, γ = 0.15: u = 2.8032, θ = 1.1·2.8032·1.55e-6/(2π·0.05) = 15.21 µrad.
  close((M2 * truncatedGaussianWidth(1, 0.15) * lambda) / (2 * Math.PI * 0.05) * 1e6, 15.213, 2e-3);
});

test("link-budget page: exact Gaussian capture vs Friis (hand; near-field gap from the physics review)", () => {
  // Defaults: θ = 2 mrad full, 10 cm, 1 km. w₀ = λ/(π·1e-3) = 0.49338 mm, z_R = 0.49338 m, w(1 km) = 1.0000001 m;
  // 1 − exp(−2·0.05²) = 0.0049875 → −23.0212 dB, Friis 2a²/w² = 0.005 → −23.0103 dB.
  const lambda = 1550e-9, theta = 1e-3;
  const exact = pointingCapture(lambda, lambda / (Math.PI * theta), 1000, 0.1, 0, 0).alignedFraction;
  close(toDb(exact), -23.0212, 1e-4);
  close(toDb(friisReceivedPower(1, gaussianTxGain(theta), apertureGain(0.1, lambda), 1000, lambda).fraction), -23.0103, 1e-4);
  // θ = 0.05 mrad half-angle, 500 m, 1 cm: z_R = λ/(πθ²) = 197.4 m, so the beam is still near its waist.
  // Friis 2a²/(θR)² = 0.0800, exact 0.06688 (independent value from the review script).
  const near = pointingCapture(lambda, lambda / (Math.PI * 5e-5), 500, 0.01, 0, 0).alignedFraction;
  close(friisReceivedPower(1, gaussianTxGain(5e-5), apertureGain(0.01, lambda), 500, lambda).fraction, 0.08, 1e-6);
  close(near, 0.06688, 1e-5);
});

test("Klein–Degnan optimum with heavy obscuration and a mildly clipped width (review brute force)", () => {
  const opt = optimumTruncation(0.5);
  close(opt.alpha, 0.9243, 2e-4);
  close(opt.efficiency, 0.34182, 2e-5);
  close(truncatedGaussianWidth(2, 0), 4.0668, 1e-3);
});
