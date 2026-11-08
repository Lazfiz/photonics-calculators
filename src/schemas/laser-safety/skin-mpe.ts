import { skinMpeResult } from "../../physics/laser-safety/skin-exposure-limits";
import { defineSchema } from "../types";
import { ICNIRP_2013, WAVELENGTH } from "./common";

const TABLE_7 = `${ICNIRP_2013}. Table 7 (skin limits) and Table 8 (apertures). https://doi.org/10.1097/HP.0b013e3182983fd4`;

export default defineSchema({
  href: "/laser-safety/skin-mpe",
  inputs: [
    { ...WAVELENGTH, default: 1064, max: 1e6 },
    { key: "power", label: "Power", unit: "mW", toSI: 1e-3, siUnit: "W", default: 1000, min: 0, max: 1e9 },
    { key: "beamDiameter", label: "Beam diameter (1/e²)", unit: "mm", toSI: 1e-3, siUnit: "m", default: 5, min: 0.01, max: 1e4 },
    { key: "exposureTime", label: "Exposure time", unit: "s", toSI: 1, siUnit: "s", default: 10, min: 1e-9, max: 30000 },
  ],
  outputs: [
    { key: "radiantExposure", label: "Skin limit H", unit: "J/m²", toSI: 1, siUnit: "J/m²" },
    { key: "irradiance", label: "Skin limit as irradiance H/t", unit: "W/m²", toSI: 1, siUnit: "W/m²" },
    { key: "beamIrradiance", label: "Beam irradiance compared (3.5 mm average, or peak below 1 mm)", unit: "W/m²", toSI: 1, siUnit: "W/m²" },
    { key: "maxPower", label: "Max power for this time", unit: "mW", toSI: 1e-3, siUnit: "W" },
    { key: "ratio", label: "Power / max power", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ wavelength, power, beamDiameter, exposureTime }) {
    const r = skinMpeResult(wavelength, power, beamDiameter, exposureTime);
    if (!r) {
      return {
        values: { radiantExposure: NaN, irradiance: NaN, beamIrradiance: NaN, maxPower: NaN, ratio: NaN },
        warnings: ["The skin limits cover 180 nm to 1 mm."],
      };
    }
    const warnings: string[] = [];
    if (beamDiameter / Math.SQRT2 < 1e-3) {
      warnings.push("The beam is under 1 mm (1/e diameter): its peak irradiance is compared, not the 3.5 mm average (Table 7 note b).");
    }
    return {
      values: {
        radiantExposure: r.H, irradiance: r.H / exposureTime, beamIrradiance: r.E, maxPower: r.pMax, ratio: r.ratio,
      },
      warnings,
    };
  },
  checks: [
    {
      // 1064 nm, t = 10 s: C_A = 5 (1050-1400 nm); the CW piece 2.0e3 C_A W/m² applies from 10 s: H = 2e3 · 5 · 10 = 1e5 J/m²
      // (the t^0.25 piece gives 97805 J/m² there: the table joint is rounded); H/t = 1e4 W/m².
      source: TABLE_7,
      basis: "computed",
      inputs: { wavelength: 1064, exposureTime: 10 },
      expect: { radiantExposure: 1e5, irradiance: 1e4 },
      tolerance: 1e-9,
    },
    {
      // 1064 nm, t = 1 s: H = 1.1e4 · 5 · 1 = 5.5e4 J/m².
      source: TABLE_7,
      basis: "computed",
      inputs: { wavelength: 1064, exposureTime: 1 },
      expect: { radiantExposure: 5.5e4 },
      tolerance: 1e-9,
    },
    {
      // 532 nm, t = 1 s: C_A = 1, H = 1.1e4 · 1^0.25 = 1.1e4 J/m².
      source: TABLE_7,
      basis: "computed",
      inputs: { wavelength: 532, exposureTime: 1 },
      expect: { radiantExposure: 11000, irradiance: 11000 },
      tolerance: 1e-9,
    },
  ],
});
