import test from "node:test";
import assert from "node:assert/strict";

import { fiberModeNonParaxial, fiberOutputDivergence } from "../src/physics/laser-safety/hazard-distance";

// Single-mode: TEM₀₀ divergence φ = 2λ/(πw₀) with w₀ = d/2 (Siegman, Lasers, 1986, ch. 17); multimode: 2 tan(asin NA).
test("single-mode fiber divergence is 2λ/(πw₀)", () => {
  // 1064 nm, MFD 10 µm: 2 × 1.064e-6/(π × 5e-6) = 0.135473 rad.
  assert.ok(Math.abs(fiberOutputDivergence(1064e-9, 10e-6, 0.12, false) / 0.1354726875598213 - 1) < 1e-9);
});

test("multimode fiber divergence fills the NA: 2 NA/√(1 − NA²)", () => {
  const na = 0.12;
  assert.ok(Math.abs(fiberOutputDivergence(1064e-9, 50e-6, na, true) / ((2 * na) / Math.sqrt(1 - na * na)) - 1) < 1e-12);
});

test("paraxial limit: λ/(πw₀) > 0.3 flags a mode field near the wavelength", () => {
  assert.equal(fiberModeNonParaxial(1064e-9, 10e-6), false); // 0.068
  assert.equal(fiberModeNonParaxial(1064e-9, 2e-6), true); // 0.338
});
