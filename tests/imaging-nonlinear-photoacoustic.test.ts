import test from "node:test";
import assert from "node:assert/strict";

import { c, epsilon_0 } from "../src/physics/constants";
import { detectedPhotoelectrons, srsShotNoiseSnr, stokesWavelength } from "../src/physics/imaging/coherent-raman";
import { mixedFocusFwhm, multiphotonFwhm } from "../src/physics/imaging/multiphoton-focus";
import {
  averageSfgPower, GAUSSIAN_PULSE_G2, sfgCoefficient, sfgCoherenceLengths, shgCoefficient, sumFrequencyWavelength,
} from "../src/physics/imaging/second-harmonic-generation";
import {
  acousticLossDb, effectiveAttenuation, fluenceAtDepth, initialPressure, paAxialResolution, paLateralResolution,
  skinLongExposureIrradianceLimit, skinPulseLimit, stressConfinementTime, transportMeanFreePath,
} from "../src/physics/imaging/photoacoustic";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const nm = 1e-9;
const um = 1e-6;

test("SRS shot-noise SNR δ√(ηPτλ/hc) (Ozeki et al. 2009)", () => {
  // 80 mW at 1036.27 nm for 1 µs: 8e-8 J / 1.91692e-19 J = 4.1733e11 photons, √ = 6.4601e5; δ = 1e-5 → 6.460.
  assertRel(detectedPhotoelectrons(0.08, 1036.27 * nm, 1 * um, 1), 4.17334e11, 1e-5, "N");
  assertRel(srsShotNoiseSnr(1e-5, 0.08, 1036.27 * nm, 1 * um, 1), 6.460, 1e-4, "SNR");
  // SNR ∝ √(ητ): η 0.8 → 5.778; 100 µs → 64.60.
  assertRel(srsShotNoiseSnr(1e-5, 0.08, 1036.27 * nm, 1 * um, 0.8), 6.460 * Math.sqrt(0.8), 1e-4, "η 0.8");
  assertRel(srsShotNoiseSnr(1e-5, 0.08, 1036.27 * nm, 100 * um, 1), 64.60, 1e-4, "100 µs");
  // The default 800 nm pump and 2850 cm⁻¹ shift put the Stokes beam at 1036.27 nm.
  assertRel(stokesWavelength(800 * nm, 285000), 1036.2694 * nm, 1e-7, "Stokes λ");
  assert.equal(srsShotNoiseSnr(0, 0.08, 1036.27 * nm, 1 * um, 1), 0);
  assert.ok(Number.isNaN(srsShotNoiseSnr(1e-5, 0.08, 1036.27 * nm, 0, 1)), "τ = 0");
  assert.ok(Number.isNaN(srsShotNoiseSnr(1e-5, 0.08, 1036.27 * nm, 1 * um, 1.2)), "η > 1");
  assert.ok(Number.isNaN(srsShotNoiseSnr(-1e-5, 0.08, 1036.27 * nm, 1 * um, 1)), "δ < 0");
});

test("Mixed-beam focus FWHM √(2 ln 2/Σ kᵢ/wᵢ²) on Zipfel's Gaussian focus", () => {
  // One beam of order 2 is the two-photon FWHM.
  const one = mixedFocusFwhm([{ lambda: 800 * nm, order: 2 }], 1.33, 1.0);
  const twoPhoton = multiphotonFwhm(800 * nm, 1.33, 1.0, 2);
  assertRel(one.lateral, twoPhoton.lateral, 1e-12, "k = 2 lateral");
  assertRel(one.axial, twoPhoton.axial, 1e-12, "k = 2 axial");
  // SRS 800 + 1036.27 nm, NA 1.0: w = 0.65λ/√2 → 367.70 and 476.29 nm, Σ 1/w² = 1.18046e13 m⁻², FWHM 342.69 nm.
  const srs = mixedFocusFwhm([{ lambda: 800 * nm, order: 1 }, { lambda: 1036.27 * nm, order: 1 }], 1.33, 1.0);
  assertRel(srs.lateral, 342.69 * nm, 2e-4, "SRS lateral");
  assert.ok(Number.isNaN(mixedFocusFwhm([], 1.33, 1.0).lateral), "no beams");
  assert.ok(Number.isNaN(mixedFocusFwhm([{ lambda: 800 * nm, order: 1 }], 1.33, 1.4).axial), "NA > n");
});

test("Sum-frequency generation: wavelength, thin-slab power and coherence lengths (Boyd eq. 2.2.10)", () => {
  assertRel(sumFrequencyWavelength(1040 * nm, 800 * nm), 452.1739 * nm, 1e-7, "λ₃");
  assert.ok(Number.isNaN(sumFrequencyWavelength(0, 800 * nm)), "λ₁ = 0");
  // Hand calculation: 8π² d² L²/(ε₀ c n³ λ₃²) · 2/(π(w₁² + w₂²)), d 1 pm/V, L 1 µm, n 1.33, w 1 µm → 1.96836e-8 /W.
  const sfg = sfgCoefficient({ lambda1: 1040 * nm, lambda2: 800 * nm, length: 1 * um, deff: 1e-12, n: 1.33, deltaN: 0, w1: 1 * um, w2: 1 * um });
  const lambda3 = 452.17391e-9;
  const hand = ((8 * Math.PI ** 2 * 1e-24 * 1e-12) / (epsilon_0 * c * 1.33 ** 3 * lambda3 ** 2)) * (2 / (Math.PI * 2e-12));
  assertRel(sfg.K, hand, 1e-6, "K");
  assertRel(sfg.K, 1.96836e-8, 1e-5, "K value");
  assert.equal(sfg.deltaK, 0);
  // ω₁ = ω₂ and w₁ = w₂: 4× the near-field SHG coefficient (degeneracy factor of P = 4ε₀dA₁A₂).
  const deg = sfgCoefficient({ lambda1: 800 * nm, lambda2: 800 * nm, length: 0.2 * um, deff: 1e-12, n: 1.33, deltaN: 0.01, w1: 1 * um, w2: 1 * um });
  const shg = shgCoefficient({ lambda: 800 * nm, length: 0.2 * um, deff: 1e-12, nOmega: 1.33, deltaN: 0.01, w0: 1 * um });
  assertRel(deg.K, 4 * shg.KNearField, 1e-12, "degenerate SFG = 4 × SHG");
  // Pulses: K g P₁P₂/(fτ).
  assertRel(averageSfgPower(sfg.K, 0.1, 0.05, 80e6, 150e-15), (sfg.K * GAUSSIAN_PULSE_G2 * 0.005) / (80e6 * 150e-15), 1e-12, "⟨P₃⟩");
  // Coherence lengths at λ₃ 400 nm, n 1.33, Δn 0.01: 20 µm forward, 74.906 nm backward (as for SHG of 800 nm).
  const lc = sfgCoherenceLengths(400 * nm, 1.33, 0.01);
  assertRel(lc.forward, 20 * um, 1e-12, "forward");
  assertRel(lc.backward, 74.9064 * nm, 1e-5, "backward");
  assert.equal(sfgCoherenceLengths(400 * nm, 1.33, 0).forward, Infinity);
  assert.ok(Number.isNaN(sfgCoefficient({ lambda1: 1040 * nm, lambda2: 800 * nm, length: 0, deff: 1e-12, n: 1.33, deltaN: 0, w1: 1 * um, w2: 1 * um }).K), "L = 0");
});

test("Photoacoustic pressure, diffuse attenuation and resolution (Xu & Wang 2006; Wang & Hu 2012)", () => {
  // p₀ = Γ μ_a F: 0.2 · 500 m⁻¹ · 200 J/m² = 2.0e4 Pa.
  assertRel(initialPressure(0.2, 500, 200), 2.0e4, 1e-12, "p₀");
  // μ_eff = √(3 · 5 · 15) = 15 cm⁻¹; transport mean free path 1/(15 cm⁻¹).
  assertRel(effectiveAttenuation(500, 1000), 1500, 1e-12, "μ_eff");
  assertRel(transportMeanFreePath(500, 1000), 1 / 1500, 1e-12, "l′");
  assertRel(fluenceAtDepth(200, 1500, 1e-3), 200 * Math.exp(-1.5), 1e-12, "F(1 mm)");
  // R_A = 0.88 · 1540/5 MHz = 271.04 µm; R_L = 0.71 · 1540/(0.5 · 5 MHz) = 437.36 µm.
  assertRel(paAxialResolution(1540, 5e6), 271.04 * um, 1e-12, "R_A");
  assertRel(paLateralResolution(1540, 0.5, 5e6), 437.36 * um, 1e-12, "R_L");
  // 0.5 dB cm⁻¹ MHz⁻¹ = 5e-5 dB m⁻¹ Hz⁻¹, 5 MHz, 1 cm: 2.5 dB.
  assertRel(acousticLossDb(5e-5, 5e6, 0.01), 2.5, 1e-12, "loss");
  assertRel(stressConfinementTime(271.04 * um, 1540), 176 * nm, 1e-12, "τ_s");
  assert.equal(effectiveAttenuation(0, 1000), 0);
  assert.ok(Number.isNaN(effectiveAttenuation(-1, 1000)), "μ_a < 0");
  assert.ok(Number.isNaN(paLateralResolution(1540, 1.2, 5e6)), "NA > 1");
  assert.ok(Number.isNaN(paAxialResolution(1540, 0)), "Δf = 0");
});

test("Skin exposure limit of the excitation (ICNIRP 2013 Table 7)", () => {
  // 750 nm: C_A = 10^0.1 = 1.258925; one 5 ns pulse 200 C_A = 251.785 J/m²; ≥ 10 s: 2000 C_A = 2517.85 W/m².
  assertRel(skinPulseLimit(750 * nm, 5e-9), 251.785, 1e-5, "pulse");
  assertRel(skinLongExposureIrradianceLimit(750 * nm), 2517.85, 1e-5, "irradiance");
  // 1 µs at 532 nm: 1.1e4 t^0.25 = 347.85 J/m² (C_A = 1).
  assertRel(skinPulseLimit(532 * nm, 1e-6), 1.1e4 * 1e-6 ** 0.25, 1e-12, "1 µs");
  assert.ok(Number.isNaN(skinPulseLimit(750 * nm, 1e-10)), "below 1 ns");
});
