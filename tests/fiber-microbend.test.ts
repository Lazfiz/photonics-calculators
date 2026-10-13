import test from "node:test";
import assert from "node:assert/strict";

import { besselJ } from "../src/physics/math";
import { lp01Mode, modeFieldRadius, vNumber } from "../src/physics/fiber-optics/macro-bending-loss";
import {
  claddingMismatch, criticalPeriod, gaussianMicrobendLoss, lp01TransformSlope, peakTiltLoss, sinusoidalMicrobendLoss,
} from "../src/physics/fiber-optics/microbend";
import { lp01Field } from "../src/physics/fiber-optics/step-index-modes";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const smf = { a: 4.1e-6, n1: 1.44937, NA: 0.1246 };
const lambda = 1550e-9;
const n2 = Math.sqrt(smf.n1 ** 2 - smf.NA ** 2);
const kn = ((2 * Math.PI) / lambda) * n2;

test("critical period: LP01–radiation beat length", () => {
  // Session-18 review (PR #43): ≈ 0.76 mm for a = 4.1 µm, NA 0.12, n₁ 1.468 at 1550 nm. Hand check with
  // Rudolph–Neumann W = 1.1428V − 0.996 and δ ≈ W²/(2a²kn₂): Λc = 2π/δ.
  const f = { a: 4.1e-6, n1: 1.468, NA: 0.12 };
  const V = vNumber(f, lambda);
  const W = 1.1428 * V - 0.996;
  const knf = ((2 * Math.PI) / lambda) * Math.sqrt(f.n1 ** 2 - f.NA ** 2);
  assertRel(criticalPeriod(f, lambda), (2 * Math.PI) / ((W * W) / (2 * f.a ** 2 * knf)), 5e-3, "Λc hand");
  assertRel(criticalPeriod(f, lambda), 0.76e-3, 5e-3, "Λc review");
  assertRel(criticalPeriod(smf, lambda), 0.6579e-3, 1e-3, "Λc SMF-28-like");
});

test("Gaussian closed form equals a numerical sum over plane-wave radiation modes", () => {
  // α = (kn)² Σ_m |⟨m|x|ψ₀⟩|² Φ_c(Δβ_m), Φ_c = (πC²/2) δ(Δβ − ν) for c = C sin νz. With plane waves
  // e^{ik·r}/2π and Δβ = δ + k²/(2kn), the δ-function leaves the ring |k| = k* = √(2kn(ν − δ)) with
  // density kn dφ: α = (kn)³ (πC²/2) ∫₀^{2π} |X(k*, φ)|² dφ. X is evaluated here by 2-D quadrature.
  const w = modeFieldRadius(smf, lambda);
  const delta = claddingMismatch(smf, lambda);
  const norm = Math.sqrt(2 / (Math.PI * w * w));
  for (const period of [0.3e-3, 0.5e-3]) {
    const nu = (2 * Math.PI) / period;
    const kStar = Math.sqrt(2 * kn * (nu - delta));
    const A = 20e-9;
    const C = A * nu * nu;
    // X(k, φ) = (1/2π) ∫∫ x ψ₀ e^{−i k·r} dx dy (imaginary, odd in x); midpoint rule on ±4w.
    const N = 200;
    const h = (8 * w) / N;
    let ring = 0;
    const phis = 16;
    for (let p = 0; p < phis; p++) {
      const phi = (2 * Math.PI * (p + 0.5)) / phis;
      const kx = kStar * Math.cos(phi);
      const ky = kStar * Math.sin(phi);
      let re = 0;
      let im = 0;
      for (let i = 0; i < N; i++) {
        const x = -4 * w + (i + 0.5) * h;
        for (let j = 0; j < N; j++) {
          const y = -4 * w + (j + 0.5) * h;
          const g = x * norm * Math.exp(-(x * x + y * y) / (w * w));
          re += g * Math.cos(kx * x + ky * y);
          im -= g * Math.sin(kx * x + ky * y);
        }
      }
      const X2 = ((re * re + im * im) * h ** 4) / (4 * Math.PI ** 2);
      ring += (X2 * 2 * Math.PI) / phis;
    }
    const expected = kn ** 3 * ((Math.PI * C * C) / 2) * ring;
    assertRel(gaussianMicrobendLoss(smf, lambda, A, period), expected, 1e-4, `Λ = ${period * 1e3} mm`);
  }
});

test("coupling normalization reproduces Marcuse's tilt loss", () => {
  // Integrating α/((kn)² πC²/2) over ν at fixed curvature amplitude C gives Σ_m |X_m|² = ⟨x²⟩ = w²/4.
  // A kink of angle θ (c = θ δ(z), flat spectrum θ²) then loses (kn θ)² w²/4 = (π n w θ/λ)², the small-angle
  // form of Marcuse's tilt loss T = exp(−(π n₂ w θ/λ)²), Bell Syst. Tech. J. 56, 703 (1977).
  const w = modeFieldRadius(smf, lambda);
  const delta = claddingMismatch(smf, lambda);
  const C = 1;
  const rho = (nu: number) => gaussianMicrobendLoss(smf, lambda, C / (nu * nu), (2 * Math.PI) / nu) / (kn * kn * (Math.PI / 2));
  const top = delta + 40 / (kn * w * w);
  const n = 20000;
  const h = (top - delta) / n;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += rho(delta + (i + 0.5) * h) * h;
  assertRel(sum, (w * w) / 4, 1e-6, "Σ|X|²");
  const theta = 1e-3;
  assertRel(kn * kn * theta * theta * sum, ((Math.PI * n2 * w * theta) / lambda) ** 2, 1e-6, "tilt loss");
});

/** Simpson's rule on [0, L] with n (even) intervals. */
function simpson(f: (x: number) => number, L: number, n: number) {
  const h = L / n;
  let sum = f(0) + f(L);
  for (let i = 1; i < n; i++) sum += (i % 2 ? 4 : 2) * f(i * h);
  return (sum * h) / 3;
}

/** α = (π²/2)(kn)³ C² H'(k*)² with H' from a numerical Hankel transform of a radial field ψ(r) (unnormalized). */
function alphaByQuadrature(psi: (r: number) => number, rMax: number, period: number, A: number) {
  const nu = (2 * Math.PI) / period;
  const kStar = Math.sqrt(2 * kn * (nu - claddingMismatch(smf, lambda)));
  const power = 2 * Math.PI * simpson((r) => psi(r) ** 2 * r, rMax, 20000);
  const dH = -simpson((r) => psi(r) * besselJ(1, kStar * r) * r * r, rMax, 20000) / Math.sqrt(power);
  return ((Math.PI ** 2) / 2) * kn ** 3 * (A * nu * nu) ** 2 * dH * dH;
}

test("ring formula: the Hankel-transform form matches the Gaussian closed form", () => {
  // Checks (π²/2)(kn)³C²H'² (header) independently of the Lommel algebra, using the Gaussian mode.
  const w = modeFieldRadius(smf, lambda);
  for (const period of [0.2e-3, 0.5e-3]) {
    const expected = alphaByQuadrature((r) => Math.exp(-((r / w) ** 2)), 8 * w, period, 20e-9);
    assertRel(gaussianMicrobendLoss(smf, lambda, 20e-9, period), expected, 1e-8, `Gaussian Λ = ${period * 1e3} mm`);
  }
});

test("exact LP01 closed form (Lommel integrals) equals the numerical Hankel transform", () => {
  const mode = lp01Mode(vNumber(smf, lambda));
  for (const period of [0.08e-3, 0.2e-3, 0.5e-3, 0.62e-3]) {
    const expected = alphaByQuadrature((r) => lp01Field(mode, r / smf.a), 40 * smf.a, period, 20e-9);
    assertRel(sinusoidalMicrobendLoss(smf, lambda, 20e-9, period), expected, 1e-7, `exact Λ = ${period * 1e3} mm`);
  }
  // F'(Q) is continuous through the removable 0/0 at Q = U.
  const { U } = mode;
  const inside = lp01TransformSlope(mode, U * (1 + 5e-5));
  const outside = lp01TransformSlope(mode, U * (1 + 2e-4));
  assertRel(inside, outside, 1e-3, "F' near Q = U");
  assertRel(lp01TransformSlope(mode, U), simpson((r) => -lp01Field(mode, r) * besselJ(1, U * r) * r * r, 40, 40000), 1e-7, "F'(U)");
});

test("microbend golden values and domain edges", () => {
  // Gaussian, Λ = 0.5 mm, A = 20 nm, hand evaluation: kn = 5.8535e6 /m, w = 5.042 µm (w⁶ = 1.6431e-32 m⁶),
  // δ = 9550.75 /m, ν = 12566.4 /m, s = 3015.6 /m, C = Aν² = 3.1583 /m, kn w² s = 0.44874:
  // (π/8) · 1.1740e27 · 1.6431e-32 · 9.9747 · 3015.6 · e^(−0.44874) = 0.1455 /m (0.632 dB/m).
  assertRel(gaussianMicrobendLoss(smf, lambda, 20e-9, 0.5e-3), 0.1455, 2e-3, "α Gaussian");
  // Exact LP01 (U = 1.55157, W = 1.37152, Q* = a√(2kn s) = 0.7716): F'(Q*) = −0.4703 by the quadrature above,
  // α = (π/2)(kn)³ C² a⁴ W² F'² / (J₁²(U) V²) = 0.2697 /m (1.171 dB/m), 1.85× the Gaussian value.
  assertRel(sinusoidalMicrobendLoss(smf, lambda, 20e-9, 0.5e-3), 0.2697, 2e-3, "α exact");
  // Loss scales as A².
  assertRel(sinusoidalMicrobendLoss(smf, lambda, 40e-9, 0.5e-3) / sinusoidalMicrobendLoss(smf, lambda, 20e-9, 0.5e-3), 4, 1e-12, "A²");
  // Peak tilt (k n₂ w A ν/2)²: 5.8535e6 · 5.042e-6 · 20e-9 · 12566.4 / 2 = 3.709e-3, squared 1.376e-5.
  assertRel(peakTiltLoss(smf, lambda, 20e-9, 0.5e-3), 1.376e-5, 2e-3, "peak tilt");
  const Lc = criticalPeriod(smf, lambda);
  for (const loss of [sinusoidalMicrobendLoss, gaussianMicrobendLoss]) {
    assert.equal(loss(smf, lambda, 20e-9, Lc * 1.001), 0);
    assert.equal(loss(smf, lambda, 0, 0.5e-3), 0);
    assert.equal(loss(smf, lambda, 20e-9, Infinity), 0);
    assert.ok(Number.isNaN(loss(smf, lambda, -1e-9, 0.5e-3)));
    assert.ok(Number.isNaN(loss(smf, lambda, 20e-9, 0)));
    assert.ok(Number.isNaN(loss(smf, 1e-3, 20e-9, 0.5e-3)), "V below MIN_V");
  }
  assert.ok(Number.isFinite(lp01Mode(vNumber(smf, lambda)).U));
});
