/**
 * Confocal resolution page: confocal and widefield FWHMs for one pinhole size. SI units in and out.
 * Model tier: textbook approximation (scalar paraxial theory, equal excitation and emission wavelengths, uniformly
 * filled pupil); the confocal values come from the confocal module. The widefield axial FWHM is the exact sinc²
 * half maximum, 2·x½/π · λ/(n − √(n² − NA²)) = 0.886 λ/(n − √(n² − NA²)), so the confocal curve cannot cross it
 * (Born & Wolf, Principles of Optics, §8.8).
 */
import { confocalAxialFwhm, confocalLateralFwhm, confocalOpticalSectionFwhm } from "./confocal";
import { airyFwhm, SINC2_HALF_MAX_X } from "./diffraction-psf";
import { airyUnit } from "./optical-sectioning-thickness";

export interface ConfocalResolutionSummary {
  confocalLateral: number;
  widefieldLateral: number;
  confocalAxial: number;
  widefieldAxial: number;
  /** Optical-section FWHM (thin fluorescent plane), m. */
  section: number;
  /** Pinhole diameter in the pinhole plane, m. */
  pinholeDiameter: number;
}

/** Wavelength and lengths in m; `magnification` scales the object-side Airy unit to the pinhole plane. */
export function confocalResolutionSummary(
  lambda: number, NA: number, pinholeAU: number, n: number, magnification: number,
): ConfocalResolutionSummary {
  return {
    confocalLateral: confocalLateralFwhm(lambda, NA, pinholeAU),
    widefieldLateral: airyFwhm(lambda, NA),
    confocalAxial: confocalAxialFwhm(lambda, n, NA, pinholeAU),
    widefieldAxial: ((2 * SINC2_HALF_MAX_X) / Math.PI) * (lambda / (n - Math.sqrt(n * n - NA * NA))),
    section: confocalOpticalSectionFwhm(lambda, n, NA, pinholeAU),
    pinholeDiameter: pinholeAU * airyUnit(lambda, NA) * magnification,
  };
}
