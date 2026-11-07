import { apertureIrradiance } from "../../physics/laser-safety/eye-exposure-limits";
import { defineSchema } from "../types";
import { BEAM_DEFINITION, SAFETY_FACTOR, toOneOverESquared } from "./common";

export default defineSchema({
  href: "/laser-safety/od-requirements",
  choices: [BEAM_DEFINITION],
  inputs: [
    { key: "power", label: "Beam power", unit: "mW", toSI: 1e-3, siUnit: "W", default: 500, min: 0, max: 1e9 },
    { key: "beamDiameter", label: "Beam diameter", unit: "mm", toSI: 1e-3, siUnit: "m", default: 2, min: 0, max: 1e4 },
    { key: "validatedMpeIrradiance", label: "Exposure limit you supply, as an irradiance", unit: "W/cm²", toSI: 1e4, siUnit: "W/m²", default: 0.0025, min: 1e-12, max: 1e9 },
    { key: "aperture", label: "Averaging aperture of that limit", unit: "mm", toSI: 1e-3, siUnit: "m", default: 7, min: 0.1, max: 1000 },
    SAFETY_FACTOR,
  ],
  outputs: [
    { key: "irradiance", label: "Beam irradiance averaged over the aperture", unit: "W/cm²", toSI: 1e4, siUnit: "W/m²" },
    { key: "target", label: "Target irradiance: limit / safety factor", unit: "W/cm²", toSI: 1e4, siUnit: "W/m²" },
    { key: "od", label: "Required optical density log₁₀(E/target)", unit: "", toSI: 1, siUnit: "" },
    { key: "powerBehindFilter", label: "Beam power behind a filter of that OD", unit: "mW", toSI: 1e-3, siUnit: "W" },
  ],
  compute({ beamDefinition, power, beamDiameter, validatedMpeIrradiance, aperture, safetyFactor }) {
    // Gaussian beam averaged over the centred aperture.
    const E = apertureIrradiance(power, beamDiameter * toOneOverESquared(beamDefinition), aperture);
    const target = validatedMpeIrradiance / safetyFactor;
    const od = Math.max(0, Math.log10(E / target)); // log₁₀ 0 = −∞ gives 0
    return { values: { irradiance: E, target, od, powerBehindFilter: power * 10 ** -od } };
  },
  checks: [
    {
      // 500 mW, 2 mm (1/e²) inside 7 mm: E = 0.5 W (1 − e^−24.5)/(π 0.7² cm²/4) = 1.29922 W/cm²; against the visible
      // 0.25 s limit 2.5 mW/cm², OD = log₁₀(1.29922/0.0025) = 2.7157.
      source: "ANSI Z136.1-2014, American National Standard for Safe Use of Lasers, Appendix B: OD = log₁₀(H₀/MPE), " +
        "with the irradiance averaged over the limiting aperture (7 mm in the visible, ICNIRP 2013 Table 8).",
      basis: "computed",
      inputs: { power: 500, beamDiameter: 2, validatedMpeIrradiance: 0.0025, aperture: 7, safetyFactor: 1, beamDefinition: "1/e2" },
      expect: { irradiance: 1.299224025, od: 2.715744034, powerBehindFilter: 0.9621127502 },
      tolerance: 1e-8,
    },
  ],
});
