import test from "node:test";
import assert from "node:assert/strict";

import {
  analyzerTransmission, microscopeExtinction, minimumRetardance, pupilLeakTerms, rayLeakTerms, sheetPairTransmission,
} from "../src/physics/polarization/microscope-extinction";
import { fresnel } from "../src/physics/polarization/fresnel";
import { type MuellerMatrix, applyMueller, chainMueller, rotateMueller } from "../src/physics/polarization/mueller";

const deg = Math.PI / 180;

test("Microscope extinction: sheet pair H(θ) = H₀ cos²θ + H₉₀ sin²θ (Shurcliff 1962, ch. 3)", () => {
  assert.ok(Math.abs(sheetPairTransmission(0, 1e3) - 0.5 * (1 + 1e-6)) < 1e-15);
  assert.ok(Math.abs(sheetPairTransmission(90 * deg, 1e3) - 1e-3) < 1e-15);
  // ER = 1 (no polarizer): ½ at every angle.
  assert.ok(Math.abs(sheetPairTransmission(37 * deg, 1) - 1) < 1e-15);
  assert.ok(Number.isNaN(sheetPairTransmission(0, 0.5)));
});

test("Microscope extinction: one ray at 30° through a glass plate (n = 1.5), Fresnel by hand", () => {
  // Hand calculation: cos θt = √(1 − 1/9) = 0.942809; r_s = −0.240408, r_p = 0.158899 (Hecht eqs. 4.42–4.43).
  const ci = Math.cos(30 * deg), ct = Math.sqrt(1 - 1 / 9);
  const Ts = 1 - ((ci - 1.5 * ct) / (ci + 1.5 * ct)) ** 2, Tp = 1 - ((1.5 * ci - ct) / (1.5 * ci + ct)) ** 2;
  const { G, L } = rayLeakTerms(1.5, 30 * deg, 2);
  assert.ok(Math.abs(L - (Tp - Ts) ** 2 / 8) < 1e-15 && Math.abs(L - 1.32414e-4) < 1e-8, `L ${L}`);
  assert.ok(Math.abs(G + L - (Tp * Tp + Ts * Ts) / 2) < 1e-15, "energy: G + L = (a_p² + a_s²)/2");
});

test("Microscope extinction: limits — no cone recovers the sheet pair, and the leak grows as NA⁴", () => {
  const ER = 1e4;
  const zero = microscopeExtinction(ER, 1.52, 4, 0);
  assert.ok(Math.abs(zero.ER / ((ER + 1 / ER) / 2) - 1) < 1e-12 && zero.ERsurfaces === Infinity);
  const r = pupilLeakTerms(1.52, 0.1, 4).L / pupilLeakTerms(1.52, 0.05, 4).L;
  assert.ok(Math.abs(r / 16 - 1) < 0.01, `L(0.1)/L(0.05) = ${r}`);
  // The leak only lowers the extinction ratio.
  assert.ok(microscopeExtinction(ER, 1.52, 4, 0.65).ER < zero.ER);
  assert.ok(Number.isNaN(microscopeExtinction(ER, 1.52, 4, 1).ER) && Number.isNaN(microscopeExtinction(0.5, 1.5, 4, 0.3).ER));
});

test("Microscope extinction: smallest visible retardance λ/(π√ER)", () => {
  // ER 10⁴ at 546 nm: (546/π)·asin(0.01) = 1.7380 nm.
  assert.ok(Math.abs(minimumRetardance(546e-9, 1e4) / 1e-9 - (546 / Math.PI) * Math.asin(0.01)) < 1e-9);
  assert.ok(Math.abs(minimumRetardance(546e-9, 1e4) / 1e-9 - 1.738) < 1e-3);
  assert.ok(Number.isNaN(minimumRetardance(546e-9, 1)));
});

test("Microscope extinction: analyzer curve runs from parallel to crossed", () => {
  const e = microscopeExtinction(1e4, 1.52, 2, 0.5);
  assert.ok(Math.abs(analyzerTransmission(e, 0) - e.parallel) < 1e-15);
  assert.ok(Math.abs(analyzerTransmission(e, Math.PI / 2) - e.crossed) < 1e-15);
  // With no surfaces it is the sheet pair H(θ).
  const bare = microscopeExtinction(1e3, 1.52, 0, 0.5);
  assert.ok(Math.abs(analyzerTransmission(bare, 0.3) / sheetPairTransmission(0.3, 1e3) - 1) < 1e-12);
});

test("Microscope extinction: the closed form equals a brute-force Mueller sum over the pupil", () => {
  // Independent check: partial polarizers (intensity transmittances 1 and 1/ER), m surfaces as a diattenuator
  // (T_p^m, T_s^m) with its p axis along the plane of incidence φ, summed over 400 equal-area rings × 64 azimuths.
  // ER = 10⁴, n = 1.52, m = 2, NA 0.5: crossed 1.1350 × 10⁻⁴, parallel 0.45790, ER_sys 4034.3.
  const diattenuator = (q: number, r: number, az: number): MuellerMatrix => rotateMueller([
    [(q + r) / 2, (q - r) / 2, 0, 0], [(q - r) / 2, (q + r) / 2, 0, 0], [0, 0, Math.sqrt(q * r), 0], [0, 0, 0, Math.sqrt(q * r)],
  ], az);
  const ER = 1e4, n = 1.52, m = 2, NA = 0.5, rings = 400, azimuths = 64;
  const P = diattenuator(1, 1 / ER, 0), crossedA = diattenuator(1, 1 / ER, 90 * deg);
  let crossed = 0, parallel = 0;
  for (let i = 0; i < rings; i++) {
    const f = fresnel(1, n, Math.asin(NA * Math.sqrt((i + 0.5) / rings)));
    for (let j = 0; j < azimuths; j++) {
      const surfaces = diattenuator(f.Tp ** m, f.Ts ** m, (2 * Math.PI * (j + 0.5)) / azimuths);
      crossed += applyMueller(chainMueller([P, surfaces, crossedA]), [1, 0, 0, 0])[0];
      parallel += applyMueller(chainMueller([P, surfaces, P]), [1, 0, 0, 0])[0];
    }
  }
  crossed /= rings * azimuths;
  parallel /= rings * azimuths;
  const e = microscopeExtinction(ER, n, m, NA);
  assert.ok(Math.abs(e.crossed / crossed - 1) < 1e-5, `crossed ${e.crossed} vs ${crossed}`);
  assert.ok(Math.abs(e.parallel / parallel - 1) < 1e-6, `parallel ${e.parallel} vs ${parallel}`);
  assert.ok(Math.abs(e.ER - 4034.3) < 0.1, `ER ${e.ER}`);
});
