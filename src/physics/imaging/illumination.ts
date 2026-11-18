/**
 * Köhler illumination set-up of a transmitted-light microscope: field of view, pupil sizes, condenser setting and the
 * condenser-limited resolution. SI in (lengths m, NA pure numbers), SI out. Model tier: textbook approximation.
 * Pupil diameters follow the Abbe sine condition 2·f·NA; the resolution limits are in `microscope.ts`
 * (Nikon MicroscopyU, "Microscope Resolution" and "Field of View"; Evident, Köhler illumination guide (2020): condenser
 * aperture at about 0.7–0.8 of the objective NA).
 */

import { objectFieldDiameter } from "./field-of-view";
import { abbePeriodLimit, apertureDiameter, rayleighCondenserResolution } from "./microscope";

/** The usual condenser setting, as a fraction of the objective NA: 0.7 to 0.8. */
export const CONDENSER_NA_FRACTION_LOW = 0.7;
export const CONDENSER_NA_FRACTION_HIGH = 0.8;

export interface IlluminationInputs {
  /** Objective magnification M_obj. */
  objectiveMag: number;
  /** Objective NA. */
  objectiveNa: number;
  /** Tube lens focal length, m. */
  tubeFocal: number;
  /** Condenser NA (aperture diaphragm setting). */
  condenserNa: number;
  /** Condenser focal length, m. */
  condenserFocal: number;
  /** Eyepiece field number, m. */
  fieldNumber: number;
  wavelength: number;
}

export interface IlluminationSummary {
  /** Field diaphragm opening FN/M_obj, m. */
  fieldOfView: number;
  /** Objective focal length f_TL/M_obj, m. */
  objectiveFocal: number;
  /** Objective back aperture 2·f_obj·NA, m. */
  backAperture: number;
  /** NA_c/NA_obj. */
  ratio: number;
  /** Diameter of the condenser iris image in the back aperture, m (capped at the aperture). */
  irisImage: number;
  /** Fraction of the back aperture the iris image fills, min(ratio, 1). */
  irisFill: number;
  /** Condenser iris diameter 2·f_c·NA_c, m. */
  irisDiameter: number;
  usualNaLow: number;
  usualNaHigh: number;
  abbePeriod: number;
  rayleigh: number;
  /** One-sentence advice on the condenser setting. */
  advice: string;
}

export function illuminationSummary(i: IlluminationInputs): IlluminationSummary {
  const objectiveFocal = i.tubeFocal / i.objectiveMag;
  const backAperture = apertureDiameter(objectiveFocal, i.objectiveNa);
  const ratio = i.condenserNa / i.objectiveNa;
  const irisFill = Math.min(ratio, 1);
  const advice = ratio > 1
    ? "Condenser NA is above the objective NA: the cone is wider than the objective accepts, so the excess adds glare, not resolution."
    : ratio > CONDENSER_NA_FRACTION_HIGH
      ? "Condenser NA is above 0.8 × the objective NA (usual 0.7–0.8): close to full resolution, but low contrast and more glare."
      : ratio >= CONDENSER_NA_FRACTION_LOW
        ? "Condenser NA is within the usual 0.7–0.8 × the objective NA."
        : "Condenser NA is below 0.7 × the objective NA: more contrast and depth of field, lower resolution and visible diffraction fringes.";
  return {
    fieldOfView: objectFieldDiameter(i.fieldNumber, i.objectiveMag),
    objectiveFocal,
    backAperture,
    ratio,
    irisImage: backAperture * irisFill,
    irisFill,
    irisDiameter: apertureDiameter(i.condenserFocal, i.condenserNa),
    usualNaLow: CONDENSER_NA_FRACTION_LOW * i.objectiveNa,
    usualNaHigh: CONDENSER_NA_FRACTION_HIGH * i.objectiveNa,
    abbePeriod: abbePeriodLimit(i.wavelength, i.objectiveNa, i.condenserNa),
    rayleigh: rayleighCondenserResolution(i.wavelength, i.objectiveNa, i.condenserNa),
    advice,
  };
}
