import { classifyCw, type ClassCheck, type ClassOptions, type LaserClass } from "../../physics/laser-safety/laser-classes";
import { defineSchema } from "../types";
import { WAVELENGTH } from "./common";

const DEFAULT_NM = 1550;
const IEC_CLASSES = "IEC 60825-1:2014, Safety of laser products, Part 1: Equipment classification and requirements, " +
  "Tables 3–9 (AELs of Classes 1, 2, 3R and 3B, rebuilt from the ICNIRP 2013 eye limits), measurement Conditions 1 and 3";

/** The class as a number, in the order of the standard's classes. */
const RANK: Record<LaserClass, number> = { "1": 1, "1M": 2, "2": 3, "2M": 4, "3R": 5, "3B": 6, "4": 7 };

/** Largest power of the beam within a class under every applied condition, W. */
const classMax = (c: ClassCheck) => Math.min(c.condition3.power, c.condition1?.power ?? Infinity);

export default defineSchema({
  href: "/laser-safety/classification",
  inputs: [
    { key: "power", label: "CW power", unit: "mW", toSI: 1e-3, siUnit: "W", default: 20, min: 0, max: 1e12 },
    { ...WAVELENGTH, default: DEFAULT_NM },
    { key: "beamDia", label: "Beam diameter at the output (waist), 1/e²", unit: "mm", toSI: 1e-3, siUnit: "m", default: 1, min: 0.001, max: 1e6 },
    { key: "divergence", label: "Divergence, 1/e² full angle", unit: "mrad", toSI: 1e-3, siUnit: "rad", default: 1, min: 0, max: 1e6 },
    { key: "alpha", label: "Apparent source α", unit: "mrad", toSI: 1e-3, siUnit: "rad", default: 1.5, min: 0, max: 100 },
    { key: "longTerm", label: "Time base above 400 nm: 0 = 100 s, 1 = 30 000 s (intended long-term viewing)", unit: "", toSI: 1, siUnit: "", default: 0, min: 0, max: 1 },
    { key: "telescopes", label: "Apply Condition 1 (telescopes or binoculars foreseeable): 1 = yes, 0 = indoor-only", unit: "", toSI: 1, siUnit: "", default: 1, min: 0, max: 1 },
    { key: "euA11", label: "EU: EN 60825-1:2014/A11:2021 skin AEL at 1250–1400 nm: 1 = yes", unit: "", toSI: 1, siUnit: "", default: 0, min: 0, max: 1 },
  ],
  outputs: [
    { key: "classRank", label: "Class: 1 = Class 1, 2 = 1M, 3 = Class 2, 4 = 2M, 5 = 3R, 6 = 3B, 7 = Class 4", unit: "", toSI: 1, siUnit: "" },
    { key: "class1Max", label: "Largest CW power of this beam within Class 1", unit: "mW", toSI: 1e-3, siUnit: "W" },
    { key: "class3RMax", label: "Largest CW power of this beam within Class 3R", unit: "mW", toSI: 1e-3, siUnit: "W" },
    { key: "class3BMax", label: "Largest CW power of this beam within Class 3B", unit: "mW", toSI: 1e-3, siUnit: "W" },
    { key: "diameter3", label: "Beam diameter at the naked-eye stop (Condition 3)", unit: "mm", toSI: 1e-3, siUnit: "m" },
  ],
  compute({ power, wavelength, beamDia, divergence, alpha, longTerm, telescopes, euA11 }) {
    const opts: ClassOptions & { condition1: boolean } = {
      alpha: Math.min(Math.max(alpha, 0), 100e-3),
      longTermViewing: longTerm === 1,
      euA11: euA11 === 1,
      condition1: telescopes === 1,
    };
    const r = classifyCw(wavelength, power, { d: beamDia, phi: divergence }, opts);
    if (r.laserClass === null) {
      return {
        values: { classRank: NaN, class1Max: NaN, class3RMax: NaN, class3BMax: NaN, diameter3: NaN },
        warnings: ["IEC 60825-1 covers 180 nm to 1 mm."],
      };
    }
    const [c1, , c3R, c3B] = r.checks;
    return {
      values: {
        classRank: RANK[r.laserClass],
        class1Max: classMax(c1),
        class3RMax: classMax(c3R),
        class3BMax: classMax(c3B),
        diameter3: r.diameter3,
      },
      warnings: [],
    };
  },
  checks: [
    {
      // 532 nm, a 1 mm beam without divergence, Condition 1 off: all the power passes the 7 mm stop, so the limits
      // are the visible CW AELs of the standard: Class 3R 5 × 1 mW (Class 2: 1 mW), Class 3B 0.5 W. The beam is
      // 1 mm at the stop; 3 mW is Class 3R.
      source: IEC_CLASSES,
      basis: "computed",
      inputs: { power: 3, wavelength: 532, beamDia: 1, divergence: 0, alpha: 1.5, telescopes: 0 },
      expect: { classRank: 5, class3RMax: 5, class3BMax: 500, diameter3: 1 },
      tolerance: 1e-8,
    },
  ],
});
