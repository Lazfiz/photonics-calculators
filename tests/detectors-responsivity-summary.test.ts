import test from "node:test";
import assert from "node:assert/strict";

import { responsivitySummary } from "../src/physics/detectors/responsivity-summary";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// ℛ = η·q·λ/(h·c) (S. M. Sze, K. K. Ng, Physics of Semiconductor Devices, 3rd ed., ch. 13). Values re-derived with an independent
// script using the exact SI values q = 1.602176634e-19 C, h = 6.62607015e-34 J·s, c = 299792458 m/s.
test("responsivitySummary: η = 0.8 at 1550 nm", () => {
  const s = responsivitySummary(0.8, 1550e-9);
  assertRel(s.responsivity, 1.0001274482313023, 1e-9, "R");
  assertRel(s.idealResponsivity, 1.250159310289128, 1e-9, "R(η = 1)");
  assertRel(s.photonsPerWatt, 7.8028806796912e18, 1e-9, "photons per watt");
  assertRel(s.photocurrent, 1.0001274482313023e-3, 1e-9, "I at 1 mW");
});

test("responsivitySummary: η = 0 gives zero responsivity; invalid input gives NaN", () => {
  const zero = responsivitySummary(0, 850e-9);
  assert.equal(zero.responsivity, 0);
  assert.equal(zero.photocurrent, 0);
  assert.ok(Number.isNaN(responsivitySummary(0.5, 0).responsivity));
  assert.ok(Number.isNaN(responsivitySummary(-0.1, 850e-9).photocurrent));
});
