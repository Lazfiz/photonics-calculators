import assert from "node:assert/strict";
import test from "node:test";

import { geigerSummary, type GeigerInput } from "../src/physics/detectors/geiger-mode-avalanche";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Otte et al., Nucl. Instrum. Methods A 846, 106 (2017), doi:10.1016/j.nima.2016.09.053; Webster & Henderson, IEEE TED 60, 4014 (2013),
// doi:10.1109/TED.2013.2285163; Cova et al., IEEE EDL 12, 685 (1991), doi:10.1109/55.116955.
const base: GeigerInput = {
  overbiasRef: 3, vc: 2.09, pdeMax: 0.525, temperature: 25, beta: 0.054, dcrRef: 139, activationEnergy: 0.85, fieldSlope: 0.159,
  deadTime: 50e-9, trapEfficiency: 0.05, trapLifetime: 20e-9,
};

test("geigerSummary: at the reference point, hand-worked", () => {
  // P_t = 1 − e^(−3/2.09) = 0.7619815; PDE = 0.4000403; DCR = 139; P_ap = 0.05·e^(−2.5) = 0.00410425; 1/t_d = 2e7; doubling 6.246677 K
  const r = geigerSummary(base);
  assert.equal(r.bvShift, 0);
  assertRel(r.overbias, 3, 1e-12, "ΔV");
  assertRel(r.triggerProbability, 0.7619815, 1e-7, "P_t");
  assertRel(r.pde, 0.4000403, 1e-6, "PDE");
  assertRel(r.dcr, 139, 1e-12, "DCR");
  assertRel(r.afterpulseProbability, 0.00410425, 1e-6, "P_ap");
  assertRel(r.maxRate, 2e7, 1e-12, "1/t_d");
  assertRel(r.doubling, 6.246677, 1e-6, "doubling");
  assert.equal(r.belowBreakdown, false);
});

test("geigerSummary: at 45 °C the excess bias shrinks by β·ΔT", () => {
  // ΔV = 3 − 0.054·20 = 1.92 V; DCR = 139·exp[−(0.85/k_B)(1/318.15 − 1/298.15)]·e^(0.159·(−1.08))·P_t(1.92)/P_t(3)
  const r = geigerSummary({ ...base, temperature: 45 });
  assertRel(r.bvShift, 1.08, 1e-12, "shift");
  assertRel(r.overbias, 1.92, 1e-12, "ΔV");
  assert.ok(r.dcr > 0 && Number.isFinite(r.dcr));
});

test("geigerSummary: a supply below the shifted breakdown cannot count", () => {
  const r = geigerSummary({ ...base, temperature: 100 });
  assert.equal(r.belowBreakdown, true);
  assert.equal(r.triggerProbability, 0);
  assert.equal(r.dcr, 0);
});
