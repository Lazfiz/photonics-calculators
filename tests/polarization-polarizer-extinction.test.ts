import test from "node:test";
import assert from "node:assert/strict";

import {
  analyzerTransmission, cascade, contrastDb, extinctionRatioFromDb,
} from "../src/physics/polarization/polarizer-extinction";
import { applyMueller, muellerMultiply, type MuellerMatrix } from "../src/physics/polarization/mueller";

// Source: Goldstein, Polarized Light, 3rd ed. (2011), Mueller Matrices for Polarizing Components: a linear
// diattenuator with principal intensity transmittances q (pass) and r (block), axis horizontal, has
// M = ½ [[q+r, q−r, 0, 0], [q−r, q+r, 0, 0], [0, 0, 2√(qr), 0], [0, 0, 0, 2√(qr)]]. Numbers below are hand calculations.

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const DEG = Math.PI / 180;
const diattenuator = (q: number, r: number): MuellerMatrix => {
  const s = Math.sqrt(q * r);
  return [
    [(q + r) / 2, (q - r) / 2, 0, 0],
    [(q - r) / 2, (q + r) / 2, 0, 0],
    [0, 0, s, 0],
    [0, 0, 0, s],
  ];
};

test("30 dB, T∥ = 95 %: T⊥ = 9.5e-4, T(45°) = 0.475475, T(60°) = 0.2382125, contrast at 90° = 30 dB", () => {
  const tPar = 0.95;
  const tPerp = tPar / extinctionRatioFromDb(30);
  assertRel(tPerp, 9.5e-4, 1e-12, "T⊥");
  // (0.95 + 0.00095)/2 = 0.475475; 0.95·¼ + 0.00095·¾ = 0.2382125.
  assertRel(analyzerTransmission(tPar, tPerp, 45 * DEG), 0.475475, 1e-12, "T(45°)");
  assertRel(analyzerTransmission(tPar, tPerp, 60 * DEG), 0.2382125, 1e-12, "T(60°)");
  assertRel(contrastDb(tPar, analyzerTransmission(tPar, tPerp, 90 * DEG)), 30, 1e-12, "contrast at 90°");
  assert.equal(contrastDb(tPar, analyzerTransmission(tPar, tPerp, 0)), 0);
});

test("T(θ) equals S₀ of the diattenuator Mueller matrix applied to linear light at θ", () => {
  const q = 0.9;
  const r = 2e-3;
  for (const thetaDeg of [0, 17, 45, 73, 90]) {
    const t = 2 * thetaDeg * DEG;
    const out = applyMueller(diattenuator(q, r), [1, Math.cos(t), Math.sin(t), 0]);
    assertRel(analyzerTransmission(q, r, thetaDeg * DEG), out[0], 1e-12, `θ = ${thetaDeg}°`);
  }
});

test("cascade: 3 × (30 dB, 95 %) gives 90 dB and T∥ = 0.857375, matching the Mueller product", () => {
  const c = cascade(0.95, 30, 3);
  assertRel(c.erDb, 90, 1e-12, "ER");
  assertRel(c.tPar, 0.857375, 1e-12, "T∥");
  const m = diattenuator(0.95, 9.5e-4);
  const stack = muellerMultiply(m, muellerMultiply(m, m));
  // Principal transmittances of the stack: M00 ± M01.
  assertRel(stack[0][0] + stack[0][1], c.tPar, 1e-12, "stack q");
  // M00 − M01 = r³ ≈ 8.6e-10 cancels terms near 0.43, so this check holds only to ≈ 1e-8.
  assertRel(10 * Math.log10((stack[0][0] + stack[0][1]) / (stack[0][0] - stack[0][1])), c.erDb, 1e-7, "stack ER");
});

test("limits and domain: ER → ∞ is Malus's law; T∥ = 0 gives NaN contrast; non-integer cascade count gives NaN", () => {
  assertRel(analyzerTransmission(1, 0, 30 * DEG), 0.75, 1e-12, "Malus cos²30°");
  assert.ok(Number.isNaN(contrastDb(0, 0)));
  assert.ok(Number.isNaN(cascade(0.95, 30, 2.5).erDb));
  assert.ok(Number.isNaN(cascade(0.95, 30, 0).tPar));
});
