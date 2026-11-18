import assert from "node:assert/strict";
import { test } from "node:test";
import { mtfSummary } from "../src/physics/imaging/mtf";

const close = (actual: number, expected: number, rel = 1e-8) =>
  assert.ok(Math.abs(actual / expected - 1) <= rel, `${actual} vs ${expected}`);

// NA 0.4, λ = 550 nm, n = 1, Δz = 3 µm, ν = 0.5; worked by an independent script (nothing copied from the module):
//  f_c = 2NA/λ = 1.4545455e6 cycles/m; MTF(0.5) = (2/π)(arccos 0.5 − 0.5√0.75) = 0.391002 (Goodman, Introduction to
//  Fourier Optics, 3rd ed., §6.3); W₀₂₀ = Δz NA²/(2nλ) = 0.4363636 λ (Hopkins, Proc. R. Soc. A 231, 91, 1955);
//  Strehl sinc²(πW₀₂₀) = (sin 1.370871/1.370871)² = 0.5111266; edge path n Δz (1 − √(1 − NA²/n²))/λ = 0.4553720 λ.
test("mtf summary matches the hand-worked paraxial values", () => {
  const r = mtfSummary(0.4, 550e-9, 1, 3e-6, 0.5);
  close(r.cutoff, 1454545.4545455);
  close(r.inFocus, 0.391002218956);
  close(r.w020Waves, 0.436363636364);
  close(r.strehlParaxial, 0.511126588917);
  close(r.edgeWaves, 0.455371969139);
  close(r.dWaves, 5.454545454545);
  assert.equal(r.s, 0.4);
  assert.equal(r.paraxialOptimistic, false); // 0.4554/0.4364 = 1.044 < 1.1
});

// NA 0.5, n = 1, Δz = 2 µm, 550 nm: D = 3.636364, s = 0.5; the Strehl |2∫₀¹ e^(iκu) ρ dρ|², κ = 2πD, u = √(1 − s²ρ²), has the
// closed form (2/s²)[e^(iκ)(1/κ² − i/κ) − e^(iκc)(1/κ² − ic/κ)], c = √(1 − s²): 0.4270283764184 (Richards & Wolf, Proc. R. Soc.
// A 253, 358, 1959, scalar Debye defocus phase; Sheppard, Appl. Opt. 27, 4782, 1988).
test("mtf summary exact Strehl matches the closed form", () => {
  close(mtfSummary(0.5, 550e-9, 1, 2e-6, 0.5).strehlExact, 0.4270283764184104, 1e-9);
});

// Defaults (NA 0.4, 550 nm, n 1, Δz 3 µm, ν 0.5), independent script. Paraxial OTF = (4/π)∫ cos²t cos(8πW₀₂₀ν(sin t − ν)) dt over
// t from asin ν to π/2 (Hopkins 1955; pupil overlap lens, composite Simpson 20000 panels) = 0.1342939236. Exact-phase OTF =
// (2/π)∬ cos[φ(x+ν,y) − φ(x−ν,y)] over the overlap lens, φ = 2πD√(1 − s²(x² + y²)), Simpson 800 × 800 and 1600 × 1600 panels
// agree to 2e-11: 0.12016166344. Exact Strehl by the closed form above = 0.4793569991780.
test("mtf summary defocused OTF and exact Strehl at the page defaults", () => {
  const r = mtfSummary(0.4, 550e-9, 1, 3e-6, 0.5);
  close(r.defocusedParaxial, 0.1342939236, 1e-8);
  close(r.defocusedExact, 0.120161663443, 1e-9);
  close(r.strehlExact, 0.479356999178, 1e-9);
});

test("mtf summary: defocus sign does not matter, zero defocus is the in-focus MTF, and a high NA is flagged", () => {
  const pos = mtfSummary(0.4, 550e-9, 1, 3e-6, 0.5);
  const neg = mtfSummary(0.4, 550e-9, 1, -3e-6, 0.5);
  close(neg.defocusedParaxial, pos.defocusedParaxial, 1e-9);
  close(neg.strehlExact, pos.strehlExact, 1e-9);
  const zero = mtfSummary(0.4, 550e-9, 1, 0, 0.5);
  close(zero.defocusedExact, zero.inFocus, 1e-12);
  close(zero.strehlExact, 1, 1e-12);
  // NA 0.95: edge path 1 − √(1 − 0.9025) = 0.68782 against the paraxial 0.45125 (ratio 1.52 > 1.1).
  assert.equal(mtfSummary(0.95, 550e-9, 1, 1e-6, 0.5).paraxialOptimistic, true);
});
