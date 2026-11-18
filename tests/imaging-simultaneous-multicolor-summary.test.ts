import test from "node:test";
import assert from "node:assert/strict";

import { type Channel, layoutWarnings, multicolorSummary } from "../src/physics/imaging/simultaneous-multicolor";

function close(actual: number, expected: number, label: string, tol = 1e-8) {
  assert.ok(Math.abs(actual / expected - 1) <= tol, `${label}: ${actual} vs ${expected}`);
}

const channels: Channel[] = [
  { dye: "EGFP", laser: 488, center: 525, width: 50 },
  { dye: "mCherry", laser: 561, center: 610, width: 40 },
  { dye: "miRFP670", laser: 640, center: 700, width: 75 },
];
const base = { channels, mode: "simultaneous", flux: 25000, exposure: 0.02, readout: 0.002, binning: 1, binMode: "charge", readNoise: 1.5, dark: 0.01, qe: 0.9 } as const;

test("multicolor: spillover and SNR against a scratch calculation (own trapezoid integrals of the FPbase samples)", () => {
  // Roederer 2001: L_ij = R_ij/R_jj; with all lasers on the excitation cancels, so L_ij is the emission ratio between filters.
  const s = multicolorSummary(base);
  close(s.spill[1][0], 0.037999623638706037, "L21");
  close(s.spill[2][1], 0.4343452416827386, "L32");
  assert.equal(s.spill[0][2], 0);
  // Janesick 2007: SNR_i = S/√(S + D + Σ_j L_ij S + σ_read²), S = 25000·0.02·0.9 = 450 e⁻, D = 2e-4 e⁻.
  close(s.snr[2], 17.632061676968256, "SNR 3");
  close(s.snrOwn, 450 / Math.sqrt(450 + 0.0002 + 2.25), "own SNR");
  assert.deepEqual(s.warnings, []);
});

test("multicolor: frame rates, digital binning and the sequential spillover", () => {
  close(multicolorSummary(base).fpsSimultaneous, 1 / 0.022, "fps");
  close(multicolorSummary(base).fpsSequential, 1 / (3 * 0.022), "fps sequential");
  // 2 × 2 digital: S = 1800, D = 8e-4, read noise 2·1.5 = 3 e⁻.
  close(multicolorSummary({ ...base, binning: 2, binMode: "digital" }).snrOwn, 1800 / Math.sqrt(1800 + 0.0008 + 9), "digital binning");
  close(multicolorSummary({ ...base, mode: "sequential" }).spill[2][1], 0.0029209955258613957, "sequential L32");
});

test("multicolor: layout warnings", () => {
  const overlap = [channels[0], { ...channels[1], center: 540, width: 40 }];
  const w = layoutWarnings(overlap, "simultaneous", multicolorSummary({ ...base, channels: overlap }).spill);
  assert.ok(w.some((t) => t.startsWith("Filters 1 and 2 overlap")));
  const inside = [{ ...channels[0], laser: 520 }];
  assert.ok(layoutWarnings(inside, "simultaneous", multicolorSummary({ ...base, channels: inside }).spill).some((t) => t.includes("lies inside filter 1")));
});

test("multicolor: zero signal, dark current and read noise gives SNR 0/0 with finite spillovers", () => {
  // Hand: S = 0, D = 0, σ_read = 0 give SNR = S/√(S + D + Σ L S + σ²) = 0/0; the spillover L_ij = R_ij/R_jj is an emission ratio and does not depend on the flux,
  // so the off-diagonal spillovers stay finite (the schema then reports "no noise", not "no background").
  const s = multicolorSummary({ ...base, flux: 0, readNoise: 0, dark: 0 });
  assert.ok(s.snr.every((v) => Number.isNaN(v)));
  assert.ok(s.spill.every((row, r) => row.every((v, c) => c === r || Number.isFinite(v))));
});
