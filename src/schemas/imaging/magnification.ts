import { magnificationSummary, VERDICT_TEXT } from "../../physics/imaging/magnification";
import { defineSchema } from "../types";

const GREIVENKAMP = "Greivenkamp J. E. (2004). Field Guide to Geometrical Optics. SPIE Press, Microscopes " +
  "(M_obj = f_TL/f_obj, M_visual = M_obj·M_eye). https://doi.org/10.1117/3.547461";
const MICROSCOPYU = "Nikon MicroscopyU, Useful Magnification Range (500–1000 × NA). " +
  "https://www.microscopyu.com/microscopy-basics/useful-magnification-range";

const NO_VISUAL = "The visual magnification and exit pupil need an objective focal length, tube lens focal length, eyepiece power and NA above 0.";

export default defineSchema({
  href: "/imaging/magnification",
  inputs: [
    { key: "objFocal", label: "Objective focal length f_obj", unit: "mm", toSI: 1e-3, siUnit: "m", default: 10, min: 1, max: 100 },
    { key: "tubeFocal", label: "Tube lens focal length f_TL", unit: "mm", toSI: 1e-3, siUnit: "m", default: 200, min: 50, max: 400 },
    { key: "adapterMag", label: "Camera adapter magnification", unit: "×", toSI: 1, siUnit: "", default: 0.5, min: 0.1, max: 5 },
    { key: "eyepieceMag", label: "Eyepiece magnification", unit: "×", toSI: 1, siUnit: "", default: 15, min: 1, max: 30 },
    { key: "na", label: "Objective NA", unit: "", toSI: 1, siUnit: "", default: 0.4, min: 0.01, max: 1.7 },
  ],
  outputs: [
    { key: "objectiveMag", label: "Objective magnification f_TL/f_obj", unit: "×", toSI: 1, siUnit: "" },
    { key: "cameraMag", label: "On the camera, M_obj × adapter", unit: "×", toSI: 1, siUnit: "" },
    { key: "visualMag", label: "Visual, M_obj × eyepiece", unit: "×", toSI: 1, siUnit: "" },
    { key: "usefulMin", label: "Useful visual range, lower end 500 × NA", unit: "×", toSI: 1, siUnit: "" },
    { key: "usefulMax", label: "Useful visual range, upper end 1000 × NA", unit: "×", toSI: 1, siUnit: "" },
    { key: "exitPupil", label: "Exit pupil 500 mm · NA / M", unit: "mm", toSI: 1e-3, siUnit: "m" },
  ],
  compute({ objFocal, tubeFocal, adapterMag, eyepieceMag, na }) {
    const s = magnificationSummary(objFocal, tubeFocal, adapterMag, eyepieceMag, na);
    const warnings: string[] = [];
    if (s.verdict !== "within") warnings.push(`Visual magnification ${VERDICT_TEXT[s.verdict]}.`);
    return {
      values: {
        objectiveMag: s.objective,
        cameraMag: s.camera,
        visualMag: s.visual,
        usefulMin: s.usefulMin,
        usefulMax: s.usefulMax,
        exitPupil: s.exitPupil,
      },
      warnings,
      reasons: { objectiveMag: NO_VISUAL, cameraMag: NO_VISUAL, visualMag: NO_VISUAL, exitPupil: NO_VISUAL },
    };
  },
  checks: [
    {
      // f_obj = 5 mm, f_TL = 180 mm, adapter 0.63×, eyepiece 12.5×, NA 0.8: M_obj = 180/5 = 36; camera 36 × 0.63 = 22.68;
      // visual 36 × 12.5 = 450; exit pupil 2·f_obj·NA·(f_eye/f_TL) = 500 mm·NA/M (Abbe sine condition, microscope layout) = 500 × 0.8/450 = 0.888888889 mm.
      source: GREIVENKAMP,
      basis: "computed",
      inputs: { objFocal: 5, tubeFocal: 180, adapterMag: 0.63, eyepieceMag: 12.5, na: 0.8 },
      expect: { objectiveMag: 36, cameraMag: 22.68, visualMag: 450, exitPupil: 0.8888888888888888 },
      tolerance: 1e-8,
    },
    {
      // NA 0.8: 500 × 0.8 = 400 to 1000 × 0.8 = 800.
      source: MICROSCOPYU,
      basis: "computed",
      inputs: { objFocal: 5, tubeFocal: 180, adapterMag: 0.63, eyepieceMag: 12.5, na: 0.8 },
      expect: { usefulMin: 400, usefulMax: 800 },
      tolerance: 1e-8,
    },
  ],
});
