import test from "node:test";
import assert from "node:assert/strict";

import { N_A, TORR, k_B, m_u, q } from "../src/physics/constants";
import {
  D_AR,
  SPUTTER_TARGETS,
  argonMeanFreePath,
  diskOnAxisFlux,
  growthRate,
  sputteredAtomDiameter,
  sputteredAtomRate,
  sputteredMeanFreePath,
  targetIonCurrent,
  thermalisationDistance,
  thermalisationEnergy,
  thompsonFractionBelow,
  thompsonPeakEnergy,
  velocityPersistence,
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

test("Westwood 1978 thermalisation: persistence, mean free path, distance", () => {
  // Jeans' persistence for like atoms (M = 1): ln(1 + √2)/(4√2) + 1/4 = 0.4058063, the classical 0.406.
  assertRel(velocityPersistence(1), 0.4058063100, 1e-9, "ν′/ν at M = 1");
  assert.ok(Math.abs(velocityPersistence(1e-4) - 1) < 1e-3, "heavy atom keeps its velocity");
  assert.ok(velocityPersistence(1e4) < 1e-3, "light atom loses its direction");
  // Eq. (2) as printed, in cm: λ⁻¹ = 8.34e14 p (σ_s + σ_g)²/4 √(1 + M_s/M_g), at T = π·1e-6/(8.34e14 k_B) = 272.835 K.
  // 80 u, σ_s = 0.3 + 0.15·60/130 = 0.36923 nm, σ_g = 0.29 nm, 1 Pa: 0.6368982 cm.
  const ms80 = 80 * m_u;
  const s80 = sputteredAtomDiameter(80);
  assertRel(s80, 0.369230769e-9, 1e-8, "σ_s(80 u)");
  assertRel(sputteredMeanFreePath(1, 272.835287, ms80, s80), 0.006368982, 1e-6, "λ eq. (2)");
  // Westwood's abstract: a 5 eV atom of mass 80 in argon thermalises within 42 cm at 0.1 Pa and 0.44 cm at 10 Pa.
  // Independent script (constants typed in), 273.15 K: η′ = 5.031137, D = 1.25 η′ λ = 40.10023 cm at 0.1 Pa.
  const at01 = thermalisationDistance(5, 0.1, 273.15, ms80, s80);
  assertRel(at01.collisions, 5.031137, 1e-6, "η′");
  assertRel(at01.distance, 0.4010023, 1e-6, "D at 0.1 Pa");
  assertRel(at01.distance, 0.42, 0.1, "D vs Westwood 0.1 Pa");
  assertRel(thermalisationDistance(5, 10, 273.15, ms80, s80).distance, 0.0044, 0.1, "D vs Westwood 10 Pa");
  // Fig. 5, 400 u at 1 Pa (read off the log plot): ≈ 6.9 cm at 5 eV, ≈ 13.9 cm at 1000 eV; script 6.994521, 13.91040.
  const ms400 = 400 * m_u;
  const s400 = sputteredAtomDiameter(400);
  assertRel(thermalisationDistance(5, 1, 273.15, ms400, s400).distance, 0.06994521, 1e-6, "D 400 u 5 eV");
  assertRel(thermalisationDistance(1000, 1, 273.15, ms400, s400).distance, 0.1391040, 1e-6, "D 400 u 1 keV");
  assertRel(thermalisationDistance(1000, 1, 273.15, ms400, s400).distance, 0.139, 0.03, "D vs Fig. 5");
  // Page default: Al, E₀ = U_s/2 = 1.695 eV, 3 mTorr, 300 K: 6.349799 cm (script).
  const al = SPUTTER_TARGETS.Al;
  const msAl = al.M / N_A;
  assertRel(thermalisationDistance(al.Us / 2, 3e-3 * TORR, 300, msAl, sputteredAtomDiameter(al.M * 1e3)).distance, 0.06349799, 1e-6, "Al default");
  // Edge cases: an atom already at thermal energy goes nowhere; no gas gives NaN.
  assert.equal(thermalisationDistance(0.02, 1, 300, ms80, s80).distance, 0);
  assert.ok(Number.isNaN(thermalisationDistance(5, 0, 300, ms80, s80).distance), "p = 0");
  assert.ok(Number.isNaN(velocityPersistence(0)), "M = 0");
});

test("Thermalised fraction: eq. (13) inverted and the Thompson distribution", () => {
  // Thompson CDF (E/(E + U))²: median at (1 + √2)U, and 1/9 of atoms below the U/2 peak.
  assertRel(thompsonFractionBelow((1 + Math.SQRT2) * 3.49, 3.49), 0.5, 1e-12, "median");
  assertRel(thompsonFractionBelow(3.49 / 2, 3.49), 1 / 9, 1e-12, "below peak");
  // Round trip: the energy E* that thermalises at d has D(E*) = d.
  const cu = SPUTTER_TARGETS.Cu;
  const ms = cu.M / N_A;
  const sigma = sputteredAtomDiameter(cu.M * 1e3);
  const p = 3e-3 * TORR;
  const Es = thermalisationEnergy(0.1, p, 300, ms, sigma);
  assertRel(thermalisationDistance(Es, p, 300, ms, sigma).distance, 0.1, 1e-9, "D(E*) = d");
  // Page default with Cu (10 cm, 3 mTorr, 300 K), independent script: E* = 4.322666 eV, 30.61293 % thermalised.
  assertRel(Es, 4.322666, 1e-6, "E* Cu");
  assertRel(thompsonFractionBelow(Es, cu.Us), 0.3061293, 1e-6, "fraction Cu");
  // d = 0: only atoms at thermal energy or below.
  assertRel(thermalisationEnergy(0, p, 300, ms, sigma), (k_B * 300) / q, 1e-12, "E*(0) = k_B T");
});
