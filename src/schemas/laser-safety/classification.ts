import {
  classifyCw, condition1MayRaiseClass, type ClassCheck, type ClassOptions, type LaserClass,
} from "../../physics/laser-safety/laser-classes";
import { defineSchema } from "../types";
import { WAVELENGTH } from "./common";

const DEFAULT_NM = 1550;
const IEC_CLASSES = "IEC 60825-1:2014, Safety of laser products, Part 1: Equipment classification and requirements, " +
  "Tables 3–9 (AELs of Classes 1, 2, 3R and 3B, rebuilt from the ICNIRP 2013 eye limits), measurement Conditions 1 and 3";
const A11 = "EN 60825-1:2014/A11:2021 (EU): the skin AEL through the corneal stop also caps Classes 1, 1M and 3R at " +
  "1250–1400 nm, 0.1 W from 0.35 s (K. Schulmeister, \"The European Amendment A11:2021 to EN 60825-1\", white paper, 2022)";

/** E1 stopgap: Condition 1 outside 400–1400 nm isn't modelled. */
const CONDITION1_WARNING = "Condition 1 (telescope viewing) not evaluated: outside 400–1400 nm it isn't modelled, and the beam " +
  "is wider than the Condition 3 stop, so a telescope collects more of it and the class may be higher.";

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
  ],
  outputs: [
    { key: "classRank", label: "Class (IEC 60825-1:2014): 1 = Class 1, 2 = 1M, 3 = Class 2, 4 = 2M, 5 = 3R, 6 = 3B, 7 = Class 4", unit: "", toSI: 1, siUnit: "" },
    { key: "classRankA11", label: "Class in the EU (EN 60825-1:2014/A11:2021), same ranks; differs only at 1250–1400 nm", unit: "", toSI: 1, siUnit: "" },
    { key: "class1Max", label: "Largest CW power of this beam within Class 1", unit: "mW", toSI: 1e-3, siUnit: "W" },
    { key: "class1MaxA11", label: "Largest CW power of this beam within Class 1 in the EU (A11)", unit: "mW", toSI: 1e-3, siUnit: "W" },
    { key: "class3RMax", label: "Largest CW power of this beam within Class 3R", unit: "mW", toSI: 1e-3, siUnit: "W" },
    { key: "class3BMax", label: "Largest CW power of this beam within Class 3B", unit: "mW", toSI: 1e-3, siUnit: "W" },
    { key: "diameter3", label: "Beam diameter at the naked-eye stop (Condition 3)", unit: "mm", toSI: 1e-3, siUnit: "m" },
  ],
  compute({ power, wavelength, beamDia, divergence, alpha, longTerm, telescopes }) {
    const opts: ClassOptions & { condition1: boolean } = {
      alpha: Math.min(Math.max(alpha, 0), 100e-3),
      longTermViewing: longTerm === 1,
      condition1: telescopes === 1,
    };
    const beam = { d: beamDia, phi: divergence };
    const r = classifyCw(wavelength, power, beam, opts);
    const eu = classifyCw(wavelength, power, beam, { ...opts, euA11: true });
    if (r.laserClass === null || eu.laserClass === null) {
      return {
        values: { classRank: NaN, classRankA11: NaN, class1Max: NaN, class1MaxA11: NaN, class3RMax: NaN, class3BMax: NaN, diameter3: NaN },
        warnings: ["IEC 60825-1 covers 180 nm to 1 mm."],
      };
    }
    const [c1, , c3R, c3B] = r.checks;
    const warnings: string[] = [];
    if (opts.condition1 && condition1MayRaiseClass(wavelength, r.diameter3, opts)) warnings.push(CONDITION1_WARNING);
    if (eu.laserClass !== r.laserClass) {
      warnings.push(`In the EU (EN 60825-1:2014/A11:2021) this laser is Class ${eu.laserClass}, not ${r.laserClass}: the skin AEL ` +
        "caps Classes 1 and 3R at about 0.1 W at 1250–1400 nm.");
    }
    return {
      values: {
        classRank: RANK[r.laserClass],
        classRankA11: RANK[eu.laserClass],
        class1Max: classMax(c1),
        class1MaxA11: classMax(eu.checks[0]),
        class3RMax: classMax(c3R),
        class3BMax: classMax(c3B),
        diameter3: r.diameter3,
      },
      warnings,
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
    {
      // 1310 nm, 400 mW, the default 1 mm, 1 mrad beam. IEC: within the Class 1 limit of 0.4987 W, under the 0.5 W cap.
      // EU A11: the skin limit (ICNIRP 2013 Table 7, C_A = 5) is 1.1×10⁴ C_A t^0.25 J/m² to 10 s over the corneal stop
      // (1 mm to 0.35 s). Under Condition 1 the 50 mm stop takes the whole beam, so the cap is the AEL as a power, least
      // at 0.35 s through 1 mm: 5.5×10⁴ × 0.35^−0.75 W/m² × π(1 mm)²/4 = 94.930 mW (from 10 s, 2.0×10³ C_A W/m² over
      // 3.5 mm: 96.211 mW). 400 mW is above Class 1 and 3R (both 1× the cap) but within Class 3B's 0.5 W (rank 6).
      source: `${IEC_CLASSES}; ${A11}`,
      basis: "computed",
      inputs: { power: 400, wavelength: 1310 },
      expect: { classRank: 1, classRankA11: 6, class1MaxA11: 94.92957523 },
      tolerance: 1e-8,
    },
  ],
});
