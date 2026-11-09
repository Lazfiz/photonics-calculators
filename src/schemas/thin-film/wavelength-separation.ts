import { wavelengthSeparationSummary } from "../../physics/thin-film/wavelength-separation";
import { defineSchema } from "../types";

const NM = 1e-9;
const clamp = (x: number, lo: number, hi: number) => Math.min(Math.max(x, lo), hi);

/** Stack A, (HL)^N at λ₁, reflects λ₁ and passes λ₂ = λ₁·(λ₂/λ₁); stack B reflects λ₂. */
export default defineSchema({
  href: "/thin-film/wavelength-separation",
  inputs: [
    { key: "nH", label: "High index nH", unit: "", toSI: 1, siUnit: "", default: 2.35, min: 1, max: 5 },
    { key: "nL", label: "Low index nL", unit: "", toSI: 1, siUnit: "", default: 1.45, min: 1, max: 5 },
    { key: "nSub", label: "Substrate index", unit: "", toSI: 1, siUnit: "", default: 1.52, min: 1, max: 5 },
    { key: "nInc", label: "Incident medium index", unit: "", toSI: 1, siUnit: "", default: 1, min: 1, max: 5 },
    { key: "numPairs", label: "Pairs per stack (N)", unit: "", toSI: 1, siUnit: "", default: 5, min: 1, max: 30 },
    { key: "designWl", label: "λ₁ centre", unit: "nm", toSI: NM, siUnit: "m", default: 550, min: 1, max: 20000 },
    { key: "sepRatio", label: "λ₂/λ₁", unit: "", toSI: 1, siUnit: "", default: 1.4, min: 1.05, max: 3 },
  ],
  outputs: [
    { key: "lambda2", label: "λ₂ centre", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "reflectanceA1", label: "R of stack A at λ₁", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "transmittanceA2", label: "T of stack A alone at λ₂", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "minRatio", label: "Smallest λ₂/λ₁ for separate stop bands", unit: "", toSI: 1, siUnit: "" },
    { key: "layerCount", label: "Layers (combined)", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ nH, nL, nSub, nInc, numPairs, designWl, sepRatio }) {
    const pairs = Math.round(clamp(numPairs, 1, 30));
    const ratio = clamp(sepRatio, 1.05, 3);
    const lambda1 = designWl;
    const lambda2 = designWl * ratio;
    const s = wavelengthSeparationSummary({ nH, nL, nSub, nInc, pairs, lambda1, lambda2 });
    const warnings: string[] = [];
    if (s.overlap) warnings.push(`λ₂/λ₁ = ${ratio.toFixed(3)} is below ${s.minRatio.toFixed(3)}: the stop bands overlap.`);
    return {
      values: {
        lambda2,
        reflectanceA1: s.RA1,
        transmittanceA2: s.TA2,
        minRatio: s.minRatio,
        layerCount: s.layerCount,
      },
      warnings,
    };
  },
  checks: [
    {
      // Closed form for (HL)^N, H outermost, in air on a substrate (Macleod ch. 2): the admittance Y = (nH/nL)^(2N)
      // nSub, R = ((nInc − Y)/(nInc + Y))². Defaults: (2.35/1.45)^10 · 1.52 → R = 0.9791714422888022, and the
      // independent 2×2 matrix program agrees to 2e-16. Also Δg = (2/π) asin(0.9/3.8) = 0.152224816537,
      // minRatio = (1 + Δg)/(1 − Δg) = 1.35911600034 (Macleod ch. 6), 20 layers = 4N.
      source: "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., ch. 2 (characteristic matrix, quarter-wave stacks) and ch. 6 (zone width). CRC Press.",
      basis: "computed",
      inputs: {},
      expect: { reflectanceA1: 97.91714422888022, minRatio: 1.3591160003427691, layerCount: 20 },
      tolerance: 1e-8,
    },
    {
      // N = 2, λ₁ = 1000 nm, λ₂/λ₁ = 2, same indices: R(λ₁) from the closed form (nH/nL)^4 · 1.52 = Y,
      // 0.6820895363469256; T of stack A at λ₂ = 2000 nm from the independent 2×2 matrix program (no closed form).
      source: "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., ch. 2 (characteristic matrix, quarter-wave stacks). CRC Press.",
      basis: "computed",
      inputs: { numPairs: 2, designWl: 1000, sepRatio: 2 },
      expect: { lambda2: 2000, reflectanceA1: 68.20895363469256, transmittanceA2: 96.65703977177643 },
      tolerance: 1e-8,
    },
  ],
});
