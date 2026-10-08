/**
 * Resolution of STED and single-molecule localization (PALM/STORM) microscopy. SI units in and out
 * (wavelengths and lengths in m). Model tier: textbook approximation.
 *
 * - Diffraction limit, lateral FWHM ≈ λ/(2NA) (Abbe). The Airy FWHM is 0.514 λ/NA; the Rayleigh two-point
 *   distance 0.61 λ/NA is a different quantity (first zero), not a spot width.
 * - STED: d = λ/(2NA √(1 + I/I_s)), V. Westphal, S. W. Hell, Phys. Rev. Lett. 94, 143903 (2005). The law scales the
 *   FWHM λ/(2NA); feeding it the Rayleigh distance 0.61 λ/NA (as the page did) overstates d by 22 %. 2D STED
 *   (vortex depletion) leaves the axial FWHM unchanged.
 * - Axial diffraction limit: one-photon FWHM 0.88 λ/(n − √(n² − NA²)) (optical-sectioning-thickness module).
 * - Localization: σ = s/√N with s ≈ 0.21 λ/NA, the standard deviation of the Gaussian that best fits the Airy
 *   PSF (B. Zhang, J. Zerubia, J.-C. Olivo-Marin, Appl. Opt. 46, 1819 (2007)). This is the shot-noise limit of
 *   R. E. Thompson, D. R. Larson, W. W. Webb, Biophys. J. 82, 2775 (2002); pixelation, background and EMCCD
 *   excess noise (×√2) make it larger (Mortensen et al., Nat. Methods 7, 377 (2010)). The localization FWHM
 *   2√(2 ln 2) σ is often quoted as the resolution.
 */

export { axialPsfFwhm } from "./optical-sectioning-thickness";

/** Gaussian standard deviation of the widefield PSF, in units of λ/NA (Zhang et al. 2007). */
export const PSF_SIGMA_COEFFICIENT = 0.21;
/** FWHM = 2√(2 ln 2) σ for a Gaussian. */
export const GAUSSIAN_FWHM_PER_SIGMA = 2 * Math.sqrt(2 * Math.LN2);

const positive = (x: number) => Number.isFinite(x) && x > 0;

/** Abbe lateral FWHM λ/(2NA), m. */
export function abbeLateralFwhm(lambda: number, NA: number): number {
  return positive(lambda) && positive(NA) ? lambda / (2 * NA) : NaN;
}

/** Rayleigh two-point distance 0.61 λ/NA, m. */
export function rayleighDistance(lambda: number, NA: number): number {
  return positive(lambda) && positive(NA) ? (0.61 * lambda) / NA : NaN;
}

/** STED lateral FWHM λ/(2NA √(1 + I/I_s)), m (Westphal & Hell 2005). */
export function stedLateralFwhm(lambda: number, NA: number, saturation: number): number {
  if (!(Number.isFinite(saturation) && saturation >= 0)) return NaN;
  return abbeLateralFwhm(lambda, NA) / Math.sqrt(1 + saturation);
}

/** Shot-noise-limited localization precision (standard deviation) 0.21 λ/(NA √N), m. */
export function localizationPrecision(lambda: number, NA: number, photons: number): number {
  if (!positive(photons) || !positive(lambda) || !positive(NA)) return NaN;
  return (PSF_SIGMA_COEFFICIENT * lambda) / (NA * Math.sqrt(photons));
}
