import test from "node:test";
import assert from "node:assert/strict";

import { SPECIALTY_FIBERS, specialtySummary } from "../src/physics/fiber-optics/specialty-fiber";
import { wdmPlanSummary } from "../src/physics/fiber-optics/wdm-channel-plan";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Gloge, Appl. Opt. 10, 2252 (1971): V = 2π a NA/λ; Marcuse 1977 mode-radius fit.
test("specialtySummary: PM1550-XP at 1550 nm, 10 m", () => {
  const r = specialtySummary(SPECIALTY_FIBERS.pm, 1550e-9, 10);
  const V = (2 * Math.PI * 4.25e-6 * 0.125) / 1550e-9;
  assertRel(r.V, V, 1e-12, "V");
  assertRel(r.mfdModel, 2 * 4.25e-6 * (0.65 + 1.619 * V ** -1.5 + 2.879 * V ** -6), 1e-12, "MFD");
  assertRel(r.lossDb, 0.01, 1e-12, "1.0e-3 dB/m · 10 m");
  assert.equal(r.singleMode, true);
  assert.equal(r.transmits, true);
  assert.equal(r.inBand, true);
});

test("specialtySummary: chalcogenide has no sheet MFD, so its MFD at the sheet wavelength is NaN", () => {
  const r = specialtySummary(SPECIALTY_FIBERS.chalcogenide, 4800e-9, 2);
  assert.ok(Number.isNaN(r.mfdAtSheetLambda));
  assertRel(r.lossDb, 0.2, 1e-12, "0.1 dB/m · 2 m");
});

// ITU-T G.694.1: equal-frequency DWDM grid; Gaussian passband isolation 40·log10(2)·(Δλ/FWHM)² dB.
test("wdmPlanSummary: 0.8 nm at 1550 nm is the 100 GHz grid; 1.0 nm is a custom wavelength grid", () => {
  const c = 299792458;
  const g = wdmPlanSummary(8, 1550e-9, 0.8e-9, 0.4e-9);
  assert.equal(g.grid.equalFrequency, true);
  const nuC = c / 1550e-9, dNu = (c * 0.8e-9) / (1550e-9 * 1550e-9);
  assertRel(g.first, c / (nuC + 3.5 * dNu), 1e-12, "first");
  assertRel(g.last, c / (nuC - 3.5 * dNu), 1e-12, "last");
  assertRel(g.frequencySpacing, dNu, 1e-12, "Δν");
  assertRel(g.isolationDb, 40 * Math.log10(2) * 4, 1e-12, "isolation");
  const k = wdmPlanSummary(8, 1550e-9, 1e-9, 0.5e-9);
  assert.equal(k.grid.equalFrequency, false);
  assertRel(k.totalBandwidth, 7e-9, 1e-9, "span");
  assert.equal(k.outOfRange, false);
  assert.equal(wdmPlanSummary(96, 800e-9, 20e-9, 1e-9).planInvalid, true);
});
