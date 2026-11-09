import { normalIncidenceReflectance } from "../../physics/polarization/fresnel";
import {
  middleIndexForReflectance,
  quarterWaveLadderReflectance,
  singleLayerIndexForReflectance,
  tunedSplitter,
} from "../../physics/thin-film/beamsplitter";
import { defineSchema } from "../types";

const pure = { unit: "", toSI: 1, siUnit: "" } as const;
const percent = { unit: "%", toSI: 0.01, siUnit: "" } as const;

export default defineSchema({
  href: "/thin-film/beamsplitter",
  inputs: [
    { key: "nH", label: "High index nH", ...pure, default: 2.35, min: 1, max: 5 },
    { key: "nL", label: "Low index nL", ...pure, default: 1.45, min: 1, max: 5 },
    { key: "nSub", label: "Substrate index", ...pure, default: 1.52, min: 1, max: 5 },
    { key: "nInc", label: "Incident medium index", ...pure, default: 1.0, min: 1, max: 5 },
    { key: "designWl", label: "Design wavelength λ₀", unit: "nm", toSI: 1e-9, siUnit: "m", default: 550, min: 100, max: 20000 },
    { key: "targetR", label: "Target reflectance at λ₀", ...percent, default: 50, min: 1, max: 99 },
  ],
  outputs: [
    { key: "singleLayerIndex", label: "Index of a single quarter-wave layer for the target", ...pure },
    { key: "middleIndex", label: "Middle index nM of an all-quarter-wave H M H for the target", ...pure },
    { key: "bareReflectance", label: "Reflectance of the bare substrate", ...percent },
    { key: "stackH", label: "Reflectance of quarter-wave stack H", ...percent },
    { key: "stackHLH", label: "Reflectance of quarter-wave stack HLH", ...percent },
    { key: "stackHLHLH", label: "Reflectance of quarter-wave stack HLHLH", ...percent },
    { key: "stackHLHLHLH", label: "Reflectance of quarter-wave stack HLHLHLH", ...percent },
    { key: "designPeriods", label: "Periods m of the stack H(LH)^m the thinned design is cut from", ...pure },
    { key: "thinnedFraction", label: "Thickness of the thinned layer, in quarter waves", ...pure },
    { key: "thinnedThickness", label: "Physical thickness of the thinned layer", unit: "nm", toSI: 1e-9, siUnit: "m" },
  ],
  validate: ({ nH, nL }) => (nH > nL ? undefined : "nH must be above nL."),
  // targetR arrives in SI, i.e. as a fraction (50 % -> 0.5); designWl in m.
  compute({ nH, nL, nSub, nInc, designWl, targetR }) {
    const R = (m: number) => quarterWaveLadderReflectance(m, nH, nL, nInc, nSub);
    const design = tunedSplitter(targetR, nH, nL, nInc, nSub, designWl);
    const bare = normalIncidenceReflectance(nInc, nSub);
    // The thinned layer is the H layer for m = 0, else the L layer behind the front H.
    const thinned = design ? design.layers[design.m === 0 ? 0 : 1] : undefined;
    const warnings: string[] = [];
    if (!design) {
      warnings.push(targetR <= bare
        ? "The target is at or below the bare substrate's reflectance: that is an antireflection task, not a splitter."
        : "The target is not reachable with up to 20 periods.");
    }
    return {
      values: {
        singleLayerIndex: singleLayerIndexForReflectance(targetR, nInc, nSub),
        middleIndex: middleIndexForReflectance(targetR, nH, nInc, nSub),
        bareReflectance: bare,
        stackH: R(0),
        stackHLH: R(1),
        stackHLHLH: R(2),
        stackHLHLHLH: R(3),
        designPeriods: design ? design.m : NaN,
        thinnedFraction: design ? design.x : NaN,
        thinnedThickness: thinned ? thinned.thickness : NaN,
      },
      warnings,
    };
  },
  checks: [
    {
      // 50 % single quarter-wave layer: n² = n₀n_s(1 + √R)/(1 − √R) = 1.52(1.70710678)/(0.29289322) -> n = 2.97644238;
      // n_M = n_H²/n = 2.35²/2.97644238 = 1.85540296.
      source: "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., CRC Press, ch. 2 (quarter-wave layer maps Y to n²/Y) and ch. 5 (beam splitters).",
      basis: "computed",
      inputs: { targetR: 50, nInc: 1, nSub: 1.52, nH: 2.35 },
      expect: { singleLayerIndex: 2.97644237801, middleIndex: 1.85540296051 },
      tolerance: 1e-8,
    },
    {
      // Admittance Y -> n²/Y from the substrate (1.52): H: Y = 2.35²/1.52 = 3.63321 -> R = ((1 - Y)/(1 + Y))² = 0.3230048;
      // HLH: Y = 2.35²/(1.45²/3.63321) = 9.54287 -> R = 0.6565916; bare: ((1 - 1.52)/2.52)² = 0.04258.
      source: "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., CRC Press, ch. 2 (admittance of a quarter-wave stack).",
      basis: "computed",
      inputs: { nH: 2.35, nL: 1.45, nSub: 1.52, nInc: 1 },
      expect: { bareReflectance: 4.25799949609, stackH: 32.300479529, stackHLH: 65.659162346 },
      tolerance: 1e-8,
    },
  ],
});
