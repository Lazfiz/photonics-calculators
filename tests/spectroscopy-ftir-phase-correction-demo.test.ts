import assert from "node:assert/strict";
import { test } from "node:test";
import { DEMO_DX, demoSingleBeam, mertz, phaseCorrectionDemo, synthesizeInterferogram, findZpd, relativeRmsError } from "../src/physics/spectroscopy/ftir-phase-correction";
import { createRng, gaussian } from "../src/physics/random";

// phaseCorrectionDemo is the pipeline the phase-correction page and its API schema share (moved out of the page).
// Reference: Griffiths & de Haseth, Fourier Transform Infrared Spectrometry, 2nd ed. (2007), ch. 4: a record with the
// ZPD on a sample and no phase error needs no correction, so the "uncorrected" real transform already reproduces the spectrum.
test("demo step is one HeNe wavelength: Nyquist 1/(2 dx) = 7901 cm-1", () => {
  assert.ok(Math.abs(1 / (2 * DEMO_DX) - 7901.4) < 0.1);
});

test("no phase error and no noise: ZPD at sample 0 and every method reproduces the spectrum to a few percent", () => {
  const r = phaseCorrectionDemo({ N: 4096, M: 128, eps: 0, phi0: 0, phi2: 0, noisePct: 0 });
  assert.equal(r.shift, 0);
  for (const e of Object.values(r.errors)) assert.ok(e < 0.03, `error ${e}`);
  assert.ok(r.phaseRms < 0.05);
});

test("the demo equals the explicit pipeline the page used before (seed 1, defaults)", () => {
  const N = 4096, M = 128, nNeg = N + 8;
  const phi = (s: number) => 2 * Math.PI * s * 0.3 * DEMO_DX + 0.5 + 1 * ((s - 2000) / 2000) ** 2;
  const clean = synthesizeInterferogram((s) => demoSingleBeam(s), phi, DEMO_DX, nNeg, N);
  const peak = Math.max(...clean.map(Math.abs));
  const rng = createRng(1);
  const record = { I: clean.map((v) => v + (0.01 / 100) * peak * gaussian(rng)), zero: nNeg, dx: DEMO_DX };
  const z = findZpd(record);
  const expected = relativeRmsError(mertz(record, z, M), (s) => demoSingleBeam(s));
  const r = phaseCorrectionDemo({ N, M, eps: 0.3, phi0: 0.5, phi2: 1, noisePct: 0.01, seed: 1 });
  assert.equal(r.errors.mertz, expected);
});
