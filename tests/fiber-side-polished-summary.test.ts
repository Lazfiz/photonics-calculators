import test from "node:test";
import assert from "node:assert/strict";

import { sidePolishedSummary } from "../src/physics/fiber-optics/side-polished";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Exact LP01 mode of a step-index fibre (Snyder and Love, Optical Waveguide Theory, 1983); coupler after Digonnet and
// Shaw, IEEE J. Quantum Electron. 18, 746 (1982), doi:10.1109/JQE.1982.1071574. Values from an independent script
// (own Bessel functions, bisection for U, Simpson integrals for eta and the coupler phase).
const base = {
  remainingClad: 2e-6, coreDia: 8.2e-6, lambda: 1550e-9, nCore: 1.4494, nClad: 1.444, nOverlay: 1.43, blockRadius: 0.25,
};

test("sidePolishedSummary: SMF-like fibre polished to 2 um from the core", () => {
  const s = sidePolishedSummary(base);
  assertRel(s.V, 2.077462271575009, 1e-8, "V");
  assertRel(s.nEff, 1.446382156257432, 1e-9, "n_eff");
  assertRel(s.decayLength, 2.972960049946267e-6, 1e-8, "a/W");
  assertRel(s.eta, 0.01121710750031288, 1e-7, "eta");
  assertRel(s.surface, 0.182113695284627, 1e-8, "surface intensity");
  assertRel(s.dNeff, -0.0001560208467139929, 1e-7, "dn_eff");
  assertRel(s.kappa0, 514.0651580950471, 1e-8, "kappa0");
  assertRel(s.coupled, 0.4630428823801545, 1e-7, "coupled");
  assertRel(s.Leff, 1.455860798188529e-3, 1e-7, "L_eff");
  assert.equal(s.valid, true);
  assert.equal(s.leaky, false);
  assert.equal(s.strong, false);
  assert.equal(s.mismatchedGap, true);
});

test("sidePolishedSummary: overlay at or above n_eff is leaky; n1 <= n2 has no result", () => {
  const leaky = sidePolishedSummary({ ...base, nOverlay: 1.4464 });
  assert.equal(leaky.leaky, true);
  assert.equal(leaky.strong, false);
  const none = sidePolishedSummary({ ...base, nCore: 1.444 });
  assert.equal(none.valid, false);
  assert.ok(Number.isNaN(none.eta));
  // Polished to the core boundary (d = 0): the twin cores touch.
  assert.equal(sidePolishedSummary({ ...base, remainingClad: 0 }).touching, true);
});
