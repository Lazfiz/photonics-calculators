import { normalIncidenceReflectance } from "../../physics/polarization/fresnel";
import { dualBandWidth, fitDualBandAr } from "../../physics/thin-film/dual-band-ar";
import { defineSchema } from "../types";

const NM = 1e-9;
const LEVEL = 0.01;

export default defineSchema({
  href: "/thin-film/dual-band-ar",
  inputs: [
    { key: "wl1", label: "Wavelength λ₁", unit: "nm", toSI: NM, siUnit: "m", default: 450, min: 200, max: 5000 },
    { key: "wl2", label: "Wavelength λ₂", unit: "nm", toSI: NM, siUnit: "m", default: 1064, min: 200, max: 5000 },
    { key: "n1", label: "Outer layer index n₁", unit: "", toSI: 1, siUnit: "", default: 1.38, min: 1, max: 5 },
    { key: "n2", label: "Middle layer index n₂", unit: "", toSI: 1, siUnit: "", default: 2.1, min: 1, max: 5 },
    { key: "n3", label: "Layer index on the substrate n₃", unit: "", toSI: 1, siUnit: "", default: 1.65, min: 1, max: 5 },
    { key: "nSub", label: "Substrate index", unit: "", toSI: 1, siUnit: "", default: 1.52, min: 1, max: 5 },
  ],
  outputs: [
    { key: "R1", label: "Reflectance at λ₁ (fitted coating)", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "R2", label: "Reflectance at λ₂ (fitted coating)", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "d1", label: "Fitted thickness, outer layer", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "d2", label: "Fitted thickness, middle layer", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "d3", label: "Fitted thickness, layer on the substrate", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "bareReflectance", label: "Uncoated face reflectance", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "band1Low", label: "R < 1 % band around λ₁, short edge", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "band1High", label: "R < 1 % band around λ₁, long edge", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "band2Low", label: "R < 1 % band around λ₂, short edge", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "band2High", label: "R < 1 % band around λ₂, long edge", unit: "nm", toSI: NM, siUnit: "m" },
  ],
  compute({ wl1, wl2, n1, n2, n3, nSub }) {
    const problem = { incident: 1, indices: [n1, n2, n3], substrate: nSub, lambda1: wl1, lambda2: wl2 };
    const fit = fitDualBandAr(problem);
    const b1 = dualBandWidth(problem, fit.thicknesses, wl1, LEVEL);
    const b2 = dualBandWidth(problem, fit.thicknesses, wl2, LEVEL);
    const warnings: string[] = [];
    if (!b1) warnings.push("R ≥ 1 % at λ₁: no band is reported around it.");
    if (!b2) warnings.push("R ≥ 1 % at λ₂: no band is reported around it.");
    for (const b of [b1, b2]) {
      if (b?.open.some(Boolean)) warnings.push("A band edge lies beyond the scan (λ/2 … 1.5 λ); the scan limit is reported.");
    }
    return {
      values: {
        R1: fit.R1,
        R2: fit.R2,
        d1: fit.thicknesses[0],
        d2: fit.thicknesses[1],
        d3: fit.thicknesses[2],
        bareReflectance: normalIncidenceReflectance(1, nSub),
        band1Low: b1?.lo ?? NaN,
        band1High: b1?.hi ?? NaN,
        band2Low: b2?.lo ?? NaN,
        band2High: b2?.hi ?? NaN,
      },
      warnings,
    };
  },
  checks: [
    {
      // Fresnel at normal incidence, n₀ = 1 on n_s = 1.52: R = ((1.52 − 1)/(1.52 + 1))² = (0.52/2.52)² = 4.2580e-2.
      source: "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., ch. 2 (normal-incidence Fresnel reflectance). CRC Press.",
      basis: "computed",
      inputs: { nSub: 1.52 },
      expect: { bareReflectance: 4.257999496 },
      tolerance: 1e-8,
    },
  ],
});
