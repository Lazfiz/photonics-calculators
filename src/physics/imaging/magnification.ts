/**
 * Magnification page summary: objective, camera and visual magnification, useful range and exit pupil of an
 * infinity-corrected microscope. SI in and out (m). Built on microscope.ts, which has importers on other pages,
 * so this module is separate. Equations: J. E. Greivenkamp, Field Guide to Geometrical Optics (SPIE 2004,
 * doi:10.1117/3.547461), "Microscopes": M_obj = f_TL/f_obj, M_visual = M_obj·M_eye; useful range 500–1000·NA
 * (Nikon MicroscopyU, "Useful Magnification Range"); exit pupil 2·(250 mm)·NA/M_visual.
 */

import { exitPupilDiameter, objectiveMag, totalMag, usefulMagRange } from "./microscope";

export interface MagnificationSummary {
  objective: number;
  camera: number;
  visual: number;
  usefulMin: number;
  usefulMax: number;
  /** Exit pupil diameter, m. */
  exitPupil: number;
  /** Where the visual magnification sits against the useful range. */
  verdict: "below" | "within" | "above";
}

/** Magnifications for objective and tube-lens focal lengths (m), camera adapter and eyepiece powers, and NA. */
export function magnificationSummary(fObjective: number, fTube: number, adapter: number, eyepiece: number, na: number): MagnificationSummary {
  const objective = objectiveMag(fObjective, fTube);
  const visual = totalMag(objective, eyepiece);
  const useful = usefulMagRange(na);
  return {
    objective,
    camera: totalMag(objective, adapter),
    visual,
    usefulMin: useful.min,
    usefulMax: useful.max,
    exitPupil: exitPupilDiameter(na, visual),
    verdict: visual < useful.min ? "below" : visual > useful.max ? "above" : "within",
  };
}

/** The page's sentence for a verdict. */
export const VERDICT_TEXT: Record<MagnificationSummary["verdict"], string> = {
  below: "below the useful range: the eye cannot resolve all the detail the objective passes",
  within: "within the useful range",
  above: "above the useful range: empty magnification",
};
