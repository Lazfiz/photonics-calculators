import test from "node:test";
import assert from "node:assert/strict";
import { lateFraction, twoComponentDecay } from "../src/physics/spectroscopy/fluorescence-lifetime";

// Hand calculation: one exponential τ = 2 ns, T = 12.5 ns -> late fraction = e^(−6.25) (Lakowicz, Principles of
// Fluorescence Spectroscopy, 3rd ed., ch. 4); two components α = 0.5 each, τ = 2, 8 ns: (0.5·2·e^(−6.25) + 0.5·8·e^(−1.5625))/5.
test("lateFraction: single and biexponential", () => {
  assert.ok(Math.abs(lateFraction(twoComponentDecay(2e-9, 8e-9, 0), 12.5e-9) / Math.exp(-6.25) - 1) < 1e-12);
  const bi = (0.5 * 2 * Math.exp(-6.25) + 0.5 * 8 * Math.exp(-1.5625)) / 5;
  assert.ok(Math.abs(lateFraction(twoComponentDecay(2e-9, 8e-9, 0.5), 12.5e-9) / bi - 1) < 1e-12);
});
test("lateFraction: T = 0 gives 1, T < 0 gives NaN", () => {
  assert.equal(lateFraction(twoComponentDecay(2e-9, 8e-9, 0.3), 0), 1);
  assert.ok(Number.isNaN(lateFraction(twoComponentDecay(2e-9, 8e-9, 0.3), -1)));
});
