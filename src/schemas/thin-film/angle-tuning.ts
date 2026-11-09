import { stopBandCentreAtAngle, stopBandHalfWidth } from "../../physics/thin-film/quarter-wave-stack";
import { quarterWaveStackReflectance } from "../../physics/thin-film/transfer-matrix";
import { defineSchema } from "../types";

export default defineSchema({
  href: "/thin-film/angle-tuning",
  inputs: [
    { key: "nH", label: "High index n_H", unit: "", toSI: 1, siUnit: "", default: 2.35, min: 1, max: 5 },
    { key: "nL", label: "Low index n_L", unit: "", toSI: 1, siUnit: "", default: 1.45, min: 1, max: 5 },
    { key: "nSub", label: "Substrate index", unit: "", toSI: 1, siUnit: "", default: 1.52, min: 1, max: 5 },
    { key: "nInc", label: "Incident medium index", unit: "", toSI: 1, siUnit: "", default: 1.0, min: 1, max: 5 },
    { key: "numPairs", label: "Number of pairs N", unit: "", toSI: 1, siUnit: "", default: 5, min: 1, max: 30 },
    { key: "designWl", label: "Design wavelength λ₀", unit: "nm", toSI: 1e-9, siUnit: "m", default: 550, min: 1, max: 20000 },
  ],
  outputs: [
    { key: "totalLayers", label: "Total layers 2N", unit: "", toSI: 1, siUnit: "" },
    { key: "peakReflectance", label: "Reflectance at λ₀, normal incidence", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "halfWidth", label: "Stop-band half-width Δg in g = λ₀/λ", unit: "", toSI: 1, siUnit: "" },
    { key: "centre30", label: "Stop-band centre at 30° (first order)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "centre45", label: "Stop-band centre at 45° (first order)", unit: "nm", toSI: 1e-9, siUnit: "m" },
  ],
  compute({ nH, nL, nSub, nInc, numPairs, designWl }) {
    const pairs = Math.round(numPairs);
    const indices = Array.from({ length: pairs * 2 }, (_, j) => (j % 2 === 0 ? nH : nL));
    const c30 = stopBandCentreAtAngle(designWl, nH, nL, (30 * Math.PI) / 180, nInc);
    const c45 = stopBandCentreAtAngle(designWl, nH, nL, (45 * Math.PI) / 180, nInc);
    return {
      values: {
        totalLayers: pairs * 2,
        peakReflectance: quarterWaveStackReflectance(nInc, indices, nSub),
        halfWidth: stopBandHalfWidth(nH, nL),
        centre30: c30,
        centre45: c45,
      },
      warnings: Number.isFinite(c45) ? [] : ["Light does not propagate in both layers at 45°: no stop-band centre there."],
    };
  },
  checks: [
    {
      // cos θ_H = √(1 − (sin 45°/2.35)²) = 0.953657, cos θ_L = √(1 − (sin 45°/1.45)²) = 0.873034; λ_c = 550 (0.953657 + 0.873034)/2.
      source: "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., ch. 2 and ch. 6 (angle dependence of the high-reflectance zone, first order). CRC Press.",
      basis: "computed",
      inputs: { nH: 2.35, nL: 1.45, designWl: 550 },
      expect: { centre45: 502.3398926 },
      tolerance: 1e-8,
    },
    {
      // Δg = (2/π) asin((2.35 − 1.45)/(2.35 + 1.45)) = 0.1522248; Y = (n_H/n_L)^(2N) n_s with N = 5, R = ((1 − Y)/(1 + Y))² = 97.9172 %.
      source: "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., ch. 6 (Δg = (2/π) asin((n_H − n_L)/(n_H + n_L))) and ch. 2 (admittance recursion). CRC Press.",
      basis: "computed",
      inputs: { nH: 2.35, nL: 1.45, nSub: 1.52, nInc: 1, numPairs: 5 },
      expect: { halfWidth: 0.1522248165, peakReflectance: 97.91714423 },
      tolerance: 1e-8,
    },
  ],
});
