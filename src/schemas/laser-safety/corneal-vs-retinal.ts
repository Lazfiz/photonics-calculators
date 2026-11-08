import { eyeLimits } from "../../physics/laser-safety/eye-exposure-limits";
import {
  retinalGain, retinalImageDiameter, retinalIrradiance, tissueMaxPower,
} from "../../physics/laser-safety/retinal-image";
import { defineSchema } from "../types";
import { EXPOSURE, ICNIRP_2013, WAVELENGTH } from "./common";

const TABLE_5 = `${ICNIRP_2013}. Table 5 (eye limits), Table 8 (apertures) and the eye model of the module header ` +
  "(17 mm reduced eye, α_min = 1.5 mrad; Sliney & Wolbarsht, Safety with Lasers and Other Optical Sources, Plenum 1980). " +
  "https://doi.org/10.1097/HP.0b013e3182983fd4";

export default defineSchema({
  href: "/laser-safety/corneal-vs-retinal",
  inputs: [
    { ...WAVELENGTH, default: 1300 },
    { ...EXPOSURE, key: "exposureTime", default: 10, max: 30000 },
    { key: "beamDiam", label: "Beam diameter, 1/e²", unit: "mm", toSI: 1e-3, siUnit: "m", default: 3, min: 0.01, max: 1e4 },
  ],
  outputs: [
    { key: "retinaMaxPower", label: "Retina: max power", unit: "mW", toSI: 1e-3, siUnit: "W" },
    { key: "frontMaxPower", label: "Cornea / lens: max power", unit: "mW", toSI: 1e-3, siUnit: "W" },
    { key: "retinalImageDiameter", label: "Retinal image diameter", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "retinalGain", label: "Retina / cornea irradiance gain", unit: "", toSI: 1, siUnit: "" },
    { key: "retinalIrradiance", label: "Retinal irradiance at the retinal max power", unit: "W/m²", toSI: 1, siUnit: "W/m²" },
  ],
  compute({ wavelength, exposureTime, beamDiam }) {
    const limits = eyeLimits(wavelength);
    const retina = tissueMaxPower(limits, true, beamDiam, exposureTime);
    const front = tissueMaxPower(limits, false, beamDiam, exposureTime);
    const warnings: string[] = [];
    if (!retina) warnings.push("The retina is not reached at this wavelength (absorbed in front); no retinal limit, image or gain.");
    if (!front) warnings.push("No separate limit for the cornea and lens here: the retinal limits protect the front of the eye.");
    if (!retina && !front) warnings.push("The eye limits cover 180 nm to 1 mm.");
    const s = retinalImageDiameter(wavelength, beamDiam);
    return {
      values: {
        retinaMaxPower: retina ? retina.pMax : NaN,
        frontMaxPower: front ? front.pMax : NaN,
        retinalImageDiameter: retina ? s : NaN,
        retinalGain: retina ? retinalGain(s) : NaN,
        retinalIrradiance: retina ? retinalIrradiance(retina.pMax, beamDiam, s) : NaN,
      },
      warnings,
    };
  },
  checks: [
    {
      // 532 nm, 3 mm, 10 s: image 4λf/(πd) = 4·532e-9·0.017/(π·3e-3) = 3.838 µm, below the 25.5 µm floor, so 25.5 µm;
      // gain (7 mm/25.5 µm)² = (274.5098)² = 75355.63245. Retinal limit at t ≥ 10 s: 10 W/m² over the 7 mm aperture (Table 5,
      // 400–700 nm, t > 10 s thermal 10 W/m²; below the photochemical 100 C_B), P = 10·π(3.5 mm)²/(1 − e^(−2(7/3)²))
      // = 3.848451e-5 W · (1 + 1.867e-5) = 0.38485228 mW; the pupil passes P(1 − e^(−2(7/3)²)) = 10 W/m² · 38.48 mm²,
      // so E_retina = 10 W/m² · gain = 753556.3 W/m².
      source: TABLE_5,
      basis: "computed",
      inputs: { wavelength: 532, exposureTime: 10, beamDiam: 3 },
      expect: { retinaMaxPower: 0.3848522831, retinalImageDiameter: 25.5, retinalGain: 75355.63245, retinalIrradiance: 753556.3245 },
      tolerance: 1e-8,
    },
  ],
});
