import test from "node:test";
import assert from "node:assert/strict";

import { FUSED_SILICA_BRILLOUIN, acousticWavelength, brillouinGain, phononLifetime } from "../src/physics/materials/brillouin";
import { RAMAN_LINES, dephasingTime, lorentzianGain, ramanGainAtPump, ramanGainExponent } from "../src/physics/materials/raman-gain";
import {
  TPA_MEDIA, scaledBeta, scalingBeta, tpaF2, tpaRegime, tpaTransmission, twoPhotonRatio,
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
    assertRel(scalingBeta(lambda, m.n, m.bandGap_eV, m.Ep_eV), beta_cmGW * 1e-11, 0.03, id);
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

test("plane-wave 2PA transmission T = 1/(1 + βI₀L) (materials audit golden, PR #155)", () => {
  // 26 cm/GW, 1 GW/cm², 1 mm: βI₀L = 2.6, T = 0.27778.
  assertRel(tpaTransmission(26e-11, 1e13, 1e-3), 0.27778, 1e-4, "T");
  assert.equal(tpaTransmission(26e-11, 0, 1e-3), 1);
});
