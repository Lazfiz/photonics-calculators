import test from "node:test";
import assert from "node:assert/strict";

import { c, epsilon_0 } from "../src/physics/constants";
import {
  GAUSSIAN_PULSE_G2, averageShgPower, backwardCoherenceLength, boydKleinmanH, confocalParameter, forwardCoherenceLength,
  shgCoefficient,
} from "../src/physics/imaging/second-harmonic-generation";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

test("Boyd–Kleinman optimum: h = 1.068 at ξ = 2.84, σ = 0.57", () => {
  // Boyd & Kleinman, J. Appl. Phys. 39, 3597 (1968), B = 0. Golden-section search over σ.
  let lo = 0, hi = 1.5;
  const g = (Math.sqrt(5) - 1) / 2;
  for (let i = 0; i < 60; i++) {
    const a = hi - g * (hi - lo), b = lo + g * (hi - lo);
    if (boydKleinmanH(a, 2.84) > boydKleinmanH(b, 2.84)) hi = b; else lo = a;
  }
  const sigmaMax = (lo + hi) / 2;
  assertRel(boydKleinmanH(sigmaMax, 2.84), 1.068, 2e-3, "h_m");
  assert.ok(Math.abs(sigmaMax - 0.57) < 0.02, `σ_m = ${sigmaMax}`);
});

test("h has the closed form arctan²ξ/ξ at σ = 0 and the plane-wave limit at ξ ≪ 1", () => {
  // ∫_{−ξ}^{ξ} dτ/(1 + iτ) = 2 arctan ξ, so h(0, ξ) = arctan²ξ/ξ.
  for (const xi of [0.1, 1, 2.84, 50, 500]) assertRel(boydKleinmanH(0, xi), Math.atan(xi) ** 2 / xi, 1e-6, `ξ = ${xi}`);
  // ξ → 0: h → ξ sinc²(σξ) (= ξ sinc²(ΔkL/2)), up to a relative 2σξ²/3 from the Gouy phase.
  for (const sigma of [-3, 0.5, 20]) {
    const xi = 1e-3, x = sigma * xi;
    assertRel(boydKleinmanH(sigma, xi), xi * (Math.sin(x) / x) ** 2, 1e-4, `σ = ${sigma}`);
  }
});

test("tight focus in a thick slab: h → π² e^(−2σ)/ξ for σ > 0, ≈ 0 for σ < 0", () => {
  // Residue at τ = i: ∫_{−∞}^{∞} e^{iστ}/(1 + iτ) dτ = 2π e^{−σ} (σ > 0), 0 (σ < 0).
  assertRel(boydKleinmanH(1, 200), (Math.PI ** 2 * Math.exp(-2)) / 200, 0.01, "σ = 1");
  assert.ok(boydKleinmanH(-1, 200) < 1e-3 * boydKleinmanH(1, 200), "normal dispersion cancels");
});

test("near-field coefficient equals the plane-wave SHG intensity integrated over the Gaussian beam", () => {
  // Coupled amplitudes (Boyd, Nonlinear Optics §2.7, P(2ω) = 2ε₀ d E²): I_2ω = ω₂² d² L² I²/(2 n_ω² n_2ω ε₀ c³),
  // ω₂ = 4πc/λ. Integrate I(r) = I₀ exp(−2r²/w₀²) over the beam, at Δn = 0 and L ≪ b.
  const lambda = 1064e-9, L = 1e-6, d = 2e-12, n1 = 1.5, n2 = 1.5, w0 = 20e-6, P = 1;
  const w2 = (4 * Math.PI * c) / lambda;
  const I0 = (2 * P) / (Math.PI * w0 * w0);
  let P2 = 0;
  const dr = w0 / 2000;
  for (let r = dr / 2; r < 5 * w0; r += dr) {
    const I = I0 * Math.exp((-2 * r * r) / (w0 * w0));
    P2 += ((w2 * w2 * d * d * L * L * I * I) / (2 * n1 * n1 * n2 * epsilon_0 * c ** 3)) * 2 * Math.PI * r * dr;
  }
  const res = shgCoefficient({ lambda, length: L, deff: d, nOmega: n1, deltaN: 0, w0 });
  assert.ok(res.xi < 1e-3, "near field");
  assertRel(res.KNearField * P * P, P2, 1e-4, "near-field K");
  assertRel(res.K, res.KNearField, 1e-3, "h ≈ ξ");
  assertRel(res.b, confocalParameter(lambda, n1, w0), 1e-12, "b");
  assertRel(res.b, (2 * Math.PI * 1.5 * 400e-12) / lambda, 1e-12, "b = 2πnw₀²/λ");
});

test("page defaults: a 10 µm slab is 4.7 confocal parameters thick, so the plane-wave L² overestimates", () => {
  // 800 nm, NA 0.8: w₀ = 2ω_xy = 0.450481 µm; b = 2π · 1.33 · w₀²/λ = 2.119798 µm; ξ = 10/b = 4.717431.
  // Δn = 0.01 → Δk = −4π · 0.01/0.8 µm = −0.157080 /µm; σ = bΔk/2 = −0.166489.
  // Near field: ξ sinc²(ΔkL/2) = 4.717431 · sinc²(−0.785398) = 4.717431 · 0.810569 = 3.823806.
  const res = shgCoefficient({ lambda: 800e-9, length: 10e-6, deff: 1e-12, nOmega: 1.33, deltaN: 0.01, w0: 0.450481e-6 });
  assertRel(res.b, 2.119798e-6, 1e-5, "b");
  assertRel(res.xi, 4.717431, 1e-5, "ξ");
  assertRel(res.sigma, -0.166489, 1e-4, "σ");
  assertRel(res.KNearField / res.K, 3.823806 / res.h, 1e-5, "ratio");
  assert.ok(res.h < 1 && res.KNearField / res.K > 4, `h = ${res.h}`);
});

test("pulse factor and coherence lengths", () => {
  // ∫P² dt/(∫P dt)² · (1/τ) for a Gaussian pulse = √(2 ln 2/π) = 0.664 (Xu & Webb 1996, g_p).
  const tau = 1, dt = 1e-3;
  let s1 = 0, s2 = 0;
  for (let t = -5; t <= 5; t += dt) { const p = Math.exp((-4 * Math.LN2 * t * t) / (tau * tau)); s1 += p * dt; s2 += p * p * dt; }
  assertRel((s2 * tau) / (s1 * s1), GAUSSIAN_PULSE_G2, 1e-6, "g");
  assertRel(GAUSSIAN_PULSE_G2, 0.664282, 1e-5, "0.664");
  assertRel(averageShgPower(1e-6, 0.05, 80e6, 100e-15), (1e-6 * 0.664282 * 0.0025) / (80e6 * 100e-15), 1e-5, "⟨P_2ω⟩");
  // λ = 800 nm: Δn = 0.01 → 20 µm; backward λ/(4(1.33 + 1.34)) = 74.906 nm.
  assertRel(forwardCoherenceLength(800e-9, 0.01), 20e-6, 1e-12, "L_c");
  assertRel(forwardCoherenceLength(800e-9, -0.01), 20e-6, 1e-12, "|Δn|");
  assert.equal(forwardCoherenceLength(800e-9, 0), Infinity);
  assertRel(backwardCoherenceLength(800e-9, 1.33, 1.34), 74.906e-9, 1e-5, "backward");
});

test("domain guards", () => {
  assert.ok(Number.isNaN(boydKleinmanH(0, 0)));
  assert.ok(Number.isNaN(shgCoefficient({ lambda: 800e-9, length: 0, deff: 1e-12, nOmega: 1.33, deltaN: 0.01, w0: 0.45e-6 }).K));
  assert.ok(Number.isNaN(shgCoefficient({ lambda: 800e-9, length: 1e-5, deff: 1e-12, nOmega: 1.33, deltaN: 0.01, w0: 0 }).K));
  assert.ok(Number.isNaN(averageShgPower(1e-6, 0.05, 0, 100e-15)));
});
