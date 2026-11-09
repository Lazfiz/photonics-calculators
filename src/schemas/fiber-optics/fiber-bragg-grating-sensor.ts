import { SMF28_FIT_T_MAX_C, SMF28_FIT_T_MIN_C, SMF28_REFERENCE_T_C, SMF28_THERMAL_COEFFICIENT, SMF28_THERMAL_COEFFICIENT_SLOPE } from "../../physics/fiber-optics/fiber-bragg-grating";
import { braggSensorSummary } from "../../physics/fiber-optics/fiber-bragg-grating-summary";
import { defineSchema } from "../types";

const KERSEY = "Kersey A. D. et al. (1997). Fiber grating sensors. J. Lightwave Technol. 15, 1442–1463, doi:10.1109/50.618377 " +
  "(Δλ_B/λ_B = (1 − p_e)ε + (α + ξ)ΔT, p_e = (n²/2)[p₁₂ − ν(p₁₁ + p₁₂)]); strain-optic coefficients p₁₁ = 0.113, p₁₂ = 0.252: " +
  "Bertholds A., Dändliker R. (1988). Determination of the individual strain-optic coefficients in single-mode optical fibres. " +
  "J. Lightwave Technol. 6, 17–20, doi:10.1109/50.3956; Poisson ratio of fused silica ν = 0.16 (Corning HPFS 7980 product sheet); " +
  "SMF-28 K_T = 6.165e-6 /K at 20 °C and K_T linear in T (Table 3): Cosme M. et al. (2026). Sensors 26, 435, doi:10.3390/s26020435; " +
  "uniform-grating peak reflectance tanh²(κL), κ = πΔn/λ_B: Erdogan T. (1997). J. Lightwave Technol. 15, 1277, doi:10.1109/50.618322.";

export default defineSchema({
  href: "/fiber-optics/fiber-bragg-grating-sensor",
  inputs: [
    { key: "gratingPeriod", label: "Grating period Λ", unit: "nm", toSI: 1e-9, siUnit: "m", default: 535.6, min: 100, max: 1500 },
    { key: "effectiveIndex", label: "Effective index n_eff (phase)", unit: "", toSI: 1, siUnit: "", default: 1.447, min: 1, max: 3 },
    { key: "gratingLength", label: "Grating length", unit: "mm", toSI: 1e-3, siUnit: "m", default: 10, min: 0.1, max: 1000 },
    { key: "indexModulation", label: "AC effective-index modulation δn_eff", unit: "", toSI: 1, siUnit: "", default: 1e-4, min: 1e-8, max: 1e-2 },
    { key: "strain", label: "Strain", unit: "µε", toSI: 1e-6, siUnit: "", default: 500, min: -1e4, max: 1e4 },
    { key: "tempChange", label: "Temperature change ΔT from 20 °C", unit: "K", toSI: 1, siUnit: "K", default: 20, min: -100, max: 100 },
    { key: "thermalCoeff", label: "Thermal coefficient K_T", unit: "10⁻⁶/K", toSI: 1e-6, siUnit: "1/K", default: SMF28_THERMAL_COEFFICIENT * 1e6, min: 0, max: 100 },
    { key: "thermalSlope", label: "K_T slope dK_T/dT", unit: "10⁻⁸/K²", toSI: 1e-8, siUnit: "1/K²", default: SMF28_THERMAL_COEFFICIENT_SLOPE * 1e8, min: -100, max: 100 },
  ],
  outputs: [
    { key: "lambdaB", label: "Bragg wavelength λ_B", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "reflectivity", label: "Peak reflectance", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "fwhm", label: "FWHM bandwidth", unit: "pm", toSI: 1e-12, siUnit: "m" },
    { key: "zeroWidth", label: "First-zero width", unit: "pm", toSI: 1e-12, siUnit: "m" },
    { key: "pe", label: "Effective photoelastic constant p_e", unit: "", toSI: 1, siUnit: "" },
    { key: "gauge", label: "Strain gauge factor 1 − p_e", unit: "", toSI: 1, siUnit: "" },
    { key: "strainShift", label: "Strain shift", unit: "pm", toSI: 1e-12, siUnit: "m" },
    { key: "tempShift", label: "Temperature shift", unit: "pm", toSI: 1e-12, siUnit: "m" },
    { key: "totalShift", label: "Total shift", unit: "pm", toSI: 1e-12, siUnit: "m" },
    { key: "shiftedLambdaB", label: "Shifted Bragg wavelength", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "strainPm", label: "Strain sensitivity", unit: "pm/µε", toSI: 1e-12, siUnit: "m" },
    { key: "tempPm", label: "Temperature sensitivity at 20 °C", unit: "pm/K", toSI: 1e-12, siUnit: "m" },
  ],
  compute({ gratingPeriod, effectiveIndex, gratingLength, indexModulation, strain, tempChange, thermalCoeff, thermalSlope }) {
    const r = braggSensorSummary(gratingPeriod, effectiveIndex, gratingLength, indexModulation, strain, tempChange, thermalCoeff, thermalSlope);
    const warnings: string[] = [];
    if (r.outsideFit) {
      warnings.push(`${SMF28_REFERENCE_T_C + tempChange} °C is outside ${SMF28_FIT_T_MIN_C}…${SMF28_FIT_T_MAX_C} °C, where Cosme et al. fit K_T linear in T; past it K_T(T) is quadratic, so the shift is approximate.`);
    }
    return {
      values: {
        lambdaB: r.lambdaB, reflectivity: r.reflectivity, fwhm: r.fwhm, zeroWidth: r.zeroWidth, pe: r.pe, gauge: r.gauge,
        strainShift: r.strainShift, tempShift: r.tempShift, totalShift: r.totalShift, shiftedLambdaB: r.shiftedLambdaB,
        strainPm: r.strainPerMicrostrain, tempPm: r.tempPerKelvin,
      },
      warnings,
    };
  },
  checks: [
    {
      // λ_B = 2 n_eff Λ = 2 · 1.447 · 535.6 nm = 1550.0264 nm. p_e = (n²/2)[p₁₂ − ν(p₁₁ + p₁₂)] = (2.093809/2)(0.252 − 0.16 · 0.365)
      // = 1.0469045 · 0.1936 = 0.2026807; gauge 1 − p_e = 0.7973193.
      // Strain 500 µε: Δλ = λ_B · 0.7973193 · 5e-4 = 617.93297 pm per 500 µε, 1.2358659 pm/µε.
      // ΔT = 20 K: Δλ = λ_B [K_T ΔT + ½ K_T′ ΔT²] = 1550.0264 nm · (6.165e-6 · 20 + 0.5 · 1.431e-8 · 400) = 1550.0264 nm · 1.26162e-4
      // = 195.55443 pm; K_T alone at 1 K: 1550.0264 nm · 6.165e-6 = 9.555913 pm/K. Total 813.48740 pm, shifted λ_B 1550.839887 nm.
      // κL = π · 1e-4/1550.0264e-9 · 10e-3 = 2.026799, peak reflectance tanh²(κL) = 93.29104 %.
      source: KERSEY,
      basis: "computed",
      inputs: {},
      expect: {
        lambdaB: 1550.0264, pe: 0.20268071120000003, gauge: 0.7973192888, strainShift: 617.9329734346122,
        tempShift: 195.5544306768, totalShift: 813.4874041114123, shiftedLambdaB: 1550.8398874041113,
        strainPm: 1.2358659468692244, tempPm: 9.555912756000001, reflectivity: 93.29103966597663,
      },
      tolerance: 1e-8,
    },
  ],
});
