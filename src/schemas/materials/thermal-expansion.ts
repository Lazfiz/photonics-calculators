import {
  SI_ALPHA_T_MAX, SI_ALPHA_T_MIN, expansionWaves, siliconAlpha, siliconExpansion, siliconMeanAlpha, thermalExpansion,
} from "../../physics/materials/thermal-expansion";
import { defineSchema } from "../types";

// 0 °C in kelvin, as the page's K0.
const K0 = 273.15;
// The page's reference wavelength for ΔL/λ.
const HENE_NM = 633e-9;

const OKADA = "Okada Y., Tokumaru Y. (1984). Precise determination of lattice parameter and thermal expansion coefficient of silicon " +
  "between 300 and 1500 K. J. Appl. Phys. 56, 314, doi:10.1063/1.333965; α(T) = (3.725 {1 − exp[−5.88 × 10⁻³ (T − 124)]} + " +
  "5.548 × 10⁻⁴ T) × 10⁻⁶ K⁻¹ (abstract), valid 120–1500 K; L₂ = L₁ exp(∫α dT).";
const TEXTBOOK = "Linear thermal expansion with a constant coefficient: ΔL = α L ΔT, strain ε = α ΔT (any materials-science text); " +
  "ΔL/λ is the length change in waves at 633 nm.";

export default defineSchema({
  href: "/materials/thermal-expansion",
  inputs: [
    { key: "alpha", label: "CTE α", unit: "×10⁻⁶/K", toSI: 1e-6, siUnit: "1/K", default: 7.1, min: -50, max: 100 },
    { key: "dT", label: "Temperature change ΔT", unit: "°C", toSI: 1, siUnit: "K", default: 100, min: -273, max: 3000 },
    { key: "length", label: "Length L", unit: "mm", toSI: 1e-3, siUnit: "m", default: 100, min: 0, max: 1e6 },
    { key: "t0", label: "Start temperature T₀ (silicon section)", unit: "°C", toSI: 1, siUnit: "°C", default: 20, min: -273.15, max: 3000 },
  ],
  outputs: [
    { key: "dL", label: "ΔL (constant α)", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "strain", label: "Strain ε = α ΔT", unit: "", toSI: 1, siUnit: "" },
    { key: "waves", label: "ΔL / λ at 633 nm", unit: "waves", toSI: 1, siUnit: "" },
    { key: "siAlphaStart", label: "Silicon α(T₀)", unit: "×10⁻⁶/K", toSI: 1e-6, siUnit: "1/K" },
    { key: "siAlphaEnd", label: "Silicon α(T₀ + ΔT)", unit: "×10⁻⁶/K", toSI: 1e-6, siUnit: "1/K" },
    { key: "siMeanAlpha", label: "Silicon mean α over T₀ to T₀ + ΔT", unit: "×10⁻⁶/K", toSI: 1e-6, siUnit: "1/K" },
    { key: "siDL", label: "ΔL of silicon with α(T)", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "siConstDL", label: "ΔL of silicon with α frozen at T₀", unit: "mm", toSI: 1e-3, siUnit: "m" },
  ],
  compute({ alpha, dT, length, t0 }) {
    const dL = thermalExpansion(alpha, length, dT);
    const T1 = t0 + K0;
    const T2 = T1 + dT;
    const warnings: string[] = [];
    if (Math.abs(dT) > 50) {
      warnings.push("α itself changes with temperature; over large ranges use the mean α of the range (the silicon outputs integrate α(T)).");
    }
    const siInRange = T1 >= SI_ALPHA_T_MIN && T1 <= SI_ALPHA_T_MAX && T2 >= SI_ALPHA_T_MIN && T2 <= SI_ALPHA_T_MAX;
    if (!siInRange) {
      warnings.push(
        `The silicon fit holds from ${SI_ALPHA_T_MIN} to ${SI_ALPHA_T_MAX} K; T₀ = ${T1.toFixed(1)} K and T₀ + ΔT = ${T2.toFixed(1)} K must both lie in it.`,
      );
    }
    return {
      values: {
        dL,
        strain: alpha * dT,
        waves: expansionWaves(dL, HENE_NM),
        siAlphaStart: siliconAlpha(T1),
        siAlphaEnd: siliconAlpha(T2),
        siMeanAlpha: siliconMeanAlpha(T1, T2),
        siDL: siliconExpansion(length, T1, T2),
        siConstDL: thermalExpansion(siliconAlpha(T1), length, dT),
      },
      warnings,
    };
  },
  checks: [
    {
      // alpha = 7.1e-6 /K, L = 0.1 m, dT = 100 K: dL = 7.1e-6 * 0.1 * 100 = 7.1e-5 m = 0.071 mm; strain = 7.1e-4;
      // dL/lambda = 7.1e-5/633e-9 = 112.164297.
      source: TEXTBOOK,
      basis: "computed",
      inputs: { alpha: 7.1, dT: 100, length: 100 },
      expect: { dL: 0.071, strain: 7.1e-4, waves: 112.16429699842023 },
      tolerance: 1e-8,
    },
    {
      // T0 = 26.85 C = 300 K, dT = 100 K, L = 100 mm. alpha(300 K) = 3.725 (1 - e^-1.03488) + 0.16644 = 2.568062935e-6 /K;
      // mean alpha over 300-400 K (Simpson, 2000 intervals) = 2.918628276e-6 /K, integral = 2.918628276e-4,
      // dL = L expm1(integral) = 100 mm * 2.919054237e-4 = 0.02919054237 mm; frozen alpha: 2.568062935e-6 * 100 mm * 100 = 0.02568062935 mm.
      source: OKADA,
      basis: "computed",
      inputs: { t0: 26.85, dT: 100, length: 100 },
      expect: { siAlphaStart: 2.56806293533473, siMeanAlpha: 2.918628276270494, siDL: 0.02919054237260965, siConstDL: 0.0256806293533473 },
      tolerance: 1e-8,
    },
  ],
});
