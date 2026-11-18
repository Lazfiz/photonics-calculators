import {
  EXIT_PUPIL_USEFUL_MAX, EXIT_PUPIL_USEFUL_MIN, pupilMatchingSummary,
} from "../../physics/imaging/pupil-matching";
import { defineSchema } from "../types";

const GREIVENKAMP = "Greivenkamp J. E. (2004). Field Guide to Geometrical Optics, SPIE Press, Microscopes (eyepiece power 250 mm/f_eye, " +
  "exit pupil D = 2·(250 mm)·NA/(M_obj·M_eye)); useful magnification 500–1000 × NA: Nikon MicroscopyU, Useful Magnification Range, " +
  "https://www.microscopyu.com/microscopy-basics/useful-magnification-range. https://doi.org/10.1117/3.547461";
const MM = 1e-3;

export default defineSchema({
  href: "/imaging/pupil-matching",
  inputs: [
    { key: "objectiveNA", label: "Objective NA", unit: "", toSI: 1, siUnit: "", default: 0.75, min: 0.01, max: 1.7 },
    { key: "objectiveMag", label: "Objective magnification", unit: "×", toSI: 1, siUnit: "", default: 40, min: 1, max: 200 },
    { key: "eyepieceMag", label: "Eyepiece magnification", unit: "×", toSI: 1, siUnit: "", default: 10, min: 1, max: 30 },
    { key: "eyePupil", label: "Eye pupil diameter", unit: "mm", toSI: MM, siUnit: "m", default: 4, min: 1, max: 8 },
  ],
  outputs: [
    { key: "magnification", label: "Visual magnification M_obj · M_eye", unit: "×", toSI: 1, siUnit: "" },
    { key: "exitPupil", label: "Exit pupil 500 mm · NA / M", unit: "mm", toSI: MM, siUnit: "m" },
    { key: "usefulMin", label: "Useful magnification, lower end 500 × NA", unit: "×", toSI: 1, siUnit: "" },
    { key: "usefulMax", label: "Useful magnification, upper end 1000 × NA", unit: "×", toSI: 1, siUnit: "" },
    { key: "eyepieceMin", label: "Eyepiece for the lower end", unit: "×", toSI: 1, siUnit: "" },
    { key: "eyepieceMax", label: "Eyepiece for the upper end", unit: "×", toSI: 1, siUnit: "" },
    { key: "filled", label: "Share of the eye pupil diameter used", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "effectiveNa", label: "Effective NA when the eye pupil clips the beam", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ objectiveNA, objectiveMag, eyepieceMag, eyePupil }) {
    const s = pupilMatchingSummary(objectiveNA, objectiveMag, eyepieceMag, eyePupil);
    const warnings: string[] = [];
    if (s.verdict === "large") {
      warnings.push(`The exit pupil is larger than ${EXIT_PUPIL_USEFUL_MAX / MM} mm: magnification below 500·NA, the eye cannot resolve all the detail the objective passes.`);
    } else if (s.verdict === "small") {
      warnings.push(`The exit pupil is smaller than ${EXIT_PUPIL_USEFUL_MIN / MM} mm: magnification above 1000·NA is empty.`);
    }
    if (s.eyeStop) {
      warnings.push("The exit pupil is larger than the eye pupil: the eye pupil becomes the aperture stop and the effective NA drops to NA·d_eye/D.");
    }
    return {
      values: {
        magnification: s.magnification,
        exitPupil: s.exitPupil,
        usefulMin: s.usefulMin,
        usefulMax: s.usefulMax,
        eyepieceMin: s.eyepieceMin,
        eyepieceMax: s.eyepieceMax,
        filled: s.filled,
        effectiveNa: s.effectiveNa,
      },
      warnings,
      reasons: { effectiveNa: "The exit pupil is not larger than the eye pupil, so the eye does not clip the beam and the NA is unchanged." },
    };
  },
  checks: [
    {
      // 0.75 NA, 40× objective, 10× eyepiece, 4 mm eye pupil: M = 400, D = 500 mm·0.75/400 = 0.9375 mm, useful 375–750×,
      // eyepieces 375/40 = 9.375 to 750/40 = 18.75, share 0.9375/4 = 23.4375 %.
      source: GREIVENKAMP,
      basis: "computed",
      inputs: { objectiveNA: 0.75, objectiveMag: 40, eyepieceMag: 10, eyePupil: 4 },
      expect: {
        magnification: 400, exitPupil: 0.9375, usefulMin: 375, usefulMax: 750, eyepieceMin: 9.375, eyepieceMax: 18.75, filled: 23.4375,
      },
      tolerance: 1e-8,
    },
    {
      // 0.1 NA, 2× objective, 10× eyepiece, 2 mm eye pupil: M = 20, D = 500 mm·0.1/20 = 2.5 mm > 2 mm, so the eye clips it:
      // effective NA = 0.1·2/2.5 = 0.08 and the pupil is fully filled (100 %).
      // effectiveNa exists only when D > d_eye ≥ 1 mm (eye-pupil min) = EXIT_PUPIL_USEFUL_MAX, so this case necessarily fires both
      // warnings; neither is a model-validity limit.
      source: GREIVENKAMP,
      basis: "computed",
      inputs: { objectiveNA: 0.1, objectiveMag: 2, eyepieceMag: 10, eyePupil: 2 },
      expect: { exitPupil: 2.5, effectiveNa: 0.08, filled: 100 },
      tolerance: 1e-8,
    },
  ],
});
