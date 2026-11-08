import { classifyCw, escapingBeam, type ClassCheck, type LaserClass } from "../../physics/laser-safety/laser-classes";
import { defineSchema } from "../types";
import { WAVELENGTH } from "./common";

const DEFAULT_NM = 1064;
const IEC_ENCLOSURE = "IEC 60825-1:2014, Safety of laser products, Part 1: Equipment classification and requirements, " +
  "classification by accessible emission, Tables 3–9 (AELs, rebuilt from the ICNIRP 2013 eye limits); a centred Gaussian beam of 1/e² diameter d passes " +
  "an opening of diameter D with the share 1 − exp(−2D²/d²)";

/** The class as a number, in the order of the standard's classes. */
const RANK: Record<LaserClass, number> = { "1": 1, "1M": 2, "2": 3, "2M": 4, "3R": 5, "3B": 6, "4": 7 };

/** Largest power of the beam within a class under every applied condition, W. */
const classMax = (c: ClassCheck) => Math.min(c.condition3.power, c.condition1?.power ?? Infinity);

export default defineSchema({
  href: "/laser-safety/enclosure-class",
  inputs: [
    { key: "laserPower", label: "Laser power inside the enclosure", unit: "mW", toSI: 1e-3, siUnit: "W", default: 5000, min: 0, max: 1e12 },
    { ...WAVELENGTH, default: DEFAULT_NM },
    { key: "beamDia", label: "Beam diameter at the opening, 1/e²", unit: "mm", toSI: 1e-3, siUnit: "m", default: 2, min: 0.001, max: 1e6 },
    { key: "divergence", label: "Divergence, 1/e² full angle", unit: "mrad", toSI: 1e-3, siUnit: "rad", default: 1, min: 0, max: 1e6 },
    { key: "apertureSize", label: "Opening diameter", unit: "mm", toSI: 1e-3, siUnit: "m", default: 5, min: 0, max: 1e6 },
    { key: "windowOD", label: "Window or filter optical density over the opening", unit: "", toSI: 1, siUnit: "", default: 4, min: 0, max: 100 },
  ],
  outputs: [
    { key: "accessible", label: "Accessible emission outside the enclosure", unit: "mW", toSI: 1e-3, siUnit: "W" },
    { key: "classRank", label: "Class: 1 = Class 1, 2 = 1M, 3 = Class 2, 4 = 2M, 5 = 3R, 6 = 3B, 7 = Class 4", unit: "", toSI: 1, siUnit: "" },
    { key: "class1Limit", label: "Class 1 limit for the escaping beam", unit: "mW", toSI: 1e-3, siUnit: "W" },
    { key: "odClass1", label: "Optical density the opening needs for Class 1 (window included)", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ laserPower, wavelength, beamDia, divergence, apertureSize, windowOD }) {
    const throughOpening = escapingBeam(laserPower, beamDia, apertureSize, 0).power;
    const { power: accessible, d: dOut } = escapingBeam(laserPower, beamDia, apertureSize, windowOD);
    const r = classifyCw(wavelength, accessible, { d: dOut, phi: divergence });
    if (r.laserClass === null) {
      return {
        values: { accessible, classRank: NaN, class1Limit: NaN, odClass1: NaN },
        warnings: ["IEC 60825-1 covers 180 nm to 1 mm."],
      };
    }
    const class1Limit = classMax(r.checks[0]);
    return {
      values: {
        accessible,
        classRank: RANK[r.laserClass],
        class1Limit,
        odClass1: Math.max(0, Math.log10(throughOpening / class1Limit)),
      },
      warnings: [],
    };
  },
  checks: [
    {
      // 1064 nm, 5 W in a 2 mm beam through a 5 mm opening under OD 4: the opening passes 1 − exp(−2·25/4) =
      // 1 − e^−12.5 = 1 − 3.7266532e-6, the window 10^−4: 5000 mW × 1e-4 × (1 − 3.7266532e-6) = 0.4999981367 mW.
      source: IEC_ENCLOSURE,
      basis: "computed",
      inputs: { laserPower: 5000, wavelength: 1064, beamDia: 2, apertureSize: 5, windowOD: 4 },
      expect: { accessible: 0.4999981367 },
      tolerance: 1e-8,
    },
  ],
});
