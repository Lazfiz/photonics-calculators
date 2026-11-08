import { exposureDuration } from "../../physics/laser-safety/eye-exposure-limits";
import { defineSchema } from "../types";
import { ICNIRP_2013, WAVELENGTH } from "./common";

const TABLES = `${ICNIRP_2013}. Tables 3, 5, 7 and 8 (eye limits, point source, CW exposure; apertures). ` +
  "https://doi.org/10.1097/HP.0b013e3182983fd4";

export default defineSchema({
  href: "/laser-safety/exposure-duration",
  inputs: [
    WAVELENGTH,
    { key: "power", label: "Power", unit: "mW", toSI: 1e-3, siUnit: "W", default: 100, min: 0.001, max: 1e12 },
    { key: "beamDiameter", label: "Beam diameter, 1/e²", unit: "mm", toSI: 1e-3, siUnit: "m", default: 3, min: 0.01, max: 1e6 },
  ],
  outputs: [
    { key: "maxTime", label: "Max safe exposure time", unit: "s", toSI: 1, siUnit: "s" },
    { key: "aperture", label: "Averaging aperture of the limiting limit (at its max time)", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "irradiance", label: "Beam irradiance over that aperture", unit: "W/m²", toSI: 1, siUnit: "W/m²" },
    { key: "limit", label: "That limit as radiant exposure", unit: "J/m²", toSI: 1, siUnit: "J/m²" },
  ],
  compute({ wavelength, power, beamDiameter }) {
    const r = exposureDuration(wavelength, power, beamDiameter);
    const nan = { maxTime: NaN, aperture: NaN, irradiance: NaN, limit: NaN };
    if (r.limits.length === 0) return { values: nan, warnings: ["The eye limits cover 180 nm to 1 mm."] };
    const l = r.limits.find((x) => x.kind === r.limiting);
    if (!l) {
      return {
        values: nan,
        warnings: [Number.isNaN(r.tMax) ? "The beam exceeds a limit already at 1 ns." : "No limit is reached in 30 000 s."],
      };
    }
    return { values: { maxTime: r.tMax, aperture: l.aperture, irradiance: l.irradiance, limit: l.limit } };
  },
  checks: [
    {
      // 532 nm, 1 mW, d = 3 mm (1/e²): the 400–700 nm retinal thermal limit 18 t^0.75 J/m² over 7 mm (5 µs – 10 s).
      // E = P (1 − exp(−2 D²/d²)) / (π D²/4) = 1e-3 (1 − exp(−2·49/9)) / 3.8484510e-5 = 25.98399552 W/m².
      // 18 t^0.75 = E t → t = (18/E)^4 = 0.2302853390 s; H = 18 t^0.75 = 5.983733218 J/m².
      source: TABLES,
      basis: "computed",
      inputs: { wavelength: 532, power: 1, beamDiameter: 3 },
      expect: { maxTime: 0.2302853390, aperture: 7, irradiance: 25.98399552, limit: 5.983733218 },
      tolerance: 1e-8,
    },
  ],
});
