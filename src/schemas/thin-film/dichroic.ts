import { cosAngleInLayer, stopBandCentreAtAngle } from "../../physics/thin-film/quarter-wave-stack";
import { quarterWaveLayers, stackResponse } from "../../physics/thin-film/transfer-matrix";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;

export default defineSchema({
  href: "/thin-film/dichroic",
  inputs: [
    { key: "nH", label: "High index n_H", unit: "", toSI: 1, siUnit: "", default: 2.35, min: 1, max: 5 },
    { key: "nL", label: "Low index n_L", unit: "", toSI: 1, siUnit: "", default: 1.45, min: 1, max: 5 },
    { key: "nSub", label: "Substrate index", unit: "", toSI: 1, siUnit: "", default: 1.52, min: 1, max: 5 },
    { key: "nInc", label: "Incident medium index", unit: "", toSI: 1, siUnit: "", default: 1.0, min: 1, max: 5 },
    { key: "numPairs", label: "Pairs N", unit: "", toSI: 1, siUnit: "", default: 7, min: 1, max: 30 },
    { key: "designWl", label: "Design wavelength λ₀", unit: "nm", toSI: 1e-9, siUnit: "m", default: 550, min: 100, max: 20000 },
    { key: "aoi", label: "Angle of incidence", unit: "°", toSI: DEG, siUnit: "rad", default: 45, min: 0, max: 89 },
  ],
  outputs: [
    { key: "cosH", label: "cos θ_H inside the high-index layer", unit: "", toSI: 1, siUnit: "" },
    { key: "cosL", label: "cos θ_L inside the low-index layer", unit: "", toSI: 1, siUnit: "" },
    { key: "totalLayers", label: "Total layers 2N", unit: "", toSI: 1, siUnit: "" },
    { key: "centre", label: "Stop-band centre at this angle (first order)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "reflectanceS", label: "Reflectance at λ₀, s polarization", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "reflectanceP", label: "Reflectance at λ₀, p polarization", unit: "%", toSI: 0.01, siUnit: "" },
  ],
  compute({ nH, nL, nSub, nInc, numPairs, designWl, aoi }) {
    const pairs = Math.round(numPairs);
    const indices = Array.from({ length: pairs * 2 }, (_, j) => (j % 2 === 0 ? nH : nL));
    const stack = { incident: nInc, layers: quarterWaveLayers(indices, designWl), substrate: { n: nSub } };
    const centre = stopBandCentreAtAngle(designWl, nH, nL, aoi, nInc);
    return {
      values: {
        cosH: cosAngleInLayer(nInc, nH, aoi),
        cosL: cosAngleInLayer(nInc, nL, aoi),
        totalLayers: pairs * 2,
        centre,
        reflectanceS: stackResponse(stack, designWl, aoi, "s").R,
        reflectanceP: stackResponse(stack, designWl, aoi, "p").R,
      },
      warnings: Number.isFinite(centre) ? [] : ["Light does not propagate in both layers at this angle: no stop-band centre."],
    };
  },
  checks: [
    {
      // cos θ_H = √(1 − (sin 45°/2.35)²) = 0.953657, cos θ_L = √(1 − (sin 45°/1.45)²) = 0.873034; λ_c = 550 (cos θ_H + cos θ_L)/2.
      source: "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., ch. 2 (phase thickness 2π n d cos θ/λ) and ch. 6. CRC Press.",
      basis: "computed",
      inputs: { nH: 2.35, nL: 1.45, nInc: 1, designWl: 550, aoi: 45 },
      expect: { centre: 502.3398926, cosH: 0.9536568013, cosL: 0.8730337173 },
      tolerance: 1e-8,
    },
  ],
});
