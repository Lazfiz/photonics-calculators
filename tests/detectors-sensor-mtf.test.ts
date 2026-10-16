import test from "node:test";
import assert from "node:assert/strict";

import {
  columnShares,
  crosstalkKernelMtf,
  exponentialSpreadMtf,
  gaussianBlurMtf,
  neighbourFraction,
  pixelApertureMtf,
  seibCollection,
  seibDiffusionFloor,
  seibDiffusionMtf,
} from "../src/physics/detectors/sensor-mtf";
import {
  K_BETHE,
  MEAN_SEC_ZENITH,
  MEAN_TAN_ZENITH,
  SI_MEAN_PAIRS_PER_M,
  hitPixelFraction,
  mostProbableLoss,
  pathLength,
  pixelsPerTrack,
  projectedLength,
} from "../src/physics/detectors/cosmic-rays";
import { integrateTanhSinh, poissonCdf, poissonQuantile } from "../src/physics/math";

const close = (actual: number, expected: number, rel: number, msg = "") =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${msg} ${actual} vs ${expected}`);

test("pixel aperture, Gaussian blur, exponential spread and crosstalk kernel MTFs", () => {
  const p = 5e-6;
  const fN = 1 / (2 * p);
  // |sinc(π/2)| = 2/π at Nyquist for a 100 % fill pixel.
  close(pixelApertureMtf(fN, p), 2 / Math.PI, 1e-15, "2/π");
  assert.equal(pixelApertureMtf(0, p), 1);
  // Kernel X = 0.05: 1 − 2X = 0.9 at Nyquist, times 2/π = 0.572958 (ROADMAP part 9b target 0.5730).
  close(crosstalkKernelMtf(fN, p, 0.05), 0.9, 1e-15, "kernel");
  close(pixelApertureMtf(fN, p) * crosstalkKernelMtf(fN, p, 0.05), 0.5729578, 1e-7, "pixel × kernel");
  // Gaussian σ = 1 µm at 100 lp/mm: exp(−2π² · 0.01) = exp(−0.1973921) = 0.8208687.
  close(gaussianBlurMtf(1e5, 1e-6), 0.8208687, 1e-7, "Gaussian");
  // modulation-transfer defaults: ℓ = 1.5 µm at f_N of a 5.4 µm pitch: 2πfℓ = π·1.5/5.4 = 0.8726646 → 1/1.7615435 = 0.5676839.
  close(exponentialSpreadMtf(1 / (2 * 5.4e-6), 1.5e-6), 0.5676839, 1e-6, "Lorentzian");
});

test("Seib field-free diffusion MTF (Seib 1974, semi-infinite substrate), hand calculation", () => {
  // α = 1e5 /m (1/α = 10 µm), W = 10 µm, L₀ = 20 µm. η(0) = 1 − e⁻¹/3 = 0.8773735.
  const a = 1e5, W = 10e-6, L0 = 20e-6;
  close(seibCollection(0, a, W, L0), 1 - Math.exp(-1) / 3, 1e-15, "η(0)");
  close(seibCollection(0, a, W, L0), 0.8773735, 1e-7, "η(0) digits");
  // 2π f L₀ = √3 → L_f = L₀/2 = 10 µm, η = 1 − e⁻¹/2 = 0.8160603; MTF = 0.9301173.
  const f = Math.sqrt(3) / (2 * Math.PI * L0);
  close(seibDiffusionMtf(f, a, W, L0), (1 - Math.exp(-1) / 2) / (1 - Math.exp(-1) / 3), 1e-14, "MTF");
  close(seibDiffusionMtf(f, a, W, L0), 0.9301173, 1e-7, "MTF digits");
  // Floor (1 − e⁻¹)/η(0) = 0.7204692, reached at high f.
  close(seibDiffusionFloor(a, W, L0), 0.7204692, 1e-7, "floor");
  close(seibDiffusionMtf(1e12, a, W, L0), seibDiffusionFloor(a, W, L0), 1e-6, "high-f limit");
  // All light absorbed in the depletion layer: no diffusion blur.
  close(seibDiffusionMtf(f, 1e9, W, L0), 1, 1e-15, "shallow absorption");
  assert.ok(Number.isNaN(seibCollection(0, -1, W, L0)), "α ≤ 0 is NaN");
});

test("column shares match the exponential line-spread closed form", () => {
  // e^(−|x|/ℓ)/(2ℓ) over a uniformly lit column of pitch p: C₀ = 1 − (ℓ/p)(1 − e^(−p/ℓ)),
  // C₁ = (ℓ/2p)(1 − e^(−p/ℓ))², C₂ = C₁·e^(−p/ℓ) (hand integration).
  const p = 5e-6;
  for (const ratio of [0.1, 1, 10]) {
    const l = ratio * p;
    const e = Math.exp(-1 / ratio);
    const [c0, c1, c2] = columnShares(f => exponentialSpreadMtf(f, l), p);
    close(c0, 1 - ratio * (1 - e), 1e-6, `C0 ℓ/p=${ratio}`);
    close(c1, (ratio / 2) * (1 - e) ** 2, 1e-6, `C1 ℓ/p=${ratio}`);
    if (ratio >= 1) close(c2, (ratio / 2) * (1 - e) ** 2 * e, 1e-6, `C2 ℓ/p=${ratio}`);
  }
  // ℓ = p: C₁ = (1 − e⁻¹)²/2 = 0.1997882.
  close(columnShares(f => exponentialSpreadMtf(f, p), p)[1], 0.1997882, 1e-6, "C1 digits");
  // A delta line spread (floor 1) keeps everything in the lit column; the kernel then sends X to the neighbours.
  assert.deepEqual(columnShares(() => 1, p, 1), [1, 0, 0]);
  assert.equal(neighbourFraction([1, 0, 0], 0.05), 0.05);
  assert.ok(columnShares(() => 1, 0).every(Number.isNaN), "pitch 0 is NaN");
});

test("muon energy loss in silicon (PDG 2024 §34.2.9, §35.8)", () => {
  // K = 4π N_A r_e² m_e c² = 0.307075 MeV mol⁻¹ cm² (PDG Table 34.1).
  close(K_BETHE, 0.307075, 1e-6, "K");
  // 3.876 MeV/cm ÷ 3.65 eV = 106.18 e⁻/µm.
  close(SI_MEAN_PAIRS_PER_M * 1e-6, 106.1769, 1e-6, "mean pairs per µm");
  // Most probable deposit in 300 µm: ξ = 5347.5 eV, Δp = ξ(ln(2m_ec²ξ/(ħω_p)²) + 0.2) = 84 226 eV (hand calculation);
  // PDG §35.8 quotes about 23 000 e⁻ for a MIP in 300 µm Si.
  close(mostProbableLoss(300e-6), 84226, 2e-5, "Δp 300 µm");
  close(mostProbableLoss(300e-6) / 3.65, 23000, 0.005, "PDG 23 000 e⁻");
  assert.ok(Number.isNaN(mostProbableLoss(0)), "zero path is NaN");
});

test("track geometry and hit statistics", () => {
  // 20 µm layer at 30°: L = 23.094 µm, 2452 e⁻ mean (the old page gave 2.0e4 e⁻ at any angle).
  close(pathLength(20e-6, Math.PI / 6), 23.09401e-6, 1e-6, "path");
  close(pathLength(20e-6, Math.PI / 6) * SI_MEAN_PAIRS_PER_M, 2452.05, 1e-5, "mean charge");
  close(projectedLength(20e-6, Math.PI / 6), 11.547005e-6, 1e-7, "projected");
  assert.ok(Number.isNaN(pathLength(20e-6, Math.PI / 2)), "horizontal track is NaN");
  // Buffon: 1 + 4ℓ/(πp); a vertical track touches one pixel.
  assert.equal(pixelsPerTrack(0, 10e-6), 1);
  close(pixelsPerTrack(10e-6, 10e-6), 1 + 4 / Math.PI, 1e-15, "ℓ = p");
  // cos²θ flux through a horizontal plane, weight 4 cos³θ sinθ: ⟨sec θ⟩ = 4/3, ⟨tan θ⟩ = π/4 (checked by quadrature).
  const avg = (g: (t: number) => number) => integrateTanhSinh(t => 4 * Math.cos(t) ** 3 * Math.sin(t) * g(t), 0, Math.PI / 2);
  close(avg(t => 1 / Math.cos(t)), MEAN_SEC_ZENITH, 1e-10, "⟨sec θ⟩");
  close(avg(t => Math.tan(t)), MEAN_TAN_ZENITH, 1e-10, "⟨tan θ⟩");
  // Tiny hit fractions keep their digits: 1 − exp(−x) ≈ x.
  close(hitPixelFraction(1 / 60, 2.47, 1e6), (2.47 / 60) * 1e-6, 1e-7, "hit fraction");
});

test("Poisson quantile", () => {
  // μ = 1: P(K ≤ 3) = 0.98101, P(K ≤ 4) = 0.99634, so the 99th percentile is 4.
  assert.equal(poissonQuantile(0.99, 1), 4);
  assert.equal(poissonQuantile(0.99, 0), 0);
  assert.equal(poissonQuantile(0.5, 1), 1);
  for (const mu of [0.0167, 10, 1000, 1e5]) {
    const k = poissonQuantile(0.99, mu);
    assert.ok(poissonCdf(k, mu) >= 0.99 && (k === 0 || poissonCdf(k - 1, mu) < 0.99), `μ = ${mu}`);
  }
  assert.ok(Number.isNaN(poissonQuantile(1, 1)), "p = 1 is NaN");
});
