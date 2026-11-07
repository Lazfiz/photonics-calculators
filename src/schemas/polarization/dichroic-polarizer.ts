import { faceReflectance, sheetMetrics, slabLogTransmittance } from "../../physics/polarization/sheet-polarizer";
import { absorptionCoefficient } from "../../physics/spectroscopy/depth";
import { defineSchema } from "../types";

const SHURCLIFF = "Shurcliff W. A. (1962). Polarized Light: Production and Use, ch. 3 (principal transmittances k₁, k₂; " +
  "H₀ = (k₁² + k₂²)/2, H₉₀ = k₁k₂), Harvard University Press; incoherent slab T = |t t′|² τ/(1 − R² τ²): " +
  "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., ch. 2, CRC Press. https://doi.org/10.1201/9781420073034";

export default defineSchema({
  href: "/polarization/dichroic-polarizer",
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 550, min: 200, max: 20000 },
    { key: "nE", label: "n, pass axis", unit: "", toSI: 1, siUnit: "", default: 1.62, min: 1, max: 5 },
    { key: "kE", label: "κ, pass axis", unit: "", toSI: 1, siUnit: "", default: 1e-5, min: 0, max: 10 },
    { key: "nO", label: "n, block axis", unit: "", toSI: 1, siUnit: "", default: 1.64, min: 1, max: 5 },
    { key: "kO", label: "κ, block axis", unit: "", toSI: 1, siUnit: "", default: 3e-3, min: 0, max: 10 },
    { key: "thickness", label: "Sheet thickness", unit: "mm", toSI: 1e-3, siUnit: "m", default: 0.1, min: 0.001, max: 10 },
  ],
  outputs: [
    { key: "k1", label: "k₁ (pass-axis transmittance)", unit: "", toSI: 1, siUnit: "" },
    { key: "log10K2", label: "log₁₀ k₂ (block axis)", unit: "", toSI: 1, siUnit: "" },
    { key: "extinctionDb", label: "Extinction ratio 10 log₁₀(k₁/k₂)", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "efficiency", label: "Polarizing efficiency (k₁ − k₂)/(k₁ + k₂)", unit: "", toSI: 1, siUnit: "" },
    { key: "single", label: "Unpolarized light through one sheet (k₁ + k₂)/2", unit: "", toSI: 1, siUnit: "" },
    { key: "parallel", label: "Two sheets, axes parallel, (k₁² + k₂²)/2", unit: "", toSI: 1, siUnit: "" },
    { key: "log10Crossed", label: "log₁₀ of two sheets crossed, k₁k₂", unit: "", toSI: 1, siUnit: "" },
    { key: "alphaPass", label: "Absorption coefficient α = 4πκ/λ, pass axis", unit: "mm⁻¹", toSI: 1e3, siUnit: "m⁻¹" },
    { key: "alphaBlock", label: "Absorption coefficient α = 4πκ/λ, block axis", unit: "mm⁻¹", toSI: 1e3, siUnit: "m⁻¹" },
    { key: "faceRPass", label: "Face reflectance, pass axis", unit: "", toSI: 1, siUnit: "" },
    { key: "faceRBlock", label: "Face reflectance, block axis", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ wavelength, nE, kE, nO, kO, thickness }) {
    const lnK1 = slabLogTransmittance(nE, kE, thickness, wavelength);
    const lnK2 = slabLogTransmittance(nO, kO, thickness, wavelength);
    const m = sheetMetrics(lnK1, lnK2);
    const warnings: string[] = [];
    if (thickness < 10 * wavelength) {
      warnings.push("The sheet is less than 10 wavelengths thick: interference between its faces, which this incoherent model leaves out, can change k₁ and k₂.");
    }
    if (lnK2 > lnK1) warnings.push('The "block" axis transmits more than the "pass" axis: the ratios are below 1 (negative dB).');
    return {
      values: {
        k1: m.k1,
        log10K2: m.log10K2,
        extinctionDb: m.extinctionDb,
        efficiency: m.efficiency,
        single: m.single,
        parallel: m.parallel,
        log10Crossed: m.log10Crossed,
        alphaPass: absorptionCoefficient(kE, wavelength),
        alphaBlock: absorptionCoefficient(kO, wavelength),
        faceRPass: faceReflectance(nE, kE),
        faceRBlock: faceReflectance(nO, kO),
      },
      warnings,
    };
  },
  checks: [
    {
      // Lossless, n = 1.5 both axes: R = 0.04, T = (1 − R)²/(1 − R²) = (1 − R)/(1 + R) = 0.96/1.04 = 0.9230769231 = k₁ = k₂; H₀ = T² = 0.852071005917;
      // log₁₀ k₁k₂ = 2 log₁₀ 0.9230769231 = −0.0695242125.
      source: SHURCLIFF,
      basis: "computed",
      inputs: { nE: 1.5, kE: 0, nO: 1.5, kO: 0 },
      expect: { k1: 0.9230769231, single: 0.9230769231, parallel: 0.852071005917, log10Crossed: -0.0695242125, faceRPass: 0.04 },
      tolerance: 1e-8,
    },
    {
      // Defaults (n 1.62, κ 1e-5 pass; n 1.64, κ 3e-3 block; 0.1 mm; 550 nm): T = (1 − R)²(1 + κ²/n²) τ/(1 − R²τ²),
      // τ = exp(−4πκd/λ): k₁ = 0.8736251568, k₂ = 9.344824916e-4; α_block = 4π · 3e-3/550e-9 m⁻¹ = 68.54383972 mm⁻¹.
      source: SHURCLIFF,
      basis: "computed",
      inputs: {},
      expect: { k1: 0.8736251568, log10K2: -3.029428831, extinctionDb: 29.70753963, efficiency: 0.9978629645, alphaBlock: 68.54383972 },
      tolerance: 1e-8,
    },
  ],
});
