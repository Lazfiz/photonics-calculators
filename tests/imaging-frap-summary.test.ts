import test from "node:test";
import assert from "node:assert/strict";

import { frapSummary } from "../src/physics/imaging/fluorescence-dynamics";

const rel = (a: number, e: number) => Math.abs(a / e - 1);

// Soumpasis, Biophys. J. 41, 95 (1983), doi:10.1016/S0006-3495(83)84410-5; Axelrod et al., Biophys. J. 16, 1055 (1976),
// doi:10.1016/S0006-3495(76)85755-4. γ by an independent power-series Bessel and bisection (see the schema checks).
test("frapSummary: disk at the page defaults", () => {
  const r = frapSummary({ model: "disk", w: 1e-6, tHalf: 2, mobile: 0.7, postBleach: 0.3, bleachK: 1 });
  assert.ok(rel(r.gamma, 0.894591150991) < 1e-9);
  assert.ok(rel(r.D, 0.1118238938739e-12) < 1e-9);
  assert.ok(rel(r.plateau, 0.79) < 1e-12);
  assert.ok(rel(r.immobile, 0.3) < 1e-12);
});

test("frapSummary: Gaussian beam ignores the disk post-bleach value; K = 1 gives γ = 1.0967, F(0) = 1 − e^−1", () => {
  const r = frapSummary({ model: "gaussian", w: 1e-6, tHalf: 2, mobile: 0.7, postBleach: 0.9, bleachK: 1 });
  assert.ok(rel(r.F0, 0.6321205588286) < 1e-12);
  assert.ok(rel(r.gamma, 1.096693324122) < 1e-9);
  assert.ok(rel(r.tauD, 2 / 1.096693324122) < 1e-9);
});

test("frapSummary edge cases: weak Gaussian bleach K = 0.01, and no mobile fraction", () => {
  // F(u) = Σ (−K)^n/n! / (1 + n(1 + 2u)), F(0) = (1 − e^−K)/K = 0.99501662508319; bisection of (F(u) − F(0))/(1 − F(0)) = ½
  // (200 halvings) gives γ = 1.00095261008194.
  const weak = frapSummary({ model: "gaussian", w: 1e-6, tHalf: 2, mobile: 0.7, postBleach: 0.3, bleachK: 0.01 });
  assert.ok(rel(weak.gamma, 1.00095261008194) < 1e-8);
  assert.ok(rel(weak.F0, 0.99501662508319) < 1e-8);
  // mobile = 0: the plateau stays at F0 = (1 − e^−1)/1 = 0.63212055882856
  const fixed = frapSummary({ model: "gaussian", w: 1e-6, tHalf: 2, mobile: 0, postBleach: 0.3, bleachK: 1 });
  assert.ok(rel(fixed.plateau, 0.63212055882856) < 1e-8);
  assert.equal(fixed.immobile, 1);
});
