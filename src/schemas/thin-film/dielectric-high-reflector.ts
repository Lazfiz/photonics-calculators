import {
  quarterWaveMirrorDelay, quarterWaveMirrorIndices, reflectionBandEdges, stopBandEdges, stopBandHalfWidth,
} from "../../physics/thin-film/quarter-wave-stack";
import { quarterWaveLayers, quarterWaveStackReflectance, reflectionGroupDelay } from "../../physics/thin-film/transfer-matrix";
import { defineSchema } from "../types";

const NM = 1e-9;
const FS = 1e-15;
/** The page rounds the (unchecked) URL value to an integer of pairs in 1–40. */
const clampInt = (x: number, lo: number, hi: number) => Math.round(Math.min(Math.max(x, lo), hi));

export default defineSchema({
  href: "/thin-film/dielectric-high-reflector",
  choices: [
    {
      key: "outer",
      label: "Design",
      options: [
        { value: "high", label: "(HL)ᴺH: high index on both faces" },
        { value: "low", label: "(LH)ᴺ: low index facing the incident medium" },
      ],
      default: "high",
    },
  ],
  inputs: [
    { key: "nH", label: "High index nH", unit: "", toSI: 1, siUnit: "", default: 2.35, min: 1, max: 5 },
    { key: "nL", label: "Low index nL", unit: "", toSI: 1, siUnit: "", default: 1.45, min: 1, max: 5 },
    { key: "nSub", label: "Substrate index", unit: "", toSI: 1, siUnit: "", default: 1.52, min: 1, max: 5 },
    { key: "nInc", label: "Incident medium index", unit: "", toSI: 1, siUnit: "", default: 1, min: 1, max: 5 },
    { key: "designWl", label: "Design wavelength λ₀", unit: "nm", toSI: NM, siUnit: "m", default: 1064, min: 100, max: 20000 },
    { key: "pairs", label: "Pairs (N)", unit: "", toSI: 1, siUnit: "", default: 10, min: 1, max: 40 },
  ],
  outputs: [
    { key: "reflectance", label: "Reflectance at λ₀", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "bandWidth", label: "Stop band width (R ≥ 50 %)", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "bandShort", label: "Stop band, short 50 % point", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "bandLong", label: "Stop band, long 50 % point", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "zoneShort", label: "Infinite-stack zone, short edge", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "zoneLong", label: "Infinite-stack zone, long edge", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "groupDelay", label: "Group delay at λ₀", unit: "fs", toSI: FS, siUnit: "s" },
    { key: "delayLimit", label: "Group delay of the semi-infinite stack", unit: "fs", toSI: FS, siUnit: "s" },
    { key: "layerCount", label: "Layers", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ outer: outerKey, nH, nL, nSub, nInc, designWl, pairs: pairsRaw }) {
    const pairs = clampInt(pairsRaw, 1, 40);
    const outer = outerKey === "low" ? "low" : "high";
    const valid = nH > nL && nL > 0 && nSub > 0 && nInc > 0 && designWl >= 100 * NM && designWl <= 20000 * NM;
    const indices = quarterWaveMirrorIndices(outer, pairs, nH, nL);
    const stack = { incident: nInc, layers: quarterWaveLayers(indices, designWl), substrate: { n: nSub } };
    const band = valid ? reflectionBandEdges(stack, designWl, 0.5, 2 * stopBandHalfWidth(nH, nL)) : { short: NaN, long: NaN };
    const zone = stopBandEdges(designWl, nH, nL);
    const delay = valid ? reflectionGroupDelay(stack, designWl) : { groupDelay: NaN };
    const warnings: string[] = [];
    if (!valid) warnings.push("Set nH above nL, positive indices and λ₀ in 100–20 000 nm.");
    else if (!Number.isFinite(band.short)) warnings.push("R(λ₀) is below 50 %: there is no stop band.");
    return {
      values: {
        reflectance: valid ? quarterWaveStackReflectance(nInc, indices, nSub) : NaN,
        bandWidth: band.long - band.short,
        bandShort: band.short,
        bandLong: band.long,
        zoneShort: zone.short,
        zoneLong: zone.long,
        groupDelay: delay.groupDelay,
        delayLimit: valid ? quarterWaveMirrorDelay(designWl, nH, nL, nInc, outer) : NaN,
        layerCount: indices.length,
      },
      warnings,
    };
  },
  checks: [
    {
      // Quarter waves map the admittance Y -> n²/Y from Y = n_s: (HL)^10 H on 1.52 gives Y = (2.35/1.45)^20 × 2.35²/1.52,
      // R = ((1 − Y)/(1 + Y))² = 99.99295704 %; (LH)^10 gives Y = (1.45/2.35)^20 × 1.52 → 99.96111143 %. Zone Δg = (2/π) asin(0.9/3.8)
      // = 0.152224816537, edges 1064/(1 ± Δg). Layers 2N + 1 = 21.
      source: "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., ch. 2 (admittance of quarter-wave layers) and ch. 6 (high-reflectance coatings). CRC Press.",
      basis: "computed",
      inputs: {},
      expect: { reflectance: 99.99295704, zoneShort: 923.43090057, zoneLong: 1255.04971218, layerCount: 21 },
      tolerance: 1e-8,
    },
    {
      // Semi-infinite stack at λ₀ = 1064 nm, n₀ = 1, Δn = 0.9: H outermost τ = λ₀n₀/(2cΔn) = 1.97173443 fs.
      source: "Babic D. I., Corzine S. W. (1992). Analytic expressions for the reflection delay, penetration depth, and absorptance of quarter-wave dielectric mirrors. IEEE J. Quantum Electron. 28, 514–524.",
      basis: "computed",
      inputs: {},
      expect: { delayLimit: 1.97173443 },
      tolerance: 1e-8,
    },
    {
      // Low index outermost: τ = λ₀ n_H n_L/(2c n₀ Δn) = 1064e-9 × 2.35 × 1.45/(2 × c × 0.9) = 6.71868507 fs; (LH)^10 has 20 layers.
      source: "Babic D. I., Corzine S. W. (1992). Analytic expressions for the reflection delay, penetration depth, and absorptance of quarter-wave dielectric mirrors. IEEE J. Quantum Electron. 28, 514–524.",
      basis: "computed",
      inputs: { outer: "low" },
      expect: { delayLimit: 6.71868507, reflectance: 99.96111143, layerCount: 20 },
      tolerance: 1e-8,
    },
  ],
});
