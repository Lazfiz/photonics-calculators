import { faceReflectance, sheetMetrics, slabLogTransmittanceFrom } from "../../physics/polarization/sheet-polarizer";
import { defineSchema } from "../types";

const SHURCLIFF = "Shurcliff W. A. (1962). Polarized Light: Production and Use, ch. 3 (principal transmittances k₁, k₂; " +
  "H₀ = (k₁² + k₂²)/2, H₉₀ = k₁k₂), Harvard University Press; incoherent slab k = (1 − R)² e^(−αd)/(1 − R² e^(−2αd)): " +
  "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., ch. 2, CRC Press. https://doi.org/10.1201/9781420073034";

export default defineSchema({
  href: "/polarization/polymer-polarizer",
  inputs: [
    { key: "thickness", label: "Film thickness", unit: "µm", toSI: 1e-6, siUnit: "m", default: 25, min: 1, max: 200 },
    { key: "absorptionCoeff", label: "Absorption coefficient α∥, block axis (natural log)", unit: "µm⁻¹", toSI: 1e6, siUnit: "m⁻¹", default: 0.3, min: 0.001, max: 5 },
    { key: "dichroicRatio", label: "Dichroic ratio Rd = α∥/α⟂", unit: "", toSI: 1, siUnit: "", default: 40, min: 1, max: 500 },
    { key: "n", label: "Film index n (face reflections)", unit: "", toSI: 1, siUnit: "", default: 1.5, min: 1, max: 2.5 },
  ],
  outputs: [
    { key: "k1", label: "k₁ (pass, E ⟂ stretch)", unit: "", toSI: 1, siUnit: "" },
    { key: "log10K2", label: "log₁₀ k₂ (block, E ∥ stretch)", unit: "", toSI: 1, siUnit: "" },
    { key: "extinctionDb", label: "Extinction ratio 10 log₁₀(k₁/k₂)", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "efficiency", label: "Polarizing efficiency (k₁ − k₂)/(k₁ + k₂)", unit: "", toSI: 1, siUnit: "" },
    { key: "single", label: "Unpolarized light through one sheet (k₁ + k₂)/2", unit: "", toSI: 1, siUnit: "" },
    { key: "parallel", label: "Two sheets, axes parallel, (k₁² + k₂²)/2", unit: "", toSI: 1, siUnit: "" },
    { key: "log10Crossed", label: "log₁₀ of two sheets crossed, k₁k₂", unit: "", toSI: 1, siUnit: "" },
    { key: "faceR", label: "Face reflectance R", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ thickness, absorptionCoeff, dichroicRatio, n }) {
    const alphaPass = absorptionCoeff / dichroicRatio;
    const R = faceReflectance(n, 0);
    const m = sheetMetrics(
      slabLogTransmittanceFrom(R, -alphaPass * thickness),
      slabLogTransmittanceFrom(R, -absorptionCoeff * thickness),
    );
    return {
      values: {
        k1: m.k1,
        log10K2: m.log10K2,
        extinctionDb: m.extinctionDb,
        efficiency: m.efficiency,
        single: m.single,
        parallel: m.parallel,
        log10Crossed: m.log10Crossed,
        faceR: R,
      },
    };
  },
  checks: [
    {
      // Defaults: R = ((n − 1)/(n + 1))² = 0.04; k(α) = (1 − R)² e^(−αd)/(1 − R² e^(−2αd)) with α∥d = 7.5 and
      // α⟂d = 7.5/40 = 0.1875: k₁ = 0.7648743392, k₂ = 5.097225558e-4; log₁₀ k₂ = −3.292666148;
      // 10 log₁₀(k₁/k₂) = 31.76256239 dB; (k₁ − k₂)/(k₁ + k₂) = 0.9986680607; (k₁ + k₂)/2 = 0.3826920309.
      source: SHURCLIFF,
      basis: "computed",
      inputs: {},
      expect: { k1: 0.7648743392, log10K2: -3.292666148, extinctionDb: 31.76256239, efficiency: 0.9986680607, single: 0.3826920309, faceR: 0.04 },
      tolerance: 1e-8,
    },
    {
      // Defaults: parallel pair (k₁² + k₂²)/2 = 0.2925165073; crossed pair log₁₀(k₁k₂) = −3.409076057.
      source: SHURCLIFF,
      basis: "computed",
      inputs: {},
      expect: { parallel: 0.2925165073, log10Crossed: -3.409076057 },
      tolerance: 1e-8,
    },
  ],
});
