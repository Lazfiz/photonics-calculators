import { gasLaserCw } from "../../physics/wave-optics/laser-resonator";
import { mirrorRadius } from "../../physics/wave-optics/two-mirror-resonator";
import { defineSchema } from "../types";

const SOURCE =
  "Rigrod W. W. (1965). Saturation effects in high-gain lasers. J. Appl. Phys. 36, 2487–2490, doi:10.1063/1.1714517 (output " +
  "P = P_sat (1 − R₂)√R₁′ (g₀L + ln√(R₁′R₂))/((√R₁′ + √R₂)(1 − √(R₁′R₂))), P_sat = I_sat π⟨w²⟩/2 over the mode's mean-square radius); " +
  "Kogelnik H., Li T. (1966). Laser beams and resonators. Appl. Opt. 5, 1550–1567, doi:10.1364/ao.5.001550 (two-mirror mode, " +
  "g = 1 − L/R, Fresnel number a²/(λL))";

export default defineSchema({
  href: "/wave-optics/gas-laser-resonator",
  inputs: [
    { key: "tubeDiameter", label: "Bore diameter", unit: "mm", toSI: 1e-3, siUnit: "m", default: 3.2, min: 0.1, max: 100 },
    { key: "tubeLength", label: "Mirror spacing = gain length L", unit: "mm", toSI: 1e-3, siUnit: "m", default: 500, min: 10, max: 1e5 },
    { key: "wavelength", label: "Wavelength λ", unit: "nm", toSI: 1e-9, siUnit: "m", default: 632.8, min: 100, max: 20000 },
    { key: "R1", label: "HR radius R₁ (+ concave, − convex, 0 = flat)", unit: "mm", toSI: 1e-3, siUnit: "m", default: 1000, min: -1e7, max: 1e7 },
    { key: "R2", label: "Output coupler radius R₂ (+ concave, − convex, 0 = flat)", unit: "mm", toSI: 1e-3, siUnit: "m", default: 5000, min: -1e7, max: 1e7 },
    { key: "R_oc", label: "Output coupler reflectance", unit: "", toSI: 1, siUnit: "", default: 0.99, min: 0.01, max: 0.9999 },
    { key: "R_hr", label: "HR reflectance", unit: "", toSI: 1, siUnit: "", default: 0.999, min: 0.01, max: 1 },
    { key: "loss", label: "Other loss per pass (windows, scatter)", unit: "%", toSI: 0.01, siUnit: "", default: 1, min: 0, max: 50 },
    { key: "g0", label: "Small-signal gain g₀", unit: "1/m", toSI: 1, siUnit: "1/m", default: 0.15, min: 0, max: 100 },
    { key: "Isat", label: "Saturation intensity I_sat", unit: "W/cm²", toSI: 1e4, siUnit: "W/m²", default: 25, min: 1e-3, max: 1e6 },
  ],
  outputs: [
    { key: "g1g2", label: "g₁g₂", unit: "", toSI: 1, siUnit: "" },
    { key: "waist", label: "TEM₀₀ waist w₀", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "waistPosition", label: "Waist distance from the HR", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "fresnelNumber", label: "Fresnel number a²/(λL)", unit: "", toSI: 1, siUnit: "" },
    { key: "powerOutsideBore", label: "Power outside the bore at the larger mirror spot e^(−2a²/w²)", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "thresholdGain", label: "Threshold gain g_th = δ/(2L)", unit: "1/m", toSI: 1, siUnit: "1/m" },
    { key: "saturationPower", label: "Saturation power P_sat = I_sat π⟨w²⟩/2", unit: "mW", toSI: 1e-3, siUnit: "W" },
    { key: "outputPower", label: "Output power", unit: "mW", toSI: 1e-3, siUnit: "W" },
    { key: "optimumReflectance", label: "Optimum coupler reflectance", unit: "", toSI: 1, siUnit: "" },
    { key: "optimumOutputPower", label: "Output at the optimum", unit: "mW", toSI: 1e-3, siUnit: "W" },
  ],
  compute(p) {
    const op = gasLaserCw({
      lambda: p.wavelength, L: p.tubeLength, boreRadius: p.tubeDiameter / 2, R1: mirrorRadius(p.R1), R2: mirrorRadius(p.R2),
      R_hr: p.R_hr, R_oc: p.R_oc, lossPerPass: p.loss, g0: p.g0, iSat: p.Isat,
    });
    const warnings: string[] = [];
    if (!Number.isFinite(op.mode.w0)) {
      warnings.push(
        `The cavity is ${op.stability === "unstable" ? "unstable" : "on the stability boundary"}: there is no TEM₀₀ mode, so no waist or output power.`,
      );
    } else if (op.clipLoss > 0.01) {
      warnings.push("More than 1 % of the mode power lies outside the bore at the larger mirror spot: expect aperture loss (not in the loss budget).");
    }
    if (!Number.isFinite(op.best.R2)) warnings.push("No optimum coupler: the gain does not exceed the rear-mirror and internal loss.");
    return {
      values: {
        g1g2: op.g1 * op.g2,
        waist: op.mode.w0,
        waistPosition: op.mode.z1,
        fresnelNumber: op.fresnel,
        powerOutsideBore: op.clipLoss,
        thresholdGain: op.gTh,
        saturationPower: op.pSat,
        outputPower: op.pOut,
        optimumReflectance: op.best.R2,
        optimumOutputPower: op.pBest,
      },
      warnings,
    };
  },
  checks: [
    {
      // Defaults. g₁ = 1 − 0.5/1 = 0.5, g₂ = 1 − 0.5/5 = 0.9, g₁g₂ = 0.45; z_R = L√(g₁g₂(1 − g₁g₂))/|g₁ + g₂ − 2g₁g₂| = 0.5 · 0.497494/0.5 = 0.497494 m,
      // w₀ = √(λ z_R/π) = 316.557130 µm, z₁ = L g₂(1 − g₁)/(g₁ + g₂ − 2g₁g₂) = 450 mm; N = a²/(λL) = (1.6e-3)²/(632.8e-9 · 0.5) = 8.0910240;
      // δ = −ln(R_hr R_oc) + 2(−ln 0.99) = 0.0311515, g_th = δ/(2L) = 0.0311515 1/m;
      // P_sat = I_sat π⟨w²⟩/2 = 49.024070 mW, ⟨w²⟩ = w₀²(1 + (a² + ab + b²)/(3z_R²)), a = −z₁, b = L − z₁;
      // Rigrod with R₁′ = R_hr · 0.99² = 0.9791199, g₀L = 0.075: P = 0.9398755 mW.
      source: SOURCE,
      basis: "computed",
      inputs: {},
      expect: {
        g1g2: 0.45, waist: 316.55712991308883, waistPosition: 450, fresnelNumber: 8.091024020227561,
        thresholdGain: 0.03115150789408793, saturationPower: 49.024069565318946, outputPower: 0.939875484790277,
      },
      tolerance: 1e-8,
    },
    {
      // Same tube; the optimum R₂ maximises the Rigrod output over R₂ (dense scan of 2e6 points between threshold
      // e^(−2g₀L)/R₁′ and 1, step 3e-8): R₂,opt = 0.9654507, P = 1.4359666 mW. Tolerance 1e-6 covers the scan step.
      source: SOURCE,
      basis: "computed",
      inputs: {},
      expect: { optimumReflectance: 0.9654507490646165, optimumOutputPower: 1.435966613556774 },
      tolerance: 1e-6,
    },
  ],
});
