import test from "node:test";
import assert from "node:assert/strict";

import { FUSED_SILICA_BRILLOUIN, acousticWavelength, brillouinGain, phononLifetime } from "../src/physics/materials/brillouin";
import { RAMAN_LINES, dephasingTime, lorentzianGain, ramanGainAtPump, ramanGainExponent } from "../src/physics/materials/raman-gain";
import {
  TPA_MEDIA, indirectBeta, indirectF2, mediumBeta, mediumRegime, scaledBeta, scalingBeta, tpaF2, tpaRegime, tpaTransmission,
  twoPhotonRatio,
} from "../src/physics/materials/two-photon";
import { brillouinShift } from "../src/physics/fiber-optics/fiber-nonlinear";
import { stokesWavelength } from "../src/physics/imaging/coherent-raman";
import { hc_eV_nm } from "../src/physics/constants";

function assertRel(actual: number, expected: number, rel: number, label: string) {
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${label}: ${actual} vs ${expected}`);
}

// ------------------------------------------------------------------ Brillouin

test("Brillouin shift, acoustic wavelength and gain of fused silica at 1550 nm (materials audit golden, PR #155)", () => {
  const m = FUSED_SILICA_BRILLOUIN;
  // ν_B = 2 · 1.45 · 5960 / 1.55e-6 = 11.151 GHz (Agrawal NFO: ≈ 11.1 GHz at 1.55 µm).
  assertRel(brillouinShift(1550e-9, m.vA, m.n), 11.151e9, 1e-4, "ν_B");
  // Λ = λ/(2n) = 1.55 / 2.9 = 0.53448 µm.
  assertRel(acousticWavelength(1550e-9, m.n), 0.53448e-6, 1e-4, "Λ");
  // g_B = 2π · 1.45⁷ · 0.286² / (c · (1.55e-6)² · 2210 · 5960 · 20e6) = 3.650e-11 m/W.
  assertRel(brillouinGain(1550e-9, m, 20e6), 3.650e-11, 1e-3, "g_B");
  // T_B = 1/(π · 20 MHz) = 15.92 ns.
  assertRel(phononLifetime(20e6), 15.915e-9, 1e-4, "T_B");
  assert.ok(Number.isNaN(brillouinGain(1550e-9, m, 0)), "Δν_B = 0 is guarded");
});

// ------------------------------------------------------------------ Raman

test("Raman Stokes wavelengths from a 1064 nm pump (materials audit golden, PR #155)", () => {
  // 1/(1/1064 nm − 1332 cm⁻¹) = 1239.70 nm; 440 cm⁻¹ gives 1116.26 nm.
  assertRel(stokesWavelength(1064e-9, 1332e2) * 1e9, 1239.70, 1e-5, "diamond");
  assertRel(stokesWavelength(1064e-9, 440e2) * 1e9, 1116.26, 1e-5, "silica");
  // A shift above the pump wavenumber has no Stokes wave.
  assert.ok(Number.isNaN(stokesWavelength(1064e-9, 1e7)));
});

test("diamond Raman gain from Savitski 2013 Table 1 and its interpolation in pump wavenumber", () => {
  const d = RAMAN_LINES.diamond;
  assert.equal(ramanGainAtPump(d, 1064e-9).basis, "measured");
  assertRel(ramanGainAtPump(d, 1064e-9).g, 17e-11, 1e-12, "1064 nm");
  assertRel(ramanGainAtPump(d, 355e-9).g, 78e-11, 1e-12, "355 nm");
  // 600 nm lies between 532 nm (42) and 670 nm (41 cm/GW): t = (1/600 − 1/532)/(1/670 − 1/532) = 0.55072,
  // g = 42 − 0.55072 = 41.449 cm/GW.
  const mid = ramanGainAtPump(d, 600e-9);
  assert.equal(mid.basis, "interpolated");
  assertRel(mid.g, 41.449e-11, 1e-4, "600 nm");
  // Beyond 1280 nm: 7.6 · 1280/1500 = 6.4853 cm/GW, flagged as scaled.
  assert.equal(ramanGainAtPump(d, 1500e-9).basis, "scaled");
  assertRel(ramanGainAtPump(d, 1500e-9).g, 6.4853e-11, 1e-4, "1500 nm");
});

test("silica Raman gain scales as 1/λ_p from 1e-13 m/W at 1 µm (Agrawal NFO)", () => {
  assertRel(ramanGainAtPump(RAMAN_LINES["fused-silica"], 1550e-9).g, 6.4516e-14, 1e-4, "g_R(1550)");
  // 13.2 THz / c = 440.30 cm⁻¹.
  assertRel(RAMAN_LINES["fused-silica"].shift, 440.30e2, 1e-4, "Ω̃");
});

test("Lorentzian line, dephasing time and single-pass gain", () => {
  const b = RAMAN_LINES["barium-nitrate"];
  // Half maximum at Ω̃₀ ± Δν̃/2.
  assertRel(lorentzianGain(1, b.shift + b.fwhm / 2, b.shift, b.fwhm), 0.5, 1e-12, "HWHM");
  // T₂ = 1/(π c · 40 m⁻¹) = 26.54 ps (Optogama lists 28 ps for Ba(NO₃)₂).
  assertRel(dephasingTime(b.fwhm), 26.544e-12, 1e-4, "T₂");
  // Diamond at 1064 nm, 1 GW/cm², 1 cm: G = 17 cm/GW · 1 GW/cm² · 1 cm = 17.
  assertRel(ramanGainExponent(17e-11, 1e13, 0.01), 17, 1e-12, "G");
  assert.ok(Number.isNaN(lorentzianGain(1, 0, 0, NaN)), "glass line has no Lorentzian");
});

// ------------------------------------------------------------------ Two-photon absorption

test("2PA scaling of Eq. 1 against the predicted column of Van Stryland 1985 Table 1", () => {
  // Table 1 evaluates F₂ at 2ħω = 2.34 eV (1.06 µm) and 4.68 eV (0.53 µm). K = 3100 is a rounded fit, so the
  // predictions agree to ≈ 2%.
  const predicted: [keyof typeof TPA_MEDIA, number, number][] = [
    ["gaas", 2.34, 19.7], ["cdte", 2.34, 25.1], ["cdse", 2.34, 18.6], ["znse", 4.68, 4.27], ["cds", 4.68, 4.87], ["zno", 4.68, 4.77],
  ];
  for (const [id, twoPhoton_eV, beta_cmGW] of predicted) {
    const m = TPA_MEDIA[id];
    const lambda = (2 * hc_eV_nm * 1e-9) / twoPhoton_eV;
    assertRel(scalingBeta(lambda, m.n ?? NaN, m.bandGap_eV, m.Ep_eV ?? NaN), beta_cmGW * 1e-11, 0.03, id);
  }
});

test("F₂ scaling of the measured GaAs β and the 2PA window", () => {
  const g = TPA_MEDIA.gaas;
  assertRel(g.beta, 23e-11, 1e-12, "β(1064)");
  // F₂ peaks at x = 10/7; at the same x the scaled β is 23 · F₂(10/7)/F₂(x₁₀₆₄).
  const x1064 = twoPhotonRatio(1064e-9, g.bandGap_eV);
  const lambdaPeak = (2 * hc_eV_nm * 1e-9) / (g.bandGap_eV * (10 / 7));
  assertRel(scaledBeta(g.beta, g.lambda, lambdaPeak, g.bandGap_eV), (23e-11 * tpaF2(10 / 7)) / tpaF2(x1064), 1e-12, "peak");
  // F₂(10/7) = (3/7)^1.5 / (10/7)^5 = 0.28056 / 5.9499 = 0.047155.
  assertRel(tpaF2(10 / 7), 0.047155, 1e-4, "F₂ max");
  // Below E_g/2 there is no 2PA; at or above E_g the model does not apply.
  assert.equal(scaledBeta(g.beta, g.lambda, 2000e-9, g.bandGap_eV), 0);
  assert.ok(Number.isNaN(scaledBeta(g.beta, g.lambda, 800e-9, g.bandGap_eV)));
  assert.equal(tpaRegime(800e-9, g.bandGap_eV), "linear");
  assert.equal(tpaRegime(1064e-9, g.bandGap_eV), "two-photon");
});

test("silicon indirect-gap 2PA: Bristow et al. 2007 fit against their measurement", () => {
  // F₂⁽⁰⁾(x) at 2x = 2 (ħω = E_gi): π/8 · 2⁻⁵ · 1 = 0.0122718.
  assertRel(indirectF2(0, 1), Math.PI / 256, 1e-12, "F₂⁽⁰⁾(1)");
  // 1220 nm: ħω = 1.016264 eV, x = 0.907379, 2x = 1.814757, (2x)⁻⁵ = 0.050805, 2x − 1 = 0.814757:
  // F⁽⁰⁾ = π/8 · 0.050805 · 0.663829 = 0.013244, F⁽¹⁾ = 3π/48 · 0.050805 · 0.540861 = 0.0053954,
  // F⁽²⁾ = 15π/384 · 0.050805 · 0.440670 = 0.0027475; β = 2 · 43 · 0.021387 = 1.8393 cm/GW.
  // Bristow et al. measured 2.1 ± 0.4 cm/GW at 1220 nm (text), so the fit is inside their error.
  assertRel(indirectBeta(1220e-9), 1.8393e-11, 2e-4, "β(1220)");
  assert.ok(Math.abs(indirectBeta(1220e-9) - TPA_MEDIA.silicon.beta) < 0.4e-11, "within 2.1 ± 0.4");
  // 1000 nm: 2x = 2.21404, sum 0.022495, β = 1.9345 cm/GW (the plateau of Fig. 2).
  assertRel(indirectBeta(1000e-9), 1.9345e-11, 3e-4, "β(1000)");
  // No 2PA once 2ħω ≤ E_gi: λ ≥ 2·1239.842/1.12 = 2214.0 nm.
  assert.equal(indirectBeta(2215e-9), 0);
  assert.equal(mediumRegime(TPA_MEDIA.silicon, 2215e-9), "transparent");
  assert.equal(mediumRegime(TPA_MEDIA.silicon, 1000e-9), "two-photon");
  assert.equal(mediumRegime(TPA_MEDIA.silicon, 800e-9), "outside-fit");
  assert.ok(Number.isNaN(mediumBeta(TPA_MEDIA.silicon, 800e-9)), "below Bristow's 850 nm");
});

test("DeSalvo 1996 wide-gap rows: effective gaps, measured β and the near-edge divergence", () => {
  // Table I: fused silica 0.05 cm/GW at 266 nm with E′_g = 9.0 eV; β ≈ 0 at 355 nm is consistent: 2ħω = 6.99 eV < 9.0 eV.
  const fs = TPA_MEDIA["fused-silica"];
  assertRel(mediumBeta(fs, 266e-9), 0.05e-11, 1e-12, "FS at 266");
  assert.equal(mediumRegime(fs, 355e-9), "transparent");
  assert.equal(mediumBeta(fs, 355e-9), 0);
  // BBO: 0.9 cm/GW at 266 nm, E′_g = 6.8 eV. F₂(x) at 266 nm: x = 9.32212/6.8 = 1.370900, F₂ = 0.225884/4.842046 = 0.046651;
  // at 355 nm: x = 6.985026/6.8 = 1.027210, F₂ = 0.0044884/1.143657 = 0.0039246; β = 0.9 · 0.084127 = 0.075714 cm/GW,
  // against 0.010 ± 0.002 measured (Table I): the divergence near the 2PA edge that DeSalvo et al. report.
  const bbo = TPA_MEDIA.bbo;
  assertRel(mediumBeta(bbo, 355e-9), 0.075714e-11, 1e-4, "BBO 355");
  // KTP 0.10 cm/GW at 532 nm, LiNbO₃ 0.38 cm/GW at 532 nm.
  assertRel(TPA_MEDIA.ktp.beta, 0.10e-11, 1e-12, "KTP");
  assertRel(TPA_MEDIA.linbo3.beta, 0.38e-11, 1e-12, "LiNbO₃");
  assert.equal(mediumRegime(TPA_MEDIA.ktp, 1064e-9), "transparent");
  // Linear absorption starts at Table I's E_g = 3.8 eV (326.3 nm), below E′_g = 4.6 eV: KTP at 300 nm is not 2PA.
  assert.equal(mediumRegime(TPA_MEDIA.ktp, 300e-9), "linear");
  assert.ok(Number.isNaN(mediumBeta(TPA_MEDIA.ktp, 300e-9)), "no 2PA β above the edge");
  assert.equal(mediumRegime(TPA_MEDIA.ktp, 340e-9), "two-photon");
});

test("plane-wave 2PA transmission T = 1/(1 + βI₀L) (materials audit golden, PR #155)", () => {
  // 26 cm/GW, 1 GW/cm², 1 mm: βI₀L = 2.6, T = 0.27778.
  assertRel(tpaTransmission(26e-11, 1e13, 1e-3), 0.27778, 1e-4, "T");
  assert.equal(tpaTransmission(26e-11, 0, 1e-3), 1);
});
