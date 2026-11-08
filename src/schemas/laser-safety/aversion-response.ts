import { aversionLimit } from "../../physics/laser-safety/aversion-response";
import { defineSchema } from "../types";
import { ICNIRP_2013 } from "./common";

const SOURCE = `${ICNIRP_2013}. Table 5 (retinal thermal limit 18 t^0.75 J/m², 400–700 nm, 5 µs – 10 s) and Table 8 ` +
  "(7 mm aperture); aversion time 0.25 s as in IEC 60825-1 (Class 2). https://doi.org/10.1097/HP.0b013e3182983fd4";

export default defineSchema({
  href: "/laser-safety/aversion-response",
  inputs: [
    { key: "wavelength", label: "Wavelength (visible 400–700)", unit: "nm", toSI: 1e-9, siUnit: "m", default: 632, min: 400, max: 700 },
  ],
  outputs: [
    { key: "radiantExposure", label: "Radiant exposure limit at t = 0.25 s", unit: "mJ/cm²", toSI: 10, siUnit: "J/m²" },
    { key: "irradiance", label: "Irradiance limit H/t", unit: "mW/cm²", toSI: 10, siUnit: "W/m²" },
    { key: "aperture", label: "Averaging aperture", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "maxPower", label: "Maximum power into the aperture", unit: "mW", toSI: 1e-3, siUnit: "W" },
  ],
  compute({ wavelength }) {
    const r = aversionLimit(wavelength);
    if (r === null) {
      return {
        values: { radiantExposure: NaN, irradiance: NaN, aperture: NaN, maxPower: NaN },
        warnings: ["No aversion response is assumed outside 400–700 nm: the 0.25 s limit does not apply."],
      };
    }
    return {
      values: { radiantExposure: r.radiantExposure, irradiance: r.irradiance, aperture: r.aperture, maxPower: r.maxPower },
    };
  },
  checks: [
    {
      // H = 18·0.25^0.75 = 18·0.3535533906 = 6.363961031 J/m² = 0.6363961031 mJ/cm²; H/t = 25.45584412 W/m² =
      // 2.545584412 mW/cm²; through D = 7 mm: 25.45584412·π·(3.5e-3)² = 0.9796556879 mW (the Class 2 value 1 mW, rounded).
      source: SOURCE,
      basis: "computed",
      inputs: { wavelength: 632 },
      expect: { radiantExposure: 0.6363961031, irradiance: 2.545584412, aperture: 7, maxPower: 0.9796556879 },
      tolerance: 1e-8,
    },
  ],
});
