import { enhancedAluminumResults } from "../../physics/thin-film/metal-mirror";
import { defineSchema } from "../types";

const NM = 1e-9;

/** Al (Rakić 1998 Lorentz–Drude) with quarter-wave (H L) pairs at λ₀, exact transfer matrix at normal incidence. */
export default defineSchema({
  href: "/thin-film/enhanced-aluminum",
  inputs: [
    { key: "designWl", label: "Design wavelength λ₀", unit: "nm", toSI: NM, siUnit: "m", default: 550, min: 250, max: 1200 },
    { key: "pairs", label: "Enhancing pairs (L then H on the Al; rounded to an integer)", unit: "", toSI: 1, siUnit: "", default: 1, min: 0, max: 6 },
    { key: "nL", label: "Low index nL (next to the Al)", unit: "", toSI: 1, siUnit: "", default: 1.46, min: 1, max: 5 },
    { key: "nH", label: "High index nH (outermost)", unit: "", toSI: 1, siUnit: "", default: 2.35, min: 1, max: 5 },
    { key: "alThick", label: "Al thickness", unit: "nm", toSI: NM, siUnit: "m", default: 80, min: 0, max: 1000 },
    { key: "adhesionThick", label: "Cr adhesion layer under the Al", unit: "nm", toSI: NM, siUnit: "m", default: 0, min: 0, max: 100 },
    { key: "nSub", label: "Substrate index", unit: "", toSI: 1, siUnit: "", default: 1.52, min: 1, max: 5 },
  ],
  outputs: [
    { key: "R0", label: "R at λ₀", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "T0", label: "T at λ₀", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "bareR0", label: "R at λ₀ of the bare Al", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "meanVis", label: "Mean R, 400–700 nm", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "minVis", label: "Lowest R, 400–700 nm", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "bareMeanVis", label: "Mean R, 400–700 nm, bare Al", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "opaqueLimit", label: "Opaque-Al limit at λ₀ |(1 − Y)/(1 + Y)|²", unit: "%", toSI: 0.01, siUnit: "" },
  ],
  compute({ designWl, pairs, nL, nH, alThick, adhesionThick, nSub }) {
    const r = enhancedAluminumResults({
      lambda0: designWl, pairs: Math.round(Math.min(Math.max(pairs, 0), 6)), nL, nH,
      alThickness: alThick, adhesionThickness: adhesionThick, nSub,
    });
    const warnings: string[] = [];
    if (r.T0 > 1e-4) warnings.push("The Al is thin enough to transmit: the opaque-Al limit no longer equals R at λ₀.");
    return {
      values: {
        R0: r.R0, T0: r.T0, bareR0: r.bareR0, meanVis: r.vis.mean, minVis: r.vis.min,
        bareMeanVis: r.bareVis.mean, opaqueLimit: r.qw,
      },
      warnings,
    };
  },
  checks: [
    {
      // No metal (Al and Cr 0 nm), one pair on a lossless n = 1.52 substrate, so R follows from the admittance recursion
      // of quarter waves alone: from the substrate, L turns Y = nSub into nL²/nSub = 1.4023684, then H gives
      // Y = nH²/1.4023684 = 5.5225/1.4023684 = 3.93797 (= nH² nSub/nL²); R = ((1 − Y)/(1 + Y))² = 0.353996624, T = 1 − R = 0.646003376; the bare case is the substrate alone, ((1.52 − 1)/(1.52 + 1))² = 0.042579995.
      source: "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., ch. 2 (characteristic matrix and admittance of quarter-wave layers). CRC Press.",
      basis: "computed",
      inputs: { alThick: 0, adhesionThick: 0 },
      expect: { R0: 35.3996623628, T0: 64.6003376372, bareR0: 4.2579994961 },
      tolerance: 1e-8,
    },
  ],
});
