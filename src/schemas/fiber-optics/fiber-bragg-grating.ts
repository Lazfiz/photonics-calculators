import { braggGratingSummary, type GratingType } from "../../physics/fiber-optics/fiber-bragg-grating-summary";
import { defineSchema } from "../types";

const ERDOGAN = "Erdogan T. (1997). Fiber grating spectra. J. Lightwave Technol. 15, 1277–1294, doi:10.1109/50.618322 " +
  "(uniform grating reflectance R = sinh²(γL)/(cosh²(γL) − σ̂²/κ²), eq. 20, γ² = κ² − σ̂², σ̂ = 2π n_eff (1/λ − 1/λ_B), " +
  "κ = πΔn/λ, peak tanh²(κL), first zeros at γL = iπ, i.e. σ̂L = √((κL)² + π²); transfer-matrix section model of §IV for " +
  "apodized and chirped gratings).";

export default defineSchema({
  href: "/fiber-optics/fiber-bragg-grating",
  inputs: [
    { key: "braggWavelength", label: "Bragg wavelength λ_B", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 200, max: 3000 },
    { key: "effectiveIndex", label: "Effective index n_eff (phase)", unit: "", toSI: 1, siUnit: "", default: 1.447, min: 1, max: 3 },
    { key: "gratingLength", label: "Grating length", unit: "mm", toSI: 1e-3, siUnit: "m", default: 10, min: 0.1, max: 1000 },
    { key: "indexModulation", label: "AC effective-index modulation δn_eff", unit: "", toSI: 1, siUnit: "", default: 1e-4, min: 1e-8, max: 1e-2 },
    { key: "chirpRate", label: "Chirp dλ_B/dz (chirped gratings)", unit: "nm/mm", toSI: 1e-6, siUnit: "m/m", default: 0.1, min: -50, max: 50 },
  ],
  choices: [
    {
      key: "gratingType", label: "Grating type", default: "uniform",
      options: [
        { value: "uniform", label: "Uniform" },
        { value: "apodized", label: "Apodized (Gaussian, FWHM = L/2)" },
        { value: "chirped", label: "Linearly chirped" },
      ],
    },
  ],
  outputs: [
    { key: "period", label: "Grating period Λ", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "numPeriods", label: "Number of periods", unit: "", toSI: 1, siUnit: "" },
    { key: "kappaL", label: "Coupling strength κL", unit: "", toSI: 1, siUnit: "" },
    { key: "peak", label: "Peak reflectance", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "fwhm", label: "FWHM bandwidth", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "zeroWidth", label: "Uniform first-zero width", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "chirpWidth", label: "Chirp bandwidth |dλ_B/dz|·L", unit: "nm", toSI: 1e-9, siUnit: "m" },
  ],
  compute({ braggWavelength, effectiveIndex, gratingLength, indexModulation, chirpRate, gratingType }) {
    const type: GratingType = gratingType === "apodized" || gratingType === "chirped" ? gratingType : "uniform";
    const r = braggGratingSummary({ lambdaB: braggWavelength, nEff: effectiveIndex, length: gratingLength, deltaN: indexModulation }, type, chirpRate);
    const warnings: string[] = [];
    if (r.chirpClamped) warnings.push(`Chirp limited to ±${(r.chirpLimit * 1e6).toFixed(3)} nm/mm so that |dλ_B/dz|·L ≤ 0.1·λ_B.`);
    if (type === "chirped" && !Number.isFinite(r.dispersion)) warnings.push("No chirp: the dispersion is not defined.");
    const { period, numPeriods, kappaL, peak, fwhm, zeroWidth, chirpWidth } = r;
    return { values: { period, numPeriods, kappaL, peak, fwhm, zeroWidth, chirpWidth }, warnings };
  },
  checks: [
    {
      // Defaults (uniform): Λ = λ_B/(2 n_eff) = 1550/(2 · 1.447) = 535.5908777 nm; N = L/Λ = 10e-3/535.5908777e-9 = 18670.968.
      // κ = π Δn/λ_B = π · 1e-4/1550e-9 = 202.6834 1/m, κL = 2.026834; R_max = tanh²(2.026834) = 0.9329149 → 93.29149 %.
      // First zeros: σ̂L = √(κL² + π²) = √(4.108070 + 9.869604) = 3.738... ; wavelengths from 1/λ = 1/λ_B ± σ̂/(2π n_eff), width 0.1975888 nm.
      // FWHM: bisection of eq. 20 on [0, first zero] for R = R_max/2, width 0.1499206 nm.
      source: ERDOGAN,
      basis: "computed",
      inputs: {},
      expect: {
        period: 535.5908776779543, numPeriods: 18670.96774193549, kappaL: 2.026833970057931, peak: 93.2914870435739,
        zeroWidth: 0.19758876000004777, fwhm: 0.14992055462344828,
      },
      tolerance: 1e-8,
    },
    {
      // Chirped: the chirp bandwidth is |dλ_B/dz|·L = 0.1 nm/mm · 10 mm = 1 nm (well within the 0.1 λ_B = 155 nm limit).
      source: ERDOGAN,
      basis: "computed",
      inputs: { gratingType: "chirped" },
      expect: { chirpWidth: 1 },
      tolerance: 1e-8,
    },
  ],
});
