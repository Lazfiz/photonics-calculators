import { blockingFilterResponse } from "../../physics/thin-film/edge-filter";
import { stopBandHalfWidth } from "../../physics/thin-film/quarter-wave-stack";
import { defineSchema } from "../types";

const NM = 1e-9;
/** The page rounds the (unchecked) URL value to an integer of periods in 1–40. */
const clampInt = (x: number, lo: number, hi: number) => Math.round(Math.min(Math.max(x, lo), hi));

/** A long-pass edge filter (`type` is fixed): (H/2 L H/2)^N stacks in series cover the blocked band. */
export default defineSchema({
  href: "/thin-film/cold-mirror",
  inputs: [
    { key: "nH", label: "High index nH", unit: "", toSI: 1, siUnit: "", default: 2.35, min: 1, max: 5 },
    { key: "nL", label: "Low index nL", unit: "", toSI: 1, siUnit: "", default: 1.45, min: 1, max: 5 },
    { key: "nSub", label: "Substrate index", unit: "", toSI: 1, siUnit: "", default: 1.52, min: 1, max: 5 },
    { key: "nInc", label: "Incident medium index", unit: "", toSI: 1, siUnit: "", default: 1, min: 1, max: 5 },
    { key: "blockFrom", label: "Reflected band (visible): from", unit: "nm", toSI: NM, siUnit: "m", default: 400, min: 100, max: 20000 },
    { key: "blockTo", label: "Reflected band (visible): to", unit: "nm", toSI: NM, siUnit: "m", default: 700, min: 100, max: 20000 },
    { key: "passFrom", label: "Transmitted band (IR): from", unit: "nm", toSI: NM, siUnit: "m", default: 800, min: 100, max: 20000 },
    { key: "passTo", label: "Transmitted band (IR): to", unit: "nm", toSI: NM, siUnit: "m", default: 1200, min: 100, max: 20000 },
    { key: "pairs", label: "Periods per stack (N)", unit: "", toSI: 1, siUnit: "", default: 10, min: 1, max: 40 },
  ],
  outputs: [
    { key: "meanReflectance", label: "Mean R over the reflected band", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "minReflectance", label: "Lowest R in the reflected band", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "meanTransmittance", label: "Mean T over the transmitted band", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "minTransmittance", label: "Lowest T in the transmitted band", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "edgeWavelength", label: "50 % point (edge) between the bands", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "stackCount", label: "Stacks in series", unit: "", toSI: 1, siUnit: "" },
    { key: "layerCount", label: "Layers", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ nH, nL, nSub, nInc, blockFrom, blockTo, passFrom, passTo, pairs }) {
    const periods = clampInt(pairs, 1, 40);
    const r = blockingFilterResponse({ type: "long-pass", nH, nL, nSub, nInc, blockFrom, blockTo, passFrom, passTo, periods });
    const warnings: string[] = [];
    if (!r.indicesOk) warnings.push("Set nH above nL: the stacks need an index contrast.");
    if (!r.bandsOk) warnings.push('Each band needs "from" below "to".');
    if (r.tooBig) {
      warnings.push(`${r.centres.length} stacks × ${periods} periods is too many to compute here; narrow the band or use fewer periods.`);
    }
    if (r.bandsOk && r.overlap) warnings.push("The two bands overlap: the transmitted band should lie above the blocked band.");
    // Third-order zones, g = λ₀/λ in 3 ± Δg, that reach into the transmitted band.
    const dg = stopBandHalfWidth(nH, nL);
    for (const c of r.centres) {
      const from = c / (3 + dg);
      const to = c / (3 - dg);
      if (to > passFrom && from < passTo) {
        warnings.push(`A third-order reflection zone, ${(from / NM).toFixed(0)}–${(to / NM).toFixed(0)} nm, falls in the transmitted band.`);
      }
    }
    const res = r.results;
    return {
      values: {
        meanReflectance: res?.block.mean ?? NaN,
        minReflectance: res?.block.min ?? NaN,
        meanTransmittance: res?.pass.mean ?? NaN,
        minTransmittance: res?.pass.min ?? NaN,
        edgeWavelength: res?.edge ?? NaN,
        stackCount: res ? r.centres.length : NaN,
        layerCount: res ? r.stack.layers.length : NaN,
      },
      warnings,
    };
  },
  checks: [
    {
      // Defaults, worked with an independent 2×2 characteristic-matrix program (Macleod ch. 2): K = ⌈ln(700/400) /
      // ln((1 + Δg)/(1 − Δg))⌉ = 2 stacks (Δg = 0.152224816537) with λ0 = 593.44262842 and 460.88992661 nm, each
      // (H/2 L H/2)^10, so 2·2·10 + 1 = 41 layers; band means by the trapezoid rule on 1000 intervals.
      source: "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., ch. 7 (edge filters, symmetric periods) and ch. 6 (stacks in series). CRC Press.",
      basis: "computed",
      inputs: {},
      expect: {
        stackCount: 2, layerCount: 41,
        meanReflectance: 99.488842913, minReflectance: 86.836922090,
        meanTransmittance: 95.217604510, minTransmittance: 90.254381890,
      },
      tolerance: 1e-9,
    },
    {
      // Same program, the 50 % point of the stack next to the pass band: an independent 20000-step scan of T(g)
      // from g = 1 down and a 200-step bisection (the page uses 800 steps and 1e-13 in g), so the edge agrees to
      // about 1e-12; 1e-9 allows for rounding of the printed value.
      source: "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., ch. 7 (edge filters). CRC Press.",
      basis: "computed",
      inputs: {},
      expect: { edgeWavelength: 710.63876475 },
      tolerance: 1e-9,
    },
  ],
});
