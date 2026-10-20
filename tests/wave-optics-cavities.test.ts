import test from "node:test";
import assert from "node:assert/strict";

import { c } from "../src/physics/constants";
import { periodicEigenmode, systemMatrix } from "../src/physics/wave-optics/abcd";
import {
  gParameter, modeFrequency, oneWayGouyPhase, resonatorFsr, resonatorStability, transverseModeSpacing, twoMirrorMode,
} from "../src/physics/wave-optics/two-mirror-resonator";
import {
  regularRingIncidence, ringCoefficientOfFinesse, ringFinesse, ringFsr, ringPhotonLifetime, ringPlaneMode, ringResponse,
  tiltedMirrorRadius,
} from "../src/physics/wave-optics/ring-cavity";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const LAMBDA = 1064e-9;

test("two-mirror resonator: symmetric waist (Siegman ch. 19), cavity-stability defaults", () => {
  // R₁ = R₂ = 1 m, L = 0.5 m, g = 0.5: w₀² = (λL/2π)√((1 + g)/(1 − g)) = 1.46656e-7 m² → 0.38295 mm (part 0 audit: 0.3830).
  const g = gParameter(0.5, 1);
  assert.equal(g, 0.5);
  const mode = twoMirrorMode(LAMBDA, 0.5, g, g);
  assertRel(mode.w0, Math.sqrt(((LAMBDA * 0.5) / (2 * Math.PI)) * Math.sqrt(3)), 1e-12, "w₀");
  assertRel(mode.w0 * 1e3, 0.38295, 1e-4, "w₀ (mm)");
  assertRel(mode.z1, 0.25, 1e-12, "waist at the centre");
  // Mirror spot w₁² = (λL/π)/√(1 − g²) for a symmetric cavity.
  assertRel(mode.w1, Math.sqrt((LAMBDA * 0.5) / Math.PI / Math.sqrt(0.75)), 1e-12, "w₁");
});

test("two-mirror resonator: asymmetric mode matches both mirror curvatures (Kogelnik & Li 1966)", () => {
  // L = 0.4 m, R₁ = 1 m, R₂ = 0.6 m: g₁ = 0.6, g₂ = 1/3, z_R = 0.3 m and z₁ = 0.1 m exactly. Independent check: the
  // wavefront radius z + z_R²/z equals R₁ at mirror 1 (z = 0.1 m) and R₂ at mirror 2 (z = 0.3 m).
  const L = 0.4;
  const g1 = gParameter(L, 1);
  const g2 = gParameter(L, 0.6);
  const m = twoMirrorMode(LAMBDA, L, g1, g2);
  assertRel(m.zR, 0.3, 1e-12, "z_R");
  assertRel(m.z1, 0.1, 1e-12, "z₁");
  assertRel(m.z1 + m.zR ** 2 / m.z1, 1, 1e-12, "R(z₁) = R₁");
  const z2 = L - m.z1;
  assertRel(z2 + m.zR ** 2 / z2, 0.6, 1e-12, "R(z₂) = R₂");
  assertRel(m.w1, m.w0 * Math.hypot(1, m.z1 / m.zR), 1e-12, "w₁ = w(z₁)");
  assertRel(m.w2, m.w0 * Math.hypot(1, z2 / m.zR), 1e-12, "w₂ = w(z₂)");
  // The round-trip ABCD eigenmode from mirror 1 gives the same spot, and twice the one-way Gouy phase.
  const M = systemMatrix([
    { kind: "space", d: L }, { kind: "curved-mirror", R: 0.6 }, { kind: "space", d: L }, { kind: "curved-mirror", R: 1 },
  ]);
  const e = periodicEigenmode(M, LAMBDA);
  assertRel(e.w, m.w1, 1e-12, "eigenmode w at mirror 1");
  assertRel(-e.z, m.z1, 1e-12, "eigenmode waist distance");
  assertRel(e.gouy, 2 * oneWayGouyPhase(g1, g2), 1e-12, "round-trip Gouy phase");
});

test("two-mirror resonator: index fills the cavity, confocal limit, unstable and marginal cases", () => {
  // A medium of index n shortens λ to λ/n: w₀ scales as 1/√n, g is unchanged, FSR = c/(2nL).
  const g = gParameter(0.5, 1);
  assertRel(twoMirrorMode(LAMBDA, 0.5, g, g, 1.5).w0, twoMirrorMode(LAMBDA, 0.5, g, g).w0 / Math.sqrt(1.5), 1e-12, "n = 1.5");
  assertRel(resonatorFsr(0.5, 1.5), c / 1.5, 1e-15, "FSR with index");
  // Symmetric confocal: w₀² = λL/2π, mirror spot √2 w₀, and the general form tends to it.
  const conf = twoMirrorMode(LAMBDA, 0.1, 0, 0);
  assertRel(conf.w0, Math.sqrt((LAMBDA * 0.1) / (2 * Math.PI)), 1e-12, "confocal w₀");
  assertRel(conf.w1, Math.SQRT2 * conf.w0, 1e-12, "confocal mirror spot");
  assertRel(twoMirrorMode(LAMBDA, 0.1, 1e-6, 1e-6).w0, conf.w0, 1e-5, "limit towards confocal");
  assert.equal(resonatorStability(0.5, 0.5), "stable");
  assert.equal(resonatorStability(1, 1), "marginal", "planar");
  assert.equal(resonatorStability(-1, -1), "marginal", "concentric");
  assert.equal(resonatorStability(-2, -2), "unstable");
  assert.ok(Number.isNaN(twoMirrorMode(LAMBDA, 0.3, -2, -2).w0), "unstable: no mode");
  assert.ok(Number.isNaN(gParameter(0.1, 0)), "R = 0");
  assert.equal(gParameter(0.1, Infinity), 1, "flat mirror");
});

test("mode spacing: Siegman sign branch for negative g (part 0 audit, 0.6662 GHz)", () => {
  // L = 150 mm, R = 100 mm: g = −0.5, θ = acos(−0.5) = 2π/3, Δν_T = FSR·θ/π = (c/0.3 m)(2/3) = 0.666205 GHz.
  const fsr = resonatorFsr(0.15);
  assertRel(fsr, c / 0.3, 1e-15, "FSR");
  const gNeg = gParameter(0.15, 0.1);
  assertRel(transverseModeSpacing(fsr, gNeg, gNeg) / 1e9, 0.666205, 1e-6, "Δν_T, g = −0.5");
  // R = 300 mm: g = +0.5, θ = π/3, Δν_T = 0.333103 GHz.
  const gPos = gParameter(0.15, 0.3);
  assertRel(transverseModeSpacing(fsr, gPos, gPos) / 1e9, 0.333103, 1e-6, "Δν_T, g = +0.5");
  // Confocal: Δν_T = FSR/2, so TEM₀₀ of order q + 1 and TEM₂₀ of order q coincide.
  assertRel(transverseModeSpacing(fsr, 0, 0), fsr / 2, 1e-15, "confocal");
  assertRel(modeFrequency(fsr, 0, 0, 3, 2), modeFrequency(fsr, 0, 0, 4, 0), 1e-15, "confocal degeneracy");
  assert.ok(Number.isNaN(oneWayGouyPhase(-2, -2)), "unstable");
});

test("ring cavity: finesse π ρ^¼/(1 − √ρ) (part 0 audit, 102.42), FSR and lifetime", () => {
  // ρ = 0.95 × 0.99 = 0.9405: ρ^¼ = 0.984790, 1 − √ρ = 0.0302109, ℱ = 102.422.
  const rho = 0.95 * 0.99;
  assertRel(ringFinesse(rho), 102.422, 1e-5, "ℱ");
  assertRel(ringFinesse(rho), (Math.PI * Math.sqrt(ringCoefficientOfFinesse(rho))) / 2, 1e-12, "ℱ = π√F/2");
  // Low-loss limit ℱ → 2π/(1 − ρ).
  assertRel(ringFinesse(0.9999), (2 * Math.PI) / 1e-4, 1e-4, "ρ → 1");
  assert.ok(Number.isNaN(ringFinesse(1)), "lossless ring has no finite finesse");
  const fsr = ringFsr(0.3);
  assertRel(fsr, c / 0.3, 1e-15, "FSR = c/L");
  // τ = (L/c)/(−ln ρ) = 1.000692 ns / 0.0613439 = 16.3129 ns.
  assertRel(ringPhotonLifetime(0.3, rho) * 1e9, 16.3129, 1e-5, "τ");
  // Half power at Δν = ±FSR/(2ℱ) when ℱ ≫ 1.
  assertRel(ringResponse(fsr / (2 * ringFinesse(rho)), fsr, ringCoefficientOfFinesse(rho)), 0.5, 1e-3, "half width");
  assert.equal(ringResponse(fsr, fsr, ringCoefficientOfFinesse(rho)), 1, "next resonance");
});

test("ring cavity: period matrix and tilted-mirror astigmatism (Kogelnik et al. 1972)", () => {
  // Untilted, d = 100 mm, R = 1 m: m = 1 − d/R = 0.9, w² = (λd/π)/√(1 − m²) → 0.278745 mm (part 0 audit: 0.2787 mm).
  const flat = ringPlaneMode(LAMBDA, 0.1, 1, 0, "tangential");
  assertRel(flat.m, 0.9, 1e-12, "half-trace");
  assertRel(flat.w * 1e3, 0.278745, 1e-5, "spot on the mirror");
  assertRel(flat.z, 0.05, 1e-12, "waist mid-way");
  // Each plane equals a symmetric two-mirror cavity of length d with mirrors R cos α or R/cos α.
  const alpha = regularRingIncidence(3);
  assertRel(alpha, Math.PI / 6, 1e-15, "regular triangle: 30°");
  for (const plane of ["tangential", "sagittal"] as const) {
    const Reff = tiltedMirrorRadius(1, alpha, plane);
    const g = gParameter(0.1, Reff);
    const ref = twoMirrorMode(LAMBDA, 0.1, g, g);
    const ring = ringPlaneMode(LAMBDA, 0.1, 1, alpha, plane);
    assertRel(ring.w, ref.w1, 1e-12, `${plane} spot`);
    assertRel(ring.w0, ref.w0, 1e-12, `${plane} waist`);
  }
  assertRel(tiltedMirrorRadius(1, alpha, "tangential"), Math.sqrt(3) / 2, 1e-15, "R_t = R cos 30°");
  // Stable only for d < 2R_t in the tangential plane: past it there is no mode.
  assert.ok(Number.isNaN(ringPlaneMode(LAMBDA, 1.8, 1, alpha, "tangential").w), "d > 2R cos α");
  assert.ok(Number.isFinite(ringPlaneMode(LAMBDA, 1.8, 1, alpha, "sagittal").w), "sagittal still stable");
});
