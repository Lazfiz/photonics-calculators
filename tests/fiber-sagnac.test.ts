import test from "node:test";
import assert from "node:assert/strict";

import { c, h, q } from "../src/physics/constants";
import {
  EARTH_ROTATION_RATE, angleRandomWalkDegPerRootHour, birefringentPhase, loopCombPeriod, loopMirrorReflectance,
  loopMirrorTransmittance, noiseEquivalentRate, properFrequency, sagnacScaleFactor, shotNoisePhase, transitTime,
} from "../src/physics/fiber-optics/sagnac";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

test("Sagnac scale factor 2πLD/(λc) (Arditty & Lefèvre 1981)", () => {
  // L 500 m on a 100 mm coil at 1550 nm: 2π·500·0.1/(1550e-9·299792458) = 0.676079 s.
  const S = sagnacScaleFactor(500, 0.1, 1550e-9);
  assertRel(S, 0.676079, 1e-5, "S");
  // Independent turns-and-area form 8πNAΩ/(λc), N = L/(πD) turns of area πD²/4.
  const N = 500 / (Math.PI * 0.1), A = (Math.PI * 0.1 ** 2) / 4;
  assertRel(S, (8 * Math.PI * N * A) / (1550e-9 * c), 1e-12, "turns × area");
  // Earth rate: Δφ = 0.676079 · 7.292115e-5 = 4.93007e-5 rad.
  assertRel(S * EARTH_ROTATION_RATE, 4.93007e-5, 1e-5, "Earth phase");
  assert.ok(Number.isNaN(sagnacScaleFactor(500, 0, 1550e-9)));
});

test("coil transit time and proper frequency (Lefèvre §3.2)", () => {
  // n_g 1.4682 (SMF-28 group index), 500 m: τ = 2.44870 µs, f_p = 1/(2τ) = 204.190 kHz.
  assertRel(transitTime(500, 1.4682), 2.44870e-6, 1e-5, "τ");
  assertRel(properFrequency(500, 1.4682), 204190, 1e-5, "f_p");
  assert.ok(Number.isNaN(transitTime(500, 0.5)));
});

test("shot-noise angle random walk (Lefèvre §3.1, IEEE Std 952)", () => {
  // 10 mW source, 3 dB to the detector: P_d = 10 mW·10^(−0.3) = 5.01187 mW.
  const Pd = 10e-3 * 10 ** -0.3;
  const sigma = shotNoisePhase(Pd, 1550e-9);
  // Independent photocurrent form: R = q/(hν), I = R·P_d, i_n = √(2qI), slope dI/dφ = R·P_d at the π/2 bias point.
  const R = (q * 1550e-9) / (h * c);
  assertRel(sigma, Math.sqrt(2 * q * R * Pd) / (R * Pd), 1e-12, "σ_φ vs photocurrent form");
  assertRel(sigma, 7.15134e-9, 1e-5, "σ_φ");
  const rate = noiseEquivalentRate(sigma, sagnacScaleFactor(500, 0.1, 1550e-9));
  // One-sided rate ASD: 1.05777e-8 (rad/s)/√Hz = 2.18181e-3 (°/h)/√Hz. IEEE 952 Allan N = ASD/√2 ÷ 60 = 2.5713e-5 °/√h
  // (the page used ×3600; the plain ÷60 datasheet form gives 3.636e-5, √2 more).
  assertRel(rate * 206264.806, 2.18181e-3, 1e-5, "rate ASD");
  assertRel(angleRandomWalkDegPerRootHour(rate), 2.5713e-5, 1e-4, "ARW");
  // Independent photon count: over τ = 1 h, n = η·P_d·τ/(hν) photons give σ_φ = 1/√n; N = σ_Ω(τ)·√τ.
  const tau = 3600, n = (Pd * tau * 1550e-9) / (h * c);
  const N = ((1 / Math.sqrt(n)) / sagnacScaleFactor(500, 0.1, 1550e-9)) * Math.sqrt(tau); // rad/√s
  assertRel(angleRandomWalkDegPerRootHour(rate), (N * 180) / Math.PI * 60, 1e-9, "ARW vs photon count");
  // η = 0.8 raises σ_φ by 1/√0.8.
  assertRel(shotNoisePhase(Pd, 1550e-9, 0.8), sigma / Math.sqrt(0.8), 1e-12, "η");
  assert.ok(Number.isNaN(shotNoisePhase(0, 1550e-9)));
});

test("fibre loop mirror R = 4k(1 − k), T = (1 − 2k)² (Mortimore 1988)", () => {
  assert.equal(loopMirrorReflectance(0.5), 1);
  assert.equal(loopMirrorTransmittance(0.5), 0);
  assertRel(loopMirrorReflectance(0.3), 0.84, 1e-12, "R(0.3)");
  assertRel(loopMirrorTransmittance(0.3), 0.16, 1e-12, "T(0.3)");
  // Lumped loss τ = 0.9 scales both.
  assertRel(loopMirrorReflectance(0.3, 0.9) + loopMirrorTransmittance(0.3, 0, 0.9), 0.9, 1e-12, "R + T = τ");
  assert.ok(Number.isNaN(loopMirrorReflectance(1.2)));
});

test("birefringent loop mirror against a coupler-matrix field sum (Fang & Claus 1995)", () => {
  // Coupler [[t, i√k], [i√k, t]]. To the transmitted port the CW wave goes through twice (t²·e^{iΔφ}) and the CCW wave
  // crosses twice ((i√k)² = −k); to the input port each crosses once (2i·t√k for Δφ = 0).
  for (const k of [0.5, 0.3, 0.1]) {
    for (const dphi of [0, 0.7, Math.PI / 2, 2.9]) {
      const t2 = 1 - k;
      const re = t2 * Math.cos(dphi) - k, im = t2 * Math.sin(dphi);
      assertRel(loopMirrorTransmittance(k, dphi) + 1e-30, re * re + im * im + 1e-30, 1e-12, `T(k ${k}, Δφ ${dphi})`);
    }
  }
  // PM section B 4e-4, 1 m at 1550 nm: comb period λ²/(BL) = 6.00625 nm; k = ½ gives T = sin²(πBL/λ).
  assertRel(loopCombPeriod(4e-4, 1, 1550e-9), 6.00625e-9, 1e-12, "comb period");
  const dphi = birefringentPhase(4e-4, 1, 1550e-9);
  assertRel(loopMirrorTransmittance(0.5, dphi), Math.sin((Math.PI * 4e-4) / 1550e-9) ** 2, 1e-9, "comb k = ½");
  assert.ok(Number.isNaN(loopCombPeriod(0, 1, 1550e-9)));
});
