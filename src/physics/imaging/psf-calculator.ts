/**
 * Page summary of the PSF calculator: Airy radius, lateral FWHM, high-NA axial FWHM and first axial zero of an
 * aberration-free, uniformly filled pupil. SI units in and out (lengths in m). Model tier: textbook approximation
 * (scalar theory); the formulas and their references (Born & Wolf §8.5.2, §8.8) are in diffraction-psf.ts.
 * The axial FWHM is the half width of the sinc² on-axis profile the page plots, (2·x½/π)·λ/(n − √(n² − NA²)) with
 * sinc²(x½) = ½, i.e. 0.8859·λ/(n − √(n² − NA²)).
 */
import { SINC2_HALF_MAX_X, airyFirstZeroRadius, airyFwhm, axialFirstZero } from "./diffraction-psf";

export interface PsfSummary {
  /** Radius of the first dark ring, m. */
  airyRadius: number;
  /** Lateral FWHM, m. */
  lateralFwhm: number;
  /** Axial FWHM of the sinc² on-axis profile, m. */
  axialFwhm: number;
  /** Distance from focus to the first axial zero, m. */
  axialZero: number;
}

/** PSF widths for vacuum wavelength λ (m), medium index n and numerical aperture NA; NaN unless NA < n. */
export function psfSummary(lambda: number, n: number, NA: number): PsfSummary {
  const axialZero = axialFirstZero(lambda, n, NA);
  return {
    airyRadius: NA < n ? airyFirstZeroRadius(lambda, NA) : NaN,
    lateralFwhm: NA < n ? airyFwhm(lambda, NA) : NaN,
    axialFwhm: ((2 * SINC2_HALF_MAX_X) / Math.PI) * axialZero,
    axialZero,
  };
}
