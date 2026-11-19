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
  // Diffusion shares: the Seib column integral Cₙ = 2∫₀^∞ (H(u/p) − H(∞)) sinc²(πu) cos(2πnu) du (+ H(∞) in C₀), evaluated
  // independently by composite Simpson on u ∈ [0, 4000] plus the analytic 1/u³ tail (converged to ≈ 1e-11; a second
  // Simpson run to u = 2000 agrees to 1.4e-9). Without its analytic tail and half-unit cells, the module's 2C₁ ran 1.2e-5 high.
  assertRel(r.diffusionCrosstalk, 3.7062171384463e-4, 1e-8, "2 C1");
  assertRel(r.beyond, 1.257896782699e-4, 1e-8, "beyond");
  // Total 2·(C₁(1 − X) + (C₀ + C₂)·X/2), from the same shares.
  assertRel(r.total, 0.030345652450493, 1e-8, "total");
});

test("crosstalkAtWavelength: a thick depletion layer leaves only the kernel crosstalk X (shares [1, 0, 0])", () => {
  // W = 90 µm: e^(−αW) ~ 1e-25, so all charge is collected in place; total = 2·(C₁(1 − X) + (C₀ + C₂)·X/2) = X = 0.03 exactly.
  const r = crosstalkAtWavelength(550e-9, { pitch: 5e-6, depletion: 90e-6, diffusionLength: 20e-6, kernel: 0.03 });
  assertRel(r.total, 0.03, 1e-8, "total");
  assert.ok(r.diffusionCrosstalk < 1e-9);
});

test("crosstalkAtWavelength: W = 0 in the UV keeps H near 1 far beyond u = 100 (the column-integral tail matters)", () => {
  // 300 nm, p = 50 µm, W = 0, L₀ = 20 µm: the Seib knee sits at u ≈ αp/2π ≈ 1.4e3. Independent integrals of the same Seib
  // column integral: composite Simpson to u = 2e4 plus a log-u Simpson tail gives 2C₁ = 5.6301431e-4; a Gauss–Legendre run
  // with v = 1/u to u = 2e4 gives 5.63014e-4. Integrating to u = 100 and dropping the tail gave +145 %.
  const r = crosstalkAtWavelength(300e-9, { pitch: 50e-6, depletion: 0, diffusionLength: 20e-6, kernel: 0.03 });
  assertRel(r.diffusionCrosstalk, 5.6301431e-4, 5e-5, "2 C1");
});

test("crosstalkMtfAt: f = 0 gives 1 for every term", () => {
  const m = crosstalkMtfAt(0, 639011.37, { pitch: 5e-6, depletion: 10e-6, diffusionLength: 20e-6, kernel: 0.03 });
  assertRel(m.pixel, 1, 1e-12, "pixel");
  assertRel(m.seib, 1, 1e-12, "seib");
  assertRel(m.total, 1, 1e-12, "total");
});
