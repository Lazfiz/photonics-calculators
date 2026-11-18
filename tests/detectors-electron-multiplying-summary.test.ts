import test from "node:test";
import assert from "node:assert/strict";

import { emVsScmosSummary } from "../src/physics/detectors/electron-multiplying";

const assertRel = (actual: number, expected: number, tol: number, msg: string) =>
  assert.ok(Math.abs(actual - expected) <= tol * Math.abs(expected), `${msg}: ${actual} vs ${expected}`);

// Golden values from an independent scratch re-implementation: F² = 2(G − 1)G^(−(N+1)/N) + 1/G (Robbins & Hadwen 2003,
// doi:10.1109/TED.2003.813462), EMCCD SNR = S/√(F²(S + D) + (σ/G)²), sCMOS SNR = S/√(S + D + σ²).
test("emVsScmosSummary at the page defaults: the sCMOS wins at 10 e⁻ with 60 e⁻ EMCCD read noise", () => {
  const r = emVsScmosSummary({ signal: 10, dark: 0.001, emccdRead: 60, scmosRead: 1.5, gain: 1000, stages: 604 });
  assertRel(r.enf2, 1.9762796816730521, 1e-8, "F²");
  assertRel(r.emccdSnr, 2.2491298809918407, 1e-8, "EMCCD SNR");
  assertRel(r.scmosSnr, 2.857026246206452, 1e-8, "sCMOS SNR");
  assert.equal(r.winner, "sCMOS");
});

test("emVsScmosSummary with a low-noise EMCCD at G = 200, N = 536", () => {
  const r = emVsScmosSummary({ signal: 200, dark: 0.01, emccdRead: 40, scmosRead: 1.2, gain: 200, stages: 536 });
  assertRel(r.enf2, 1.9754259118214537, 1e-8, "F²");
  assertRel(r.emccdSnr, 10.061246400510402, 1e-8, "EMCCD SNR");
  assertRel(r.scmosSnr, 14.091147463317563, 1e-8, "sCMOS SNR");
});

test("emVsScmosSummary: EMCCD wins at 1 e⁻ with a high-gain, low-noise register; G above 2^N is a dash", () => {
  const ok = emVsScmosSummary({ signal: 1, dark: 0.001, emccdRead: 10, scmosRead: 5, gain: 1000, stages: 604 });
  assert.equal(ok.winner, "EMCCD");
  const bad = emVsScmosSummary({ signal: 10, dark: 0, emccdRead: 10, scmosRead: 1, gain: 1000, stages: 5 });
  assert.equal(bad.winner, "—");
});
