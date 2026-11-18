// Golden values for nonlinearSummary (src/physics/fiber-optics/nonlinear-effects.ts), worked by hand from
// Agrawal, Nonlinear Fiber Optics, 6th ed. (§4.1 L_eff and SPM phase, §2.3 γ), Smith 1972 (thresholds 16 and 21),
// and Inoue 1992 (η = 1 at Δβ = 0).
import assert from "node:assert/strict";
import { test } from "node:test";

import { nonlinearSummary, toDb, type NonlinearSummaryInput } from "../src/physics/fiber-optics/nonlinear-effects";

const close = (actual: number, expected: number, rel = 1e-8) =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${actual} vs ${expected}`);

// 10 dBm, 80 km, 80 µm², 0.2 dB/km, n₂ = 2.6e-20 m²/W, 1550 nm, 8 channels at 100 GHz.
const base: NonlinearSummaryInput = {
  powerDbm: 10, length: 80e3, effectiveArea: 80e-12, alphaDbPerKm: 0.2, n2: 2.6e-20, wavelength: 1550e-9,
  dispersion: 17e-6, slope: 0.058e3, numChannels: 8, spacing: 100e9, polarization: "copolarized",
  sourceLinewidth: 0, brillouinLinewidth: 35e6,
};

test("SPM, XPM and thresholds of the default span", () => {
  // α = 0.2/(10/ln10)/1e3 = 4.60517e-5 /m; L_eff = (1 − e^(−αL))/α = 21169.2749 m; γ = 2π·2.6e-20/(1550e-9·80e-12) = 1.31744208e-3 /(W·m);
  // φ = γ·0.01 W·L_eff = 0.278892936 rad; XPM (7 others) = 14φ; SBS K=1: 21·80e-12/(5e-11·L_eff) = 1.5859 mW = 2.00633295 dBm.
  const s = nonlinearSummary(base);
  close(s.gamma, 1.3174420805376552e-3);
  close(s.Leff, 21169.274886976453);
  close(s.phiSPM, 0.2788929355057179);
  close(s.phiXPM, 3.904501097080051);
  close(s.sbsDbm, 2.0063329504252394);
  close(s.srsDbm, 29.718356854708396);
});

test("zero dispersion gives η = 1 and a product of φ² (Inoue 1992)", () => {
  const s = nonlinearSummary({ ...base, dispersion: 0, slope: 0, numChannels: 3 });
  assert.equal(s.eta, 1);
  close(toDb(s.fwmRatio) as number, -11.091249729719639);
});

test("domain clamps: a single channel has no XPM, zero length stays finite", () => {
  const one = nonlinearSummary({ ...base, numChannels: 1 });
  assert.equal(one.phiXPM, 0);
  const zero = nonlinearSummary({ ...base, length: 0 });
  assert.ok(Number.isFinite(zero.Leff) && zero.Leff > 0);
});
