// Golden values for microbendSummary (src/physics/fiber-optics/microbend.ts), from an independent script (own Bessel series and
// K_ν integral): exact LP01 loss α = (π/2)(k n₂)³ C² a⁴ W² F′(Q*)²/(J₁²(U)V²) and Petermann's Gaussian loss
// (π/8)(k n₂)⁴ w⁶ C² s e^(−k n₂ w² s) (Petermann, Electron. Lett. 12, 107 (1976); Marcuse, Theory of Dielectric Optical Waveguides,
// 2nd ed., ch. 3), C = A(2π/Λ)², s = 2π/Λ − δ, δ = γ²/(β + k n₂), Λc = 2π/δ.
import assert from "node:assert/strict";
import { test } from "node:test";

import { microbendSummary } from "../src/physics/fiber-optics/microbend";

const close = (actual: number, expected: number, rel = 1e-8) =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${actual} vs ${expected}`);

const smf = { a: 4.1e-6, n1: 1.4494, NA: 0.1246 };

test("SMF-28-like fibre, A = 20 nm, Λ = 0.5 mm, 1 m", () => {
  const s = microbendSummary(smf, 1550e-9, 20e-9, 0.5e-3, 1);
  close(s.V, 2.070856803887589);
  close(s.dBPerMetre, 1.1711903810734874);
  close(s.gaussian, 0.6318449190603999);
  close(s.total, 1.1711903810734874);
  close(s.Lc, 0.6578870745866282e-3);
  close(s.minBendRadius, 0.3166286988823056);
  close(s.mfd, 10.084209113123363e-6);
});

test("1310 nm, A = 50 nm, Λ = 0.1 mm, 100 m", () => {
  const s = microbendSummary(smf, 1310e-9, 50e-9, 0.1e-3, 100);
  close(s.dBPerMetre, 110.53788890376772);
  close(s.total, 11053.788890376773);
  close(s.Lc, 0.4498730724390864e-3);
});

test("zero amplitude: no loss and an infinite tightest radius; Λ ≥ Λc: zero loss", () => {
  const flat = microbendSummary(smf, 1550e-9, 0, 0.5e-3, 1);
  assert.equal(flat.dBPerMetre, 0);
  assert.equal(flat.minBendRadius, Infinity);
  assert.equal(microbendSummary(smf, 1550e-9, 20e-9, 1e-3, 1).dBPerMetre, 0);
});
