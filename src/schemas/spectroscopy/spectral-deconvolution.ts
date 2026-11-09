import { PROFILES, type Profile } from "../../physics/spectroscopy/peak-model";
import { DEFAULT_PEAKS, bandModel, clamp, parsePeaks, vibronicModel } from "../../physics/spectroscopy/spectral-deconvolution";
import { defineSchema } from "../types";

const HUANG_RHYS = "Huang K., Rhys A. (1950). Theory of light absorption and non-radiative transitions in F-centres. " +
  "Proc. R. Soc. Lond. A 204, 406–423, doi:10.1098/rspa.1950.0184 (Poisson Franck–Condon factors P_n = e^(−S) Sⁿ/n!, so the " +
  "reorganisation energy of the progression is S·ν̃_v)";
const AREAS = "Areas of height-normalised line shapes: Gaussian exp(−4 ln2 (x/w)²) has area w √(π/(4 ln2)), Lorentzian " +
  "1/(1 + 4(x/w)²) has area π w/2 (elementary integrals); pseudo-Voigt form: Thompson P., Cox D.E., Hastings J.B. (1987), " +
  "Rietveld refinement of Debye–Scherrer synchrotron X-ray data from Al2O3, J. Appl. Cryst. 20, 79–83, doi:10.1107/S0021889887087090";

const PEAK_SETS = [
  { value: DEFAULT_PEAKS, label: "Three bands: 480:25:0.7, 520:35:1, 570:30:0.5" },
  { value: "500:20:1,520:20:1", label: "Two equal bands 20 apart, FWHM 20" },
];

export default defineSchema({
  href: "/spectroscopy/spectral-deconvolution",
  choices: [
    { key: "mode", label: "Model", options: [{ value: "bands", label: "Overlapping bands" }, { value: "vibronic", label: "Vibronic emission band" }], default: "bands" },
    { key: "profile", label: "Peak profile", options: PROFILES.map((p) => ({ value: p, label: p })), default: "gaussian" },
    { key: "peaks", label: "Peaks as centre:FWHM:height (preset lists)", options: PEAK_SETS, default: DEFAULT_PEAKS },
  ],
  inputs: [
    { key: "eta", label: "Lorentzian fraction η (pseudo-Voigt)", unit: "", toSI: 1, siUnit: "", default: 0.5, min: 0, max: 1 },
    { key: "noise", label: "Noise σ (fraction of the tallest peak)", unit: "", toSI: 1, siUnit: "", default: 0.02, min: 0, max: 1 },
    { key: "seed", label: "Noise seed", unit: "", toSI: 1, siUnit: "", default: 1, min: 1, max: 1e6 },
    { key: "xMin", label: "Window start (x unit)", unit: "", toSI: 1, siUnit: "", default: 400, min: -1e6, max: 1e6 },
    { key: "xMax", label: "Window end (x unit)", unit: "", toSI: 1, siUnit: "", default: 700, min: -1e6, max: 1e6 },
    { key: "lambda00", label: "0–0 transition λ₀₀", unit: "nm", toSI: 1e-9, siUnit: "m", default: 500, min: 150, max: 3000 },
    { key: "nuVib", label: "Vibrational wavenumber ν̃_v", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹", default: 1400, min: 10, max: 5000 },
    { key: "S", label: "Huang–Rhys factor S", unit: "", toSI: 1, siUnit: "", default: 1, min: 0, max: 10 },
    { key: "lineFwhm", label: "Width of each vibronic line (FWHM)", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹", default: 1000, min: 100, max: 10000 },
  ],
  outputs: [
    { key: "bandPeak", label: "Band maximum position (bands mode)", unit: "", toSI: 1, siUnit: "" },
    { key: "bandHeight", label: "Band maximum height (bands mode)", unit: "", toSI: 1, siUnit: "" },
    { key: "bandFwhm", label: "Band FWHM (bands mode)", unit: "", toSI: 1, siUnit: "" },
    { key: "bandCentroid", label: "Band centroid (bands mode)", unit: "", toSI: 1, siUnit: "" },
    { key: "totalArea", label: "Total area of the entered peaks (bands mode)", unit: "", toSI: 1, siUnit: "" },
    { key: "fitHeight1", label: "Fitted height of peak 1 (bands mode)", unit: "", toSI: 1, siUnit: "" },
    { key: "emissionMaxNm", label: "Emission maximum per nm (vibronic mode)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "absorptionMaxNm", label: "Absorption maximum (vibronic mode)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "stokesCm", label: "Stokes shift of the maxima (vibronic mode)", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹" },
    { key: "reorgCm", label: "Reorganisation energy S ν̃_v (vibronic mode)", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹" },
    { key: "emissionFwhmNm", label: "Emission band FWHM (vibronic mode)", unit: "nm", toSI: 1e-9, siUnit: "m" },
  ],
  validate({ mode, xMin, xMax }) {
    if (mode === "bands" && !(xMax > xMin)) return "The window end must be above its start.";
    return undefined;
  },
  compute({ mode, profile: profileRaw, peaks: peaksRaw, eta, noise, seed, xMin, xMax, lambda00, nuVib, S, lineFwhm }) {
    const empty = {
      bandPeak: NaN, bandHeight: NaN, bandFwhm: NaN, bandCentroid: NaN, totalArea: NaN, fitHeight1: NaN,
      emissionMaxNm: NaN, absorptionMaxNm: NaN, stokesCm: NaN, reorgCm: NaN, emissionFwhmNm: NaN,
    };
    if (mode === "vibronic") {
      const v = vibronicModel(lambda00 * 1e9, nuVib / 100, S, lineFwhm / 100);
      return {
        values: {
          ...empty,
          emissionMaxNm: v.emNm.peak * 1e-9,
          absorptionMaxNm: (1e7 / v.abs.peak) * 1e-9,
          stokesCm: (v.abs.peak - v.emNu.peak) * 100,
          reorgCm: v.reorg * 100,
          emissionFwhmNm: v.emNm.fwhm * 1e-9,
        },
        warnings: ["The band-model outputs are empty in vibronic mode."],
      };
    }
    const warnings: string[] = [];
    const profile: Profile = (PROFILES as readonly string[]).includes(profileRaw) ? (profileRaw as Profile) : "gaussian";
    const peaks = parsePeaks(peaksRaw);
    const m = bandModel({
      peaks, profile, eta: clamp(eta, 0, 1, 0.5), noise: clamp(noise, 0, 1, 0.02), seed: Math.round(clamp(seed, 1, 1e6, 1)), xMin, xMax,
    });
    if (m.narrow) warnings.push("A peak is narrower than three sample steps: widen it or narrow the window.");
    if (m.outside) warnings.push("A peak centre lies outside the window, so only its wing is sampled and its height is poorly determined.");
    if (!m.fit) warnings.push("The heights can't be separated: two peaks share a centre and width, or a peak has no samples under it.");
    warnings.push("The vibronic-model outputs are empty in bands mode.");
    return {
      values: {
        ...empty,
        bandPeak: m.stats?.peak ?? NaN,
        bandHeight: m.stats?.max ?? NaN,
        bandFwhm: m.stats?.fwhm ?? NaN,
        bandCentroid: m.stats?.centroid ?? NaN,
        totalArea: m.sumArea,
        fitHeight1: m.fit ? m.fit.heights[0] : NaN,
      },
      warnings,
    };
  },
  checks: [
    {
      // Defaults: Σ hᵢwᵢ = 0.7·25 + 1·35 + 0.5·30 = 67.5; × √(π/(4 ln2)) = 1.0644670194 gives 71.8515238.
      source: AREAS,
      basis: "computed",
      inputs: {},
      expect: { totalArea: 71.8515238 },
      tolerance: 1e-8,
    },
    {
      // Lorentzian: 67.5 · π/2 = 106.0287521.
      source: AREAS,
      basis: "computed",
      inputs: { profile: "lorentzian" },
      expect: { totalArea: 106.0287521 },
      tolerance: 1e-8,
    },
    {
      // Reorganisation energy S·ν̃_v = 2 · 1000 = 2000 cm⁻¹.
      source: HUANG_RHYS,
      basis: "computed",
      inputs: { mode: "vibronic", S: 2, nuVib: 1000 },
      expect: { reorgCm: 2000 },
      tolerance: 1e-8,
    },
  ],
});
