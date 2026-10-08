import test from "node:test";
import assert from "node:assert/strict";

import { beamRadius, gaussianDiscFraction, pointingCapture } from "../src/physics/free-space-comms/pointing-loss";
import { besselI0 } from "../src/physics/math";

const close = (actual: number, expected: number, rel: number, msg = "") =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${msg} ${actual} vs ${expected}`);

/** 1 − Q₁(b/σ, a/σ) from the polar form ∫₀ᵃ (ρ/σ²) e^(−(ρ² + b²)/2σ²) I₀(ρb/σ²) dρ, midpoint rule. */
function polarReference(b: number, sigma: number, a: number): number {
  const n = 100000;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const r = ((i + 0.5) * a) / n;
    sum += (r / sigma ** 2) * Math.exp(-(r * r + b * b) / (2 * sigma ** 2)) * besselI0((r * b) / sigma ** 2);
  }
  return (sum * a) / n;
}

test("disc fraction equals 1 − Q₁(b/σ, a/σ): closed form on axis, Marcum table and the polar integral off axis", () => {
  close(gaussianDiscFraction(0, 1, 1), -Math.expm1(-0.5), 1e-10);
  // Q₁(1, 2) = 0.26901 (tabulated Marcum Q-function).
  close(1 - gaussianDiscFraction(1, 1, 2), 0.26901, 2e-4);
  for (const [b, s, a] of [[2, 1, 2], [3, 0.5, 2], [5, 1, 1]]) {
    close(gaussianDiscFraction(b, s, a), polarReference(b, s, a), 1e-7, `b=${b} σ=${s} a=${a}`);
  }
  assert.equal(gaussianDiscFraction(100, 1, 1), 0);
});

test("small aperture: η₀ · w²/(w² + 4s²) · exp(−2b²/(w² + 4s²)) (Farid & Hranilovic 2007)", () => {
  // w = 4 cm beam (σ = 2 cm), a = 0.4 mm, b = 1 cm, jitter s = 1 cm per axis.
  const w = 0.04, a = 4e-4, b = 0.01, s = 0.01;
  const expected = ((2 * a * a) / (w * w)) * (w * w / (w * w + 4 * s * s)) * Math.exp((-2 * b * b) / (w * w + 4 * s * s));
  close(gaussianDiscFraction(b, Math.sqrt((w * w) / 4 + s * s), a), expected, 1e-4);
});

test("beam radius and capture at the page defaults (1550 nm, w₀ = 2.5 cm, 1 km, D = 10 cm, 1 µrad jitter)", () => {
  // z_R = π · 0.025²/1.55e-6 = 1266.8 m; w = 2.5 cm · √(1 + (1000/1266.8)²) = 3.185 cm.
  close(beamRadius(0.025, 1550e-9, 1000), 0.031851, 1e-4);
  const r = pointingCapture(1550e-9, 0.025, 1000, 0.1, 0, 1e-6);
  close(r.alignedFraction, -Math.expm1(-2 * 0.05 ** 2 / 0.031851 ** 2), 1e-4);
  // On axis with jitter: 1 − exp(−2a²/(w² + 4s²)), s = 1 mm.
  close(r.meanFraction, -Math.expm1((-2 * 0.05 ** 2) / (0.031851 ** 2 + 4e-6)), 1e-4);
  assert.ok(r.meanFraction < r.alignedFraction);
});
