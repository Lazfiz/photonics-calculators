import { aliasedFrequency } from "../../physics/spectroscopy/fourier-transform";
import {
  FTIR_APODIZATIONS, FTIR_APODIZATION_NAMES, halfVisibilityOpd, ilsFwhm, nominalResolution, type FtirApodization,
} from "../../physics/spectroscopy/ftir";
import {
  gaussianLineCoherence, machZehnderBeams, michelsonBeams, twoBeamIntensity, twoBeamOpd, twoBeamVisibility, type TwoBeamType,
} from "../../physics/spectroscopy/two-beam";
import { defineSchema } from "../types";

const GRIFFITHS = "Griffiths P. R., de Haseth J. A. (2007). Fourier Transform Infrared Spectrometry, 2nd ed., Wiley, ch. 2 " +
  "(resolution 1/L, Nyquist wavenumber 1/(2Δx), sampling at step Δx = L/N).";
const BORN_WOLF = "Born M., Wolf E. (1999). Principles of Optics, 7th ed., Cambridge University Press, ch. 7 (two-beam " +
  "interference I = I₁ + I₂ + 2√(I₁I₂)|γ|cos φ, visibility) and ch. 10 (degree of coherence); Hariharan P. (2003). Optical " +
  "Interferometry, 2nd ed., Academic Press (Michelson, OPD = 2ΔL).";

// The recovered spectrum (cosine transform of the sampled interferogram) is not an output: it is a curve. The page's
// two-beam block shows the detector (Michelson) or outputs A and B (Mach-Zehnder); the schema gives the detector or
// output A only, since output B does not exist for the Michelson default.
export default defineSchema({
  href: "/spectroscopy/michelson-interferometer",
  choices: [
    {
      key: "apodization",
      label: "Apodization",
      options: FTIR_APODIZATION_NAMES.map((name) => ({ value: name, label: FTIR_APODIZATIONS[name].label })),
      default: "boxcar",
    },
    {
      key: "type",
      label: "Interferometer",
      options: [{ value: "michelson", label: "Michelson" }, { value: "mz", label: "Mach-Zehnder" }],
      default: "michelson",
    },
  ],
  inputs: [
    { key: "wavelength", label: "Central wavelength", unit: "µm", toSI: 1e-6, siUnit: "m", default: 1.0, min: 0.2, max: 50 },
    { key: "nLines", label: "Number of lines", unit: "", toSI: 1, siUnit: "", default: 3, min: 1, max: 10 },
    { key: "lineSpacing", label: "Line spacing", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹", default: 300, min: 0.01, max: 10000 },
    { key: "linewidth", label: "Linewidth, Gaussian FWHM", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹", default: 20, min: 0, max: 5000 },
    { key: "maxOPD", label: "Maximum OPD L", unit: "µm", toSI: 1e-6, siUnit: "m", default: 100, min: 1, max: 100000 },
    { key: "nPoints", label: "Samples over 0 … L", unit: "", toSI: 1, siUnit: "", default: 512, min: 16, max: 4096 },
    { key: "armDiff", label: "Arm-length difference ΔL", unit: "µm", toSI: 1e-6, siUnit: "m", default: 10, min: -100000, max: 100000 },
    { key: "splitR", label: "Splitter reflectance R (Michelson) or Rₐ (Mach-Zehnder)", unit: "", toSI: 1, siUnit: "", default: 0.5, min: 0, max: 1 },
    { key: "reflectivity", label: "Mirror R₁ (Michelson)", unit: "", toSI: 1, siUnit: "", default: 0.9, min: 0, max: 1 },
    { key: "reflectivity2", label: "Mirror R₂ (Michelson)", unit: "", toSI: 1, siUnit: "", default: 0.9, min: 0, max: 1 },
    { key: "splitR2", label: "Splitter 2 reflectance R_b (Mach-Zehnder)", unit: "", toSI: 1, siUnit: "", default: 0.5, min: 0, max: 1 },
  ],
  outputs: [
    { key: "resolution", label: "Resolution δσ = 1/L", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹" },
    { key: "resolvingPower", label: "Resolving power L/λ", unit: "", toSI: 1, siUnit: "" },
    { key: "ilsFwhm", label: "Instrument line shape FWHM", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹" },
    { key: "nyquist", label: "Nyquist wavenumber 1/(2Δx)", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹" },
    { key: "sampleStep", label: "Sample step Δx = L/N", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "halfVisibilityOpd", label: "OPD where a line's fringe visibility falls to one half", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "opd", label: "Optical path difference", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "fringeOrder", label: "Fringe order OPD/λ", unit: "", toSI: 1, siUnit: "" },
    { key: "fringePhase", label: "Phase past a bright fringe", unit: "°", toSI: Math.PI / 180, siUnit: "rad" },
    { key: "coherence", label: "Coherence factor |γ| of one Gaussian line", unit: "", toSI: 1, siUnit: "" },
    { key: "visibility", label: "Fringe visibility V (detector or output A)", unit: "", toSI: 1, siUnit: "" },
    { key: "intensity", label: "Output intensity I (fraction of the input; detector or output A)", unit: "", toSI: 1, siUnit: "" },
  ],
  // The module's relations hold in any coherent units; wavenumbers and OPD go to cm⁻¹ and cm for them, as on the page.
  compute({ wavelength, nLines, lineSpacing, linewidth, maxOPD, nPoints, armDiff, splitR, reflectivity, reflectivity2, splitR2,
    apodization, type }) {
    const apod = apodization as FtirApodization;
    const kind: TwoBeamType = type === "mz" ? "mz" : "michelson";
    const lambda_um = wavelength * 1e6;
    const L = maxOPD * 1e2; // cm
    const N = Math.round(nPoints);
    const n = Math.round(nLines);
    const spacing = lineSpacing / 100; // cm⁻¹
    const fwhm = linewidth / 100; // cm⁻¹
    const sigma0 = 1e4 / lambda_um; // cm⁻¹
    const dx = L / N; // cm
    const sigmaNyquist = 1 / (2 * dx);
    const lines = Array.from({ length: n }, (_, i) => sigma0 + (i - (n - 1) / 2) * spacing).filter((s) => s > 0);
    const dropped = n - lines.length;
    const aliased = lines.filter((s) => s > sigmaNyquist);

    const beams = kind === "michelson" ? michelsonBeams(splitR, reflectivity, reflectivity2) : machZehnderBeams(splitR, splitR2).A;
    const opd_um = twoBeamOpd(kind, armDiff * 1e6);
    const order = opd_um / lambda_um;
    const gamma = gaussianLineCoherence(fwhm, opd_um * 1e-4);

    const warnings: string[] = [];
    if (dropped > 0) warnings.push(`${dropped} line(s) fall at or below zero wavenumber and are left out: reduce the spacing.`);
    if (aliased.length > 0) {
      warnings.push(`Undersampled: the Nyquist wavenumber ${sigmaNyquist} cm⁻¹ is below ${aliased.map((s) => `${s} (aliases to ${aliasedFrequency(s, 2 * sigmaNyquist)})`).join(", ")} cm⁻¹.`);
    }
    return {
      values: {
        resolution: nominalResolution(L) * 100,
        resolvingPower: maxOPD / wavelength,
        ilsFwhm: (ilsFwhm(apod) / L) * 100,
        nyquist: sigmaNyquist * 100,
        sampleStep: dx * 1e-2,
        halfVisibilityOpd: halfVisibilityOpd(fwhm) * 1e-2,
        opd: opd_um * 1e-6,
        fringeOrder: order,
        fringePhase: (((order % 1) + 1) % 1) * 2 * Math.PI,
        coherence: gamma,
        visibility: twoBeamVisibility(beams) * gamma,
        intensity: twoBeamIntensity(beams, 2 * Math.PI * order, gamma),
      },
      warnings,
    };
  },
  checks: [
    {
      // L = 100 µm = 0.01 cm: δσ = 1/L = 100 cm⁻¹; λ = 1 µm: L/λ = 100. N = 512: Δx = 0.01/512 cm, so
      // σ_Nyquist = 1/(2Δx) = 25600 cm⁻¹ and Δx = 0.1953125 µm (exact).
      source: GRIFFITHS,
      basis: "computed",
      inputs: {},
      expect: { resolution: 100, resolvingPower: 100, nyquist: 25600, sampleStep: 0.1953125 },
      tolerance: 1e-8,
    },
    {
      // Γ = 20 cm⁻¹: |γ| = 1/2 at x = 2 ln 2/(πΓ) = 1.386294361/62.83185307 = 0.02206356 cm = 220.6356 µm.
      source: BORN_WOLF,
      basis: "computed",
      inputs: { linewidth: 20 },
      expect: { halfVisibilityOpd: 220.6356001526516 },
      tolerance: 1e-8,
    },
    {
      // Michelson at ΔL = 0, R = 1/2, R1 = R2 = 0.9: I1 = I2 = R T R1 = 0.25 · 0.9 = 0.225, |γ| = 1, V = 1 and
      // I = I1 + I2 + 2 sqrt(I1 I2) = 0.45 + 0.45 = 0.9.
      source: BORN_WOLF,
      basis: "computed",
      inputs: { armDiff: 0 },
      expect: { visibility: 1, intensity: 0.9 },
      tolerance: 1e-8,
    },
  ],
});
