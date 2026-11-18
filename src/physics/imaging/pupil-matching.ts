/**
 * Page summary of the pupil-matching calculator: microscope exit pupil against the eye pupil. SI units in and out
 * (lengths in m). Model tier: textbook (paraxial first-order layout); the formulas and references (Greivenkamp 2004;
 * Nikon MicroscopyU "Useful Magnification Range") are in microscope.ts.
 */
import { exitPupilDiameter, totalMag, usefulMagRange } from "./microscope";

/** Exit pupil above this (magnification below 500·NA) loses detail the objective passes, m. */
export const EXIT_PUPIL_USEFUL_MAX = 1e-3;
/** Exit pupil below this (magnification above 1000·NA) is empty magnification, m. */
export const EXIT_PUPIL_USEFUL_MIN = 0.5e-3;

export interface PupilMatchingSummary {
  /** Visual magnification M_obj·M_eye. */
  magnification: number;
  /** Exit pupil 500 mm·NA/M, m. */
  exitPupil: number;
  /** Useful magnification range, 500·NA to 1000·NA. */
  usefulMin: number;
  usefulMax: number;
  /** Eyepiece powers that put M_obj·M_eye inside the useful range. */
  eyepieceMin: number;
  eyepieceMax: number;
  /** Share of the eye pupil diameter the exit pupil fills, capped at 1. */
  filled: number;
  /** Which side of the useful range the exit pupil lies on. */
  verdict: "large" | "small" | "useful" | "none";
  /** The eye pupil is smaller than the exit pupil and becomes the aperture stop. */
  eyeStop: boolean;
  /** NA·d_eye/D when the eye pupil clips the beam; NaN otherwise. */
  effectiveNa: number;
}

/** Exit pupil and eye matching for objective NA, objective and eyepiece magnification and eye pupil diameter (m). */
export function pupilMatchingSummary(
  NA: number, objectiveMag: number, eyepieceMag: number, eyePupil: number,
): PupilMatchingSummary {
  const magnification = totalMag(objectiveMag, eyepieceMag);
  const exitPupil = exitPupilDiameter(NA, magnification);
  const useful = usefulMagRange(NA);
  const eyeStop = exitPupil > eyePupil;
  return {
    magnification,
    exitPupil,
    usefulMin: useful.min,
    usefulMax: useful.max,
    eyepieceMin: useful.min / objectiveMag,
    eyepieceMax: useful.max / objectiveMag,
    filled: Math.min(1, exitPupil / eyePupil),
    verdict: !Number.isFinite(exitPupil)
      ? "none"
      : exitPupil > EXIT_PUPIL_USEFUL_MAX ? "large" : exitPupil < EXIT_PUPIL_USEFUL_MIN ? "small" : "useful",
    eyeStop,
    effectiveNa: eyeStop ? (NA * eyePupil) / exitPupil : NaN,
  };
}
