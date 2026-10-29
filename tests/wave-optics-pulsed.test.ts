import test from "node:test";
import assert from "node:assert/strict";

import { c, h, q } from "../src/physics/constants";
import { PULSE_SHAPE_FACTOR, peakPower } from "../src/physics/laser-safety/peak-power";
import {
  ALFVEN_CURRENT, ELECTRON_REST_ENERGY, besselFactor, felPower, freeElectronLaser, lorentzFactor, resonanceWavelength,
  xieDegradation,
} from "../src/physics/wave-optics/free-electron-laser";
import {
  TIME_BANDWIDTH, cavityLengthForRepRate, photonLifetime, qSwitchExtraction, qSwitchPeakPhotons, qSwitchPulse,
  qSwitchWaveform, roundTripTime, singlePassLoss, transformLimitedBandwidth, wavelengthWidth,
} from "../src/physics/wave-optics/pulsed-laser";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const MeV = 1e6 * q;

test("q-switch: extraction efficiency solves rη = −ln(1 − η) (Wagner & Lengyel 1963)", () => {
  for (const r of [1.2, 2, 3, 10]) {
    const eta = qSwitchExtraction(r);
    assert.ok(Math.abs(r * eta + Math.log1p(-eta)) < 1e-9, `residual at r = ${r}`);
  }
  // Hand values: η(2) = 0.79681, η(3) = 0.94048 (Svelto, Principles of Lasers, ch. 8, plots η against r).
  assertRel(qSwitchExtraction(2), 0.796812, 1e-5, "η(2)");
  assertRel(qSwitchExtraction(3), 0.940480, 1e-5, "η(3)");
  assertRel(qSwitchPeakPhotons(3), 2 - Math.log(3), 1e-12, "Φ_p(3)");
  // Edge: no pulse at or below threshold.
  assert.ok(Number.isNaN(qSwitchExtraction(1)));
  assert.ok(Number.isNaN(qSwitchWaveform(0.9).fwhm));
});

test("q-switch: energy is Degnan's (hνA/2σ) ln(1/R) ln(n_i/n_f) and peak Φ_p/τ_c (Degnan 1989)", () => {
  // Nd:YAG defaults: 1064 nm, 1 mm mode diameter, σ = 2.8e-19 cm², R = 0.7, 2 % internal loss per pass,
  // L = 300 mm with a 50 mm rod of n = 1.82, r = 3.
  const R = 0.7;
  const gamma = singlePassLoss(1, R, 0.02);
  assertRel(gamma, Math.log(1 / 0.98) + Math.log(1 / R) / 2, 1e-12, "γ");
  const tauC = photonLifetime(0.3 + 0.82 * 0.05, gamma);
  assertRel(tauC, 0.341 / (c * 0.198540), 1e-5, "τ_c");
  const hv = (h * c) / 1064e-9;
  const A = Math.PI * 0.5e-3 ** 2;
  const sigma = 2.8e-23;
  const p = qSwitchPulse(3, hv, A, sigma, Math.log(1 / R), tauC);
  const eta = qSwitchExtraction(3);
  // ln(n_i/n_f) = −ln(1 − η) = rη.
  const degnan = ((hv * A) / (2 * sigma)) * Math.log(1 / R) * -Math.log(1 - eta);
  assertRel(p.energy, degnan, 1e-12, "E (Degnan form)");
  assertRel(p.energy, 2.63500e-3, 1e-4, "E (hand: 2.618 mJ × 0.35667 × 2.82144)");
  assertRel(p.peak, 146939, 1e-4, "P_p");
  assert.ok(Number.isNaN(qSwitchPulse(3, hv, A, 0, 0.3, tauC).energy));
});

test("q-switch: RK4 waveform conserves rη and its FWHM matches the quadrature ∫dx/(xΦ(x))", () => {
  for (const r of [1.5, 3, 10]) {
    const w = qSwitchWaveform(r);
    assertRel(w.extracted, r * qSwitchExtraction(r), 1e-4, `∫Φ dt at r = ${r}`);
    // Independent FWHM: Φ(x) = r − x + ln(x/r); dt = −dx/(xΦ). Half-power points by bisection, then Simpson in x.
    const phiP = qSwitchPeakPhotons(r);
    const phi = (x: number) => r - x + Math.log(x / r);
    const root = (a: number, b: number) => {
      for (let i = 0; i < 200; i++) { const m = (a + b) / 2; if ((phi(m) - phiP / 2) * (phi(a) - phiP / 2) <= 0) b = m; else a = m; }
      return (a + b) / 2;
    };
    const xLead = root(1, r);
    const xTrail = root(r * (1 - qSwitchExtraction(r)), 1);
    const n = 20000;
    const dx = (xLead - xTrail) / n;
    let s = 0;
    for (let i = 0; i <= n; i++) {
      const x = xTrail + i * dx;
      s += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) / (x * phi(x));
    }
    assertRel(w.fwhm, (s * dx) / 3, 2e-3, `FWHM at r = ${r}`);
  }
  // At r = 3 the FWHM is 2.704 τ_c, below Svelto's estimate τ_c rη/(r − 1 − ln r) = 3.130 τ_c.
  assertRel(qSwitchWaveform(3).fwhm, 2.7043, 1e-3, "FWHM(3)");
});

test("cavity dump and pulse train: τ_RT = 2L/c and shape factors (audit part 0)", () => {
  // Audit: 1.5 m cavity → τ_RT = 10.007 ns; 1 mJ in 10 ns Gaussian → 93.9 kW (the old page read 100000 kW).
  assertRel(roundTripTime(1.5), 10.00692e-9, 1e-6, "τ_RT");
  assert.ok(Number.isNaN(roundTripTime(0)));
  assertRel(peakPower(1e-3, 10e-9, "gaussian"), 93944, 1e-4, "Gaussian peak");
  assertRel(PULSE_SHAPE_FACTOR.sech2, 0.881374, 1e-6, "sech² factor");
});

test("mode locking: transform limit, wavelength width and cavity length (Diels & Rudolph ch. 1)", () => {
  assertRel(TIME_BANDWIDTH.gaussian, 0.441271, 1e-6, "Gaussian TBP");
  assertRel(TIME_BANDWIDTH.sech2, 0.314833, 1e-6, "sech² TBP");
  // Audit: L(80 MHz) = c/(2f) = 1.8737 m. 100 fs sech² at 1550 nm: Δν = 3.1483 THz, Δλ ≈ λ²Δν/c = 25.23 nm.
  assertRel(cavityLengthForRepRate(80e6), 1.873703, 1e-6, "L linear");
  assertRel(cavityLengthForRepRate(80e6, true), 3.747406, 1e-6, "L ring");
  const dnu = transformLimitedBandwidth(100e-15, "sech2");
  assertRel(dnu, 3.14833e12, 1e-5, "Δν");
  assertRel(wavelengthWidth(dnu, 1550e-9), 25.2320e-9, 1e-5, "Δλ");
  assertRel(dnu / 80e6, 39354, 1e-4, "modes in the FWHM");
  // Edge: a band reaching zero frequency has no finite wavelength width.
  assert.equal(wavelengthWidth(2 * c / 1e-6, 1e-6), Infinity);
});

test("FEL: constants, resonance and [JJ] (Huang & Kim 2007 eqs. 4–5)", () => {
  assertRel(ALFVEN_CURRENT, 17045, 1e-4, "I_A (Xie: 17.045 kA)");
  assertRel(ELECTRON_REST_ENERGY / MeV, 0.51099895, 1e-8, "m_e c²");
  // Audit: 100 MeV kinetic, λ_u = 30 mm, K = 1.5 → γ = 196.695, λ₁ = 823.9 nm.
  const gamma = lorentzFactor(100 * MeV);
  assertRel(gamma, 196.69512, 1e-7, "γ");
  assertRel(resonanceWavelength(0.03, 1.5, gamma), 823.878e-9, 1e-5, "λ₁");
  // [JJ] at K = 3.5: ξ = 12.25/28.5 = 0.429825; series J₀ = 1 − ξ²/4 + ξ⁴/64 = 0.954343, J₁ = ξ/2 − ξ³/16 + ξ⁵/384 = 0.209986.
  assertRel(besselFactor(3.5), 0.744357, 1e-5, "[JJ](3.5)");
  assert.equal(besselFactor(0), 1);
  assert.equal(xieDegradation(0, 0, 0), 0);
});

test("FEL: LCLS Pierce parameter and gain length (Huang & Kim 2007, table I)", () => {
  // 13.6 GeV, 3.4 kA, ε_n = 1.2 µm, β = 25 m, λ_u = 3 cm, K = 3.5: λ₁ = 1.5 Å, ρ = 4.5e-4, L_G = 4.3 m (GENESIS).
  const r = freeElectronLaser({
    kineticEnergy: 13.6e3 * MeV - ELECTRON_REST_ENERGY, lambdaU: 0.03, K: 3.5, current: 3400, normEmittance: 1.2e-6,
    beta: 25, energySpread: 1e-4,
  });
  assertRel(r.wavelength, 1.5e-10, 0.01, "λ₁");
  assertRel(r.rho, 4.5e-4, 0.01, "ρ");
  // Xie's fit is quoted to about 10 % of numerical solutions.
  assertRel(r.gainLength, 4.3, 0.1, "L_G");
});

test("FEL: Xie (1995) table 1 gain and saturation lengths", () => {
  // λ₁ = 1.5 Å, I = 5 kA, ε_n = 1 mm mrad, σ_E = 3 MeV, planar hybrid wiggler rows (λ_w, K, β) → L_g, L_sat.
  const rows = [[0.030, 3.7, 10, 3.1, 58], [0.034, 3.6, 11, 3.5, 65], [0.037, 3.4, 12, 3.8, 71]];
  for (const [lw, K, beta, lg, lsat] of rows) {
    const gamma = Math.sqrt((lw * (1 + (K * K) / 2)) / (2 * 1.5e-10));
    const E = gamma * ELECTRON_REST_ENERGY;
    const r = freeElectronLaser({
      kineticEnergy: E - ELECTRON_REST_ENERGY, lambdaU: lw, K, current: 5000, normEmittance: 1e-6, beta, energySpread: (3 * MeV) / E,
    });
    assert.ok(Math.abs(r.gainLength - lg) < 0.05, `L_g ${r.gainLength} vs ${lg}`);
    assert.ok(Math.abs(r.saturationLength - lsat) < 1, `L_sat ${r.saturationLength} vs ${lsat}`);
    assertRel(felPower(r.saturationLength, r), r.saturationPower, 1e-9, "P(L_sat) = P_sat");
  }
  // Edge: zero current has no gain.
  const zero = freeElectronLaser({ kineticEnergy: 100 * MeV, lambdaU: 0.03, K: 1.5, current: 0, normEmittance: 5e-6, beta: 1, energySpread: 0 });
  assert.ok(Number.isNaN(zero.rho) && Number.isNaN(zero.gainLength));
});

test("FEL: no saturation length when P_sat ≤ P_n/9 (edge)", () => {
  // 100 MeV, λ_u = 30 mm, K = 1.5, β = 1 m, but I = 1 A and ε_n = 1 mm rad: the Xie-degraded gain length (~1e12 m) leaves
  // 9 P_sat below the start-up noise, so ln(9 P_sat/P_n) < 0 and a "saturation length" would come out negative.
  const r = freeElectronLaser({
    kineticEnergy: 100 * 1e6 * q, lambdaU: 0.03, K: 1.5, current: 1, normEmittance: 1e-3, beta: 1, energySpread: 0.001,
  });
  assert.ok(9 * r.saturationPower < r.noisePower, "P_sat below the noise");
  assert.ok(Number.isNaN(r.saturationLength), `L_sat ${r.saturationLength}`);
});
