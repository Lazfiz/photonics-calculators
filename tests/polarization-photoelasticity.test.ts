import test from "node:test";
import assert from "node:assert/strict";

import {
  C_NBK7, kirschMaxRetardance, kirschRetardanceField, kirschStress, photoelasticRetardance, principalStresses,
} from "../src/physics/polarization/photoelasticity";

const deg = Math.PI / 180;

test("Photoelasticity: Kirsch stress concentration at a hole (Timoshenko & Goodier art. 35)", () => {
  const S = 10e6, a = 1e-3;
  // Hole edge: σ_θθ = 3S across the load (θ = 90°), −S along it (θ = 0); σ_rr = τ_rθ = 0 on the free edge.
  const top = kirschStress(S, a, a, 90 * deg), side = kirschStress(S, a, a, 0);
  assert.ok(Math.abs(top.stt - 3 * S) < 1e-9 * S && Math.abs(side.stt + S) < 1e-9 * S);
  assert.ok(Math.abs(top.srr) < 1e-9 * S && Math.abs(kirschStress(S, a, a, 30 * deg).srt) < 1e-9 * S);
  // Far field: uniaxial S along x, i.e. σ_rr = S cos²θ, σ_θθ = S sin²θ, τ = −S sinθ cosθ.
  const far = kirschStress(S, a, 1e4 * a, 30 * deg);
  assert.ok(Math.abs(far.srr - S * Math.cos(30 * deg) ** 2) < 1e-6 * S);
  assert.ok(Math.abs(far.srt + S * Math.sin(30 * deg) * Math.cos(30 * deg)) < 1e-6 * S);
  assert.ok(Number.isNaN(kirschStress(S, a, 0.5 * a, 0).stt));
});

test("Photoelasticity: principal stresses and the stress-optic law", () => {
  // Far field at any θ: σ₁ − σ₂ = S along x (azimuth 0 mod π).
  const S = 10e6, theta = 30 * deg;
  const p = principalStresses(kirschStress(S, 1e-3, 1, theta), theta);
  assert.ok(Math.abs(p.diff - S) < 1e-3 * S);
  assert.ok(Math.abs(Math.sin(p.azimuth)) < 1e-5, `azimuth ${p.azimuth / deg}°`);
  // N-BK7 (Schott K = 2.77 × 10⁻⁶ mm²/N), 10 mm thick at 10 MPa: R = 2.77e-12 · 0.01 · 1e7 = 277 nm.
  assert.ok(Math.abs(photoelasticRetardance(C_NBK7, 0.01, 10e6) - 277e-9) < 1e-15);
});

test("Photoelasticity: the Kirsch retardance field", () => {
  // N-BK7, 10 mm, 10 MPa, a = 1 mm, field ±4 mm: the centre pixel is in the hole; far edges near R = 277 nm.
  const N = 41;
  const { R, azimuth } = kirschRetardanceField(10e6, 1e-3, C_NBK7, 0.01, N, 4e-3);
  assert.ok(Number.isNaN(R[20 * N + 20]));
  // Pixel on the +y axis at r = 1.17a (row 14, x = 0): τ = 0 there, so R = C d |σ_θθ − σ_rr| = 1.87 × 277 nm.
  const y = (1 - (2 * (14 + 0.5)) / N) * 4e-3;
  const s = kirschStress(10e6, 1e-3, y, Math.PI / 2);
  assert.ok(Math.abs(R[14 * N + 20] - C_NBK7 * 0.01 * Math.abs(s.stt - s.srr)) < 1e-18);
  assert.ok(Math.abs(R[14 * N + 20] / 277e-9 - 1.87) < 0.01 && Number.isFinite(azimuth[0]), `${R[14 * N + 20]}`);
});

test("Photoelasticity: the largest Kirsch retardance is 3SCd, on the hole edge across the load", () => {
  // S = 10 MPa, N-BK7 C = 2.77 TPa⁻¹ (Schott), d = 10 mm: 3 × 10⁷ × 2.77 × 10⁻¹² × 0.01 = 831.0 nm.
  const S = 10e6, d = 10e-3, a = 1e-3;
  assert.ok(Math.abs(kirschMaxRetardance(S, C_NBK7, d) * 1e9 - 831.0) < 1e-9);
  // It is the maximum of the field: a fine polar scan never exceeds it, and the edge at 90° reaches it.
  let max = 0;
  for (let i = 0; i <= 200; i++) for (let j = 0; j <= 180; j++) {
    const r = a * (1 + (i / 200) * 3), th = j * (Math.PI / 180);
    max = Math.max(max, principalStresses(kirschStress(S, a, r, th), th).diff);
  }
  assert.ok(Math.abs(max - 3 * S) < 1e-6 * S, `max σ₁ − σ₂ = ${max}`);
});
