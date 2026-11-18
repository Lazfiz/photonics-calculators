import test from "node:test";
import assert from "node:assert/strict";

import { FA_PER_CM2, vacuumPhotodiodeSummary, type VacuumPhotodiodeParams } from "../src/physics/detectors/vacuum-photodiode";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Richardson–Dushman (Dushman 1923, doi:10.1103/PhysRev.21.623), Child (1911, doi:10.1103/PhysRevSeriesI.32.492), Ramo (1939, doi:10.1109/JRPROC.1939.228757)
// transit τ = d√(2m_e/qV), f_tr = 0.55332713/τ; shot √(2qIB), Johnson √(4k_B·298.15·B/R). Values re-derived with an independent script (CODATA 2022 m_e, ε₀).
const base: VacuumPhotodiodeParams = {
  qe: 0.25, wavelength: 300e-9, power: 1e-6, phi: 2, voltage: 100, gap: 2e-3, area: 100e-6, load: 50, temperature: 298.15,
  darkEmission25: 0.02 * FA_PER_CM2, strayCapacitance: 0,
};

test("vacuumPhotodiodeSummary: defaults", () => {
  const s = vacuumPhotodiodeSummary(base);
  assertRel(s.cutoff, 619.9209921660013e-9, 1e-9, "cutoff");
  assertRel(s.responsivity, 0.0604915795301191, 1e-9, "R");
  assertRel(s.photocurrent, 6.04915795301191e-8, 1e-9, "I_ph");
  assertRel(s.darkCurrent, 2e-17, 1e-9, "I_dark");
  assertRel(s.childLimit, 0.058348798461538225, 1e-9, "Child");
  assertRel(s.transitTime, 674.4259847488199e-12, 1e-9, "tau");
  assertRel(s.capacitance, 0.44270939093999995e-12, 1e-9, "C");
  assertRel(s.rcBandwidth, 7.19004142893664e9, 1e-9, "f_RC");
  assertRel(s.bandwidth, 0.8151518551790503e9, 1e-9, "B");
  assertRel(s.snrDb, -18.654823173343996, 1e-9, "SNR");
  assert.equal(s.overChild, false);
  assert.equal(s.loadCollapse, false);
});

test("vacuumPhotodiodeSummary: beyond threshold gives no photocurrent", () => {
  const s = vacuumPhotodiodeSummary({ ...base, wavelength: 700e-9 });
  assert.equal(s.responsivity, 0);
  assert.equal(s.photocurrent, 0);
  assert.equal(s.snrDb, -Infinity);
});

test("vacuumPhotodiodeSummary: load collapse when I_ph·R_L exceeds 10 % of the bias", () => {
  const s = vacuumPhotodiodeSummary({ ...base, load: 1e9, power: 1e-3 });
  assert.equal(s.loadCollapse, true);
});
