import { eyeSafeTrain, maxPulseEnergy } from "../../physics/laser-safety/pulse-train";
import { defineSchema } from "../types";
import { ICNIRP_2013 } from "./common";

const RULES = `${ICNIRP_2013}. Tables 3, 5 and 8 (eye limits and apertures) and p. 287 (repetitive pulses). ` +
  "https://doi.org/10.1097/HP.0b013e3182983fd4";

/** The page's table of lasers: wavelength (nm). */
const LASERS = [355, 532, 905, 1064, 1550, 2050, 10600] as const;

const outputs = [
  ...LASERS.map((nm) => ({
    key: `maxEnergy${nm}`, label: `Max energy per pulse at ${nm} nm`, unit: "mJ", toSI: 1e-3, siUnit: "J",
  })),
  ...LASERS.map((nm) => ({
    key: `pulseOverMax${nm}`, label: `Your pulse / max at ${nm} nm`, unit: "", toSI: 1, siUnit: "",
  })),
];

export default defineSchema({
  href: "/laser-safety/eye-safe-wavelength",
  inputs: [
    { key: "pulseEnergy", label: "Pulse energy", unit: "mJ", toSI: 1e-3, siUnit: "J", default: 100, min: 0, max: 1e12 },
    { key: "pulseWidth", label: "Pulse width", unit: "ns", toSI: 1e-9, siUnit: "s", default: 10, min: 1e-4, max: 3e13 },
    { key: "beamDiam", label: "Beam diameter, 1/e²", unit: "mm", toSI: 1e-3, siUnit: "m", default: 5, min: 0.01, max: 1e4 },
    { key: "prf", label: "Repetition rate (0 = one pulse)", unit: "Hz", toSI: 1, siUnit: "Hz", default: 10, min: 0, max: 1e15 },
    { key: "exposureTime", label: "Exposure time", unit: "s", toSI: 1, siUnit: "s", default: 10, min: 1e-13, max: 30000 },
  ],
  outputs,
  compute({ pulseEnergy, pulseWidth, beamDiam, prf, exposureTime }) {
    // The page's inputs in its units: it clamps the pulse width and the exposure and turns overlapping pulses into one.
    const { train, overlap } = eyeSafeTrain(pulseWidth * 1e9, prf, exposureTime);
    const values: Record<string, number> = {};
    for (const nm of LASERS) {
      const m = maxPulseEnergy(nm * 1e-9, beamDiam, train);
      values[`maxEnergy${nm}`] = m ? m.qMax : NaN;
      values[`pulseOverMax${nm}`] = m ? pulseEnergy / m.qMax : NaN;
    }
    return {
      values,
      warnings: overlap ? ["The pulses overlap (repetition rate × pulse width above 1), so only one pulse is evaluated."] : undefined,
    };
  },
  checks: [
    {
      // 532 nm, one 10 ns pulse, 7 mm beam: 2e-3 J/m² (1 ns – 5 µs, C_A = 1) × A (3.848451001e-5 m²) = 7.696902002e-8 J
      // through the 7 mm aperture; the beam (1/e² d = 7 mm) puts 1 − e^(−2) = 0.8646647168 of its energy there:
      // 7.696902002e-8 / 0.8646647168 = 8.901602959e-8 J = 8.901602959e-5 mJ.
      source: RULES,
      basis: "computed",
      inputs: { pulseEnergy: 1, pulseWidth: 10, beamDiam: 7, prf: 0, exposureTime: 1e-8 },
      expect: { maxEnergy532: 8.901602959e-5, pulseOverMax532: 11233.93174 },
      tolerance: 1e-8,
    },
    {
      // 1550 nm, one 10 ns pulse, 7 mm beam: 1e4 J/m² over the 1 mm corneal aperture (A = π(0.5 mm)² = 7.853981634e-7 m²)
      // = 7.853981634e-3 J; the share of the beam inside 1 mm is 1 − e^(−2(0.5/3.5)²) = 1 − e^(−2/49) = 0.03999...:
      // 7.853981634e-3 / (1 − e^(−2/49)) = 0.1963762543 J = 196.3762543 mJ.
      source: RULES,
      basis: "computed",
      inputs: { pulseEnergy: 1, pulseWidth: 10, beamDiam: 7, prf: 0, exposureTime: 1e-8 },
      expect: { maxEnergy1550: 196.3762543 },
      tolerance: 1e-8,
    },
  ],
});
