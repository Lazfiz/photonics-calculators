import { aelEnergy, cwClassLimit, exposureLimitEnergy } from "../../physics/laser-safety/laser-classes";
import { defineSchema } from "../types";
import { EXPOSURE, ICNIRP_2013, WAVELENGTH } from "./common";

const TABLE_5 = `${ICNIRP_2013}. Table 5 (eye limits, point source) and Table 8 (apertures). ` +
  "https://doi.org/10.1097/HP.0b013e3182983fd4";

export default defineSchema({
  href: "/laser-safety/ansi-iec-comparison",
  inputs: [{ ...WAVELENGTH, default: 355 }, { ...EXPOSURE, default: 100, key: "exposureTime", label: "Exposure or emission duration" }],
  outputs: [
    { key: "mpeRadiantExposure", label: "Exposure limit (MPE), ICNIRP 2013, as radiant exposure", unit: "J/m²", toSI: 1, siUnit: "J/m²" },
    { key: "mpeEnergy", label: "The MPE as energy through its averaging aperture", unit: "J", toSI: 1, siUnit: "J" },
    { key: "mpeAperture", label: "Averaging aperture of that limit", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "aelEnergy", label: "Class 1 AEL (IEC 60825-1:2014 rebuilt), as energy through its stop", unit: "J", toSI: 1, siUnit: "J" },
    { key: "aelStop", label: "Measurement stop of that AEL", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "aelOverMpe", label: "AEL / exposure limit (as energy)", unit: "", toSI: 1, siUnit: "" },
    { key: "cwPower", label: "Class 1 AEL for a CW laser (all of the beam inside the stop)", unit: "mW", toSI: 1e-3, siUnit: "W" },
  ],
  compute({ wavelength, exposureTime }) {
    const mpe = exposureLimitEnergy(wavelength, exposureTime);
    const ael = aelEnergy("1", wavelength, exposureTime);
    const cw = cwClassLimit("1", wavelength, 0);
    if (!Number.isFinite(mpe.energy) || !Number.isFinite(ael.energy)) {
      return {
        values: { mpeRadiantExposure: NaN, mpeEnergy: NaN, mpeAperture: NaN, aelEnergy: NaN, aelStop: NaN, aelOverMpe: NaN, cwPower: NaN },
        warnings: ["The limits cover 180 nm to 1 mm."],
      };
    }
    const mpeArea = (Math.PI * mpe.aperture * mpe.aperture) / 4;
    return {
      values: {
        mpeRadiantExposure: mpe.energy / mpeArea,
        mpeEnergy: mpe.energy,
        mpeAperture: mpe.aperture,
        aelEnergy: ael.energy,
        aelStop: ael.stop,
        aelOverMpe: ael.energy / mpe.energy,
        cwPower: cw.power,
      },
    };
  },
  checks: [
    {
      // 532 nm, 0.25 s, point source: 18 t^0.75 J/m² = 18·0.353553391 = 6.363961031 J/m² over 7 mm (A = π(3.5 mm)² =
      // 3.848451001e-5 m²): 2.449139220e-4 J. The Class 1 AEL is the same limit times the stop area (ratio 1). CW: 10 W/m²
      // from 10 s (the thermal limit) × A = 0.3848451001 mW over the 100 s time base.
      source: TABLE_5,
      basis: "computed",
      inputs: { wavelength: 532, exposureTime: 0.25 },
      expect: { mpeRadiantExposure: 6.363961031, mpeEnergy: 2.449139220e-4, mpeAperture: 7, aelEnergy: 2.449139220e-4, aelOverMpe: 1, cwPower: 0.3848451001 },
      tolerance: 1e-8,
    },
    {
      // 1550 nm, 100 s: 1000 W/m² × 100 s = 1e5 J/m² over 3.5 mm (A = π(1.75 mm)² = 9.621127502e-6 m²): 0.9621127502 J.
      // CW: 1000 W/m² × A = 9.621127502 mW.
      source: TABLE_5,
      basis: "computed",
      inputs: { wavelength: 1550, exposureTime: 100 },
      expect: { mpeRadiantExposure: 1e5, mpeEnergy: 0.9621127502, mpeAperture: 3.5, aelOverMpe: 1, cwPower: 9.621127502 },
      tolerance: 1e-8,
    },
  ],
});
