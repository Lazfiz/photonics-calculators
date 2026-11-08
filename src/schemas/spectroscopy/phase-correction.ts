import { DEMO_DX, phaseCorrectionDemo } from "../../physics/spectroscopy/ftir-phase-correction";
import { defineSchema } from "../types";

const GRIFFITHS = "Griffiths P. R., de Haseth J. A. (2007). Fourier Transform Infrared Spectrometry, 2nd ed., Wiley, ch. 4 " +
  "(phase correction; resolution 1/L of a record of N samples at step Δx, phase resolution 1/(2MΔx) from the ±M " +
  "double-sided part). Mertz L. (1967). Infrared Phys. 7, 17, doi:10.1016/0020-0891(67)90026-7; Forman M. L., Steel W. H., Vanasse G. A. (1966). " +
  "J. Opt. Soc. Am. 56, 59, doi:10.1364/JOSA.56.000059.";

const METHODS = { mertz: "Mertz", forman: "Forman", magnitude: "Magnitude" } as const;
type Method = keyof typeof METHODS;

// The page adds white noise from the fixed seed 1 (createRng(1)); the schema calls the same function with seed 1, so
// every output, including the noisy RMS errors, is deterministic and equals the page's.
export default defineSchema({
  href: "/spectroscopy/phase-correction",
  choices: [
    {
      key: "method",
      label: "Method",
      options: (Object.keys(METHODS) as Method[]).map((value) => ({ value, label: METHODS[value] })),
      default: "mertz",
    },
  ],
  inputs: [
    { key: "opdPoints", label: "Single-sided points N", unit: "", toSI: 1, siUnit: "", default: 4096, min: 512, max: 8192 },
    { key: "doubleSided", label: "Double-sided points ±M", unit: "", toSI: 1, siUnit: "", default: 128, min: 16, max: 512 },
    { key: "zpdShift", label: "ZPD offset ε", unit: "samples", toSI: 1, siUnit: "samples", default: 0.3, min: -0.5, max: 0.5 },
    { key: "phaseOffset", label: "Phase offset φ₀", unit: "rad", toSI: 1, siUnit: "rad", default: 0.5, min: -3.14159, max: 3.14159 },
    { key: "dispersion", label: "Dispersion φ₂", unit: "rad", toSI: 1, siUnit: "rad", default: 1, min: -5, max: 5 },
    { key: "noise", label: "Noise, RMS (% of the centreburst)", unit: "%", toSI: 0.01, siUnit: "", default: 0.01, min: 0, max: 5 },
  ],
  outputs: [
    { key: "errorSelected", label: "Spectrum error, selected method (RMS vs truth where B ≥ 5 % of peak)", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "errorNone", label: "Error without correction", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "errorMertz", label: "Mertz error", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "errorForman", label: "Forman error", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "errorMagnitude", label: "Magnitude error", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "phaseError", label: "Phase estimate error (RMS)", unit: "rad", toSI: 1, siUnit: "rad" },
    { key: "phaseResolution", label: "Phase resolution 1/(2MΔx)", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹" },
    { key: "resolution", label: "Resolution 1/L, L = NΔx", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹" },
    { key: "zpdFound", label: "ZPD found, samples from sample 0", unit: "samples", toSI: 1, siUnit: "samples" },
  ],
  compute({ opdPoints, doubleSided, zpdShift, phaseOffset, dispersion, noise, method }) {
    const N = Math.round(opdPoints);
    const M = Math.round(doubleSided);
    const r = phaseCorrectionDemo({ N, M, eps: zpdShift, phi0: phaseOffset, phi2: dispersion, noisePct: noise * 100, seed: 1 });
    const key: Method = method in METHODS ? (method as Method) : "mertz";
    return {
      values: {
        errorSelected: r.errors[key],
        errorNone: r.errors.none,
        errorMertz: r.errors.mertz,
        errorForman: r.errors.forman,
        errorMagnitude: r.errors.magnitude,
        phaseError: r.phaseRms,
        phaseResolution: (1 / (2 * M * DEMO_DX)) * 100,
        resolution: (1 / (N * DEMO_DX)) * 100,
        zpdFound: r.shift,
      },
    };
  },
  checks: [
    {
      // dx = 632.8e-7 cm (one HeNe wavelength). N = 4096: 1/L = 1/(4096 · 632.8e-7 cm) = 1/0.259195 cm = 3.858101 cm⁻¹.
      // M = 128: 1/(2 · 128 · 632.8e-7 cm) = 1/0.0161997 cm = 61.72961 cm⁻¹.
      source: GRIFFITHS,
      basis: "computed",
      inputs: {},
      expect: { resolution: 3.8581009007585334, phaseResolution: 61.729614412136534 },
      tolerance: 1e-8,
    },
  ],
});
