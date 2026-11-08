import { aelEnergy, cwClassLimit, type AelClass, type ClassOptions } from "../../physics/laser-safety/laser-classes";
import { defineSchema } from "../types";
import { EXPOSURE, WAVELENGTH } from "./common";

const IEC = "IEC 60825-1:2014, Safety of laser products, Tables 3–9 (AELs), rebuilt from the ICNIRP 2013 eye limits " +
  "(Health Phys. 105(3), 271–295, Table 5) times the stop area";

const CLASSES: readonly AelClass[] = ["1", "2", "3R", "3B"];
const NAMES: Record<AelClass, string> = { "1": "Class 1 / 1M", "2": "Class 2 / 2M", "3R": "Class 3R", "3B": "Class 3B" };

const outputs = CLASSES.flatMap((c) => [
  { key: `energy${c}`, label: `${NAMES[c]}: AEL of one emission, energy through the stop`, unit: "J", toSI: 1, siUnit: "J" },
  { key: `stop${c}`, label: `${NAMES[c]}: stop of that AEL`, unit: "mm", toSI: 1e-3, siUnit: "m" },
  { key: `cw${c}`, label: `${NAMES[c]}: CW power through the stop`, unit: "mW", toSI: 1e-3, siUnit: "W" },
]);

export default defineSchema({
  href: "/laser-safety/ael-limits",
  inputs: [
    { ...WAVELENGTH, default: 633 },
    { ...EXPOSURE, key: "emissionDuration", label: "Emission duration", default: 1e-8 },
    { key: "alpha", label: "Apparent source α", unit: "mrad", toSI: 1e-3, siUnit: "rad", default: 1.5, min: 0, max: 100 },
    { key: "longTerm", label: "Time base above 400 nm: 0 = 100 s, 1 = 30 000 s (long-term viewing)", unit: "", toSI: 1, siUnit: "", default: 0, min: 0, max: 1 },
    { key: "euA11", label: "EU: EN 60825-1:2014/A11:2021 skin AEL at 1250–1400 nm (1 = on)", unit: "", toSI: 1, siUnit: "", default: 0, min: 0, max: 1 },
  ],
  outputs,
  validate({ longTerm, euA11 }) {
    return (longTerm === 0 || longTerm === 1) && (euA11 === 0 || euA11 === 1) ? undefined : "longTerm and euA11 are 0 or 1.";
  },
  compute({ wavelength, emissionDuration, alpha, longTerm, euA11 }) {
    const opts: ClassOptions = { alpha, longTermViewing: longTerm === 1, euA11: euA11 === 1 };
    const values: Record<string, number> = {};
    const missing: string[] = [];
    for (const c of CLASSES) {
      const pulse = aelEnergy(c, wavelength, emissionDuration, opts);
      const cw = cwClassLimit(c, wavelength, 0, opts);
      values[`energy${c}`] = pulse.energy;
      values[`stop${c}`] = pulse.stop;
      values[`cw${c}`] = cw.power;
      if (!Number.isFinite(pulse.energy) || !Number.isFinite(cw.power)) missing.push(NAMES[c]);
    }
    return {
      values,
      warnings: missing.length > 0 ? [`Not defined at this wavelength: ${missing.join(", ")} (Class 2 exists only at 400–700 nm, Class 3R from 302.5 nm).`] : undefined,
    };
  },
  checks: [
    {
      // 532 nm, 1 s, α = 1.5 mrad (C_E = 1): Class 1 = 18 t^0.75 J/m² × A (A = π(3.5 mm)² = 3.848451001e-5 m²) =
      // 6.927211801e-4 J; Class 2 = 1 mW × 1 s; Class 3R = 5 × Class 2; Class 3B = 0.5 W × 1 s through 7 mm.
      // CW: Class 1 10 W/m² × A = 0.3848451001 mW (100 s time base); Class 2 1 mW; 3R 5 mW; 3B 500 mW.
      source: IEC,
      basis: "computed",
      inputs: { wavelength: 532, emissionDuration: 1 },
      expect: {
        energy1: 6.927211801e-4, energy2: 1e-3, energy3R: 5e-3, energy3B: 0.5, stop1: 7,
        cw1: 0.3848451001, cw2: 1, cw3R: 5, cw3B: 500,
      },
      tolerance: 1e-8,
    },
    {
      // 1064 nm, 1 ms, point source: Class 1 = 90 C_C t^0.75 J/m² × A with C_C = 1 and t^0.75 = 10^-2.25 = 5.623413252e-3:
      // 0.5061071927 J/m² × 3.848451001e-5 m² = 1.947728732e-5 J; Class 3R = 5 × that; Class 3B = 0.15 J at 1050–1400 nm.
      source: IEC,
      basis: "computed",
      inputs: { wavelength: 1064, emissionDuration: 1e-3, alpha: 0 },
      expect: { energy1: 1.947728732e-5, energy3R: 9.738643660e-5, energy3B: 0.15 },
      tolerance: 1e-8,
    },
  ],
});
