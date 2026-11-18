/**
 * Page summary of the optical-sectioning-thickness calculator: widefield, confocal (Wilhelm and wave-optical),
 * point-pinhole and two-photon section thicknesses, and the object-side pinhole diameter. SI units in and out
 * (lengths in m). Model tier: textbook approximation; the formulas and their references are in
 * optical-sectioning-thickness.ts (Wilhelm et al. 2003, Zipfel et al. 2003) and confocal.ts (Wilson & Sheppard).
 * The two-photon value is for excitation at twice the entered (one-photon) wavelength.
 */
import { confocalOpticalSectionFwhm } from "./confocal";
import {
  airyUnit, confocalSectionFwhm, confocalSectionFwhmPointPinhole, twoPhotonAxialFwhm, widefieldAxialFirstZero,
} from "./optical-sectioning-thickness";

/** Two-photon excitation wavelength as a multiple of the entered wavelength. */
export const TWO_PHOTON_WAVELENGTH_FACTOR = 2;
/** Below this pinhole (Airy units) Wilhelm's geometric formula overestimates the section. */
export const WILHELM_MIN_PINHOLE_AU = 1;

export interface OpticalSectioningSummary {
  /** Widefield focus to first axial zero, m. */
  widefield: number;
  /** Confocal section, Wilhelm geometric formula, m. */
  confocal: number;
  /** Confocal section, wave-optical table, m. */
  waveOptical: number;
  /** Point-pinhole limit 0.64 λ/(n − √(n² − NA²)), m. */
  pointPinhole: number;
  /** Two-photon axial FWHM at 2λ, m. */
  twoPhoton: number;
  /** Object-side pinhole diameter, m. */
  pinholeDiameter: number;
}

/** All results of the page at wavelength `lambda` (m), index `n`, numerical aperture `na`, pinhole in Airy units. */
export function opticalSectioningSummary(lambda: number, n: number, na: number, pinholeAU: number): OpticalSectioningSummary {
  return {
    widefield: widefieldAxialFirstZero(lambda, n, na),
    confocal: confocalSectionFwhm(lambda, n, na, pinholeAU),
    waveOptical: confocalOpticalSectionFwhm(lambda, n, na, pinholeAU),
    pointPinhole: confocalSectionFwhmPointPinhole(lambda, n, na),
    twoPhoton: twoPhotonAxialFwhm(TWO_PHOTON_WAVELENGTH_FACTOR * lambda, n, na),
    pinholeDiameter: pinholeAU * airyUnit(lambda, na),
  };
}
