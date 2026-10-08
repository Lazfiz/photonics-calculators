import test from "node:test";
import assert from "node:assert/strict";

import { c } from "../src/physics/constants";
import {
  gtiGdd, gtiGroupDelay, gtiPhase, gtiRoundTripPhase, gtiRoundTripTime,
} from "../src/physics/wave-optics/gires-tournois";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// R = 0.64 (ρ = 0.8), n = 1.5, d = 1 µm: t₀ = 2nd/c = 3 µm / c, and δ = 4πnd/λ = 6π µm / λ.
const g = { R: 0.64, n: 1.5, d: 1e-6 };
const t0 = 3e-6 / c;

test("Gires–Tournois: group delay and GDD at hand-calculated points", () => {
  assertRel(gtiRoundTripTime(g), t0, 1e-15, "t₀");
  // Resonance δ = 7π (λ = 6/7 µm): τ = t₀(1 + ρ)/(1 − ρ) = 9t₀, the peak (Kuhl & Heppner 1986).
  assertRel(gtiGroupDelay(g, 6e-6 / 7), 9 * t0, 1e-12, "τ at δ = 7π");
  // Anti-resonance δ = 8π (λ = 750 nm): τ = t₀(1 − ρ)/(1 + ρ) = t₀/9.
  assertRel(gtiGroupDelay(g, 750e-9), t0 / 9, 1e-12, "τ at δ = 8π");
  // Quadrature, cos δ = 0: GDD = 2t₀²ρ(1 − R) sin δ / (1 + R)² = ±0.576/2.6896 t₀² = ±0.2141582 t₀².
  assertRel(gtiGdd(g, 800e-9), -0.2141582391 * t0 * t0, 1e-9, "GDD at δ = 7.5π");
  assertRel(gtiGdd(g, 6e-6 / 6.5), 0.2141582391 * t0 * t0, 1e-9, "GDD at δ = 6.5π");
});

test("Gires–Tournois: φ, τ and GDD match the reflection coefficient, differentiated numerically", () => {
  // Independent route: r(ω) = (ρ + e^(iωt₀)) / (1 + ρ e^(iωt₀)), its phase by atan2, derivatives by
  // central differences. |r| = 1, so the GTI is all-pass.
  const rho = Math.sqrt(g.R);
  const phase = (omega: number) => {
    const cr = Math.cos(omega * t0), ci = Math.sin(omega * t0);
    const [nr, ni, dr, di] = [rho + cr, ci, 1 + rho * cr, rho * ci];
    assert.ok(Math.abs(Math.hypot(nr, ni) / Math.hypot(dr, di) - 1) < 1e-14, "|r| = 1");
    return Math.atan2(ni * dr - nr * di, nr * dr + ni * di);
  };
  const wrap = (x: number) => x - 2 * Math.PI * Math.round(x / (2 * Math.PI));
  const h = 1e-4 / t0; // a step of 1e-4 rad in δ
  for (const deltaMod of [0.5, 2, 3, 4, 5.5]) {
    const delta = 14 * Math.PI + deltaMod;
    const lambda = (4 * Math.PI * g.n * g.d) / delta;
    const omega = (2 * Math.PI * c) / lambda;
    assertRel(gtiRoundTripPhase(g, lambda), delta, 1e-14, `δ at ${deltaMod}`);
    assert.ok(Math.abs(wrap(gtiPhase(g, lambda) - phase(omega))) < 1e-12, `φ at δ mod 2π = ${deltaMod}`);
    const [lo, mid, hi] = [phase(omega - h), phase(omega), phase(omega + h)];
    assertRel(gtiGroupDelay(g, lambda), wrap(hi - lo) / (2 * h), 1e-7, `τ at δ mod 2π = ${deltaMod}`);
    const second = (wrap(hi - mid) - wrap(mid - lo)) / (h * h);
    assertRel(gtiGdd(g, lambda), second, 1e-5, `GDD at δ mod 2π = ${deltaMod}`);
  }
});

test("Gires–Tournois: limits and domain", () => {
  // No front reflection: the layer is a plain delay line, τ = t₀ and GDD = 0 at every λ.
  const bare = { ...g, R: 0 };
  for (const lambda of [700e-9, 800e-9, 1550e-9]) {
    assertRel(gtiGroupDelay(bare, lambda), t0, 1e-14, `τ(R = 0) at ${lambda}`);
    assert.ok(Math.abs(gtiGdd(bare, lambda)) < 1e-45, `GDD(R = 0) at ${lambda}`);
  }
  for (const [bad, lambda] of [[{ ...g, R: 1 }, 1e-6], [{ ...g, n: 0 }, 1e-6], [{ ...g, d: -1e-9 }, 1e-6], [g, 0]] as const) {
    assert.ok(Number.isNaN(gtiGroupDelay(bad, lambda)) && Number.isNaN(gtiGdd(bad, lambda)) &&
      Number.isNaN(gtiPhase(bad, lambda)), `NaN for ${JSON.stringify(bad)}, λ = ${lambda}`);
  }
});
