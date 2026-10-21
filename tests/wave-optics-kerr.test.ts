import test from "node:test";
import assert from "node:assert/strict";

import {
  FWHM_FACTOR, criticalPower, focusedCollapseDistance, gaussianPeakIntensity, kerrLensFocalLength, nonlinearPhase,
  pulseHalfWidth, pulsePeakPower, rayleighRangeInMedium, selfFocusingDistance, spmMaxFrequencyShift, spmRmsBroadening,
  spmSpectrum,
} from "../src/physics/wave-optics/kerr";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

test("critical power 3.77 λ²/(8π n₀ n₂) (Fibich & Gaeta 2000): 1.705 MW in Ti:sapphire, 2.069 MW at n₀ = 1.45", () => {
  // Part 0 audit, hand calculation: λ = 800 nm, n₂ = 3.2e-20 m²/W.
  assertRel(criticalPower(800e-9, 1.76, 3.2e-20), 1.7046e6, 1e-4, "n₀ 1.76");
  assertRel(criticalPower(800e-9, 1.45, 3.2e-20), 2.0690e6, 1e-4, "n₀ 1.45");
  assert.ok(Number.isNaN(criticalPower(800e-9, 1.45, 0)));
  assert.ok(Number.isNaN(criticalPower(-1, 1.45, 3.2e-20)));
});

test("thin Kerr lens 1/f = 8n₂PL/(πw⁴): 100 kW, w 20 µm, 2 mm of n₂ 3.2e-20 → f = 9.817 mm (part 0 audit)", () => {
  // π (20e-6)⁴ / (8 · 3.2e-20 · 1e5 · 2e-3) = 5.0265e-19 / 5.12e-17 = 9.8175e-3 m.
  assertRel(kerrLensFocalLength(3.2e-20, 1e5, 2e-3, 20e-6), 9.8175e-3, 1e-4, "f");
  // Equivalent to 1/f = 4 n₂ I₀ L / w² with I₀ = 2P/(πw²).
  const I0 = gaussianPeakIntensity(1e5, 20e-6);
  assertRel(1 / kerrLensFocalLength(3.2e-20, 1e5, 2e-3, 20e-6), (4 * 3.2e-20 * I0 * 2e-3) / 20e-6 ** 2, 1e-12, "4n₂I₀L/w²");
  assert.equal(kerrLensFocalLength(3.2e-20, 0, 2e-3, 20e-6), Infinity);
  assert.ok(kerrLensFocalLength(-3.2e-20, 1e5, 2e-3, 20e-6) < 0, "n₂ < 0 defocuses");
});

test("SPM phase k₀n₂I₀L: 1 nJ, 100 fs Gaussian, w 50 µm, 2 mm, n₂ 3.2e-20 → 1.202e-3 rad (part 0 audit)", () => {
  const P = pulsePeakPower(1e-9, 100e-15, "gaussian");
  // Gaussian peak power 2√(ln2/π) E/FWHM = 0.93944 E/FWHM.
  assertRel(P, 9394.37, 1e-5, "P₀");
  assertRel(nonlinearPhase(800e-9, 3.2e-20, gaussianPeakIntensity(P, 50e-6), 2e-3), 1.2025e-3, 1e-4, "φ_max");
  // sech²: P₀ = E/(2T₀) = 0.88137 E/FWHM.
  assertRel(pulsePeakPower(1e-9, 100e-15, "sech"), 8813.74, 1e-5, "sech P₀");
  assertRel(FWHM_FACTOR.gaussian, 1.665109, 1e-6, "Gaussian FWHM/T₀");
  assert.ok(Number.isNaN(pulseHalfWidth(0, "sech")));
});

test("Marburger self-focusing distance: P/P_cr = 4 → 0.3224 z_R; no collapse at P ≤ P_cr", () => {
  // 0.367 / √((2 − 0.852)² − 0.0219) = 0.367 / 1.13842 (part 0 audit; Marburger 1975).
  assertRel(selfFocusingDistance(4, 1), 0.322376, 1e-5, "z_sf/z_R");
  assert.ok(Number.isNaN(selfFocusingDistance(1, 1)), "P = P_cr");
  assert.ok(Number.isNaN(selfFocusingDistance(0.3, 1)), "below the fit's spurious low-power root");
  assert.ok(selfFocusingDistance(1.0001, 1) > 50, "diverges at threshold");
  // z_R = π n₀ w₀²/λ: 50 µm in fused silica at 800 nm → 14.24 mm.
  assertRel(rayleighRangeInMedium(800e-9, 1.45, 50e-6), 1.42353e-2, 1e-5, "z_R");
});

test("lens before the medium: 1/z′ = 1/z_sf + 1/f (Dubietis et al. 2017, eq. 16)", () => {
  assertRel(focusedCollapseDistance(1, 1), 0.5, 1e-12, "z_sf = f");
  assert.equal(focusedCollapseDistance(0.3, Infinity), 0.3);
  assertRel(focusedCollapseDistance(0.3, -0.6), 0.6, 1e-12, "diverging lens");
  assert.ok(Number.isNaN(focusedCollapseDistance(1, -0.5)), "diverging lens beats the Kerr lens");
  assert.ok(Number.isNaN(focusedCollapseDistance(NaN, 1)));
});

test("SPM chirp: max |δω| = √(2/e) φ/T₀ (Gaussian, Agrawal §4.1) and 4φ/(3√3 T₀) (sech²) match a numeric derivative", () => {
  for (const [shape, f] of [["gaussian", (x: number) => Math.exp(-x * x)], ["sech", (x: number) => 1 / Math.cosh(x) ** 2]] as const) {
    let best = 0;
    for (let t = -5; t < 5; t += 1e-4) best = Math.max(best, Math.abs((2 * (f(t + 1e-6) - f(t - 1e-6))) / 2e-6));
    assertRel(spmMaxFrequencyShift(2, 1, shape), best, 1e-6, shape);
  }
  assertRel(spmMaxFrequencyShift(1, 1, "gaussian"), 0.857764, 1e-6, "Gaussian coefficient");
});

test("SPM spectrum by FFT: energy conserved, rms width matches √(1 + 4φ²/3√3) and √(1 + 32φ²/35)", () => {
  for (const shape of ["gaussian", "sech"] as const) {
    for (const phi of [0, 4.5 * Math.PI, 30]) {
      const s = spmSpectrum(phi, shape)!;
      const moments = (y: number[]) => {
        const m0 = y.reduce((a, v) => a + v, 0);
        return [m0, y.reduce((a, v, i) => a + v * s.omegaT0[i] ** 2, 0) / m0];
      };
      const [eIn, w2In] = moments(s.input);
      const [eOut, w2Out] = moments(s.output);
      assertRel(eOut, eIn, 1e-9, `${shape} φ ${phi} energy`);
      assertRel(Math.sqrt(w2Out / w2In), spmRmsBroadening(phi, shape), 1e-6, `${shape} φ ${phi} rms`);
    }
  }
  assert.equal(spmSpectrum(101, "gaussian"), null, "beyond the grid");
});

test("SPM spectrum has M peaks for φ_max ≈ (M − ½)π (Agrawal eq. 4.1.16): 1.5π → 2, 4.5π → 5", () => {
  const peaks = (phi: number) => {
    const y = spmSpectrum(phi, "gaussian")!.output;
    const max = Math.max(...y);
    return y.filter((v, i) => i > 0 && i < y.length - 1 && v > y[i - 1] && v >= y[i + 1] && v > 0.01 * max).length;
  };
  assert.equal(peaks(0), 1);
  assert.equal(peaks(1.5 * Math.PI), 2);
  assert.equal(peaks(4.5 * Math.PI), 5);
});
