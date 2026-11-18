import test from "node:test";
import assert from "node:assert/strict";

import { lightFieldMicroscope } from "../src/physics/imaging/light-field";
import { NO_ANGLE_DIFFRACTION, NO_ANGLE_PIXELS, noAngleReason } from "../src/physics/imaging/light-field-summary";

const close = (actual: number, expected: number, tol: number, label: string) =>
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);

const base = { na: 0.2, magnification: 20, n: 1, pixelPitch: 6.5e-6, lambda: 550e-9 };

test("pixel-limited lenslet (W 90 µm, p 50 µm) gets the pixel reason (Levoy 2006 eq. 3 with the 2-pixel cap)", () => {
  // Hand: R_obj = 0.47·0.55 µm·20/0.2 = 25.85 µm; W/R_obj = 90/25.85 = 3.48162476; W/(2p) = 90/100 = 0.9; N_u = 0.9 < 1.
  const r = lightFieldMicroscope({ ...base, pixelPitch: 50e-6, lensletPitch: 90e-6 });
  close(r.spotsDiffraction, 3.4816247582205033, 1e-9, "W/R_obj");
  close(r.spotsPixels, 0.9, 1e-12, "W/(2p)");
  assert.ok(Number.isNaN(r.dofRefocused));
  assert.ok(Number.isNaN(r.dofView));
  assert.equal(noAngleReason(r), NO_ANGLE_PIXELS);
});

test("diffraction-limited lenslet (W 20 µm) gets the diffraction reason; defaults have none", () => {
  // Hand: W/R_obj = 20/25.85 = 0.7737 < 1 and W/(2p) = 20/13 = 1.54, so diffraction is the cause.
  const narrow = lightFieldMicroscope({ ...base, lensletPitch: 20e-6 });
  assert.equal(noAngleReason(narrow), NO_ANGLE_DIFFRACTION);
  // Defaults W = 150 µm: W/R_obj = 5.80, W/(2p) = 11.5, N_u = 5.80 >= 1.
  assert.equal(noAngleReason(lightFieldMicroscope({ ...base, lensletPitch: 150e-6 })), undefined);
  // Invalid design (NA = n): N_u is NaN, no angle reason.
  assert.equal(noAngleReason(lightFieldMicroscope({ ...base, na: 1, lensletPitch: 150e-6 })), undefined);
});
