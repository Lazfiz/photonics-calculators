import {
  averagedOnly, exposureLimit, eyeLimits, limitingAperture, limitMaxPower,
} from "../../physics/laser-safety/eye-exposure-limits";
import { defineSchema } from "../types";
import { EXPOSURE, ICNIRP_2013, WAVELENGTH } from "./common";

const TABLE_5 = `${ICNIRP_2013}. Table 5 (eye limits, point source) and Table 8 (apertures). ` +
  "https://doi.org/10.1097/HP.0b013e3182983fd4";

export default defineSchema({
  href: "/laser-safety/mpe",
  inputs: [WAVELENGTH, EXPOSURE],
  outputs: [
    { key: "radiantExposure", label: "MPE, radiant exposure H (the lowest limit in force at t)", unit: "J/m²", toSI: 1, siUnit: "J/m²" },
    { key: "irradiance", label: "MPE, irradiance H/t for a constant exposure", unit: "W/m²", toSI: 1, siUnit: "W/m²" },
    { key: "aperture", label: "Averaging aperture of that limit", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "maxPowerNarrowBeam", label: "Largest power of a beam inside every aperture", unit: "mW", toSI: 1e-3, siUnit: "W" },
  ],
  compute({ wavelength, exposure }) {
    // The limits in force at t (the photochemical one starts at 10 s).
    const rows = eyeLimits(wavelength)
      .map((limit) => ({
        H: exposureLimit(limit, exposure),
        D: limitingAperture(limit, exposure),
        pMax: limitMaxPower({ ...limit, apertures: averagedOnly(limit.apertures) }, 0, exposure),
      }))
      .filter((r) => Number.isFinite(r.H));
    if (rows.length === 0) {
      return {
        values: { radiantExposure: NaN, irradiance: NaN, aperture: NaN, maxPowerNarrowBeam: NaN },
        warnings: ["No ICNIRP limit applies at this wavelength and time."],
      };
    }
    // The lowest radiant exposure is the MPE of a beam wider than the apertures; for a narrow beam the apertures
    // differ, so the lowest power decides.
    const mpe = rows.reduce((m, r) => (r.H < m.H ? r : m));
    return {
      values: {
        radiantExposure: mpe.H,
        irradiance: mpe.H / exposure,
        aperture: mpe.D,
        maxPowerNarrowBeam: Math.min(...rows.map((r) => r.pMax)),
      },
    };
  },
  checks: [
    {
      // 400–700 nm, 5 µs – 10 s: 18 t^0.75 J/m² = 6.364 J/m² at 0.25 s; over 7 mm that is 0.980 mW (IEC Class 2 ≈ 1 mW).
      source: TABLE_5,
      basis: "computed",
      inputs: { wavelength: 532, exposure: 0.25 },
      expect: { radiantExposure: 6.363961031, irradiance: 25.45584412, aperture: 7, maxPowerNarrowBeam: 0.9796556879 },
      tolerance: 1e-9,
    },
    {
      // 532 nm, 100 s: 10 W/m² (thermal) is below the photochemical 100 C_B = 43.7 W/m²; 0.385 mW through 7 mm.
      source: TABLE_5,
      basis: "computed",
      inputs: { wavelength: 532, exposure: 100 },
      expect: { radiantExposure: 1000, maxPowerNarrowBeam: 0.3848451001 },
      tolerance: 1e-9,
    },
    {
      // 1050–1400 nm: 90 C_C t^0.75 J/m², C_C = 1 at 1064 nm: 90 J/m² at 1 s.
      source: TABLE_5,
      basis: "computed",
      inputs: { wavelength: 1064, exposure: 1 },
      expect: { radiantExposure: 90 },
      tolerance: 1e-9,
    },
  ],
});
