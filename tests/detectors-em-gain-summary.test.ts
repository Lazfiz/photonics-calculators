import test from "node:test";
import assert from "node:assert/strict";

import { emGainSummary } from "../src/physics/detectors/em-gain";

const assertRel = (actual: number, expected: number, tol: number, msg: string) =>
  assert.ok(Math.abs(actual - expected) <= tol * Math.abs(expected), `${msg}: ${actual} vs ${expected}`);

// Golden values from an independent scratch re-implementation of Robbins & Hadwen (2003, doi:10.1109/TED.2003.813462):
// F² = 2(G − 1)G^(−(N+1)/N) + 1/G, SNR = S/√(F²(S + CIC) + (σ/G)²), crossover S* = (σ_c² − (σ/G)²)/(F² − 1) − CIC.
test("emGainSummary at the page defaults", () => {
  const r = emGainSummary({ gain: 100, signal: 10, cic: 0.001, read: 50, stages: 604, conventionalRead: 6 });
  assertRel(r.enf2, 1.974960986166897, 1e-8, "F²");
  assertRel(r.stageProbability, 0.007653594111524997, 1e-8, "p");
  assertRel(r.snrWithEM, 2.2359793884849464, 1e-8, "SNR EM");
  assertRel(r.snrWithoutEM, 0.19960115625276723, 1e-8, "SNR G = 1");
  assertRel(r.emBenefit, 11.202236652644377, 1e-8, "benefit");
  assertRel(r.snrConventional, 1.474403535510683, 1e-8, "SNR conventional");
  assertRel(r.emVsConventional, 1.5165314885863181, 1e-8, "EM / conventional");
  assertRel(r.crossover, 36.66713391226323, 1e-8, "crossover");
  assert.equal(r.outputSignal, 1000);
  assert.equal(r.effectiveRead, 0.5);
});

test("emGainSummary at G = 300, N = 536", () => {
  const r = emGainSummary({ gain: 300, signal: 3, cic: 0.002, read: 30, stages: 536, conventionalRead: 5 });
  assertRel(r.enf2, 1.975567301150734, 1e-8, "F²");
  assertRel(r.snrWithEM, 1.2308472525538974, 1e-8, "SNR EM");
  assertRel(r.emBenefit, 12.328983233083138, 1e-8, "benefit");
  assertRel(r.crossover, 25.613864708178465, 1e-8, "crossover");
});

test("emGainSummary: G above 2^N gives NaN, G = 1 gives F² = 1 and crossover 0", () => {
  assert.ok(Number.isNaN(emGainSummary({ gain: 1000, signal: 10, cic: 0, read: 50, stages: 5, conventionalRead: 6 }).enf2));
  const r = emGainSummary({ gain: 1, signal: 10, cic: 0.001, read: 50, stages: 604, conventionalRead: 6 });
  assert.equal(r.enf2, 1);
  assert.equal(r.crossover, 0);
});
