/**
 * Speckle-imaging page: objective and subjective speckle sizes, surface phase, Rician contrast and averaged contrast,
 * from `speckle.ts` (Goodman 2020; Fujii & Asakura 1974). SI units. Model tier: textbook.
 */

import {
  SPECKLE_FIRST_ZERO, averagedContrast, objectiveSpeckleSize, speckleContrast, subjectiveSpeckleSize, surfacePhaseRms,
} from "./speckle";

/** D/z above which λz/D is no longer a good paraxial estimate. */
export const SPECKLE_WIDE_ANGLE_RATIO = 0.3;
/** Surface phase rms (rad) below which the diffuse part is not circular Gaussian and the Rician form overestimates C. */
export const SPECKLE_MIN_PHASE_RMS = 1;

export interface SpeckleSummary {
  objective: number;
  objectiveFirstZero: number;
  subjective: number;
  subjectiveFirstZero: number;
  phaseRms: number;
  contrast: number;
  averagedContrast: number;
  /** D/z. */
  spotRatio: number;
  wideAngle: boolean;
  lowPhase: boolean;
}

/** λ, spot diameter D, distance z, roughness σ_h (all m), f-number N, magnification M, cells N_c, averaged patterns. */
export function speckleSummary(
  lambda: number, spot: number, distance: number, fNumber: number, magnification: number, roughness: number,
  cells: number, averages: number,
): SpeckleSummary {
  const objective = objectiveSpeckleSize(lambda, distance, spot);
  const subjective = subjectiveSpeckleSize(lambda, fNumber, magnification);
  const phaseRms = surfacePhaseRms(roughness, lambda);
  const contrast = speckleContrast(phaseRms, cells);
  const spotRatio = spot / distance;
  return {
    objective,
    objectiveFirstZero: SPECKLE_FIRST_ZERO * objective,
    subjective,
    subjectiveFirstZero: SPECKLE_FIRST_ZERO * subjective,
    phaseRms,
    contrast,
    averagedContrast: averagedContrast(contrast, averages),
    spotRatio,
    wideAngle: spotRatio > SPECKLE_WIDE_ANGLE_RATIO,
    lowPhase: phaseRms < SPECKLE_MIN_PHASE_RMS && phaseRms > 0,
  };
}
