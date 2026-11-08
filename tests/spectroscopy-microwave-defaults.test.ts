import assert from "node:assert/strict";
import test from "node:test";
import { DIATOMICS, MICROWAVE_DEFAULTS, microwavePresetValues } from "../src/physics/spectroscopy/diatomic";

// The microwave page's input values for a preset: 1 cm⁻¹ = 29979.2458 MHz (c in cm/µs ×10⁴), so the NIST WebBook
// ¹²C¹⁶O constants α_e = 0.01750441 cm⁻¹ and D_e = 6.12147×10⁻⁶ cm⁻¹ read 524.769 MHz and 0.183517 MHz (6 digits).
// Hand arithmetic: 0.01750441 × 29979.2458 = 524.7690, 6.12147e-6 × 29979.2458 = 0.1835170.
test("microwavePresetValues: ¹²C¹⁶O in the page's units", () => {
  const v = microwavePresetValues(DIATOMICS.co);
  assert.equal(v.m1, 12);
  assert.equal(v.bondLength, 1.128323); // r_e = 1.128323 Å
  assert.ok(Math.abs(v.alphaE / 524.7690 - 1) < 1e-6);
  assert.ok(Math.abs(v.distortion / 0.183517 - 1) < 1e-5);
  assert.equal(v.dipoleMoment, 0.11011); // JPL 28001, debye
  assert.deepEqual(MICROWAVE_DEFAULTS, v);
});

test("microwavePresetValues: edge case, zero dipole and zero distortion stay zero", () => {
  const v = microwavePresetValues({ ...DIATOMICS.co, dipole: 0, De: 0 });
  assert.equal(v.dipoleMoment, 0);
  assert.equal(v.distortion, 0);
});
