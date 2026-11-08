import { infraredHazard } from "../../physics/laser-safety/eye-exposure-limits";
import { defineSchema } from "../types";
import { ICNIRP_2013 } from "./common";

const TABLES = `${ICNIRP_2013}. Tables 3, 5, 7 and 8 (eye limits and averaging apertures). ` +
  "https://doi.org/10.1097/HP.0b013e3182983fd4";

export default defineSchema({
  href: "/laser-safety/infrared-hazard",
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 10600, min: 180, max: 1e6 },
    { key: "power", label: "Power", unit: "W", toSI: 1, siUnit: "W", default: 10, min: 0, max: 1e12 },
    { key: "beamDiameter", label: "Beam diameter, 1/e²", unit: "mm", toSI: 1e-3, siUnit: "m", default: 5, min: 0.01, max: 1e6 },
    { key: "exposureTime", label: "Exposure time", unit: "s", toSI: 1, siUnit: "s", default: 10, min: 1e-9, max: 30000 },
  ],
  outputs: [
    { key: "maxPower", label: "Max power for this time (governing limit)", unit: "W", toSI: 1, siUnit: "W" },
    { key: "powerRatio", label: "Power / max power", unit: "", toSI: 1, siUnit: "" },
    { key: "aperture", label: "Averaging aperture of the governing limit", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "radiantExposure", label: "Governing limit as radiant exposure at t", unit: "J/m²", toSI: 1, siUnit: "J/m²" },
  ],
  compute({ wavelength, power, beamDiameter, exposureTime }) {
    const r = infraredHazard(wavelength, power, beamDiameter, exposureTime);
    if (!r.governing) {
      return {
        values: { maxPower: NaN, powerRatio: NaN, aperture: NaN, radiantExposure: NaN },
        warnings: ["The eye limits cover 180 nm to 1 mm."],
      };
    }
    const g = r.governing;
    return { values: { maxPower: g.pMax, powerRatio: r.ratio, aperture: g.D, radiantExposure: g.H } };
  },
  checks: [
    {
      // 10.6 µm (corneal IR limit), t = 0.1 s, d = 5 mm (1/e²): H = 5.6×10³ t^0.25 = 3149.111421 J/m² (irradiance
      // 31491.11421 W/m²). H/t falls as t^−0.75, so the tightest ratio is at t = 0.1, over the 1 mm aperture (below 0.35 s).
      // Per watt the Gaussian beam gives (1 − exp(−2·1/25)) / (π/4·1e-6) W/m², so
      // P_max = 31491.11421 · π/4·1e-6 / (1 − exp(−0.08)) = 0.3216946919 W; 10 W / P_max = 31.08537458.
      source: TABLES,
      basis: "computed",
      inputs: { wavelength: 10600, power: 10, beamDiameter: 5, exposureTime: 0.1 },
      expect: { maxPower: 0.3216946919, powerRatio: 31.08537458, aperture: 1, radiantExposure: 3149.111421 },
      tolerance: 1e-8,
    },
  ],
});
