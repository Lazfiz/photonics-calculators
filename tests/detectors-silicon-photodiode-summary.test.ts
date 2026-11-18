import test from "node:test";
import assert from "node:assert/strict";

import { siliconPhotodiodeSummary, type SiliconPhotodiodeParams } from "../src/physics/detectors/silicon-photodiode";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Gärtner (1959) η = (1 − R)[1 − e^(−αW)/(1 + αL)] with Green (2008) k; E_g(T) = 1.17 − 4.73e-4·T²/(T + 636) eV (Sze & Ng 2007);
// I = q·n_i·W·A/τ_g, n_i(300 K) = 9.65e15 m⁻³ (Altermatt et al. 2003); C = ε₀·11.9·A/W. Values re-derived with an independent script.
const base: SiliconPhotodiodeParams = { T: 293, W: 10e-6, L: 100e-6, area: 1e-6, reflectance: 0.05, lifetime: 1e-3 };

test("siliconPhotodiodeSummary: defaults", () => {
  const s = siliconPhotodiodeSummary(base);
  assertRel(s.bandGap, 1.1262900139935415, 1e-9, "E_g");
  assertRel(s.bandGapWavelength, 1100.819477157428, 1e-9, "hc/E_g");
  assertRel(s.peakResponsivity, 0.5919236526279316, 1e-9, "peak R");
  assert.equal(s.peakWavelength, 840);
  assertRel(s.qe700, 0.9427878356955178, 1e-9, "QE 700");
  assertRel(s.responsivity900, 0.5632180606398561, 1e-9, "R 900");
  assertRel(s.qe900, 0.7758904421281571, 1e-9, "QE 900");
  assertRel(s.darkCurrent, 8.569716939553903e-12, 1e-9, "I_dark");
  assertRel(s.capacitance, 10.536483504372e-12, 1e-9, "C");
});

test("siliconPhotodiodeSummary: hot, thick, short diffusion length", () => {
  const s = siliconPhotodiodeSummary({ T: 330, W: 30e-6, L: 50e-6, area: 4e-6, reflectance: 0.1, lifetime: 10e-3 });
  assertRel(s.bandGap, 1.1166773291925465, 1e-9, "E_g");
  assertRel(s.peakResponsivity, 0.5834933668540738, 1e-9, "peak R");
  assert.equal(s.peakWavelength, 844);
  assertRel(s.darkCurrent, 1.7744956556554906e-10, 1e-9, "I_dark");
  assertRel(s.capacitance, 14.048644672496001e-12, 1e-9, "C");
});

test("siliconPhotodiodeSummary: no substrate diffusion (L = 0) lowers the near-infrared QE", () => {
  const withL = siliconPhotodiodeSummary(base);
  const noL = siliconPhotodiodeSummary({ ...base, L: 0 });
  assert.ok(noL.qe900 < withL.qe900);
  assert.ok(Number.isFinite(noL.peakResponsivity));
});
