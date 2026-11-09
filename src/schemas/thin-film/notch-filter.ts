import { notchFilterSummary, notchPairsForOD } from "../../physics/thin-film/notch-filter";
import { defineSchema } from "../types";

const NM = 1e-9;
/** The page rounds the (unchecked) URL value to an integer of pairs in 1–200. */
const clampInt = (x: number, lo: number, hi: number) => Math.round(Math.min(Math.max(x, lo), hi));

/** Quarter-wave notch filter (HL)^N with a low index contrast; H faces the incident medium. */
export default defineSchema({
  href: "/thin-film/notch-filter",
  inputs: [
    { key: "nH", label: "High index nH", unit: "", toSI: 1, siUnit: "", default: 1.63, min: 1, max: 5 },
    { key: "nL", label: "Low index nL", unit: "", toSI: 1, siUnit: "", default: 1.46, min: 1, max: 5 },
    { key: "nSub", label: "Substrate index", unit: "", toSI: 1, siUnit: "", default: 1.52, min: 1, max: 5 },
    { key: "nInc", label: "Incident medium index", unit: "", toSI: 1, siUnit: "", default: 1, min: 1, max: 5 },
    { key: "notchWl", label: "Notch wavelength λ₀", unit: "nm", toSI: NM, siUnit: "m", default: 532, min: 100, max: 20000 },
    { key: "pairs", label: "Pairs (N)", unit: "", toSI: 1, siUnit: "", default: 40, min: 1, max: 200 },
  ],
  outputs: [
    { key: "reflectance", label: "Reflectance at λ₀", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "opticalDensity", label: "Blocking at λ₀ (OD = −log₁₀ T)", unit: "", toSI: 1, siUnit: "" },
    { key: "notchWidth", label: "Notch FWHM (R ≥ R(λ₀)/2)", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "notchShort", label: "Notch, short half-depth point", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "notchLong", label: "Notch, long half-depth point", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "zoneShort", label: "Infinite-stack zone, short edge", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "zoneLong", label: "Infinite-stack zone, long edge", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "pairsOD3", label: "Pairs needed for OD 3", unit: "", toSI: 1, siUnit: "" },
    { key: "pairsOD4", label: "Pairs needed for OD 4", unit: "", toSI: 1, siUnit: "" },
    { key: "pairsOD6", label: "Pairs needed for OD 6", unit: "", toSI: 1, siUnit: "" },
    { key: "layerCount", label: "Layers", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ nH, nL, nSub, nInc, notchWl, pairs: pairsRaw }) {
    const pairs = clampInt(pairsRaw, 1, 200);
    const lambda0 = notchWl; // SI (m)
    const s = notchFilterSummary({ nH, nL, nSub, nInc, lambda0, pairs });
    const base = { nH, nL, nSub, nInc, lambda0 };
    return {
      values: {
        reflectance: s.R0,
        opticalDensity: s.od,
        notchWidth: s.notch.long - s.notch.short,
        notchShort: s.notch.short,
        notchLong: s.notch.long,
        zoneShort: s.zone.short,
        zoneLong: s.zone.long,
        pairsOD3: notchPairsForOD(3, base),
        pairsOD4: notchPairsForOD(4, base),
        pairsOD6: notchPairsForOD(6, base),
        layerCount: s.indices.length,
      },
      warnings: s.valid ? [] : ["Set nH above nL, positive indices and λ₀ in 100–20 000 nm."],
    };
  },
  checks: [
    {
      // Quarter waves map Y -> n²/Y from Y = n_s: R = tanh²(N ln(nH/nL) + ½ ln(n_s/n₀)). N = 40, nH/nL = 1.63/1.46,
      // n_s = 1.52, n₀ = 1: argument = 40·0.110337... + 0.5 ln 1.52 → R = 0.99960794106, OD = −log10(1 − R) = 3.4066486332.
      source: "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., ch. 2 (admittance of quarter-wave layers) and ch. 6 (high-reflectance coatings). CRC Press.",
      basis: "computed",
      inputs: {},
      expect: { reflectance: 99.960794106, opticalDensity: 3.4066486332, layerCount: 80 },
      tolerance: 1e-8,
    },
    {
      // Zone Δg = (2/π) asin((nH − nL)/(nH + nL)) = (2/π) asin(0.17/3.09); edges 532/(1 ± Δg).
      // Pairs: N = ⌈(atanh √R − ½ ln(n_s/n₀))/ln(nH/nL)⌉ with R = 1 − 10^−OD: 36, 47, 68 for OD 3, 4, 6.
      source: "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., ch. 6 (zone width) and ch. 2 (reflectance of quarter-wave stacks). CRC Press.",
      basis: "computed",
      inputs: {},
      expect: { zoneShort: 513.98876390, zoneLong: 551.31937850, pairsOD3: 36, pairsOD4: 47, pairsOD6: 68 },
      tolerance: 1e-8,
    },
  ],
});
