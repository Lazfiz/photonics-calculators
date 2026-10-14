import test from "node:test";
import assert from "node:assert/strict";

import {
  GEO_SUBSATELLITE_VPERP, GM_EARTH, R_EARTH_EQ, R_GEO, airyHalfAngle, lightTime, pointAheadAngle,
} from "../src/physics/free-space-comms/point-ahead";
import { quadCellNea, rasterScan, squareCoverage, stareProbability } from "../src/physics/free-space-comms/acquisition";
import { decoyBb84, maxChannelLossDb, optimalMu, plobBound } from "../src/physics/free-space-comms/qkd";
import { capturedPower, linkSecurity, nepLimitedSnr } from "../src/physics/free-space-comms/physical-layer-security";
import { secrecyCapacity } from "../src/physics/free-space-comms/channel-capacity";
import { gaussianDiscFraction } from "../src/physics/free-space-comms/pointing-loss";
import { c } from "../src/physics/constants";

const close = (actual: number, expected: number, rel: number, msg = "") =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${msg} ${actual} vs ${expected}`);

test("point-ahead 2v⊥/c: 7 km/s → 46.70 µrad; LEO 500 km ≈ 51 µrad and GEO ≈ 18 µrad (Carrasco-Casado 2020, eq. 8.4)", () => {
  close(pointAheadAngle(7e3), 46.6990e-6, 1e-5);
  close(pointAheadAngle(-7e3), pointAheadAngle(7e3), 0);
  // LEO 500 km at zenith: v = √(GM/r) = 7.61 km/s ("7.62 km/s … 51 µrad" in the chapter).
  const vLeo = Math.sqrt(GM_EARTH / (R_EARTH_EQ + 500e3));
  close(vLeo, 7612.6, 1e-4);
  assert.equal(Math.round(pointAheadAngle(vLeo) * 1e6), 51);
  // GEO radius 42 164 km; inertial velocity of the satellite over a station beneath it ω(r − R) = 2.61 km/s.
  close(R_GEO, 42164.17e3, 1e-6);
  close(GEO_SUBSATELLITE_VPERP, 2609.5, 1e-4);
  close(pointAheadAngle(GEO_SUBSATELLITE_VPERP), 17.41e-6, 1e-3);
  close(lightTime(35786e3), 0.119369, 1e-5);
  close(airyHalfAngle(1550e-9, 0.1), 18.91e-6, 1e-12);
  assert.ok(Number.isNaN(airyHalfAngle(1550e-9, 0)));
  assert.equal(pointAheadAngle(c / 2), 1);
});

test("acquisition: 5 mrad 3σ / 1 mrad FOV → 10 lines, 0.573 s at 10°/s; stare probability is the Rayleigh CDF", () => {
  const scan = rasterScan(5e-3, 1e-3, (10 * Math.PI) / 180);
  assert.equal(scan.lines, 10);
  close(scan.time, (10 * 10e-3) / ((10 * Math.PI) / 180), 1e-12);
  close(scan.time, 0.5730, 1e-4);
  assert.equal(rasterScan(5e-3, 3e-3, 1).lines, 4); // ⌈10/3⌉
  assert.ok(Number.isNaN(rasterScan(5e-3, 0, 1).time));
  // 1 − exp(−(0.5)²/(2·(5/3)²)) = 1 − exp(−0.045) = 0.044003; equal to the disc fraction of the 2-D Gaussian.
  const sigma = 5e-3 / 3;
  close(stareProbability(1e-3, sigma), 0.0440025, 1e-5);
  close(stareProbability(1e-3, sigma), gaussianDiscFraction(0, sigma, 0.5e-3), 1e-8);
  close(stareProbability(2 * 5e-3, sigma), 1 - Math.exp(-4.5), 1e-12); // FOV radius = 3σ
  assert.equal(stareProbability(1e-3, 0), 1);
  // The raster sweeps the 2U square: erf(3/√2)² = 0.997300² = 0.994608.
  close(squareCoverage(5e-3, sigma), 0.9973002039 ** 2, 1e-9);
});

test("quadrant-detector NEA (3π/16)(λ/D)/SNR (Tyler & Fried 1982): 1550 nm, 10 cm, SNR 10 → 0.913 µrad", () => {
  close(quadCellNea(1550e-9, 0.1, 10), ((3 * Math.PI) / 16) * 15.5e-6 / 10, 1e-12);
  close(quadCellNea(1550e-9, 0.1, 10), 0.9130e-6, 1e-4);
  assert.ok(Number.isNaN(quadCellNea(1550e-9, 0.1, 0)));
});

const GYS = { y0: 1.7e-6, eDetector: 0.033, fEc: 1.22 }; // Ma et al. 2005, Table 1; f(e) = 1.22
const etaAt = (km: number) => 0.045 * 10 ** (-(0.21 * km) / 10);

test("decoy BB84 (Ma, Qi, Zhao, Lo 2005): GYS, μ = 0.48 → key up to 142.05 km; optimal μ 0.48 (f = 1.22), 0.54 (f = 1)", () => {
  const km = maxChannelLossDb({ ...GYS, mu: 0.48 }, 0.045) / 0.21;
  assert.ok(Math.abs(km - 142.05) < 0.1, `max distance ${km} km`);
  // §3.1, from eq. (12): μ_opt ≈ 0.48 for f = 1.22 and ≈ 0.54 for f = 1 (low-loss, low-background limit).
  assert.ok(Math.abs(optimalMu({ ...GYS, eta: etaAt(50) }) - 0.48) < 0.01);
  assert.ok(Math.abs(optimalMu({ ...GYS, fEc: 1, eta: etaAt(50) }) - 0.54) < 0.01);
  // QBER → e_d when the background is negligible; the key falls ≈ 0.21 dB/km in the linear regime.
  const r0 = decoyBb84({ ...GYS, mu: 0.48, eta: etaAt(0) });
  close(r0.qber, 0.033, 0.002);
  const r50 = decoyBb84({ ...GYS, mu: 0.48, eta: etaAt(50) }).keyPerPulse;
  const r100 = decoyBb84({ ...GYS, mu: 0.48, eta: etaAt(100) }).keyPerPulse;
  assert.ok(Math.abs(10 * Math.log10(r50 / r100) - 10.5) < 1, "≈ 50 km × 0.21 dB/km");
});

test("decoy BB84 limits: noiseless channel gives q·ημe^(−μ); bright pulses give no key; PLOB −log₂(1 − η)", () => {
  const eta = 1e-3, mu = 0.5;
  close(decoyBb84({ mu, eta, y0: 0, eDetector: 0, fEc: 1 }).keyPerPulse, 0.5 * eta * mu * Math.exp(-mu), 1e-12);
  // The old page default (−10 dBm at 1 GHz, 1550 nm) is μ = 7.8×10⁵: e^(−μ) underflows and Q₁ = 0.
  const bright = decoyBb84({ ...GYS, mu: 7.8e5, eta: etaAt(50) });
  assert.equal(bright.q1, 0);
  assert.equal(bright.keyPerPulse, 0);
  assert.equal(decoyBb84({ ...GYS, mu, eta: 0 }).keyPerPulse, 0);
  assert.equal(maxChannelLossDb({ ...GYS, y0: 0.5, mu }, 0.045), 0);
  assert.equal(maxChannelLossDb({ y0: 0, eDetector: 0, fEc: 1, mu }, 1), Infinity);
  close(plobBound(0.5), 1, 1e-15);
  close(plobBound(1e-3), 1e-3 / Math.LN2, 1e-3); // ≈ 1.44 η for η ≪ 1
  assert.equal(plobBound(0), 0);
  // The decoy-state key stays below the bound (here η·μe^(−μ)/2 ≪ 1.44 η).
  assert.ok(decoyBb84({ ...GYS, mu: 0.48, eta: etaAt(20) }).keyPerPulse < plobBound(etaAt(20)));
});

test("physical-layer security: exact Gaussian capture never exceeds P; wiretap capacity (Leung-Yan-Cheong & Hellman 1978)", () => {
  const P = 0.01, lambda = 1550e-9, w0 = 2.5e-3;
  // Near field: a 20 cm aperture 10 m from the transmitter collects all of the beam, not more.
  close(capturedPower(P, lambda, w0, 10, 0, 0.2), P, 1e-9);
  // On axis: 1 − exp(−2a²/w²), w(1 km) = w₀√(1 + (z/z_R)²).
  const zR = (Math.PI * w0 * w0) / lambda;
  const w = w0 * Math.sqrt(1 + (1000 / zR) ** 2);
  close(capturedPower(P, lambda, w0, 1000, 0, 0.1), P * -Math.expm1((-2 * 0.05 ** 2) / (w * w)), 1e-8);
  // Small aperture far off axis: η₀ exp(−2r²/w²), η₀ = 2a²/w² (Farid & Hranilovic 2007 small-aperture limit).
  close(capturedPower(1, lambda, w0, 1000, 0.3, 0.002), ((2 * 0.001 ** 2) / (w * w)) * Math.exp((-2 * 0.09) / (w * w)), 2e-4);
  // Off axis with a finite aperture: 1.5655e-5 W from an independent 1500² grid integration of the Gaussian over the disc.
  close(capturedPower(P, lambda, w0, 1000, 0.3, 0.1), 1.5655e-5, 2e-4);
  close(nepLimitedSnr(1e-6, 1e-11, 1e8), 1e2, 1e-12); // (1 µW / (10 pW/√Hz · 10⁴ √Hz))²
  close(secrecyCapacity(1e9, 100, 0), 1e9 * Math.log2(101), 1e-14);
  assert.equal(secrecyCapacity(1e9, 10, 100), 0);
  const s = linkSecurity({
    power: P, lambda, waist: w0, range: 1000, bobAperture: 0.1, eveDistance: 1000, eveOffset: 0.3, eveAperture: 0.1,
    nep: 2e-11, bandwidth: 1e9,
  });
  assert.ok(s.bobPower > s.evePower && s.evePower > 0);
  close(s.secrecy, 1e9 * (Math.log2(1 + s.snrBob) - Math.log2(1 + s.snrEve)), 1e-12);
});
