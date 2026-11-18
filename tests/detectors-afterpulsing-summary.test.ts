import assert from "node:assert/strict";
import test from "node:test";

import { afterpulsingSummary } from "../src/physics/detectors/afterpulsing";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Cova, Lacaita, Ripamonti, IEEE EDL 12, 685 (1991), doi:10.1109/55.116955; Ziarkash et al., Sci. Rep. 8, 5076 (2018).
test("afterpulsingSummary: one trap, hand-worked (P_ap = η e^(−t_d/τ), m = R/(1 + R t_d))", () => {
  // η = 0.05, τ = 20 ns, t_d = 50 ns, R = 1e6: P_ap = 0.05 e^(−2.5) = 0.00410424993; m = 1e6/1.05 = 952380.952; R_ap = 3908.8095
  const r = afterpulsingSummary({ tau1: 20e-9, eta1: 0.05, tau2: 200e-9, eta2: 0, deadTime: 50e-9, countRate: 1e6 });
  assertRel(r.pAp, 0.00410424993, 1e-8, "P_ap");
  assertRel(r.measured, 952380.952381, 1e-8, "m");
  assertRel(r.apRate, 3908.80946, 1e-8, "R_ap");
  assertRel(r.release1, 0.917915001, 1e-8, "released");
  assert.equal(r.tauMax, 20e-9);
  assert.deepEqual(r.warnings, []);
});

test("afterpulsingSummary: two traps add, tauMax follows the active slower trap, both warnings fire", () => {
  // η₁ = 0.4, τ₁ = 20 ns, η₂ = 0.2, τ₂ = 200 ns, t_d = 10 ns: P_ap = 0.4 e^(−0.5) + 0.2 e^(−0.05) = 0.242612 + 0.190246 = 0.432858
  const r = afterpulsingSummary({ tau1: 20e-9, eta1: 0.4, tau2: 200e-9, eta2: 0.2, deadTime: 10e-9, countRate: 1e6 });
  assertRel(r.pAp, 0.4328585, 1e-6, "P_ap");
  assert.equal(r.tauMax, 200e-9);
  assert.equal(r.warnings.length, 2); // P_ap > 0.1 and R·τ_max = 0.2 > 0.1
});
