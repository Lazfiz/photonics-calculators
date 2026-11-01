import test from "node:test";
import assert from "node:assert/strict";

import { crystalIndices } from "../src/physics/materials/uniaxial-data";
import { sinc } from "../src/physics/math";
import { applyMueller } from "../src/physics/polarization/mueller";
import {
  bandMeanRetardance, muellerRetarderSpectral, plateRetardances, retardanceForVisibility, spectralVisibility,
  wavenumberBand,
} from "../src/physics/polarization/spectral-depolarization";
import { degreeOfPolarization } from "../src/physics/polarization/stokes";

/** Simpson average of f over [a, b] with n (even) intervals. */
function simpsonMean(f: (x: number) => number, a: number, b: number, n = 20000): number {
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return (s * h) / 3 / (b - a);
}

test("Spectral depolarization: closed forms equal direct averages for a non-dispersive retarder", () => {
  const R = 40e-6; // 40 µm of retardance, ≈ 73 waves at 550 nm
  const { sigma0, dSigma } = wavenumberBand(550e-9, 20e-9);
  const flat = bandMeanRetardance(R, R, sigma0, dSigma, "flat");
  const lo = sigma0 - dSigma / 2, hi = sigma0 + dSigma / 2;
  assert.ok(Math.abs(flat.meanCos - simpsonMean((s) => Math.cos(2 * Math.PI * R * s), lo, hi)) < 1e-9);
  assert.ok(Math.abs(flat.meanSin - simpsonMean((s) => Math.sin(2 * Math.PI * R * s), lo, hi)) < 1e-9);
  // Gaussian of FWHM Δσ: weight exp(−4 ln 2 (σ − σ₀)²/Δσ²), integrated over ±4 FWHM.
  const g = bandMeanRetardance(R, R, sigma0, dSigma, "gaussian");
  const w = (s: number) => Math.exp((-4 * Math.LN2 * (s - sigma0) ** 2) / dSigma ** 2);
  const a = sigma0 - 4 * dSigma, b = sigma0 + 4 * dSigma;
  const norm = simpsonMean(w, a, b);
  assert.ok(Math.abs(g.meanCos - simpsonMean((s) => w(s) * Math.cos(2 * Math.PI * R * s), a, b) / norm) < 1e-9);
});

test("Spectral depolarization: coherence lengths (visibility ½) and limits", () => {
  // Gaussian: R = 2 ln 2/(π Δσ) = 0.4413/Δσ, the usual coherence length 2 ln 2 λ²/(π Δλ).
  assert.ok(Math.abs(retardanceForVisibility(0.5, 1, "gaussian") - (2 * Math.LN2) / Math.PI) < 1e-12);
  // Flat: sinc x = ½ at x = 1.895494 (root of sin x = x/2).
  assert.ok(Math.abs(retardanceForVisibility(0.5, 1, "flat") * Math.PI - 1.895494) < 1e-6);
  assert.equal(sinc(0), 1);
  assert.equal(spectralVisibility(1e-3, 0, "flat"), 1);
  // A first zero of sinc: R Δσ = 1 scrambles light at 45° to the axis completely.
  const M = muellerRetarderSpectral(1e-3, 1e-3, 1e6, 1e3, "flat", 0);
  assert.ok(degreeOfPolarization(applyMueller(M, [1, 0, 1, 0])) < 1e-12);
  assert.ok(Math.abs(degreeOfPolarization(applyMueller(M, [1, 1, 0, 0])) - 1) < 1e-15, "axis state kept");
  assert.ok(Number.isNaN(wavenumberBand(500e-9, 1000e-9).dSigma));
});

test("Spectral depolarization: 5 mm of quartz, the linear-phase model against the dispersive integral", () => {
  const dn = (lambda: number) => {
    const { no, ne } = crystalIndices("quartz", lambda);
    return ne - no;
  };
  const d = 5e-3, lambda0 = 550e-9;
  const { phase, group } = plateRetardances(d, dn, lambda0);
  // Quartz: Δn(550) = 0.00916 (Hecht Table 8.1 gives 0.0091 at 589 nm); R_g from a 540/560 nm secant.
  assert.ok(Math.abs(phase / d - 0.00916) < 5e-5, `Δn ${phase / d}`);
  const secant = d * (dn(lambda0) - lambda0 * (dn(560e-9) - dn(540e-9)) / 20e-9);
  assert.ok(Math.abs(group / secant - 1) < 1e-4 && Math.abs(group / phase - 1.100) < 0.005, `R_g/R ${group / phase}`);
  for (const dl of [2e-9, 10e-9, 40e-9]) {
    const { sigma0, dSigma } = wavenumberBand(lambda0, dl);
    const model = bandMeanRetardance(phase, group, sigma0, dSigma, "flat");
    const lo = sigma0 - dSigma / 2, hi = sigma0 + dSigma / 2;
    const exactCos = simpsonMean((s) => Math.cos(2 * Math.PI * d * dn(1 / s) * s), lo, hi, 40000);
    const exactSin = simpsonMean((s) => Math.sin(2 * Math.PI * d * dn(1 / s) * s), lo, hi, 40000);
    const err = Math.hypot(model.meanCos - exactCos, model.meanSin - exactSin);
    assert.ok(err < 0.01, `Δλ ${dl * 1e9} nm: |error| ${err}`);
  }
});

test("Spectral depolarization: thin quartz over a wide band, phase taken at the wavenumber centre", () => {
  // 50 µm of quartz, 550 ± 137.5 nm flat: R, R_g at λ_c = 1/σ₀ put ⟨e^{iΓ}⟩ within 0.01 of the direct integral
  // (probe: 0.0070, angle −0.6°); R at λ₀ misses by 0.034 (−2.8°), the 2π(R − R_g)(σ₀ − 1/λ₀) term.
  const dn = (lambda: number) => {
    const { no, ne } = crystalIndices("quartz", lambda);
    return ne - no;
  };
  const d = 50e-6;
  const { sigma0, dSigma } = wavenumberBand(550e-9, 275e-9);
  const lo = sigma0 - dSigma / 2, hi = sigma0 + dSigma / 2;
  const exactCos = simpsonMean((s) => Math.cos(2 * Math.PI * d * dn(1 / s) * s), lo, hi, 40000);
  const exactSin = simpsonMean((s) => Math.sin(2 * Math.PI * d * dn(1 / s) * s), lo, hi, 40000);
  const err = (lambda: number) => {
    const { phase, group } = plateRetardances(d, dn, lambda);
    const m = bandMeanRetardance(phase, group, sigma0, dSigma, "flat");
    return Math.hypot(m.meanCos - exactCos, m.meanSin - exactSin);
  };
  assert.ok(err(1 / sigma0) < 0.01, `centre: ${err(1 / sigma0)}`);
  assert.ok(err(550e-9) > 0.03, `λ₀: ${err(550e-9)}`);
});
