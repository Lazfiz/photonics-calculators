import { intensifiedCcdSummary, PHOSPHOR_IDS } from "../../physics/detectors/intensified-ccd";
import { PHOSPHOR_SCREENS } from "../../physics/detectors/photoemission";
import { defineSchema } from "../types";

const SOURCE = "Intensified CCD as a cascade of gain stages: Shockley W., Pierce J. R. (1938). A theory of noise for electron multipliers. " +
  "Proc. IRE 26(3), 321–332, doi:10.1109/JRPROC.1938.228127 (noise factor of cascaded stages, F = F₁ + (F₂ − 1)/G₁ + …), applied to an MCP " +
  "with variance factor K_f² followed by a Poisson phosphor and a binomial lens or fiber coupling: F = K_f² + 1/G_e, " +
  "G_e = G_MCP·g·η_coupling·QE_CCD, SNR = N_pe·G_e/√Var with Var = N_pe·G_e²·F + N_bg·G_e²·F + σ_read² for a point spot (K_f: Dussault D., " +
  "Hoess P. (2004), ICCDs edge out electron-multiplying CCDs in low light, Laser Focus World 40(9)). Phosphor g = η·qV/(hc/λ) with " +
  "g(5 kV) = 240 (P43, 548 nm) and 55 (P46, 530 nm) photons per electron (Photek, Image Diode data sheet PH-DS039 Rev 02 (2021), Phosphor options). " +
  "MCP stack gain G_plate^N (Wiza J. L. (1979), Microchannel plate detectors, Nucl. Instrum. Methods 162, 587–601, doi:10.1016/0029-554X(79)90734-1).";

export default defineSchema({
  href: "/detectors/intensified-ccd",
  inputs: [
    { key: "signalPhotons", label: "Signal (photons/pixel per gate)", unit: "photons", toSI: 1, siUnit: "photons", default: 10, min: 0, max: 1e7 },
    { key: "qe", label: "Photocathode QE", unit: "", toSI: 1, siUnit: "", default: 0.35, min: 0, max: 1 },
    { key: "mcpGain", label: "MCP gain per plate", unit: "", toSI: 1, siUnit: "", default: 1e3, min: 1, max: 1e6 },
    { key: "plates", label: "MCP plates", unit: "", toSI: 1, siUnit: "", default: 1, min: 1, max: 2 },
    { key: "kf", label: "Intensifier noise factor K_f (SNR_in/SNR_out)", unit: "", toSI: 1, siUnit: "", default: 1.6, min: 1, max: 5 },
    { key: "screenVoltage", label: "Screen voltage", unit: "kV", toSI: 1e3, siUnit: "V", default: 5, min: 3, max: 10 },
    { key: "fiberCoupling", label: "Fiber/lens coupling", unit: "", toSI: 1, siUnit: "", default: 0.1, min: 0.01, max: 1 },
    { key: "ccdQE", label: "CCD QE at the phosphor peak", unit: "", toSI: 1, siUnit: "", default: 0.5, min: 0.01, max: 1 },
    { key: "ccdReadNoise", label: "CCD read noise", unit: "e⁻", toSI: 1, siUnit: "e⁻", default: 5, min: 0, max: 100 },
    { key: "fullWell", label: "CCD full well", unit: "e⁻", toSI: 1, siUnit: "e⁻", default: 1e5, min: 1e3, max: 1e7 },
    { key: "spotFwhm", label: "Event spot FWHM on the CCD", unit: "px", toSI: 1, siUnit: "px", default: 2, min: 0, max: 20 },
    { key: "bareQe", label: "Bare CCD QE at the signal wavelength", unit: "", toSI: 1, siUnit: "", default: 0.5, min: 0, max: 1 },
    { key: "backgroundRate", label: "Background (photons/pixel/s)", unit: "photons/px/s", toSI: 1, siUnit: "photons/px/s", default: 1e6, min: 0, max: 1e12 },
    { key: "gate", label: "Gate width", unit: "ns", toSI: 1e-9, siUnit: "s", default: 100, min: 1, max: 1e9 },
  ],
  choices: [
    {
      key: "phosphor", label: "Phosphor", default: "p43",
      options: PHOSPHOR_IDS.map((id) => ({ value: id, label: PHOSPHOR_SCREENS[id].label })),
    },
  ],
  outputs: [
    { key: "photoelectrons", label: "Photoelectrons", unit: "e⁻", toSI: 1, siUnit: "e⁻" },
    { key: "backgroundElectrons", label: "Background photoelectrons in the gate", unit: "e⁻", toSI: 1, siUnit: "e⁻" },
    { key: "photonsPerElectron", label: "Phosphor gain", unit: "photons/e⁻", toSI: 1, siUnit: "photons/e⁻" },
    { key: "ccdElectronsPerPhotoelectron", label: "CCD e⁻ per photoelectron", unit: "e⁻", toSI: 1, siUnit: "e⁻" },
    { key: "outputSignal", label: "Output signal per pixel", unit: "e⁻", toSI: 1, siUnit: "e⁻" },
    { key: "noiseFactor", label: "Noise factor F (variance)", unit: "", toSI: 1, siUnit: "" },
    { key: "snr", label: "ICCD SNR per element", unit: "", toSI: 1, siUnit: "" },
    { key: "bareSnr", label: "Bare CCD SNR", unit: "", toSI: 1, siUnit: "" },
    { key: "highGainLimit", label: "High-gain SNR limit", unit: "", toSI: 1, siUnit: "" },
    { key: "noisePixels", label: "Effective noise pixels N_eff", unit: "px", toSI: 1, siUnit: "px" },
  ],
  compute({ signalPhotons, qe, mcpGain, plates, kf, screenVoltage, phosphor, fiberCoupling, ccdQE, ccdReadNoise, fullWell, spotFwhm, bareQe, backgroundRate, gate }) {
    const r = intensifiedCcdSummary({
      signal: signalPhotons, qe, mcpGain, plates, kf, screenVoltage, phosphor: PHOSPHOR_IDS.find((p) => p === phosphor) ?? "p43",
      coupling: fiberCoupling, ccdQe: ccdQE, readNoise: ccdReadNoise, fullWell, spotFwhm, bareQe, backgroundRate, gate,
    });
    const warnings: string[] = [];
    if (r.evenFieldFull) warnings.push("Signal + background exceed the full well in an even field: lower the gain.");
    else if (r.eventFull) warnings.push("One photoelectron puts more electrons in its centre pixel than the full well holds: lower the gain.");
    if (r.gainSaturated) {
      warnings.push(`The MCP stack gain is above the ≈ 10⁷ chevron saturation level (Wiza 1979); the model does not saturate.`);
    }
    const reasons: Record<string, string> = {};
    if (!Number.isFinite(r.snr)) reasons.snr = "There are no photoelectrons, no background and no read noise: the signal and the noise are both zero.";
    if (!Number.isFinite(r.highGainLimit)) reasons.highGainLimit = "There are no photoelectrons and no background: the signal and the noise are both zero.";
    if (!Number.isFinite(r.bareSnr)) reasons.bareSnr = "The bare-CCD signal (signal × bare QE) and the read noise are both zero.";
    return {
      values: {
        photoelectrons: r.photoelectrons, backgroundElectrons: r.background, photonsPerElectron: r.photonsPerElectron,
        ccdElectronsPerPhotoelectron: r.ge, outputSignal: r.output, noiseFactor: r.noiseFactor, snr: r.snr, bareSnr: r.bareSnr,
        highGainLimit: r.highGainLimit, noisePixels: r.noisePixels,
      },
      warnings,
      reasons,
    };
  },
  checks: [
    {
      // Point spot (FWHM 0), P43: 10 photons, QE 0.35, one plate of 1e3, K_f 1.6, 5 kV, coupling 0.1, CCD QE 0.5, read 5 e⁻, bare QE 0.5, 1e6 photons/px/s, 100 ns.
      // N_pe = 3.5, N_bg = 1e6·1e-7·0.35 = 0.035; g = 240 at 5 kV; G_e = 1e3·240·0.1·0.5 = 12000; F = 1.6² + 1/12000 = 2.5600833.
      // Var = (3.5 + 0.035)·12000²·F + 25 = 3.535·1.44e8·2.5600833 + 25; SNR = 3.5·12000/√Var = 1.1634461; output 42000 e⁻.
      // Bare SNR = 5/√(5 + 25) = 0.9128709; high-gain limit = 3.5/√(3.535·2.56) = 1.1634651.
      source: SOURCE,
      basis: "computed",
      inputs: { spotFwhm: 0 },
      expect: {
        photoelectrons: 3.5, backgroundElectrons: 0.034999999999999996, photonsPerElectron: 240, ccdElectronsPerPhotoelectron: 12000,
        outputSignal: 42000, noiseFactor: 2.560083333333334, snr: 1.1634461317165583, bareSnr: 0.9128709291752769,
        highGainLimit: 1.1634650790199978, noisePixels: 1,
      },
      tolerance: 1e-8,
    },
    {
      // Point spot, P46 at 6 kV: g = 55·6/5 = 66; 50 photons, QE 0.2, two plates of 100 (stack 1e4), K_f 1.4, coupling 0.2, CCD QE 0.6, read 3 e⁻, bare QE 0.4, 1e5 photons/px/s, 1 µs, full well 1e7.
      // N_pe = 10, N_bg = 1e5·1e-6·0.2 = 0.02; G_e = 1e4·66·0.2·0.6 = 79200; F = 1.96 + 1/79200 = 1.9600126.
      // Var = 10.02·79200²·F + 9; SNR = 10·79200/√Var = 2.2565071; bare SNR = 20/√(20 + 9) = 3.7139068; high-gain limit = 10/√(10.02·1.96) = 2.2565144.
      source: SOURCE,
      basis: "computed",
      inputs: { phosphor: "p46", plates: 2, mcpGain: 100, screenVoltage: 6, kf: 1.4, signalPhotons: 50, qe: 0.2, fiberCoupling: 0.2, ccdQE: 0.6, ccdReadNoise: 3, bareQe: 0.4, backgroundRate: 1e5, gate: 1000, fullWell: 1e7, spotFwhm: 0 },
      expect: {
        photoelectrons: 10, backgroundElectrons: 0.02, photonsPerElectron: 66, ccdElectronsPerPhotoelectron: 79200, outputSignal: 792000,
        noiseFactor: 1.960012626262626, snr: 2.2565071017763705, bareSnr: 3.7139067635410377, highGainLimit: 2.256514370023441,
      },
      tolerance: 1e-8,
    },
    {
      // Gaussian spot (FWHM 3 px) with background and read noise: matched filter w = h/Σh² over the pixel-integrated spot
      // h (erf differences), N_eff = (Σh)²/Σh² = 21.450665 px. G_e = 10·240·0.05·0.3 = 36, F = K_f² + 1/G_e = 2.56 + 1/36
      // = 2.5877778 (default K_f 1.6); N_bg = 1e7·1e-6·0.35 = 3.5; Var = (N_pe + N_bg)·G_e²·F + N_eff·10² → SNR 0.33532076.
      // Independent 2-D brute-force sum (review script), agreeing with the analytic form to 1e-15.
      source: SOURCE,
      basis: "computed",
      inputs: { mcpGain: 10, fiberCoupling: 0.05, ccdQE: 0.3, ccdReadNoise: 10, backgroundRate: 1e7, gate: 1000, spotFwhm: 3 },
      expect: {
        photoelectrons: 3.5, backgroundElectrons: 3.5, photonsPerElectron: 240, ccdElectronsPerPhotoelectron: 36, outputSignal: 126,
        noiseFactor: 2.587777777777778, snr: 0.3353207595042096, bareSnr: 0.4879500364742666, highGainLimit: 0.34144025389626814,
        noisePixels: 21.450664772032077,
      },
      tolerance: 1e-8,
    },
  ],
});
