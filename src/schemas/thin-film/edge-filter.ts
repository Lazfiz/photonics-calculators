import { edgeDesignWavelength, edgeFilterLayers, halfTransmissionEdge, type EdgeType } from "../../physics/thin-film/edge-filter";
import { stopBandEdges, stopBandHalfWidth } from "../../physics/thin-film/quarter-wave-stack";
import { stackResponse } from "../../physics/thin-film/transfer-matrix";
import { defineSchema } from "../types";

const NM = 1e-9;
/** The page rounds the (unchecked) URL value to an integer of periods in 1–40. */
const clampInt = (x: number, lo: number, hi: number) => Math.round(Math.min(Math.max(x, lo), hi));

export default defineSchema({
  href: "/thin-film/edge-filter",
  choices: [
    {
      key: "type",
      label: "Type",
      options: [
        { value: "long", label: "Long-pass: (H/2 L H/2)ᴺ, transmits λ > edge" },
        { value: "short", label: "Short-pass: (L/2 H L/2)ᴺ, transmits λ < edge" },
      ],
      default: "long",
    },
  ],
  inputs: [
    { key: "nH", label: "High index nH", unit: "", toSI: 1, siUnit: "", default: 2.35, min: 1, max: 5 },
    { key: "nL", label: "Low index nL", unit: "", toSI: 1, siUnit: "", default: 1.45, min: 1, max: 5 },
    { key: "nSub", label: "Substrate index", unit: "", toSI: 1, siUnit: "", default: 1.52, min: 1, max: 5 },
    { key: "nInc", label: "Incident medium index", unit: "", toSI: 1, siUnit: "", default: 1, min: 1, max: 5 },
    { key: "edgeWl", label: "Edge wavelength", unit: "nm", toSI: NM, siUnit: "m", default: 600, min: 100, max: 20000 },
    { key: "pairs", label: "Periods (N)", unit: "", toSI: 1, siUnit: "", default: 10, min: 1, max: 40 },
  ],
  outputs: [
    { key: "halfPoint", label: "50 % transmittance point of this stack", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "designWavelength", label: "Design wavelength λ₀", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "reflectanceAtDesign", label: "Reflectance at λ₀", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "zoneShort", label: "Infinite-stack zone, short edge", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "zoneLong", label: "Infinite-stack zone, long edge", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "zoneHalfWidth", label: "Zone half-width Δg (in g = λ₀/λ)", unit: "", toSI: 1, siUnit: "" },
    { key: "layerCount", label: "Layers", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ type: typeKey, nH, nL, nSub, nInc, edgeWl, pairs: pairsRaw }) {
    const type: EdgeType = typeKey === "short" ? "short-pass" : "long-pass";
    const periods = clampInt(pairsRaw, 1, 40);
    const valid = nH > nL && nL > 0 && nSub > 0 && nInc > 0 && edgeWl > 0;
    const lambda0 = valid ? edgeDesignWavelength(type, edgeWl, nH, nL) : NaN;
    const stack = { incident: nInc, layers: edgeFilterLayers(type, lambda0, nH, nL, periods), substrate: { n: nSub } };
    const half = valid ? halfTransmissionEdge(stack, type, lambda0) : NaN;
    const zone = stopBandEdges(lambda0, nH, nL);
    const warnings: string[] = [];
    if (!valid) warnings.push("Set nH above nL: the edge needs an index contrast.");
    else if (!Number.isFinite(half)) warnings.push("No 50 % crossing: add periods or contrast.");
    return {
      values: {
        halfPoint: half,
        designWavelength: lambda0,
        reflectanceAtDesign: valid ? stackResponse(stack, lambda0).R : NaN,
        zoneShort: zone.short,
        zoneLong: zone.long,
        zoneHalfWidth: stopBandHalfWidth(nH, nL),
        layerCount: 2 * periods + 1,
      },
      warnings,
    };
  },
  checks: [
    {
      // Long-pass at 600 nm: Δg = (2/π) asin(0.9/3.8) = 0.152224816537, λ₀ = 600(1 − Δg) = 508.66511008 nm, so the
      // zone's long edge λ₀/(1 − Δg) is the edge wavelength 600 nm and its short edge is λ₀/(1 + Δg) = 441.46342170 nm.
      source: "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., ch. 7 (edge filters) and ch. 6 (zone edges, Δg). CRC Press.",
      basis: "computed",
      inputs: {},
      expect: { designWavelength: 508.66511008, zoneShort: 441.4634217, zoneLong: 600, zoneHalfWidth: 0.15222481654, layerCount: 21 },
      tolerance: 1e-8,
    },
    {
      // Short-pass: λ₀ = 600(1 + Δg) = 691.33488992 nm; the zone's short edge λ₀/(1 + Δg) is the edge, 600 nm.
      source: "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., ch. 7 (edge filters) and ch. 6 (zone edges, Δg). CRC Press.",
      basis: "computed",
      inputs: { type: "short" },
      expect: { designWavelength: 691.33488992, zoneShort: 600 },
      tolerance: 1e-8,
    },
  ],
});
