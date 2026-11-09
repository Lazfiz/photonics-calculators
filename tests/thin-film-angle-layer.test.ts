import assert from "node:assert/strict";
import { test } from "node:test";
import { cosAngleInLayer } from "../src/physics/thin-film/quarter-wave-stack";

// Snell: cos θ_n = √(1 − (n₀ sin θ₀/n)²) (Macleod, Thin-Film Optical Filters, 4th ed., ch. 2).
// Hand value: sin 45° = 0.70710678; /2.35 = 0.30090714; cos = √(1 − 0.09054514) = 0.95365680.
test("cosAngleInLayer matches the hand-worked Snell value", () => {
  assert.ok(Math.abs(cosAngleInLayer(1, 2.35, Math.PI / 4) - 0.9536568013) < 1e-9);
  assert.equal(cosAngleInLayer(1.5, 1.2, 0), 1);
});

test("cosAngleInLayer is NaN when the wave does not propagate or the input is invalid", () => {
  assert.ok(Number.isNaN(cosAngleInLayer(1.5, 1.2, Math.PI / 3)));
  assert.ok(Number.isNaN(cosAngleInLayer(1, 1.5, Math.PI / 2)));
  assert.ok(Number.isNaN(cosAngleInLayer(1, 0, 0.1)));
});
