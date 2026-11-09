import {
  quarterQuarterArInnerIndex, quarterWaveArIndex, quarterWaveStackReflectance, quarterWaveThickness,
} from "../../physics/thin-film/transfer-matrix";
import { defineSchema } from "../types";

export default defineSchema({
  href: "/thin-film/double-layer-ar",
  inputs: [
    { key: "n1", label: "Outer layer index n₁", unit: "", toSI: 1, siUnit: "", default: 1.38, min: 0.1, max: 10 },
    { key: "n2", label: "Inner layer index n₂", unit: "", toSI: 1, siUnit: "", default: 1.7, min: 0.1, max: 10 },
    { key: "nSub", label: "Substrate index", unit: "", toSI: 1, siUnit: "", default: 1.52, min: 0.1, max: 10 },
    { key: "nInc", label: "Incident medium index", unit: "", toSI: 1, siUnit: "", default: 1.0, min: 0.1, max: 10 },
    { key: "designWl", label: "Design wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 550, min: 1, max: 20000 },
  ],
  outputs: [
    { key: "d1", label: "Outer layer thickness λ/(4 n₁)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "d2", label: "Inner layer thickness λ/(4 n₂)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "n2ForZero", label: "n₂ for R = 0 at λ₀, given n₁", unit: "", toSI: 1, siUnit: "" },
    { key: "reflectance", label: "Reflectance at λ₀", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "equalStepN1", label: "Equal-step outer index (n₀³ n_s)^¼", unit: "", toSI: 1, siUnit: "" },
    { key: "equalStepN2", label: "Equal-step inner index (n₀ n_s³)^¼", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ n1, n2, nSub, nInc, designWl }) {
    // Equal-step pair: n₁ = √(n₀ √(n₀ n_s)) = (n₀³ n_s)^¼, then the closed-form inner index for that n₁.
    const equalStepN1 = quarterWaveArIndex(nInc, quarterWaveArIndex(nInc, nSub));
    return {
      values: {
        d1: quarterWaveThickness(n1, designWl),
        d2: quarterWaveThickness(n2, designWl),
        n2ForZero: quarterQuarterArInnerIndex(nInc, n1, nSub),
        reflectance: quarterWaveStackReflectance(nInc, [n1, n2], nSub),
        equalStepN1,
        equalStepN2: quarterQuarterArInnerIndex(nInc, equalStepN1, nSub),
      },
    };
  },
  checks: [
    {
      // Y = n₁² n_s / n₂² = 1.9044 × 1.52 / 2.89 = 1.001622; R = ((1 − Y)/(1 + Y))² = 6.568e-7 = 6.568e-5 %.
      source: "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., ch. 2 (quarter-wave admittance recursion) and ch. 4 (two-layer AR). CRC Press.",
      basis: "computed",
      inputs: { n1: 1.38, n2: 1.7, nSub: 1.52, nInc: 1, designWl: 550 },
      expect: { reflectance: 6.567730535e-5, d1: 99.63768116, d2: 80.88235294 },
      tolerance: 1e-8,
    },
    {
      // R = 0 needs n₂ = n₁ √(n_s/n₀) = 1.38 × √1.52 and the equal-step pair (n₀³ n_s)^¼, (n₀ n_s³)^¼.
      source: "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., ch. 4 (two-layer quarter-quarter coatings). CRC Press.",
      basis: "computed",
      inputs: { n1: 1.38, nSub: 1.52, nInc: 1 },
      expect: { n2ForZero: 1.701378265, equalStepN1: 1.110352557, equalStepN2: 1.368934570 },
      tolerance: 1e-8,
    },
  ],
});
