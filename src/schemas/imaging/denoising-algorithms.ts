import { denoisingSummary, type DenoisingFilter } from "../../physics/imaging/denoising";
import { defineSchema } from "../types";

const GONZALEZ = "Gonzalez R. C., Woods R. E. (2018). Digital Image Processing, 4th ed., Pearson, box and Gaussian spatial filters. " +
  "Output noise σ_out² = σ²·Σw² follows from the variance of a weighted sum of independent variables, Papoulis A., Pillai S. U. (2002). " +
  "Probability, Random Variables and Stochastic Processes, 4th ed., McGraw-Hill (no DOI), for Σw = 1 on white noise.";
const DAVID = "David H. A., Nagaraja H. N. (2003). Order Statistics, 3rd ed., Wiley. Density of the sample median of n = k² " +
  "independent normals. https://doi.org/10.1002/0471722162";
const DONOHO = "Donoho D. L., Johnstone I. M. (1994). Ideal spatial adaptation by wavelet shrinkage. Biometrika 81, 425–455, " +
  "universal threshold σ√(2 ln N). https://doi.org/10.1093/biomet/81.3.425";
const NO_TRANSFER = "The median is nonlinear and has no transfer function, so there is no half-response frequency or H(0.25 cy/px).";
const ABOVE_HALF = "The transfer function stays above 0.5 up to the Nyquist frequency (0.5 cy/px), so it has no half-response frequency.";

export default defineSchema({
  href: "/imaging/denoising-algorithms",
  inputs: [
    { key: "inputNoise", label: "Input noise σ (any unit: DN, e⁻)", unit: "", toSI: 1, siUnit: "", default: 20, min: 1e-6, max: 1e9 },
    { key: "filterSize", label: "Window size k (odd, k × k; box and median)", unit: "px", toSI: 1, siUnit: "", default: 3, min: 3, max: 15 },
    { key: "sigmaSpatial", label: "Gaussian σ_s (Gaussian only)", unit: "px", toSI: 1, siUnit: "", default: 2, min: 0.5, max: 10 },
    { key: "imageSize", label: "Image side (for VisuShrink)", unit: "px", toSI: 1, siUnit: "", default: 512, min: 16, max: 16384 },
  ],
  choices: [
    {
      key: "filter",
      label: "Filter",
      options: [
        { value: "box", label: "Box (mean)" },
        { value: "gaussian", label: "Gaussian" },
        { value: "median", label: "Median" },
      ],
      default: "box",
    },
  ],
  outputs: [
    { key: "outputNoise", label: "Output noise σ (in the unit of the input noise)", unit: "", toSI: 1, siUnit: "" },
    { key: "noiseRatio", label: "Output noise as a multiple of the input σ", unit: "×", toSI: 1, siUnit: "" },
    { key: "snrGain", label: "SNR gain", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "halfResponse", label: "Half-response frequency f₅₀", unit: "cy/px", toSI: 1, siUnit: "cy/px" },
    { key: "responseQuarter", label: "H(0.25 cy/px) along one axis", unit: "", toSI: 1, siUnit: "" },
    { key: "visuShrink", label: "VisuShrink threshold σ√(2 ln N)", unit: "", toSI: 1, siUnit: "" },
  ],
  validate({ filterSize }) {
    if (!(Number.isInteger(filterSize) && filterSize % 2 === 1)) return `The window size must be an odd whole number (3, 5 … 15), got ${filterSize}.`;
    return undefined;
  },
  compute({ inputNoise, filterSize, sigmaSpatial, imageSize, filter }) {
    const kind: DenoisingFilter = filter === "gaussian" || filter === "median" ? filter : "box";
    const s = denoisingSummary(kind, filterSize, sigmaSpatial, inputNoise, Math.round(imageSize));
    const reasons = kind === "median" ? { halfResponse: NO_TRANSFER, responseQuarter: NO_TRANSFER } : { halfResponse: ABOVE_HALF };
    return {
      values: {
        outputNoise: s.outputNoise,
        noiseRatio: s.ratio,
        snrGain: s.gainDb,
        halfResponse: s.f50,
        responseQuarter: s.hQuarter,
        visuShrink: s.threshold,
      },
      reasons,
    };
  },
  checks: [
    {
      // Sampled Gaussian σ_s = 2 px, taps i = −6…6, g_i ∝ exp(−i²/8): Σg²/(Σg)² = 0.14133634 (output/input σ),
      // H(0.25) = Σg_i cos(πi/2)/Σg = 0.00706677, |H| first falls to 0.5 at 0.0938283 cy/px (independent bisection).
      source: GONZALEZ,
      basis: "computed",
      inputs: { filter: "gaussian", sigmaSpatial: 2 },
      expect: { noiseRatio: 0.1413363421550684, responseQuarter: 0.0070667708446923725, halfResponse: 0.09382828337529911 },
      tolerance: 1e-8,
    },
    {
      // Median 5 × 5 (n = 25, m = 12): √var = 0.248488, from a trapezoid quadrature of x² n!/(m!)² Φ^m (1−Φ)^m φ on [−12, 12]
      // (the same quadrature gives 1 − √3/π for n = 3, the closed form).
      source: DAVID,
      basis: "computed",
      inputs: { filter: "median", filterSize: 5 },
      expect: { noiseRatio: 0.2484879414215154 },
      tolerance: 1e-8,
    },
    {
      // σ = 7, 1024 × 1024 image: N = 1048576, ln N = 13.862944, √(2 ln N) = 5.265538, T = 7 × that.
      source: DONOHO,
      basis: "computed",
      inputs: { inputNoise: 7, imageSize: 1024 },
      expect: { visuShrink: 36.85876386827823 },
      tolerance: 1e-8,
    },
  ],
});
