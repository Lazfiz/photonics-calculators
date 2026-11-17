import { aelEnergy, cwClassLimit, type AelClass, type ClassOptions } from "../../physics/laser-safety/laser-classes";
import { defineSchema } from "../types";
import { EXPOSURE, WAVELENGTH } from "./common";

const IEC = "IEC 60825-1:2014, Safety of laser products, Tables 3–9 (AELs), rebuilt from the ICNIRP 2013 eye limits " +
  "(Health Phys. 105(3), 271–295, Table 5) times the stop area";

const CLASSES: readonly AelClass[] = ["1", "2", "3R", "3B"];
const NAMES: Record<AelClass, string> = { "1": "Class 1 / 1M", "2": "Class 2 / 2M", "3R": "Class 3R", "3B": "Class 3B" };

/**
 * EN 60825-1:2014/A11:2021 (EU) adds the skin AEL at 1250–1400 nm to Classes 1, 1M and 3R (Schulmeister's 2022 white
 * paper, §4: "the respective requirement added to the AEL tables for Class 1, 1M and Class 3R"). The paper gives one
 * table and no factor for 3R, so 3R takes it 1×, as the classification schema does. The A11 text is unread; 1× is also
 * the cautious reading (5 × Class 1 would allow ≈ 475 mW at 1310 nm against ≈ 95 mW).
 */
const A11_CLASSES: readonly AelClass[] = ["1", "3R"];
const A11 = "EN 60825-1:2014/A11:2021";
const UNVERIFIED = "unverified: A11 text not read";

const classOutputs = (c: AelClass, suffix: string, prefix: string) => [
  { key: `energy${c}${suffix}`, label: `${prefix}${NAMES[c]}: AEL of one emission, energy through the stop`, unit: "J", toSI: 1, siUnit: "J" },
  { key: `stop${c}${suffix}`, label: `${prefix}${NAMES[c]}: stop of that AEL`, unit: "mm", toSI: 1e-3, siUnit: "m" },
  { key: `cw${c}${suffix}`, label: `${prefix}${NAMES[c]}: CW power through the stop`, unit: "mW", toSI: 1e-3, siUnit: "W" },
];
const outputs = [
  ...CLASSES.flatMap((c) => classOutputs(c, "", "")),
  ...A11_CLASSES.flatMap((c) => classOutputs(c, "A11", `EU, ${A11} (${UNVERIFIED}): `)),
];

/** True when two AELs differ by more than rounding (or one is defined and the other isn't). */
const differs = (a: number, b: number) => Number.isFinite(a) !== Number.isFinite(b) || Math.abs(a - b) > 1e-9 * Math.abs(b);

export default defineSchema({
  href: "/laser-safety/ael-limits",
  inputs: [
    { ...WAVELENGTH, default: 633 },
    { ...EXPOSURE, key: "emissionDuration", label: "Emission duration", default: 1e-8 },
    { key: "alpha", label: "Apparent source α", unit: "mrad", toSI: 1e-3, siUnit: "rad", default: 1.5, min: 0, max: 100 },
    { key: "longTerm", label: "Time base above 400 nm: 0 = 100 s, 1 = 30 000 s (long-term viewing)", unit: "", toSI: 1, siUnit: "", default: 0, min: 0, max: 1 },
  ],
  outputs,
  validate({ longTerm }) {
    return longTerm === 0 || longTerm === 1 ? undefined : "longTerm is 0 or 1.";
  },
  compute({ wavelength, emissionDuration, alpha, longTerm }) {
    const opts: ClassOptions = { alpha, longTermViewing: longTerm === 1 };
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
    const capped: string[] = [];
    for (const c of A11_CLASSES) {
      const pulse = aelEnergy(c, wavelength, emissionDuration, { ...opts, euA11: true });
      const cw = cwClassLimit(c, wavelength, 0, { ...opts, euA11: true });
      values[`energy${c}A11`] = pulse.energy;
      values[`stop${c}A11`] = pulse.stop;
      values[`cw${c}A11`] = cw.power;
      if (differs(pulse.energy, values[`energy${c}`]) || differs(cw.power, values[`cw${c}`])) capped.push(NAMES[c]);
    }
    const warnings: string[] = [];
    const reasons: Record<string, string> = {};
    if (missing.length > 0) {
      const undefinedHere = `Not defined at this wavelength: ${missing.join(", ")} (Class 2 exists only at 400–700 nm, Class 3R from 302.5 nm).`;
      warnings.push(undefinedHere);
      // Each output of a class that does not exist here, and its A11 twin, names that warning (null reasons, #292).
      for (const c of CLASSES) {
        if (!missing.includes(NAMES[c])) continue;
        const suffixes = A11_CLASSES.includes(c) ? ["", "A11"] : [""];
        for (const s of suffixes) for (const k of ["energy", "stop", "cw"]) reasons[`${k}${c}${s}`] = undefinedHere;
      }
    }
    if (capped.length > 0) {
      warnings.push(`In the EU (${A11}) the skin AEL also caps ${capped.join(" and ")} here, as Schulmeister's 2022 ` +
        `white paper describes it (${UNVERIFIED}): see the A11 outputs.` +
        (capped.includes(NAMES["3R"]) ? " Class 3R takes the skin AEL 1× (no factor 5), the cautious reading." : ""));
    }
    return { values, warnings: warnings.length > 0 ? warnings : undefined, reasons };
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
      // EU A11 at 1310 nm (C_A = 5): the skin limit 1.1×10⁴ C_A t^0.25 J/m² (ICNIRP 2013 Table 7) over the corneal stop, 1 mm
      // below 0.35 s and 1.5 t^0.375 mm to 10 s (white paper §4: "the aperture diameter equals 1 mm for emission durations
      // up to 0,35 seconds and then increases to 3,5 mm at emission durations of 10 seconds and above"; its table: 4.3×10⁻²
      // t^0.25 J to 0.35 s, then 0.1 W). One 1 s emission: 5.5×10⁴ J/m² × π(0.75 mm)² = 0.09719302272 J through 1.5 mm.
      // CW: least at 0.35 s through 1 mm, 5.5×10⁴·0.35^−0.75 W/m² × π(0.5 mm)² = 94.92957523 mW (IEC alone: 498.7 mW).
      source: `${IEC}; K. Schulmeister, "White Paper: The European Amendment A11:2021 to EN 60825-1", Seibersdorf ` +
        "Laboratories, v2c (2022), §4 (A11 text itself not read)",
      basis: "computed",
      inputs: { wavelength: 1310, emissionDuration: 1, alpha: 1.5 },
      // Class 3R under A11 takes the same skin AEL 1× (cautious reading; see A11_CLASSES); IEC alone: 0.5 J, 500 mW.
      expect: {
        energy1A11: 0.09719302272, stop1A11: 1.5, cw1A11: 94.92957523, energy1: 0.5,
        energy3RA11: 0.09719302272, stop3RA11: 1.5, cw3RA11: 94.92957523, energy3R: 0.5, cw3R: 500,
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
