import test from "node:test";
import assert from "node:assert/strict";

import { q } from "../src/physics/constants";
import {
  coherenceLength, coherenceTime, degreeOfCoherence, dopplerFrequency, fdOctSnr, fringeVisibility, octAxialResolution,
  OCT_GAUSSIAN_FACTOR, spectralWidthHz, tdOctSnr, tdSignalBandwidth,
} from "../src/physics/imaging/oct";
import {
  BINARY_AMPLITUDE_EFFICIENCY, depthOfFocus, fresnelNumber, fresnelReconstructionPitch, hologramEffectiveNA, hologramNA, inlineMinDistance,
  maxInterferenceAngle, phaseQuantizationEfficiency, pixelEnvelope, replayField, slmMaxAngle,
} from "../src/physics/imaging/holography";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const nm = 1e-9;
const um = 1e-6;

test("OCT axial resolution (2 ln 2/π) λ²/(nΔλ) (Fercher et al. 2003)", () => {
  // 0.441271 · (1.31 µm)²/0.1 µm = 7.5727 µm; /1.33 = 5.6937 µm; 0.441271 · 0.84²/0.05 = 6.2272 µm.
  assertRel(OCT_GAUSSIAN_FACTOR, 0.4412712, 1e-6, "2 ln2/π");
  assertRel(octAxialResolution(1310 * nm, 100 * nm), 7.5727 * um, 2e-5, "1310/100 air");
  assertRel(octAxialResolution(1310 * nm, 100 * nm, 1.33), 5.6937 * um, 2e-5, "1310/100 n 1.33");
  assertRel(octAxialResolution(840 * nm, 50 * nm), 6.2272 * um, 2e-5, "840/50");
  // The old page divided by 2n: 1300 nm, 80 nm, n 1.4 must give 6.66 µm, not 3.33 µm.
  assertRel(octAxialResolution(1300 * nm, 80 * nm, 1.4), 6.65846 * um, 1e-5, "1300/80 n 1.4");
  assert.ok(Number.isNaN(octAxialResolution(1310 * nm, 0)), "Δλ = 0");
  assert.ok(Number.isNaN(octAxialResolution(1310 * nm, 100 * nm, 0)), "n = 0");
});

test("Gaussian coherence: Δν, τ_c, l_c = 2Δz and |γ| = 1/2 at OPD = l_c/2", () => {
  // Δν = c · 100 nm/(1310 nm)² = 17.470 THz; τ_c = 0.882542/Δν = 50.517 fs; l_c = cτ_c = 15.145 µm.
  assertRel(spectralWidthHz(1310 * nm, 100 * nm), 17.4699e12, 1e-4, "Δν");
  assertRel(coherenceTime(1310 * nm, 100 * nm), 50.517e-15, 1e-4, "τ_c");
  assertRel(coherenceLength(1310 * nm, 100 * nm), 2 * octAxialResolution(1310 * nm, 100 * nm), 1e-12, "l_c = 2Δz");
  const lc = coherenceLength(1310 * nm, 100 * nm);
  assertRel(degreeOfCoherence(lc / 2, 1310 * nm, 100 * nm), 0.5, 1e-12, "|γ(l_c/2)|");
  assertRel(degreeOfCoherence(-lc / 2, 1310 * nm, 100 * nm), 0.5, 1e-12, "|γ(−l_c/2)|");
  assert.equal(degreeOfCoherence(0, 1310 * nm, 100 * nm), 1);
});

test("Fringe visibility 2√(R_r R_s)/(R_r + R_s)", () => {
  // 2√(0.9 · 0.004)/0.904 = 0.12/0.904 = 0.132743.
  assertRel(fringeVisibility(0.9, 0.004), 0.132743, 1e-5, "V(0.9, 0.004)");
  assert.equal(fringeVisibility(0.5, 0.5), 1);
  assert.equal(fringeVisibility(1, 0), 0);
  assert.ok(Number.isNaN(fringeVisibility(0, 0)), "both zero");
});

test("Time-domain carrier 2v/λ and signal bandwidth 2vΔλ/λ²", () => {
  // 2 · 0.05 m/s/1.3 µm = 76 923 Hz; 2 · 0.05 · 80 nm/(1.3 µm)² = 4733.7 Hz.
  assertRel(dopplerFrequency(0.05, 1300 * nm), 76923.08, 1e-6, "f_D");
  assertRel(dopplerFrequency(0.01, 1300 * nm, 1.38, Math.PI / 3), (2 * 1.38 * 0.01 * 0.5) / (1300 * nm), 1e-12, "f_D n, θ");
  assertRel(tdSignalBandwidth(0.05, 1300 * nm, 80 * nm), 4733.73, 1e-5, "Δf");
  // Time-bandwidth product of a Gaussian: FWHM duration Δz/v times FWHM bandwidth = 4 ln 2/π.
  const T = octAxialResolution(1300 * nm, 80 * nm) / 0.05;
  assertRel(T * tdSignalBandwidth(0.05, 1300 * nm, 80 * nm), (4 * Math.LN2) / Math.PI, 1e-12, "TB product");
});

test("Shot-noise SNR ρP_sΔt/(2e) and ρP_s/(2eB) (Choma et al. 2003, eqs. 9–10)", () => {
  // 0.8 A/W · 60 µW · 50 µs/(2e) = 2.4e-9 C/3.204353e-19 C = 7.48981e9 (98.74 dB).
  assertRel(fdOctSnr(0.8, 60e-6, 50e-6), 2.4e-9 / (2 * 1.602176634e-19), 1e-12, "FD SNR");
  assertRel(10 * Math.log10(fdOctSnr(0.8, 60e-6, 50e-6)), 98.7447, 1e-5, "FD SNR dB");
  // Choma's sensitivity check: 500 µW on the sample, 3.5 ms sweep, 126 dB predicted ⇒ ρ ≈ 0.73 A/W.
  const rho = (10 ** 12.6 * 2 * q) / (500e-6 * 3.5e-3);
  assert.ok(rho > 0.6 && rho < 0.9, `ρ for 126 dB: ${rho}`);
  assertRel(tdOctSnr(0.8, 10e-6, 9467.46), fdOctSnr(0.8, 10e-6, 1 / 9467.46), 1e-12, "TD = FD with Δt = 1/B");
  assert.equal(fdOctSnr(0.8, 0, 1e-3), 0);
  assert.ok(Number.isNaN(tdOctSnr(0.8, 1e-6, 0)), "B = 0");
});

test("Digital holography: Fresnel pixel, NA, reference angle, in-line distance (Schnars & Jüptner 2002)", () => {
  // 532 nm · 0.1 m/(2048 · 6.5 µm) = 5.32e-8/0.013312 = 3.99639 µm; NA = 13.312 mm/0.2 m = 0.06656.
  assertRel(fresnelReconstructionPitch(532 * nm, 0.1, 2048, 6.5 * um), 3.99639 * um, 1e-5, "Δξ");
  // sin(atan(0.06656)) = 0.06656/sqrt(1 + 0.06656²) = 0.066413 (the paraxial value 0.06656 overestimates slightly).
  assertRel(hologramNA(2048, 6.5 * um, 0.1), 0.066413, 1e-5, "NA");
  // Edge case z = 1 mm: NΔx/2z = 6.656, sin(atan 6.656) = 6.656/sqrt(1 + 44.30) = 0.98890 (≤ 1; paraxial gave 6.66).
  assertRel(hologramNA(2048, 6.5 * um, 1e-3), 0.98890, 1e-5, "NA at 1 mm");
  assert.ok(hologramNA(2048, 6.5 * um, 1e-3) <= 1);
  // Defaults z = 200 mm: atan(0.03328), sin = 0.033262.
  assertRel(hologramNA(2048, 6.5 * um, 0.2), 0.033262, 3e-5, "NA defaults");
  // Pixel limit: λ/(2Δx) = 532 nm/13 µm = 0.040923 at z = 50 mm (sensor NA there is 0.2576), resolution λ/(2NA) = Δx.
  assertRel(hologramEffectiveNA(532 * nm, 2048, 6.5 * um, 0.05), 0.040923, 1e-5, "NA_eff pixel-limited");
  assertRel((532 * nm) / (2 * hologramEffectiveNA(532 * nm, 2048, 6.5 * um, 0.05)), 6.5 * um, 1e-9, "res = Δx");
  assertRel(hologramEffectiveNA(532 * nm, 2048, 6.5 * um, 0.2), 0.033262, 3e-5, "NA_eff = NA at defaults");
  assert.ok(Number.isNaN(hologramEffectiveNA(NaN, 2048, 6.5 * um, 0.2)), "NaN guard");
  // λz/(NΔx) = λ/(2NA): the pixel is the coherent resolution of the synthetic aperture.
  assertRel(fresnelReconstructionPitch(532 * nm, 0.1, 2048, 6.5 * um), (532 * nm) / (2 * 0.06656), 1e-12, "λ/(2NA)");
  // 2 asin(532 nm/26 µm) = 2 asin(0.0204615) = 0.0409259 rad = 2.3449°.
  assertRel(maxInterferenceAngle(532 * nm, 6.5 * um), 0.0409259, 1e-5, "θ_max");
  // 6.5 µm · (13.312 + 0.5) mm/532 nm = 0.168756 m; with D = 0 the image pixel equals Δx.
  assertRel(inlineMinDistance(532 * nm, 2048, 6.5 * um, 500 * um), 0.168756, 1e-5, "z_min");
  const z0 = inlineMinDistance(532 * nm, 2048, 6.5 * um, 0);
  assertRel(fresnelReconstructionPitch(532 * nm, z0, 2048, 6.5 * um), 6.5 * um, 1e-12, "Δξ = Δx at NΔx²/λ");
  // λ/NA² = 532 nm/0.0044302 = 120.08 µm; (0.25 mm)²/(532 nm · 0.1 m) = 1.1748.
  assertRel(depthOfFocus(532 * nm, 0.06656), 120.085 * um, 1e-4, "DOF");
  assertRel(fresnelNumber(250 * um, 532 * nm, 0.1), 1.17481, 1e-4, "N_F");
  assertRel(replayField(532 * nm, 0.1, 6.5 * um), 2048 * 3.99639 * um, 1e-5, "field = NΔξ");
  assert.ok(Number.isNaN(maxInterferenceAngle(30 * um, 6.5 * um)), "λ > 4Δx");
});

test("CGH: replay field, SLM angle, quantisation efficiency sinc²(π/L) (Swanson 1989)", () => {
  // 633 nm · 0.5 m/8 µm = 39.5625 mm; asin(633 nm/16 µm) = 0.0395728 rad.
  assertRel(replayField(633 * nm, 0.5, 8 * um), 39.5625e-3, 1e-9, "replay field");
  assertRel(slmMaxAngle(633 * nm, 8 * um), 0.0395728, 1e-5, "θ_max");
  assert.ok(Number.isNaN(slmMaxAngle(20 * um, 8 * um)), "λ > 2Δx");
  // (sin(π/8)/(π/8))² = 0.949641; binary 4/π² = 0.405285; 4 levels 8/π² = 0.810569; binary amplitude 1/π².
  assertRel(phaseQuantizationEfficiency(8), 0.949641, 1e-6, "8 levels");
  assertRel(phaseQuantizationEfficiency(2), 4 / Math.PI ** 2, 1e-12, "binary phase");
  assertRel(phaseQuantizationEfficiency(4), 8 / Math.PI ** 2, 1e-12, "4 levels");
  assertRel(BINARY_AMPLITUDE_EFFICIENCY, 0.101321, 1e-5, "binary amplitude");
  assert.ok(phaseQuantizationEfficiency(1024) > 0.999996, "continuous limit");
  assert.ok(Number.isNaN(phaseQuantizationEfficiency(1)), "one level");
  // Pixel envelope at the field edge: sinc²(π/2) = 4/π² at F = 1; sinc²(π√0.9/2) = 0.44740 at F = 0.9.
  assertRel(pixelEnvelope(1 / (2 * 8 * um), 8 * um, 1), 4 / Math.PI ** 2, 1e-12, "edge F = 1");
  assertRel(pixelEnvelope(1 / (2 * 8 * um), 8 * um, 0.9), 0.44740, 1e-4, "edge F = 0.9");
  assert.equal(pixelEnvelope(0, 8 * um, 0.9), 1);
});
