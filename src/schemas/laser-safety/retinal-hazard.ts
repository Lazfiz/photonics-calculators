import { apertureIrradiance, T_MAX, T_MIN } from "../../physics/laser-safety/eye-exposure-limits";
import {
  governingMaxPower, pupilPower, PUPIL_DIAMETER, retinalGain, retinalImageDiameter, retinalIrradiance,
} from "../../physics/laser-safety/retinal-image";
import { defineSchema } from "../types";
import { ICNIRP_2013 } from "./common";

const SOURCE = `${ICNIRP_2013}. Table 5 (eye limits), Table 8 (apertures) and the eye model of the module header ` +
  "(17 mm reduced eye, α_min = 1.5 mrad; Sliney & Wolbarsht, Safety with Lasers and Other Optical Sources, Plenum 1980). " +
  "https://doi.org/10.1097/HP.0b013e3182983fd4";

export default defineSchema({
  href: "/laser-safety/retinal-hazard",
  inputs: [
    { key: "wavelength", label: "Wavelength (400–1400 nm)", unit: "nm", toSI: 1e-9, siUnit: "m", default: 532, min: 400, max: 1399 },
    { key: "power", label: "Power", unit: "mW", toSI: 1e-3, siUnit: "W", default: 10, min: 0, max: 1e9 },
    { key: "beamDiam", label: "Beam diameter, 1/e²", unit: "mm", toSI: 1e-3, siUnit: "m", default: 2, min: 0.01, max: 1e4 },
    { key: "exposureTime", label: "Exposure time", unit: "s", toSI: 1, siUnit: "s", default: 0.25, min: T_MIN, max: T_MAX },
    { key: "pupil", label: "Pupil diameter", unit: "mm", toSI: 1e-3, siUnit: "m", default: 7, min: 1, max: 9 },
  ],
  outputs: [
    { key: "powerIntoEye", label: "Power into the eye", unit: "mW", toSI: 1e-3, siUnit: "W" },
    { key: "imageDiameter", label: "Retinal image diameter", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "retinalIrradiance", label: "Retinal irradiance", unit: "W/m²", toSI: 1, siUnit: "W/m²" },
    { key: "cornealIrradiance", label: "Corneal irradiance (7 mm)", unit: "W/m²", toSI: 1, siUnit: "W/m²" },
    { key: "gainSevenMm", label: "Retina / cornea irradiance gain at a 7 mm pupil", unit: "", toSI: 1, siUnit: "" },
    { key: "maxPower", label: "Max power within the eye limits", unit: "mW", toSI: 1e-3, siUnit: "W" },
    { key: "powerOverMax", label: "Power / max power", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ wavelength, power, beamDiam, exposureTime, pupil }) {
    const s = retinalImageDiameter(wavelength, beamDiam, pupil);
    const governing = governingMaxPower(wavelength, beamDiam, exposureTime);
    const warnings: string[] = [];
    if (!governing) warnings.push("No eye limit applies at this wavelength.");
    return {
      values: {
        powerIntoEye: pupilPower(power, beamDiam, pupil),
        imageDiameter: s,
        retinalIrradiance: retinalIrradiance(power, beamDiam, s, pupil),
        cornealIrradiance: apertureIrradiance(power, beamDiam, PUPIL_DIAMETER),
        gainSevenMm: retinalGain(s),
        maxPower: governing ? governing.pMax : NaN,
        powerOverMax: governing ? power / governing.pMax : NaN,
      },
      warnings,
    };
  },
  checks: [
    {
      // 532 nm, 2 mm, 0.25 s, 7 mm pupil: image 4λf/(πd) = 4·532e-9·0.017/(π·2e-3) = 5.76 µm < 25.5 µm floor → 25.5 µm.
      // Pupil passes 10 mW·(1 − e^(−2·(7/2)²)) = 10 mW·(1 − 2.3e-11) ≈ 10 mW; E_retina = 10 mW/(π(12.75 µm)²)
      // = 1e-2/5.1070e-10 = 1.9581e7 W/m²; E_cornea = 1e-2/(π(3.5 mm)²) = 259.84 W/m²; gain 75355.63.
      // Limit: 400–700 nm, 18 µs–10 s: 18 t^0.75 = 6.36396 J/m² → 25.45584 W/m² over the 7 mm aperture (38.48451 mm²)
      // → 0.97965569 mW (as the MPE page); P/Pmax = 10/0.97965569 = 10.2077.
      source: SOURCE,
      basis: "computed",
      inputs: { wavelength: 532, power: 10, beamDiam: 2, exposureTime: 0.25, pupil: 7 },
      expect: {
        imageDiameter: 25.5, retinalIrradiance: 19580769.62, cornealIrradiance: 259.844805, gainSevenMm: 75355.63245,
        maxPower: 0.9796556879, powerOverMax: 10.20766798,
      },
      tolerance: 1e-8,
    },
  ],
});
