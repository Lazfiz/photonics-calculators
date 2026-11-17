import { T_MAX, T_MIN } from "../../physics/laser-safety/eye-exposure-limits";
import {
  diffuseHazardDistance, effectiveDiameterAt, nominalOcularHazardDistance, requiredOpticalDensity, roundBeam,
} from "../../physics/laser-safety/hazard-distance";
import { classifyCw, type LaserClass } from "../../physics/laser-safety/laser-classes";
import { defineSchema } from "../types";
import { ICNIRP_2013, WAVELENGTH } from "./common";

const LAB_SOURCES = `${ICNIRP_2013}, Tables 5 and 8; OD = log₁₀(H₀/MPE) as in ANSI Z136.1-2014 Appendix B; ` +
  "IEC 60825-1:2014 Tables 3–9 (class limits)";

/** The class as a number, in the order of the standard's classes. */
const RANK: Record<LaserClass, number> = { "1": 1, "1M": 2, "2": 3, "2M": 4, "3R": 5, "3B": 6, "4": 7 };

export default defineSchema({
  href: "/laser-safety/research-lab-safety",
  inputs: [
    { key: "power", label: "CW power", unit: "mW", toSI: 1e-3, siUnit: "W", default: 300, min: 0, max: 1e12 },
    { ...WAVELENGTH, default: 780 },
    { key: "beamDia", label: "Beam diameter at the output, 1/e²", unit: "mm", toSI: 1e-3, siUnit: "m", default: 1.5, min: 0.001, max: 1e6 },
    { key: "divergence", label: "Divergence, 1/e² full angle", unit: "mrad", toSI: 1e-3, siUnit: "rad", default: 1.5, min: 0, max: 1e6 },
    { key: "exposureTime", label: "Eye exposure time", unit: "s", toSI: 1, siUnit: "s", default: 10, min: 1e-9, max: 30000 },
    { key: "labLength", label: "Lab length", unit: "m", toSI: 1, siUnit: "m", default: 5, min: 0, max: 1e6 },
    { key: "labWidth", label: "Lab width", unit: "m", toSI: 1, siUnit: "m", default: 4, min: 0, max: 1e6 },
  ],
  outputs: [
    { key: "classRank", label: "Class: 1 = Class 1, 2 = 1M, 3 = Class 2, 4 = 2M, 5 = 3R, 6 = 3B, 7 = Class 4", unit: "", toSI: 1, siUnit: "" },
    { key: "nohd", label: "Nominal ocular hazard distance of the direct beam (0: within the limit at the output)", unit: "m", toSI: 1, siUnit: "m" },
    { key: "od", label: "Eyewear optical density for the whole output beam (round up)", unit: "", toSI: 1, siUnit: "" },
    { key: "diffuseDistance", label: "Diffuse-reflection hazard distance, white wall (0: none)", unit: "m", toSI: 1, siUnit: "m" },
    { key: "beamAtWall", label: "Beam diameter at the room diagonal", unit: "mm", toSI: 1e-3, siUnit: "m" },
  ],
  compute({ power, wavelength, beamDia, divergence, exposureTime, labLength, labWidth }) {
    const t = Math.min(Math.max(exposureTime, T_MIN), T_MAX);
    const diagonal = Math.hypot(labLength, labWidth);
    const beam = roundBeam(beamDia, divergence);
    const cls = classifyCw(wavelength, power, { d: beamDia, phi: divergence });
    const nohd = nominalOcularHazardDistance(wavelength, power, beam, t);
    const warnings: string[] = [];
    if (cls.laserClass === null || Number.isNaN(nohd.distance)) warnings.push("The eye limits cover 180 nm to 1 mm.");
    else if (nohd.distance > diagonal) warnings.push("The direct beam is hazardous at every wall of the room.");
    return {
      values: {
        classRank: cls.laserClass === null ? NaN : RANK[cls.laserClass],
        nohd: nohd.distance,
        od: requiredOpticalDensity(wavelength, power, beamDia, t).od,
        diffuseDistance: diffuseHazardDistance(wavelength, power, beamDia, t).distance,
        beamAtWall: effectiveDiameterAt(beam, diagonal),
      },
      warnings,
    };
  },
  checks: [
    {
      // 532 nm, 1 W, 2 mm (1/e²), 0.25 s: all of it inside 7 mm, P_max = 18 t^0.75/t · π(7 mm)²/4 / (1 − e^−24.5)
      // = 0.97966 mW, OD = log₁₀(1 W/P_max) = 3.0089; 1 W is Class 4 (rank 7).
      source: LAB_SOURCES,
      basis: "computed",
      inputs: { power: 1000, wavelength: 532, beamDia: 2, exposureTime: 0.25 },
      expect: { classRank: 7, od: 3.008926536 },
      tolerance: 1e-8,
    },
    {
      // Room 3 m × 4 m: diagonal 5 m; beam √(d² + (rφ)²) = √(1.5² + (5 m × 1.5 mrad)²) = √58.5 = 7.648529 mm.
      source: "Gaussian beam growth √(d² + (rφ)²), the beam diameter of ANSI Z136.1 Appendix B's NOHD (1/φ)√(4P/(π MPE) − a²) " +
        "(Eq. B51 of the 2007 edition, quoted in Sandia report SAND2007-5052, p. 31)",
      basis: "computed",
      inputs: { labLength: 3, labWidth: 4 },
      expect: { beamAtWall: 7.648529270 },
      tolerance: 1e-8,
    },
  ],
});
