import test from "node:test";
import assert from "node:assert/strict";

import { TORR, k_B, m_u } from "../src/physics/constants";
import {
  D_AR,
  SPUTTER_TARGETS,
  argonMeanFreePath,
  diskOnAxisFlux,
  growthRate,
  sputteredAtomRate,
  targetIonCurrent,
  thompsonPeakEnergy,
} from "../src/physics/thin-film/sputtering";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

test("Al target, 300 W at 500 V, γ = 0.07, a = 3.81 cm, d = 10 cm (hand calculation)", () => {
  // Iᵢ = 300/500/1.07 = 0.5607477 A; Φ = Iᵢ/e · 1.05 = 3.674907e18 s⁻¹;
  // F = Φ/(π(0.0381² + 0.1²)) = 1.021480e20 m⁻² s⁻¹; r = F · 26.982e-3/(2700 · N_A) = 1.695077 nm/s.
  const Ii = targetIonCurrent(300, 500, 0.07);
  assertRel(Ii, 0.5607477, 1e-6, "Iᵢ");
  const Phi = sputteredAtomRate(Ii, SPUTTER_TARGETS.Al.Y500);
  assertRel(Phi, 3.674907e18, 1e-6, "Φ");
  const F = diskOnAxisFlux(Phi, 0.0381, 0.1);
  assertRel(F, 1.021480e20, 1e-6, "F");
  assertRel(growthRate(F, SPUTTER_TARGETS.Al.M, SPUTTER_TARGETS.Al.rho), 1.695077e-9, 1e-6, "rate");
});

test("cosine disk: point-source limit and on-axis integral", () => {
  // a → 0: Φ/(π d²), the on-axis flux of a Lambertian point source.
  assertRel(diskOnAxisFlux(1e18, 0, 0.1), 1e18 / (Math.PI * 0.01), 1e-12, "point source");
  // Independent check: integrate the cosine emission (J/π) cos²θ / r² over the disk numerically.
  const a = 0.05;
  const d = 0.08;
  const J = 1e18 / (Math.PI * a * a);
  let sum = 0;
  const n = 20000;
  for (let i = 0; i < n; i++) {
    const rho = ((i + 0.5) * a) / n;
    const r2 = rho * rho + d * d;
    sum += ((J / Math.PI) * (d * d) / (r2 * r2)) * 2 * Math.PI * rho * (a / n);
  }
  assertRel(diskOnAxisFlux(1e18, a, d), sum, 1e-6, "disk integral");
  assert.ok(Number.isNaN(diskOnAxisFlux(1e18, a, 0)), "d = 0");
});

test("Thompson peak, argon mean free path, guards", () => {
  // f(E) ∝ E/(E + U)³ peaks at E = U/2 (df/dE = 0 ⇔ (E + U) = 3E).
  assert.equal(thompsonPeakEnergy(3.39), 1.695);
  // d_Ar from η(273.15 K) = 21.0 µPa·s (CRC): d² = (5/16)√(π m k T)/(π η) → 3.6441 Å.
  const m = 39.948 * m_u;
  const d = Math.sqrt(((5 / 16) * Math.sqrt(Math.PI * m * k_B * 273.15)) / (Math.PI * 21.0e-6));
  assertRel(D_AR, d, 2e-3, "d_Ar");
  // λ at 3 mTorr, 300 K: k_B·300/(√2 π (3.64e-10)² · 0.3999671 Pa) = 1.759190 cm.
  assertRel(argonMeanFreePath(3e-3 * TORR, 300), 0.01759190, 1e-6, "λ");
  assert.ok(Number.isNaN(targetIonCurrent(300, 0, 0.07)), "V = 0");
  assert.ok(Number.isNaN(argonMeanFreePath(0, 300)), "p = 0");
  for (const t of Object.values(SPUTTER_TARGETS)) assert.ok(t.Y500 > 0 && t.Us > 0 && t.rho > 0 && t.Tm > 0, t.name);
});
