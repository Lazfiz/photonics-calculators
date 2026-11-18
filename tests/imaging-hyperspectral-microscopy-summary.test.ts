import test from "node:test";
import assert from "node:assert/strict";

import schema from "../src/schemas/imaging/hyperspectral-microscopy";
import { runSchema } from "../src/schemas/run";
import { hyperspectralBandSnr, hyperspectralSummary } from "../src/physics/imaging/hyperspectral-microscopy";

const rel = (a: number, e: number) => Math.abs(a / e - 1);

// Janesick, Photon Transfer (SPIE 2007), doi:10.1117/3.725073: SNR = S/√(S + D + σ_r²); size and time from the definitions.
const defaults = {
  start_nm: 400, end_nm: 720, bands: 32, pixels: 256, bitDepth: 16, exposure_s: 0.1, frames: 10, compression: 1,
  flux: 1000, qe: 0.8, readNoise: 1.5, dark: 0.5,
};

test("hyperspectralSummary at the page defaults, worked by hand", () => {
  // Δλ = 10 nm; 256²·32·16·10/8 B = 41 943 040 B = 40 MiB; T = 32 s; S = 800 e⁻; SNR = 800/√(800 + 0.05 + 2.25) = 28.2437.
  const r = hyperspectralSummary(defaults);
  assert.equal(r.bandwidth_nm, 10);
  assert.equal(r.sizeMiB, 40);
  assert.equal(r.cubeMiB, 4);
  assert.equal(r.totalTime, 32);
  assert.equal(r.dataRate, 1.25);
  assert.ok(rel(r.signal, 800) < 1e-12);
  assert.ok(rel(r.snrFrame, 28.24370006822) < 1e-10);
  assert.ok(rel(r.snrSum, 89.31442176623) < 1e-10);
});

test("hyperspectralBandSnr: no signal and no noise is NaN; summing n frames scales by √n", () => {
  assert.ok(Number.isNaN(hyperspectralBandSnr({ flux: 0, qe: 0.8, readNoise: 0, dark: 0 }, 10, 0.1)));
  const one = hyperspectralBandSnr(defaults, 10, 0.1);
  assert.ok(rel(hyperspectralBandSnr(defaults, 10, 0.1, 4), 2 * one) < 1e-12);
});

test("schema: start 478 nm, end 479 nm raises no false warning (float round trip)", () => {
  // through the API path: page units in nm, multiplied by toSI 1e-9 as a request is
  const values = Object.fromEntries(schema.inputs.map((i) => [i.key, i.default]));
  const out = runSchema(schema, { ...values, startNm: 478, endNm: 479, spectralBands: 4 });
  assert.deepEqual(out.warnings, []);
  // Δλ = (479 − 478) nm / 4 bands = 0.25 nm
  assert.ok(Math.abs((out.outputs.bandwidth ?? NaN) - 0.25) < 1e-8 * 0.25);
  // end below start + 1 nm is raised and warns
  assert.equal(runSchema(schema, { ...values, startNm: 478, endNm: 478.5, spectralBands: 4 }).warnings.length, 1);
});
