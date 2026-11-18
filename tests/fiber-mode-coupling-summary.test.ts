// Golden values for modeCouplingSummary (src/physics/fiber-optics/mode-coupling.ts), worked by hand from
// Yariv, IEEE J. Quantum Electron. 9, 919 (1973): P₂ = P₀(κ²/ψ²) sin²(ψz), ψ = √(κ² + (Δβ/2)²).
import assert from "node:assert/strict";
import { test } from "node:test";

import { MODE_COUPLING_MAX, modeCouplingSummary } from "../src/physics/fiber-optics/mode-coupling";

const close = (actual: number, expected: number, rel = 1e-8) =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${actual} vs ${expected}`);

test("κ = 500 /m, Δβ = 100 /m, L = 1 mm, P₀ = 1 mW", () => {
  // ψ = √(500² + 50²) = 502.493781 /m; κ²/ψ² = 0.990099010; P₂/P₀ = 0.990099010·sin²(0.502493781) = 0.229654102.
  const s = modeCouplingSummary({ length: 1e-3, kappa: 500, deltaBeta: 100, inputPower: 1e-3 });
  close(s.psi, 502.4937810560445);
  close(s.fraction, 0.22965410185127497);
  close(s.coupledPower, 0.22965410185127497e-3);
  close(s.throughPower, 0.770345898148725e-3);
  close(s.peak.length, 3.1260015268123316e-3);
});

test("full transfer at the coupling length π/(2κ) for Δβ = 0", () => {
  close(modeCouplingSummary({ length: Math.PI / 1000, kappa: 500, deltaBeta: 0, inputPower: 1 }).fraction, 1);
});

test("κ = Δβ = 0 has no exchange; out-of-range and non-finite inputs are clamped", () => {
  const none = modeCouplingSummary({ length: 1e-3, kappa: 0, deltaBeta: 0, inputPower: 1 });
  assert.equal(none.fraction, 0);
  assert.equal(none.beat, Infinity);
  const big = modeCouplingSummary({ length: 100, kappa: 1e12, deltaBeta: NaN, inputPower: -1 });
  assert.equal(big.length, MODE_COUPLING_MAX.length);
  assert.equal(big.kappa, MODE_COUPLING_MAX.kappa);
  close(big.deltaBeta, 100);
  assert.equal(big.inputPower, 0);
});
