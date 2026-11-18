import assert from "node:assert/strict";
import test from "node:test";

import { crosstalkAtWavelength, crosstalkMtfAt, pixelCrosstalkSummary } from "../src/physics/detectors/pixel-crosstalk";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Seib, IEEE Trans. Electron Devices 21, 210 (1974), doi:10.1109/T-ED.1974.17898: η(f) = 1 − e^(−αW)/(1 + α L_f), 1/L_f² = 1/L₀² + (2π f)².
// α = 4πk/λ with k(550 nm) = 0.027968 (Green 2008, Table 1, doi:10.1016/j.solmat.2008.06.009; refractiveindex.info Green-2008.yml).
test("pixelCrosstalkSummary: closed-form terms at 550 nm, p = 5 µm, W = 10 µm, L₀ = 20 µm, X = 0.03", () => {
  // α = 4π·0.027968/550e-9 = 639011.3697 /m; 1/α = 1.56491738 µm; e^(−αW) = 0.0016780654; η(0) = 1 − 0.0016780654/(1 + α·L₀) = 0.99987823;
  // f_N = 1e5 cycles/m; pixel 2/π; η(f_N)/η(0) = 0.99928841; kernel 0.94: MTF = 0.59799675.
  const r = pixelCrosstalkSummary({ pitch: 5e-6, depletion: 10e-6, diffusionLength: 20e-6, kernel: 0.03, wavelength: 550e-9 });
  assertRel(r.alpha, 639011.3697134496, 1e-8, "alpha");
  assertRel(r.absorptionDepth, 1.5649173823752582e-6, 1e-8, "1/alpha");
  assertRel(r.belowDepletion, 0.0016780653993152286, 1e-8, "e^(-aW)");
  assertRel(r.collected, 0.9998782265813688, 1e-8, "eta(0)");
  assertRel(r.nyquist, 1e5, 1e-12, "f_N");
  assertRel(r.atNyquist.pixel, 2 / Math.PI, 1e-8, "pixel");
  assertRel(r.atNyquist.seib, 0.9992884091910659, 1e-8, "seib");
  assertRel(r.atNyquist.total, 0.5979967540134521, 1e-8, "MTF");
  // The two lit-column shares and the lost-to-farther-out charge are consistent: C0 + 2 C1 + 2 C2 + ... = 1.
  assert.ok(r.diffusionCrosstalk > 0 && r.diffusionCrosstalk < 0.01);
  assert.ok(r.total >= r.diffusionCrosstalk * (1 - 0.03));
});

test("crosstalkAtWavelength: a thick depletion layer leaves only the kernel crosstalk X (shares [1, 0, 0])", () => {
  // W = 90 µm: e^(−αW) ~ 1e-25, so all charge is collected in place; total = 2·(C₁(1 − X) + (C₀ + C₂)·X/2) = X = 0.03 exactly.
  const r = crosstalkAtWavelength(550e-9, { pitch: 5e-6, depletion: 90e-6, diffusionLength: 20e-6, kernel: 0.03 });
  assertRel(r.total, 0.03, 1e-8, "total");
  assert.ok(r.diffusionCrosstalk < 1e-9);
});

test("crosstalkMtfAt: f = 0 gives 1 for every term", () => {
  const m = crosstalkMtfAt(0, 639011.37, { pitch: 5e-6, depletion: 10e-6, diffusionLength: 20e-6, kernel: 0.03 });
  assertRel(m.pixel, 1, 1e-12, "pixel");
  assertRel(m.seib, 1, 1e-12, "seib");
  assertRel(m.total, 1, 1e-12, "total");
});
