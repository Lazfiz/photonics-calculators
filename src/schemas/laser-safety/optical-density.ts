import { requiredOpticalDensity } from "../../physics/laser-safety/hazard-distance";
import { defineSchema } from "../types";
import { BEAM_DEFINITION, EXPOSURE, ICNIRP_2013, SAFETY_FACTOR, toOneOverESquared, WAVELENGTH } from "./common";

export default defineSchema({
  href: "/laser-safety/optical-density",
  choices: [BEAM_DEFINITION],
  inputs: [
    WAVELENGTH,
    { key: "power", label: "Beam power", unit: "mW", toSI: 1e-3, siUnit: "W", default: 500, min: 0, max: 1e9 },
    { key: "beamDiam", label: "Beam diameter", unit: "mm", toSI: 1e-3, siUnit: "m", default: 3, min: 0.01, max: 1e4 },
    EXPOSURE,
    { ...SAFETY_FACTOR, default: 10 },
  ],
  outputs: [
    { key: "od", label: "Required optical density (round up for eyewear)", unit: "", toSI: 1, siUnit: "" },
    { key: "maxPower", label: "Largest power within every limit, safety factor included", unit: "mW", toSI: 1e-3, siUnit: "W" },
    { key: "odWithoutSafetyFactor", label: "Optical density without the safety factor", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ beamDefinition, wavelength, power, beamDiam, exposure, safetyFactor }) {
    const d = beamDiam * toOneOverESquared(beamDefinition);
    // The safety factor divides every limit, which multiplies the power.
    const result = requiredOpticalDensity(wavelength, power * safetyFactor, d, exposure);
    const pMax = Math.min(...result.limits.map((l) => l.pMax));
    return {
      values: {
        od: result.od,
        maxPower: pMax / safetyFactor,
        odWithoutSafetyFactor: Math.max(0, result.od - Math.log10(safetyFactor)),
      },
      warnings: Number.isNaN(result.od) ? ["No ICNIRP limit applies at this wavelength and time."] : [],
    };
  },
  checks: [
    {
      // 532 nm, 1 W, 2 mm (1/e²), 0.25 s: all of it inside 7 mm, P_max = 18 t^0.75/t · π(7 mm)²/4 / (1 − e^−24.5)
      // = 0.97966 mW, OD = log₁₀(1 W/P_max) = 3.0089 (ANSI Z136.1's OD = log₁₀(H/MPE)).
      source: `${ICNIRP_2013}, Tables 5 and 8; OD = log₁₀(H₀/MPE) as in ANSI Z136.1-2014 Appendix B.`,
      basis: "computed",
      inputs: { wavelength: 532, power: 1000, beamDiam: 2, exposure: 0.25, safetyFactor: 1, beamDefinition: "1/e2" },
      expect: { od: 3.008926536, maxPower: 0.9796556879 },
      tolerance: 1e-8,
    },
  ],
});
