import { stopBandEdges } from "../../physics/thin-film/quarter-wave-stack";
import { quarterWaveStackReflectance } from "../../physics/thin-film/transfer-matrix";
import { defineSchema } from "../types";

const NM = 1e-9;
/** The page rounds the (unchecked) URL value to an integer of pairs in 1–30. */
const clampInt = (x: number, lo: number, hi: number) => Math.round(Math.min(Math.max(x, lo), hi));

export default defineSchema({
  href: "/thin-film/dielectric-stack",
  inputs: [
    { key: "nH", label: "n (high index)", unit: "", toSI: 1, siUnit: "", default: 2.35, min: 0.1, max: 10 },
    { key: "nL", label: "n (low index)", unit: "", toSI: 1, siUnit: "", default: 1.38, min: 0.1, max: 10 },
    { key: "nSub", label: "n (substrate)", unit: "", toSI: 1, siUnit: "", default: 1.52, min: 0.1, max: 10 },
    { key: "nInc", label: "n (incident)", unit: "", toSI: 1, siUnit: "", default: 1, min: 0.1, max: 10 },
    { key: "numPairs", label: "Number of HL pairs", unit: "", toSI: 1, siUnit: "", default: 5, min: 1, max: 30 },
    { key: "designWl", label: "Design wavelength", unit: "nm", toSI: NM, siUnit: "m", default: 550, min: 1, max: 20000 },
  ],
  outputs: [
    { key: "peakReflectance", label: "Peak reflectance at λ₀", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "indexRatio", label: "nH/nL ratio", unit: "", toSI: 1, siUnit: "" },
    { key: "layerCount", label: "Total layers", unit: "", toSI: 1, siUnit: "" },
    { key: "bandShort", label: "Stop band, short edge (infinite stack)", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "bandLong", label: "Stop band, long edge (infinite stack)", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "bandWidth", label: "Stop band width (infinite stack)", unit: "nm", toSI: NM, siUnit: "m" },
  ],
  compute({ nH, nL, nSub, nInc, numPairs, designWl }) {
    const pairs = clampInt(numPairs, 1, 30);
    const indices = Array.from({ length: 2 * pairs }, (_, j) => (j % 2 === 0 ? nH : nL));
    const edges = stopBandEdges(designWl, nH, nL);
    const warnings: string[] = [];
    if (!(nH > nL)) warnings.push("nH is not above nL: the stack is not a reflector (the zone is still computed for |nH − nL|).");
    return {
      values: {
        peakReflectance: quarterWaveStackReflectance(nInc, indices, nSub),
        indexRatio: nH / nL,
        layerCount: 2 * pairs,
        bandShort: edges.short,
        bandLong: edges.long,
        bandWidth: edges.long - edges.short,
      },
      warnings,
    };
  },
  checks: [
    {
      // (HL)^5, n_L = 1.38: Y = (2.35/1.38)^10 × 1.52, R = ((1 − Y)/(1 + Y))² = 98.72489352 %; ratio 2.35/1.38 = 1.70289855.
      // Δg = (2/π) asin(0.97/3.73) = 0.167480486; edges 550/(1 ± Δg) = 471.09995 and 660.645175 nm, width 189.545224 nm.
      source: "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., ch. 2 (admittance of quarter-wave layers) and ch. 6 (high-reflectance coatings). CRC Press.",
      basis: "computed",
      inputs: {},
      expect: {
        peakReflectance: 98.72489352, indexRatio: 1.70289855, layerCount: 10,
        bandShort: 471.09995118, bandLong: 660.64517504, bandWidth: 189.54522386,
      },
      tolerance: 1e-8,
    },
  ],
});
