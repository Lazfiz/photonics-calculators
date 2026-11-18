// Golden values for macroBendSummary (src/physics/fiber-optics/macro-bending-loss-summary.ts), from an independent script
// (own Bessel series and K_ν integral, bisection for the LP01 root) applying Marcuse D., J. Opt. Soc. Am. 66, 216 (1976):
// α = √π κ² exp(−2γ³R/(3β²)) / (2 γ^(3/2) V² √R K₁²(W)), κ = U/a, γ = W/a, β² = (n₁k)² − κ²; loss per turn = 10 log₁₀(e) α 2πR;
// and Marcuse's mode-field fit, Bell Syst. Tech. J. 56, 703 (1977).
import assert from "node:assert/strict";
import { test } from "node:test";

import { macroBendSummary } from "../src/physics/fiber-optics/macro-bending-loss-summary";

const close = (actual: number, expected: number, rel = 1e-8) =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${actual} vs ${expected}`);

const smf = { a: 4.1e-6, n1: 1.4494, NA: 0.1246 };

test("SMF-28-like fibre at 1550 nm, R = 15 mm, 10 turns, no elasto-optic factor", () => {
  const s = macroBendSummary(smf, 1550e-9, 15e-3, 10, false);
  close(s.V, 2.070856803887589);
  close(s.n2, 1.4440343486219434);
  close(s.dBPerMetre, 0.9038914933316045);
  close(s.perTurn, 0.08518976625278628);
  close(s.total, 0.8518976625278628);
  close(s.mfd, 10.084209113123363e-6);
  close(s.cutoff, 1.3347446494627734e-6);
});

test("R = 5 mm", () => {
  const s = macroBendSummary(smf, 1550e-9, 5e-3, 1, false);
  close(s.perTurn, 69.9086188597868);
  close(s.dBPerMetre, 2225.260451252474);
});

test("elasto-optic correction lowers the loss; V below 0.5 has no result", () => {
  const plain = macroBendSummary(smf, 1550e-9, 15e-3, 1, false);
  const eo = macroBendSummary(smf, 1550e-9, 15e-3, 1, true);
  assert.ok(eo.perTurn < plain.perTurn / 10);
  const weak = macroBendSummary({ a: 0.5e-6, n1: 1.45, NA: 0.01 }, 5000e-9, 15e-3, 1, false);
  assert.ok(Number.isNaN(weak.perTurn) && Number.isNaN(weak.mfd));
  assert.ok(Number.isFinite(weak.V));
});
