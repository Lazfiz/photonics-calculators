import test from "node:test";
import assert from "node:assert/strict";

import { tiaNoiseAtRf, tiaNoiseSummary, type TiaNoiseParams } from "../src/physics/detectors/photodiode-tia-noise";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// X. Ramus, TI SBOA122 (2009): Butterworth TIA f = √(GBW/(2π·R_f·C_S)) and its noise sources, integrated through |H|² = 1/(1 + (f/f₀)⁴) up to B
// with the closed-form antiderivatives of 1/(1 + x⁴) and x²/(1 + x⁴) (checked against Simpson integration). Independent script, own constants.
const base: TiaNoiseParams = {
  wavelength_nm: 530, qe: 0.9, currentNoise: 5e-15, voltageNoise: 5e-9, inputC: 10e-12, gbw: 1e9, band: 100e6, feedbackR: 1e6, temperature: 300,
};

test("tiaNoiseSummary: 1 MΩ, 1 GHz GBW, 100 MHz post-filter", () => {
  const s = tiaNoiseSummary(base);
  assertRel(s.responsivity, 0.38472644581155746, 1e-9, "R");
  assertRel(s.fTia, 3989422.804014327, 1e-9, "f_TIA");
  assertRel(s.F, 4431050.193035749, 1e-9, "ENBW");
  assertRel(s.iRms, 2.6046198139874777e-9, 1e-9, "i_rms");
  assertRel(s.nep, 6.770056600848397e-9, 1e-9, "NEP");
  assertRel(s.outputNoise, 0.0026046198139874775, 1e-9, "output");
  assertRel(s.cf, 5.625980341168374e-14, 1e-9, "C_f");
  assert.equal(s.dominant, "e_n·2πf·C_S");
});

test("tiaNoiseSummary: post-filter below f_TIA; tiaNoiseAtRf agrees with the summary at R_f", () => {
  const p = { ...base, wavelength_nm: 850, qe: 0.7, currentNoise: 2e-15, voltageNoise: 3e-9, inputC: 5e-12, gbw: 5e8, band: 2e6, feedbackR: 1e5, temperature: 290 };
  const s = tiaNoiseSummary(p);
  assertRel(s.fTia, 12615662.6101008, 1e-9, "f_TIA");
  assertRel(s.F, 1999747.4267524988, 1e-9, "ENBW");
  assertRel(s.iRms, 5.880123549477652e-10, 1e-9, "i_rms");
  assertRel(s.cf, 1.752293127534392e-13, 1e-9, "C_f");
  assert.equal(tiaNoiseAtRf(p, p.feedbackR).nep, s.nep);
});

test("tiaNoiseSummary: a small R_f needs no feedback capacitance", () => {
  const s = tiaNoiseSummary({ ...base, feedbackR: 1 });
  assert.ok(Number.isNaN(s.cf));
});
