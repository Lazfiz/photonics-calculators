import test from "node:test";
import assert from "node:assert/strict";

import { spliceLossSummary } from "../src/physics/fiber-optics/splice-loss";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const um = 1e-6;
const K = 10 / Math.LN10;
const base = { mfd1: 9 * um, mfd2: 9 * um, offset: 0, tilt: 0, gap: 0, gapIndex: 1.45, fiberIndex: 1.447, lambda: 1550e-9 };

// Marcuse, Bell Syst. Tech. J. 56, 703 (1977): equal-mode offset, tilt and mismatch formulas.
test("spliceLossSummary: offset, tilt and mismatch alone match the closed forms", () => {
  const w = 4.5 * um;
  assertRel(spliceLossSummary({ ...base, offset: 0.3 * um }).latLoss, K * (0.3 * um / w) ** 2, 1e-9, "offset");
  const th = (0.4 * Math.PI) / 180;
  assertRel(spliceLossSummary({ ...base, tilt: th }).angLoss, K * ((Math.PI * 1.45 * w * th) / 1550e-9) ** 2, 1e-9, "tilt");
  const r = spliceLossSummary({ ...base, mfd1: 9.2 * um, mfd2: 10.4 * um });
  const eta = ((2 * 4.6 * 5.2) / (4.6 ** 2 + 5.2 ** 2)) ** 2;
  assertRel(r.mismatchLoss, -10 * Math.log10(eta), 1e-9, "mismatch");
  assertRel(r.totalLoss, r.mismatchLoss, 1e-9, "contact total");
});

test("spliceLossSummary: index-matched gap is pure diffraction; invalid input gives NaN", () => {
  const w = 4.5 * um, u = (1550e-9 * 5 * um) / (2 * Math.PI * 1.447 * w * w);
  const r = spliceLossSummary({ ...base, gap: 5 * um, gapIndex: 1.447 });
  assertRel(r.gapLoss, 10 * Math.log10(1 + u * u), 1e-9, "gap");
  assert.ok(Math.abs(r.reflectionLoss) < 1e-12);
  assert.ok(Number.isNaN(spliceLossSummary({ ...base, tilt: Math.PI / 6 }).totalLoss));
});
