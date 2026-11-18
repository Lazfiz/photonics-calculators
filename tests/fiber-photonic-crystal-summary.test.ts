// pcfInputStatus and pcfGuidance (src/physics/fiber-optics/photonic-crystal.ts). Golden values worked by hand from
// Saitoh & Koshiba, Opt. Express 13, 267 (2005): the endlessly single-mode limit is d/Λ = 0.4275 (fit), so
// d/Λ = 0.4 is endlessly single-mode and d/Λ = 0.6 at λ/Λ = 0.344 has V = 2.933 > 2.405 (multimode).
import assert from "node:assert/strict";
import { test } from "node:test";

import { pcfGuidance, pcfInputStatus, pcfMode } from "../src/physics/fiber-optics/photonic-crystal";

test("input status separates geometry, wavelength and d/Λ range", () => {
  assert.deepEqual(pcfInputStatus(4.5e-6, 2.7e-6, 1550e-9), { geometryBad: false, lambdaBad: false, dOutOfFit: false });
  assert.equal(pcfInputStatus(4.5e-6, 4.5e-6, 1550e-9).geometryBad, true); // d = Λ
  assert.equal(pcfInputStatus(4.5e-6, 2.7e-6, 299 * 1e-9).lambdaBad, true);
  assert.equal(pcfInputStatus(4.5e-6, 2.7e-6, 3000 * 1e-9).lambdaBad, false); // the range includes both ends
  assert.equal(pcfInputStatus(4.5e-6, 4.0e-6, 1550e-9).dOutOfFit, true); // d/Λ = 0.89 > 0.8
});

test("guidance class", () => {
  assert.equal(pcfGuidance(pcfMode(4.5e-6, 2.7e-6, 1550e-9)), "multimode"); // V = 2.933
  assert.equal(pcfGuidance(pcfMode(5e-6, 2e-6, 1000e-9)), "endlessly-single-mode"); // d/Λ = 0.4
  assert.equal(pcfGuidance(pcfMode(2.5e-6, 1.5e-6, 2000e-9)), "single-mode"); // d/Λ = 0.6, λ/Λ = 0.8, past the cutoff λ_c/Λ = 0.672 (3024 nm / 4.5 µm): V = 2.22
  assert.equal(pcfGuidance(null), "none");
  assert.equal(pcfGuidance(pcfMode(4.5e-6, 4.0e-6, 1550e-9)), "none"); // outside the fit: V is NaN
});
