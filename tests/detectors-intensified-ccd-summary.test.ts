import assert from "node:assert/strict";
import test from "node:test";

import { intensifiedCcdSummary } from "../src/physics/detectors/intensified-ccd";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Cascade of gain stages (Shockley and Pierce, Proc. IRE 26, 321 (1938), doi:10.1109/JRPROC.1938.228127): F = K_f² + 1/G_e;
// phosphor 240 photons per electron at 5 kV for P43 (Photek PH-DS039 Rev 02).
const base = {
  signal: 10, qe: 0.35, mcpGain: 1e3, plates: 1, kf: 1.6, screenVoltage: 5e3, phosphor: "p43" as const, coupling: 0.1, ccdQe: 0.5,
  readNoise: 5, fullWell: 1e5, spotFwhm: 0, bareQe: 0.5, backgroundRate: 1e6, gate: 100e-9,
};

test("intensifiedCcdSummary: point spot, hand-worked", () => {
  // N_pe = 3.5, N_bg = 1e6·1e-7·0.35 = 0.035, G_e = 1e3·240·0.1·0.5 = 12000, F = 2.56 + 1/12000
  // Var = 3.535·12000²·F + 25, SNR = 42000/√Var = 1.16344613; bare SNR = 5/√30 = 0.91287093
  const r = intensifiedCcdSummary(base);
  assertRel(r.photoelectrons, 3.5, 1e-12, "N_pe");
  assertRel(r.background, 0.035, 1e-12, "N_bg");
  assertRel(r.photonsPerElectron, 240, 1e-12, "g");
  assertRel(r.ge, 12000, 1e-12, "G_e");
  assertRel(r.noiseFactor, 2.560083333333, 1e-12, "F");
  assertRel(r.snr, 1.16344613, 1e-8, "SNR");
  assertRel(r.bareSnr, 0.91287093, 1e-8, "bare SNR");
  assert.equal(r.evenFieldFull, false);
  assert.equal(r.eventFull, false);
  assert.equal(r.gainSaturated, false);
});

test("intensifiedCcdSummary: phosphor gain is linear in the screen voltage, the stack is G^N, full well and saturation flags", () => {
  // P46 at 6 kV: 55·6/5 = 66 photons per electron; two plates of 100 give 1e4; G_e = 1e4·66·0.2·0.6 = 79200
  const r = intensifiedCcdSummary({ ...base, phosphor: "p46", screenVoltage: 6e3, plates: 2, mcpGain: 100, coupling: 0.2, ccdQe: 0.6 });
  assertRel(r.photonsPerElectron, 66, 1e-12, "g");
  assertRel(r.gain, 1e4, 1e-12, "stack");
  assertRel(r.ge, 79200, 1e-12, "G_e");
  // output = 3.5·79200 = 277200 e⁻ > the 1e5 e⁻ well: even-field full; gain 1e4 is below 1e7
  assert.equal(r.evenFieldFull, true);
  assert.equal(intensifiedCcdSummary({ ...base, plates: 2, mcpGain: 1e4 }).gainSaturated, true); // 1e8 > 1e7
});

test("intensifiedCcdSummary: no photoelectrons and no background make the high-gain limit undefined", () => {
  assert.ok(Number.isNaN(intensifiedCcdSummary({ ...base, qe: 0 }).highGainLimit));
});
