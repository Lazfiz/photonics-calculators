import assert from "node:assert/strict";
import { test } from "node:test";
import { palmNyquist, palmStormSummary } from "../src/physics/imaging/palm-storm";

const close = (actual: number, expected: number, rel = 1e-8) =>
  assert.ok(Math.abs(actual / expected - 1) <= rel, `${actual} vs ${expected}`);
const nm = 1e-9;

// 647 nm, NA 1.49, N = 1000, b² = 10, pixel 100 nm; independent script:
//  σ = 0.21 λ/NA = 91.18792 nm, σ_a² = σ² + a²/12; least squares (Mortensen et al., Nat. Methods 7, 377, 2010, eq. 6)
//  σ_loc = √(σ_a²/N (16/9 + 8π σ_a² b²/(N a²))) = 4.285749 nm, × √2 for an EMCCD; maximum likelihood (eq. 5) with
//  τ = N a²/(2π σ_a² b²) = 17.3967 and the closed form ∫₀¹ ln t/(1 + τt) dt = Li₂(−τ)/τ = −0.325776
//  (Li₂(−τ) = −π²/6 − ½ ln²τ − Li₂(−1/τ), checked against Simpson on t = e^(−u)): 3.6836171613 nm.
//  σ = 0.21 λ/NA: Zhang, Zerubia, Olivo-Marin, Appl. Opt. 46, 1819, 2007.
//  2D at 2500 µm⁻²: d_Nyquist = 2/√2500 µm = 40 nm (Shroff et al., Nat. Methods 5, 417, 2008); effective
//  √((2.35482 σ_loc)² + 40²) = 41.253507 nm (Legant et al., Nat. Methods 13, 359, 2016).
test("palm-storm summary matches the hand-worked values", () => {
  const ls = palmStormSummary(647 * nm, 1.49, 1000, 10, 100 * nm, "ls", false, 2500, 2, 20000, 100);
  close(ls.psfSigma, 91.18791946 * nm);
  close(ls.sigmaLoc, 4.285748791 * nm);
  close(ls.nyquist, 40 * nm);
  close(ls.labelSpacing, 20 * nm);
  close(ls.effective, 41.25350698 * nm);
  close(ls.shotLimit, 2.883615206 * nm);
  close(ls.diffraction, 217.1140940 * nm);
  close(ls.acquisitionTime, 200);
  assert.equal(ls.undersampled, false);
  close(palmStormSummary(647 * nm, 1.49, 1000, 10, 100 * nm, "ls", true, 2500, 2, 20000, 100).sigmaLoc, 6.060964065 * nm);
  close(palmStormSummary(647 * nm, 1.49, 1000, 10, 100 * nm, "mle", false, 2500, 2, 20000, 100).sigmaLoc, 3.6836171612629847 * nm, 1e-9);
});

test("palm-storm Nyquist resolution in 1D, 3D, and an undersampled pixel", () => {
  close(palmNyquist(50, 1), 40 * nm); // 2/(50 µm⁻¹) = 0.04 µm
  close(palmNyquist(1000, 3), 200 * nm); // 2/(1000 µm⁻³)^(1/3) = 0.2 µm
  assert.ok(Number.isNaN(palmNyquist(0, 2)));
  // 300 nm pixel > 2 · 91.2 nm.
  assert.equal(palmStormSummary(647 * nm, 1.49, 1000, 10, 300 * nm, "ls", false, 2500, 2, 20000, 100).undersampled, true);
});
