import test from "node:test";
import assert from "node:assert/strict";

import { photonTransferSummary } from "../src/physics/detectors/photon-transfer";

const assertRel = (actual: number, expected: number, tol: number, msg: string) =>
  assert.ok(Math.abs(actual - expected) <= tol * Math.abs(expected), `${msg}: ${actual} vs ${expected}`);

// Golden values from an independent scratch re-implementation of Janesick (2007, doi:10.1117/3.725073, ch. 5):
// σ_q = K/√12, temporal √(S + σ_r² + σ_q²), total √(temporal² + (PRNU·S)²), floor √(σ_r² + σ_q²), DR = 20·log₁₀(well/floor).
test("photonTransferSummary at the page defaults", () => {
  const r = photonTransferSummary({ gain: 2, read: 10, wellCapacity: 50000, prnu: 0.01 });
  assertRel(r.full.total, 547.8141412316164, 1e-9, "total");
  assertRel(r.full.temporal, 223.83103746650806, 1e-9, "temporal");
  assertRel(r.floor, 10.016652800877813, 1e-9, "floor");
  assertRel(r.readCrossover, 100.33333333333333, 1e-9, "read crossover");
  assertRel(r.prnuCrossover, 10000, 1e-9, "PRNU crossover");
  assertRel(r.dynamicRangeDb, 73.96494767797857, 1e-9, "DR");
});

test("photonTransferSummary without PRNU has no PRNU crossover", () => {
  const r = photonTransferSummary({ gain: 2, read: 10, wellCapacity: 50000, prnu: 0 });
  assert.equal(r.prnuCrossover, Infinity);
  assertRel(r.full.total, r.full.temporal, 1e-12, "total = temporal");
});
