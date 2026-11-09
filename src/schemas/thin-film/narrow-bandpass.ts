import { cavityFilterSummary } from "../../physics/thin-film/cavity-filter";
import { stopBandHalfWidth } from "../../physics/thin-film/quarter-wave-stack";
import { defineSchema } from "../types";

const NM = 1e-9;
const clampInt = (x: number, lo: number, hi: number) => Math.round(Math.min(Math.max(x, lo), hi));

/** The page's `mirrorPairs` (1–20) and `cavities` are rounded like the page does with a URL value (the shared cavity component with three cavities and longer mirrors). */
export default defineSchema({
  href: "/thin-film/narrow-bandpass",
  inputs: [
    { key: "nH", label: "High index nH", unit: "", toSI: 1, siUnit: "", default: 2.35, min: 1, max: 5 },
    { key: "nL", label: "Low index nL", unit: "", toSI: 1, siUnit: "", default: 1.45, min: 1, max: 5 },
    { key: "nSub", label: "Substrate index", unit: "", toSI: 1, siUnit: "", default: 1.52, min: 1, max: 5 },
    { key: "spacerN", label: "Spacer index (half-wave spacer)", unit: "", toSI: 1, siUnit: "", default: 2.1, min: 1, max: 5 },
    { key: "centerWl", label: "Centre wavelength λ₀", unit: "nm", toSI: NM, siUnit: "m", default: 1550, min: 100, max: 20000 },
    { key: "mirrorPairs", label: "Mirror pairs p (HL pairs per mirror)", unit: "", toSI: 1, siUnit: "", default: 6, min: 1, max: 20 },
    { key: "cavities", label: "Cavities", unit: "", toSI: 1, siUnit: "", default: 3, min: 1, max: 6 },
  ],
  outputs: [
    { key: "peakTransmittance", label: "Peak transmittance in the pass band", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "centerTransmittance", label: "Transmittance at λ₀", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "fwhm", label: "Pass-band FWHM", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "passbandShort", label: "Short-wavelength half-peak point", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "passbandLong", label: "Long-wavelength half-peak point", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "resolvingPower", label: "λ₀ / FWHM", unit: "", toSI: 1, siUnit: "" },
    { key: "layerCount", label: "Layers", unit: "", toSI: 1, siUnit: "" },
    { key: "zoneShort", label: "Mirror zone (infinite stack), short edge", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "zoneLong", label: "Mirror zone (infinite stack), long edge", unit: "nm", toSI: NM, siUnit: "m" },
  ],
  compute({ nH, nL, nSub, spacerN, centerWl, mirrorPairs, cavities }) {
    const lambda0 = centerWl; // SI (m)
    const summary = cavityFilterSummary({
      nH, nL, nSub, nSpacer: spacerN, lambda0,
      mirrorPairs: clampInt(mirrorPairs, 1, 20), cavities: clampInt(cavities, 1, 6),
    });
    if (!summary) {
      const nan = NaN;
      return {
        values: {
          peakTransmittance: nan, centerTransmittance: nan, fwhm: nan, passbandShort: nan, passbandLong: nan,
          resolvingPower: nan, layerCount: nan, zoneShort: nan, zoneLong: nan,
        },
        warnings: ["Set nH above nL (the mirrors need an index contrast) and use positive indices."],
      };
    }
    const { band } = summary;
    const fwhm = band.long - band.short;
    const hasBand = Number.isFinite(fwhm) && fwhm > 0;
    const dg = stopBandHalfWidth(nH, nL);
    return {
      values: {
        peakTransmittance: band.peakT,
        centerTransmittance: summary.T0,
        fwhm: hasBand ? fwhm : NaN,
        passbandShort: hasBand ? band.short : NaN,
        passbandLong: hasBand ? band.long : NaN,
        resolvingPower: hasBand ? lambda0 / fwhm : NaN,
        layerCount: summary.layerCount,
        zoneShort: lambda0 / (1 + dg),
        zoneLong: lambda0 / (1 - dg),
      },
      warnings: hasBand ? [] : ["T doesn't fall to half within the mirrors' zone: add mirror pairs."],
    };
  },
  checks: [
    {
      // Single cavity, half-wave spacer: spacer and mirror layers are absentee at λ0, leaving the bare substrate:
      // T = 4 n_s/(1 + n_s)² = 6.08/6.3504 = 0.95742000504 at n_s = 1.52. Six pairs: 2·6·2 + 1 = 25 layers.
      source: "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., ch. 2 (absentee layers) and ch. 8 (single-cavity filters). CRC Press.",
      basis: "computed",
      inputs: { cavities: 1 },
      expect: { centerTransmittance: 95.742000504, peakTransmittance: 95.742000504, layerCount: 25 },
      tolerance: 1e-8,
    },
    {
      // Defaults (three cavities, 6 pairs each): 3 × (2·6·2 + 1) + 2 coupling L = 77 layers; zone edges λ0/(1 ± Δg),
      // Δg = (2/π) asin((nH − nL)/(nH + nL)) = 0.152224816537.
      source: "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., ch. 6 (zone width) and ch. 8 (coupled cavities). CRC Press.",
      basis: "computed",
      inputs: {},
      expect: { layerCount: 77, zoneShort: 1345.2235864, zoneLong: 1828.3149010 },
      tolerance: 1e-8,
    },
    {
      // Defaults, worked with an independent 2×2 characteristic-matrix program (Macleod ch. 2) over the same layers: scan
      // of g = λ0/λ in steps of 1e-8, peak, first fall below half the peak, 60-step bisection.
      source: "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., ch. 8, three-cavity filter pass band. CRC Press.",
      basis: "computed",
      inputs: {},
      expect: { centerTransmittance: 95.742000504, peakTransmittance: 99.691274524, fwhm: 1.1343688648, passbandShort: 1549.4330231 },
      tolerance: 1e-8,
    },
  ],
});
