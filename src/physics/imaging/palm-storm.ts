/**
 * Page summary of the PALM/STORM calculator: localization precision (Mortensen 2010), label-density (Nyquist)
 * resolution and their quadrature sum. SI in and out, except that the label density is per µm^D as on the page. A new
 * module so that the page and the API schema share one dispatch; the physics is in super-resolution.ts (imported by
 * many pages: not appended to). Model tier: textbook approximation, see super-resolution.ts.
 */
import {
  GAUSSIAN_FWHM_PER_SIGMA, PSF_SIGMA_COEFFICIENT, abbeLateralFwhm, localizationPrecision, mortensenPrecision,
  nyquistResolution, smlmEffectiveResolution,
} from "./super-resolution";

/** Mortensen's formulas are correct to order a²/(12σ²); past a = this many σ that term exceeds 1/3. */
export const PIXEL_SIGMA_LIMIT = 2;

/** Nyquist resolution 2/ρ^(1/D), m, for a density in labels per µm^D. */
export function palmNyquist(densityPerUmD: number, dim: 1 | 2 | 3): number {
  return nyquistResolution(densityPerUmD * 1e6 ** dim, dim);
}

export interface PalmStormSummary {
  psfSigma: number;
  sigmaLoc: number;
  shotLimit: number;
  localizationFwhm: number;
  labelSpacing: number;
  nyquist: number;
  effective: number;
  diffraction: number;
  /** Acquisition time frames/fps, s. */
  acquisitionTime: number;
  /** True when the pixel exceeds PIXEL_SIGMA_LIMIT PSF σ, so the a²/12 correction is no longer small. */
  undersampled: boolean;
}

export function palmStormSummary(
  lambda: number, na: number, photons: number, background: number, pixel: number,
  estimator: "ls" | "mle", emccd: boolean, density: number, dim: 1 | 2 | 3, frames: number, fps: number,
): PalmStormSummary {
  const psfSigma = (PSF_SIGMA_COEFFICIENT * lambda) / na;
  const sigmaLoc = mortensenPrecision(lambda, na, photons, pixel, background, { estimator, emccd });
  const nyquist = palmNyquist(density, dim);
  return {
    psfSigma,
    sigmaLoc,
    shotLimit: localizationPrecision(lambda, na, photons),
    localizationFwhm: GAUSSIAN_FWHM_PER_SIGMA * sigmaLoc,
    labelSpacing: nyquist / 2,
    nyquist,
    effective: smlmEffectiveResolution(sigmaLoc, nyquist),
    diffraction: abbeLateralFwhm(lambda, na),
    acquisitionTime: frames / fps,
    undersampled: pixel > PIXEL_SIGMA_LIMIT * psfSigma,
  };
}
