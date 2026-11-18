/**
 * Super-resolution page: the diffraction limits, STED lateral FWHM and shot-noise PALM/STORM precision the page
 * shows, from `super-resolution.ts`. SI units. Model tier: textbook approximation (formulas and sources there).
 */

import {
  GAUSSIAN_FWHM_PER_SIGMA, abbeLateralFwhm, axialPsfFwhm, localizationPrecision, rayleighDistance, stedLateralFwhm,
} from "./super-resolution";

export interface SuperResolutionSummary {
  /** Abbe lateral FWHM λ/(2NA), m. */
  abbe: number;
  /** Rayleigh distance 0.61 λ/NA, m. */
  rayleigh: number;
  /** One-photon axial FWHM, m; NaN when NA ≥ n. */
  axial: number;
  /** STED lateral FWHM, m. */
  sted: number;
  /** Localization precision σ, m. */
  palm: number;
  /** Localization FWHM 2.355 σ, m. */
  palmFwhm: number;
}

/** Wavelengths (m), NA, index n, depletion ratio I_STED/I_sat and detected photons. */
export function superResolutionSummary(
  lambda: number, na: number, n: number, stedDepletion: number, lambdaSted: number, photons: number,
): SuperResolutionSummary {
  const palm = localizationPrecision(lambda, na, photons);
  return {
    abbe: abbeLateralFwhm(lambda, na),
    rayleigh: rayleighDistance(lambda, na),
    axial: axialPsfFwhm(lambda, n, na),
    sted: stedLateralFwhm(lambda, na, stedDepletion, lambdaSted),
    palm,
    palmFwhm: palm * GAUSSIAN_FWHM_PER_SIGMA,
  };
}
