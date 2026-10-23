import test from "node:test";
import assert from "node:assert/strict";

import { erf } from "../src/physics/math";
import {
  childLangmuirCurrentDensity, effectiveThermionicBarrier, gaussianSpotShares, intensifiedSnr, intensifierNoiseFactor,
  PHOSPHOR_SCREENS, PHOTOCATHODE_DARK_EMISSION, POINT_SPOT, phosphorEfficiency, phosphorGain, planarTransitTime, quadratureFwhm,
  RICHARDSON_A0, rectGaussFwhm, streakTime, streakWindow, thermionicCurrentDensity, thresholdWavelength, VACUUM_TRANSIT_FACTOR, vacuumTransitBandwidth,
} from "../src/physics/detectors/photoemission";

const close = (actual: number, expected: number, rel: number, msg = "") =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${msg} ${actual} vs ${expected}`);

test("Richardson–Dushman emission (Ashcroft & Mermin ch. 18: A₀ = 120 A/(cm²·K²))", () => {
  // 4π·m_e·k_B²·q/h³ with CODATA 2022 m_e and the exact SI k_B, q, h.
  close(RICHARDSON_A0, 1.2017322911e6, 1e-9);
  close(RICHARDSON_A0 / 1e4, 120.17, 1e-4);
  // Tungsten, φ = 4.54 eV at 2500 K: φ/k_BT = 4.54/(8.617333262e-5·2500) = 21.07384, J = A₀·T²·e^(−21.07384).
  close(thermionicCurrentDensity(2500, 4.54), 1.2017322911e6 * 2500 ** 2 * Math.exp(-4.54 / (8.617333262e-5 * 2500)), 1e-9);
  close(thermionicCurrentDensity(2500, 4.54), 5.3e3, 0.01);
  assert.equal(thermionicCurrentDensity(10, 6), 0); // underflows to zero, not NaN
  assert.ok(Number.isNaN(thermionicCurrentDensity(0, 2)));
  // hc/q = 1239.84198 eV·nm, so a 2 eV threshold cuts off at 619.92 nm.
  close(thresholdWavelength(2) * 1e9, 619.920992, 1e-8);
  assert.ok(Number.isNaN(thresholdWavelength(0)));
});

test("planar vacuum diode: transit time, Ramo bandwidth and Child's law", () => {
  // τ = d·√(2m_e/qV): 2 mm at 100 V, √(2·9.1093837139e-31/1.602176634e-17) = 3.372218e-7 s/m → 674.44 ps.
  close(planarTransitTime(2e-3, 100), 6.744259847e-10, 1e-9);
  // Same final speed v = √(2qV/m_e) = 5.9301e6 m/s, average speed v/2.
  close(planarTransitTime(2e-3, 100), (2 * 2e-3) / Math.sqrt((2 * 1.602176634e-19 * 100) / 9.1093837139e-31), 1e-12);
  // Ramo ramp current: |H(x)|² = 4[(cos x + x sin x − 1)² + (x cos x − sin x)²]/x⁴ = 1/2 at x = 2π·0.5533.
  const x = 2 * Math.PI * VACUUM_TRANSIT_FACTOR;
  const h2 = (4 * ((Math.cos(x) + x * Math.sin(x) - 1) ** 2 + (x * Math.cos(x) - Math.sin(x)) ** 2)) / x ** 4;
  close(h2, 0.5, 1e-7);
  close(vacuumTransitBandwidth(1e-9), 0.55332713e9, 1e-12);
  assert.ok(Number.isNaN(vacuumTransitBandwidth(0)));
  // Child's constant (4ε₀/9)·√(2q/m_e) = 2.3339e-6 A·V^(−3/2) (Child 1911; Langmuir 1913).
  close(childLangmuirCurrentDensity(1, 1), 2.33395e-6, 1e-5);
  close(childLangmuirCurrentDensity(100, 2e-3), (2.33395e-6 * 1000) / 4e-6, 1e-5);
  assert.equal(childLangmuirCurrentDensity(0, 1e-3), 0);
  assert.ok(Number.isNaN(childLangmuirCurrentDensity(100, 0)));
});

test("image intensifier: phosphor gain, cascade noise factor and SNR", () => {
  // P43 at 5 kV: E_ph = 1239.84198/545 = 2.274939 eV, g = 0.15·5000/2.274939 = 329.679 photons per electron.
  close(phosphorGain(0.15, 5000, 545e-9), 329.6791084, 1e-9);
  assert.equal(phosphorGain(0, 5000, 545e-9), 0);
  assert.ok(Number.isNaN(phosphorGain(1.2, 5000, 545e-9)));
  // Branching process: a Poisson phosphor of mean g then binomial coupling p gives Var = g·p (thinned Poisson),
  // so F = 1 + Var/mean² = 1 + 1/(g·p); with an ideal F = 1 first stage the cascade formula must agree.
  close(intensifierNoiseFactor(1, 329.679 * 0.3), 1 + 1 / (329.679 * 0.3), 1e-15);
  // Page defaults: G_e = 10⁴ × 329.679 × 0.6 × 0.5 = 9.89037e5, F = 2 + 1/G_e.
  const ge = 1e4 * 329.6791084 * 0.3;
  close(intensifierNoiseFactor(2, ge), 2.000001011, 1e-9);
  // Point spot, 35 photoelectrons, 0.035 background, read noise 5 e⁻: SNR → √(35²/(35.035·2)) = 4.18121.
  close(intensifiedSnr(35, 0.035, ge, 2, 5), 4.181209, 1e-6);
  // Noiseless MCP at high G_e, no read noise: Poisson limit √N.
  close(intensifiedSnr(35, 0, 1e12, 1, 0), Math.sqrt(35), 1e-11);
  // One CCD electron per photoelectron: the Poisson phosphor and coupling add 1/G_e = 1, so √(N/2).
  close(intensifiedSnr(35, 0, 1, 1, 0), Math.sqrt(35 / 2), 1e-15);
  // Read-noise limit: Var = 1e-6·(1 + 1/1e-3) + 1.
  close(intensifiedSnr(1, 0, 1e-3, 1, 1), 1e-3 / Math.sqrt(1 + 1e-3 + 1e-6), 1e-12);
  assert.ok(Number.isNaN(intensifiedSnr(0, 0, 1, 2, 0)));
  assert.ok(Number.isNaN(intensifiedSnr(1, 0, 1, 0.5, 0)));
  assert.ok(Number.isNaN(intensifierNoiseFactor(0.5, 1e3)));
});

test("phosphor screens: Photek gains at 5 kV as energy efficiencies", () => {
  // Photek PH-DS039 Rev 02: P43 240 photons/e⁻ at 5 kV, peak 548 nm. E_ph = 1239.841984/548 = 2.262485 eV, so
  // η = 240·2.262485/5000 = 0.1085993 (aluminium film included); P46 55 at 530 nm: 55·2.339325/5000 = 0.0257326.
  close(phosphorEfficiency(240, 5000, 548e-9), 0.10859930, 1e-7);
  close(phosphorEfficiency(55, 5000, 530e-9), 0.02573257, 1e-6);
  const eta = phosphorEfficiency(PHOSPHOR_SCREENS.p43.photonsAt5kV, 5000, PHOSPHOR_SCREENS.p43.peak);
  close(phosphorGain(eta, 5000, 548e-9), 240, 1e-12);
  close(phosphorGain(eta, 3000, 548e-9), 144, 1e-12); // ∝ V
  assert.ok(Number.isNaN(phosphorEfficiency(240, 0, 548e-9)));
  // intensified-ccd defaults: S = 3.5, B = 0.035, G_e = 10³·240·0.1·0.5 = 12 000, F_MCP = 1.6², 2 px spot (c₃ = 1.353821,
  // κ = 5.056566, N_eff = 10.11629), σ_r = 5: Var = 3.5·1.44e8·(2.56 + c₃/12 000) + 0.035·1.44e8·(2.56κ + N_eff/12 000)
  // + 25·N_eff, SNR = 42 000/√Var = 1.140756. Background equal to the signal (B = 3.5) drops it to 0.475103.
  const ge = 1e3 * phosphorGain(eta, 5000, 548e-9) * 0.1 * 0.5;
  close(intensifiedSnr(3.5, 0.035, ge, 1.6 ** 2, 5, gaussianSpotShares(2)), 1.140756, 1e-6);
  close(intensifiedSnr(3.5, 3.5, ge, 1.6 ** 2, 5, gaussianSpotShares(2)), 0.475103, 1e-5);
});

test("Gaussian spot on a pixel grid: centre share, Σh², c₃ and κ", () => {
  // FWHM 2 px: σ√2 = 1.2011224; 1-D shares s₀ = erf(0.5/1.2011224) = 0.4439408, s₁ = ½[erf(1.5/·) − erf(0.5/·)] =
  // 0.2393413, s₂ = 0.0370658, s₃ = 0.0016036. Centre pixel s₀² = 0.1970835; Σh² = (s₀² + 2Σs_k²)² = 0.3144049² =
  // 0.0988504 (N_eff = 10.1). A Monte Carlo even field (exponential MCP, Poisson phosphor, binomial coupling,
  // 8.4e4 pixel samples) gave a per-pixel variance 0.5 % above N·G²(2·Σh² + 1/G) and 10× below N·G²(2 + 1/G).
  const spot = gaussianSpotShares(2);
  close(spot.peak, 0.4439408243 ** 2, 1e-8);
  close(spot.sumSquares, 0.3144048712 ** 2, 1e-8);
  // c₃ = Σh³/(Σh²)² and κ = Σ(h⋆h)²/(Σh²)² against a brute-force 2-D sum (17 × 17 shares, direct autocorrelation):
  // 1.3538208 and 5.0565663.
  close(spot.cubeRatio, 1.3538207918, 1e-9);
  close(spot.footprint, 5.0565662946, 1e-9);
  // Wide spot: Σh² → 1/(4π(σ² + 1/12)), the Gaussian with the pixel's variance 1/12 added per axis, and κ·Σh² → ½
  // (continuum Gaussian: κ = 2πσ², N_eff = 4πσ²).
  close(gaussianSpotShares(20).footprint * gaussianSpotShares(20).sumSquares, 0.5, 1e-6);
  const sigma = 20 / 2.354820045;
  close(gaussianSpotShares(20).sumSquares, 1 / (4 * Math.PI * (sigma ** 2 + 1 / 12)), 1e-4);
  // Point spot: all in one pixel.
  assert.deepEqual(gaussianSpotShares(0), POINT_SPOT);
  assert.deepEqual(POINT_SPOT, { peak: 1, sumSquares: 1, cubeRatio: 1, footprint: 1 });
  close(gaussianSpotShares(0.01).peak, 1, 1e-12);
  assert.ok(Number.isNaN(gaussianSpotShares(-1).peak));
  assert.ok(Number.isNaN(gaussianSpotShares(Infinity).footprint));
});

test("streak camera: time per length and quadrature resolution", () => {
  // 10 mm/ns = 10⁷ m/s: a 75 µm slit image spans 7.5 ps, a 13 µm pixel 1.3 ps.
  close(streakTime(75e-6, 1e7), 7.5e-12, 1e-12);
  close(streakTime(13e-6, 1e7), 1.3e-12, 1e-12);
  // Window: 1024 × 13 µm = 13.312 mm fits the Ø18 mm C16910 screen, 1.3312 ns at 10 mm/ns; 2048 × 13 µm = 26.6 mm
  // overfills it, so the screen sets 18 mm / 10⁷ m/s = 1.8 ns.
  close(streakWindow(1024 * 13e-6, 18e-3, 1e7), 1.3312e-9, 1e-12);
  close(streakWindow(2048 * 13e-6, 18e-3, 1e7), 1.8e-9, 1e-12);
  assert.ok(Number.isNaN(streakWindow(1e-3, 0, 1e7)));
  // Gaussians add in quadrature: √(2² + 1.5²) = 2.5.
  close(quadratureFwhm([2e-12, 1.5e-12, 0]), 2.5e-12, 1e-12);
  // Rect 7.5 ps ⊗ rect 1.3 ps ⊗ Gauss 2 ps FWHM. A brute-force sum (trapezoid sampled every 1e-4 ps,
  // times the Gaussian, half maximum bisected) gives 7.5000973 ps; quadrature would give √61.94 = 7.8702 ps.
  close(rectGaussFwhm([7.5, 1.3], 2), 7.5000973, 1e-7);
  // Two equal rectangles 3 ⊗ 3 (a triangle of FWHM 3) blurred by a 1 ps Gaussian: brute force 3.3390152.
  close(rectGaussFwhm([3, 3], 1), 3.3390152, 1e-7);
  // Limits: rectangles alone give the wider one (trapezoid), a Gaussian alone itself, one rect a ⊗ Gauss a ≈ 1.2494·a.
  assert.equal(rectGaussFwhm([5, 2], 0), 5);
  assert.equal(rectGaussFwhm([0, 0], 2), 2);
  // Rect 4 ⊗ Gauss 4 ∝ erf((t + 2)/s) − erf((t − 2)/s), s = σ√2: the profile at half the FWHM is half the peak.
  const w = rectGaussFwhm([4], 4);
  const sg = (4 / (2 * Math.sqrt(2 * Math.LN2))) * Math.SQRT2;
  const prof = (t: number) => erf((t + 2) / sg) - erf((t - 2) / sg);
  close(prof(w / 2), prof(0) / 2, 1e-10);
  close(w, 4.997483, 1e-6);
  // A tiny Gaussian converges on the trapezoid's FWHM.
  close(rectGaussFwhm([5, 2], 1e-6), 5, 1e-6);
  assert.ok(Number.isNaN(rectGaussFwhm([1, 1, 1], 1)));
  assert.ok(Number.isNaN(rectGaussFwhm([1], -1)));
  assert.equal(quadratureFwhm([]), 0);
  assert.ok(Number.isNaN(quadratureFwhm([1e-12, -1e-12])));
  assert.ok(Number.isNaN(streakTime(1e-6, 0)));
});

test("photocathode dark emission: Burle Table I values carried to other temperatures over an effective barrier", () => {
  // K₂CsSb, 0.02 fA/cm² = 2e-13 A/m² at 25 °C (Burle Photomultiplier Handbook 1980, Table I). By hand: k_BT/q =
  // 8.617333262e-5 · 298.15 = 0.02569258 V, A₀T² = 1.2017323e6 · 298.15² = 1.068261e11 A/m², ln(A₀T²/j) = 54.63491,
  // so ψ = 1.40371 eV, well below the ≈ 1.9 eV photoemission threshold of a bialkali cathode.
  const j = PHOTOCATHODE_DARK_EMISSION.find((p) => p.name.startsWith("K₂CsSb"))!.jDark25;
  close(j, 2e-13, 1e-12);
  const psi = effectiveThermionicBarrier(j, 298.15);
  close(psi, 1.40371, 1e-5);
  close(thermionicCurrentDensity(298.15, psi), j, 1e-12);
  // Cooling to 0 °C: (273.15/298.15)² · exp(−(ψ/k_B)(1/273.15 − 1/298.15)) = 0.83933 · e^(−5.00044) = 5.653e-3.
  close(thermionicCurrentDensity(273.15, psi) / j, 0.83933 * Math.exp(-5.00044), 1e-4);
  // The page's old model, Richardson over the 2.0 eV threshold, was ten decades low.
  assert.ok(thermionicCurrentDensity(298.15, 2.0) / j < 1e-9);
  assert.ok(Number.isNaN(effectiveThermionicBarrier(0, 298.15)));
});
