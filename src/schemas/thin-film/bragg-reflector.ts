import {
  quarterWaveDecayPerPeriod, quarterWaveGapMidgap, quarterWavePeriod,
} from "../../physics/thin-film/photonic-crystal";
import { stopBandEdges } from "../../physics/thin-film/quarter-wave-stack";
import { quarterWaveStackReflectance } from "../../physics/thin-film/transfer-matrix";
import { defineSchema } from "../types";

export default defineSchema({
  href: "/thin-film/bragg-reflector",
  inputs: [
    { key: "nInc", label: "Incident medium index", unit: "", toSI: 1, siUnit: "", default: 1.0, min: 1, max: 5 },
    { key: "nH", label: "High index n_H", unit: "", toSI: 1, siUnit: "", default: 2.35, min: 0.1, max: 10 },
    { key: "nL", label: "Low index n_L", unit: "", toSI: 1, siUnit: "", default: 1.45, min: 0.1, max: 10 },
    { key: "nSub", label: "Substrate index", unit: "", toSI: 1, siUnit: "", default: 1.52, min: 0.1, max: 10 },
    { key: "designWavelength", label: "Design wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 100, max: 20000 },
    { key: "pairs", label: "Number of pairs", unit: "", toSI: 1, siUnit: "", default: 5, min: 1, max: 30 },
  ],
  outputs: [
    { key: "peakReflectance", label: "Peak reflectance at λ₀", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "bandShort", label: "Stop band, short edge (infinite stack)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "bandLong", label: "Stop band, long edge (infinite stack)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "gapMidgap", label: "Gap/midgap ratio Δω/ω₀", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "period", label: "Period Λ = d_H + d_L", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "decayPerPeriod", label: "Bloch decay at λ₀, κ = ln(n_H/n_L)", unit: "Np per period", toSI: 1, siUnit: "Np per period" },
  ],
  compute({ nInc, nH, nL, nSub, designWavelength, pairs }) {
    const n = Math.round(pairs);
    const indices = Array.from({ length: 2 * n }, (_, j) => (j % 2 === 0 ? nH : nL));
    const band = stopBandEdges(designWavelength, nH, nL);
    return {
      values: {
        peakReflectance: quarterWaveStackReflectance(nInc, indices, nSub),
        bandShort: band.short,
        bandLong: band.long,
        gapMidgap: quarterWaveGapMidgap(nH, nL),
        period: quarterWavePeriod(designWavelength, nH, nL),
        decayPerPeriod: quarterWaveDecayPerPeriod(nH, nL),
      },
      warnings: nH === nL ? ["n_H = n_L: there is no stop band; the decay is zero and the band edges coincide with λ₀."] : [],
    };
  },
  checks: [
    {
      // Y = (n_H/n_L)^(2N) n_s = (2.35/1.45)^10 × 1.52 for N = 5; R = ((1 − Y)/(1 + Y))² = 97.9171 %.
      source: "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., ch. 2 (admittance of quarter-wave layers) and ch. 6 (high-reflectance coatings). CRC Press.",
      basis: "computed",
      inputs: { nInc: 1, nH: 2.35, nL: 1.45, nSub: 1.52, designWavelength: 1550, pairs: 5 },
      expect: { peakReflectance: 97.91714423 },
      tolerance: 1e-8,
    },
    {
      // Δg = (2/π) asin(0.9/3.8) = 0.1522248; edges λ₀/(1 ± Δg); gap/midgap = 2Δg; Λ = (λ₀/4)(1/2.35 + 1/1.45); κ = ln(2.35/1.45).
      source: "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., ch. 6; Yeh P., Yariv A., Hong C.-S. (1977). Electromagnetic propagation in periodic stratified media. I. General theory. J. Opt. Soc. Am. 67, 423, doi:10.1364/JOSA.67.000423.",
      basis: "computed",
      inputs: { nH: 2.35, nL: 1.45, designWavelength: 1550 },
      expect: { bandShort: 1345.223586, bandLong: 1828.3149, gapMidgap: 30.44496331, period: 432.1349963, decayPerPeriod: 0.4828517717 },
      tolerance: 1e-8,
    },
  ],
});
