import test from "node:test";
import assert from "node:assert/strict";

import {
  GEO_SUBSATELLITE_VPERP, GM_EARTH, R_EARTH_EQ, R_GEO, airyHalfAngle, lightTime, pointAheadAngle, zenithPassVelocity,
} from "../src/physics/free-space-comms/point-ahead";
import { quadCellNea, rasterScan, squareCoverage, stareProbability } from "../src/physics/free-space-comms/acquisition";
import { decoyBb84, maxChannelLossDb, maxChannelLossDbOptimalMu, optimalMu, plobBound } from "../src/physics/free-space-comms/qkd";
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
  // Near the cutoff (29.86 dB) max(0, R) is zero over most of [0.01, 1]; a 1e-4 scan of μ peaks at 0.4264 with
  // 2.1040e-9 per pulse (2.10 bit/s at 1 GHz; 2.0400e-9 with Ma et al.’s eqs. (10)–(11), which keep e₀Y₀ unweighted:
  // near the cutoff the key is a 1e-4 difference, so O(Y₀η) terms move it 3 %). The search must use the unclipped rate.
  const etaEdge = 0.045 * 10 ** (-29.86 / 10);
  const muEdge = optimalMu({ ...GYS, eta: etaEdge });
  close(muEdge, 0.4264, 5e-4);
  close(decoyBb84({ ...GYS, mu: muEdge, eta: etaEdge }).keyPerPulse, 2.1040e-9, 1e-4);
  assert.ok(decoyBb84({ ...GYS, mu: 0.48, eta: etaAt(200) }).rawRate < 0);
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

test("decoy BB84, GYS: re-optimising μ at each loss extends the key from 142.01 to 142.21 km", () => {
  // 29.864 dB / 0.21 dB/km = 142.21 km; an independent reviewer bisection (session 173 probe) gave 142.21 km.
  const opt = maxChannelLossDbOptimalMu(GYS, 0.045);
  close(opt / 0.21, 142.21, 1e-4);
  assert.ok(opt >= maxChannelLossDb({ ...GYS, mu: 0.48 }, 0.045));
  // The cutoff is a sign change of the optimal-μ key.
  const keyAt = (db: number) => { const eta = 0.045 * 10 ** (-db / 10); return decoyBb84({ ...GYS, eta, mu: optimalMu({ ...GYS, eta }) }).keyPerPulse; };
  assert.ok(keyAt(opt - 0.01) > 0);
  assert.equal(keyAt(opt + 0.01), 0);
  // Edge case: no key at zero loss for any μ.
  assert.equal(maxChannelLossDbOptimalMu({ ...GYS, y0: 0.5 }, 0.045), 0);
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

test("decoy BB84: gain and errors exact in Y₀ (Ma et al. 2005 eq. (7) summed over the Poisson photon number)", () => {
  // Hand, Y₀ = 0.1, η = 0.5, μ = 1, e_d = 0: Q_μ = 1 − 0.9·e^(−0.5) = 1 − 0.9·0.606531 = 0.454122 (eq. (10) gives
  // 0.493469); E_μ = ½·0.1·0.606531/0.454122 = 0.066780; Y₁ = 0.55, e₁ = ½·0.1·0.5/0.55 = 0.045455.
  const r = decoyBb84({ mu: 1, eta: 0.5, y0: 0.1, eDetector: 0, fEc: 1 });
  close(r.gain, 0.454122, 1e-5);
  close(r.qber, 0.066780, 1e-4);
  close(r.y1, 0.55, 1e-12);
  close(r.e1, 0.045455, 1e-4);
  // The same as the sums Σ P_i Y_i and Σ P_i [½Y₀(1 − η)^i + e_d η_i] over i photons, P_i = e^(−μ)μ^i/i!.
  const p = { mu: 0.7, eta: 0.3, y0: 0.05, eDetector: 0.02, fEc: 1 };
  let q = 0, eq = 0, pi = Math.exp(-p.mu);
  for (let i = 0; i < 60; i++) {
    if (i > 0) pi *= p.mu / i;
    const miss = (1 - p.eta) ** i;
    q += pi * (1 - (1 - p.y0) * miss);
    eq += pi * (0.5 * p.y0 * miss + p.eDetector * (1 - miss));
  }
  const s = decoyBb84(p);
  close(s.gain, q, 1e-12);
  close(s.qber * s.gain, eq, 1e-12);
  // Y₀ = 1: every pulse clicks at random, no key.
  assert.equal(decoyBb84({ ...p, y0: 1 }).keyPerPulse, 0);
});

test("point-ahead, LEO 500 km at the zenith of an equatorial station: orbital velocity less the station's rotation", () => {
  // Hand: v = √(3.986004418e14 / 6 878 137 m) = 7612.6 m/s, ω_E R_E = 7.292115e-5 · 6 378 137 = 465.10 m/s.
  // Prograde equatorial 7147.5 m/s → 47.68 µrad; polar √(7612.6² + 465.1²) = 7626.8 m/s → 50.88 µrad; retrograde
  // 8077.7 m/s → 53.89 µrad. Carrasco-Casado & Mata-Calvo (arXiv:2012.13166 §8.1.2) quote ≈ 51 µrad from v alone.
  close(zenithPassVelocity(500e3, 0), 7147.5, 1e-4);
  close(zenithPassVelocity(500e3, 90), 7626.8, 1e-4);
  close(pointAheadAngle(zenithPassVelocity(500e3, 0)), 47.68e-6, 2e-4);
  close(pointAheadAngle(zenithPassVelocity(500e3, 90)), 50.88e-6, 2e-4);
  close(pointAheadAngle(zenithPassVelocity(500e3, 180)), 53.89e-6, 2e-4);
  // Station rotation alone: 2 · 465.10 / c = 3.103 µrad between prograde and the orbital velocity.
  const vOrbit = Math.sqrt(GM_EARTH / (R_EARTH_EQ + 500e3));
  close(pointAheadAngle(vOrbit) - pointAheadAngle(zenithPassVelocity(500e3, 0)), 3.103e-6, 1e-3);
  assert.ok(Number.isNaN(zenithPassVelocity(-1, 0)));
});
