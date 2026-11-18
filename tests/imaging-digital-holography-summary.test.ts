// Digital-holography summary (src/physics/imaging/digital-holography.ts). Golden values worked by hand from
// Schnars & Jüptner (2002), Meas. Sci. Technol. 13, R85–R101, doi:10.1088/0957-0233/13/9/201: Fresnel pixel λz/(NΔx),
// field λz/Δx, largest reference angle 2 arcsin(λ/4Δx), NA = sin(atan(NΔx/2z)).
import assert from "node:assert/strict";
import test from "node:test";

import { hologramSummary } from "../src/physics/imaging/digital-holography";

const near = (a: number, b: number, rel = 1e-9) => assert.ok(Math.abs(a - b) <= rel * Math.abs(b), `${a} vs ${b}`);

test("532 nm, 6.5 µm pitch, 2048 px, z = 0.2 m, D = 500 µm", () => {
  const s = hologramSummary(532e-9, 2048, 6.5e-6, 0.2, 500e-6);
  near(s.sensorSize, 13.312e-3);
  near(s.na, Math.sin(Math.atan(13.312e-3 / 0.4)));
  near(s.pitch, (532e-9 * 0.2) / 13.312e-3);
  near(s.field, (532e-9 * 0.2) / 6.5e-6);
  near(s.maxAngle, 2 * Math.asin(532e-9 / 26e-6));
  // z_min = Δx(NΔx + D)/λ = 6.5e-6·13.812e-3/532e-9 = 0.168756 m < 0.2 m
  near(s.inlineMinDistance, (6.5e-6 * 13.812e-3) / 532e-9);
  assert.equal(s.sampled, true);
  // Geometric NA is below the pixel limit λ/2Δx = 0.0409, so NA_eff = NA and the resolution is λ/(2NA).
  near(s.naEff, s.na);
  near(s.resolution, 532e-9 / (2 * s.na));
  near(s.fresnelNumber, (250e-6) ** 2 / (532e-9 * 0.2));
});

test("close in, the pixel limit λ/2Δx caps the NA and the in-line hologram is aliased", () => {
  const s = hologramSummary(532e-9, 2048, 6.5e-6, 0.05, 0);
  near(s.naEff, 532e-9 / 13e-6);
  near(s.resolution, 6.5e-6); // λ/(2·λ/2Δx) = Δx
  assert.equal(s.sampled, false);
  near(s.matchedDistance, (2048 * 6.5e-6 ** 2) / 532e-9);
});

test("invalid inputs give NaN", () => {
  assert.ok(Number.isNaN(hologramSummary(532e-9, 2048, 0, 0.2, 0).pitch));
});
