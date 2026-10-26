/**
 * Resolution of STED, single-molecule localization (PALM/STORM), structured illumination (SIM) and expansion
 * microscopy (ExM). SI units in and out (wavelengths and lengths in m). Model tier: textbook approximation.
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

import { GAUSSIAN_FWHM_PER_SIGMA, integrateTanhSinh } from "../math";

export { axialPsfFwhm } from "./optical-sectioning-thickness";

/** Gaussian standard deviation of the widefield PSF, in units of λ/NA (Zhang et al. 2007). */
export const PSF_SIGMA_COEFFICIENT = 0.21;
/** FWHM = 2√(2 ln 2) σ for a Gaussian (`math.ts`). */
export { GAUSSIAN_FWHM_PER_SIGMA };

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

/**
 * Localization precision (standard deviation) with pixelation and background, K. I. Mortensen et al., Nat. Methods
 * 7, 377 (2010), doi:10.1038/nmeth.1447, with σ_a² = σ² + a²/12:
 * - eq. 5, maximum-likelihood fit of a Gaussian (MLEwG): Var = σ_a²/N · (1 + ∫₀¹ ln t / (1 + N a² t/(2π σ_a² b²)) dt)⁻¹;
 * - eq. 6, unweighted least-squares Gaussian fit (GME): Var = σ_a²/N · (16/9 + 8π σ_a² b²/(N a²)).
 * σ = 0.21 λ/NA, a is the pixel size in the sample plane, N the detected photons and b² the expected background
 * photons per pixel. An EMCCD's excess noise doubles the variance (their Supplementary Note). Returns m.
 */
export function mortensenPrecision(
  lambda: number, NA: number, photons: number, pixel: number, background: number,
  options: { estimator?: "mle" | "ls"; emccd?: boolean } = {},
): number {
  if (!positive(lambda) || !positive(NA) || !positive(photons) || !positive(pixel)) return NaN;
  if (!(Number.isFinite(background) && background >= 0)) return NaN;
  const sigma = (PSF_SIGMA_COEFFICIENT * lambda) / NA;
  const sa2 = sigma * sigma + (pixel * pixel) / 12;
  let factor: number;
  if (options.estimator === "mle") {
    if (background === 0) factor = 1;
    else {
      const tau = (photons * pixel * pixel) / (2 * Math.PI * sa2 * background);
      factor = 1 / (1 + integrateTanhSinh((t) => Math.log(t) / (1 + tau * t), 0, 1));
    }
  } else {
    factor = 16 / 9 + (8 * Math.PI * sa2 * background) / (photons * pixel * pixel);
  }
  const variance = (sa2 / photons) * factor * (options.emccd ? 2 : 1);
  return Math.sqrt(variance);
}

/**
 * Nyquist label-density resolution 2/ρ^(1/D): twice the mean label spacing, for ρ labels per m^D in D dimensions
 * (H. Shroff, C. G. Galbraith, J. A. Galbraith, E. Betzig, Nat. Methods 5, 417 (2008), doi:10.1038/nmeth.1202). Returns m.
 */
export function nyquistResolution(density: number, dimensions: 1 | 2 | 3): number {
  return positive(density) ? 2 / Math.pow(density, 1 / dimensions) : NaN;
}

/**
 * Effective SMLM resolution √((2.355 σ_loc)² + d_Nyquist²): the localization FWHM and the Nyquist term in quadrature
 * (W. R. Legant et al., Nat. Methods 13, 359 (2016), doi:10.1038/nmeth.3797). Returns m.
 */
export function smlmEffectiveResolution(sigmaLoc: number, nyquist: number): number {
  if (!positive(sigmaLoc) || !positive(nyquist)) return NaN;
  return Math.hypot(GAUSSIAN_FWHM_PER_SIGMA * sigmaLoc, nyquist);
}

/**
 * SIM lateral cut-off frequency 2NA/λ_em + m·k₀ with pattern frequency k₀ = p · 2NA/λ_ex (p ≤ 1; p = 1 when the two
 * beams sit at the pupil edge). m = 1 is linear SIM (M. G. L. Gustafsson, J. Microsc. 198, 82 (2000),
 * doi:10.1046/j.1365-2818.2000.00710.x); m > 1 counts the harmonics of saturated SIM (M. G. L. Gustafsson, PNAS 102,
 * 13081 (2005), doi:10.1073/pnas.0406877102). Returns cycles per m.
 */
export function simCutoff(lambdaEx: number, lambdaEm: number, NA: number, patternFraction = 1, orders = 1): number {
  if (!positive(lambdaEx) || !positive(lambdaEm) || !positive(NA)) return NaN;
  if (!(patternFraction > 0 && patternFraction <= 1) || !(Number.isInteger(orders) && orders >= 1)) return NaN;
  return (2 * NA) / lambdaEm + (orders * patternFraction * 2 * NA) / lambdaEx;
}

/** SIM lateral resolution 1/k_c, the Abbe-type counterpart of λ/(2NA) for widefield, m. */
export function simLateralFwhm(lambdaEx: number, lambdaEm: number, NA: number, patternFraction = 1, orders = 1): number {
  return 1 / simCutoff(lambdaEx, lambdaEm, NA, patternFraction, orders);
}

/** Raw SIM images: (2m + 1) phases per pattern angle to separate orders −m … m (Gustafsson 2000, 2005). */
export function simRawImageCount(orders: number, angles: number): number {
  if (!(Number.isInteger(orders) && orders >= 1) || !(Number.isInteger(angles) && angles >= 1)) return NaN;
  return angles * (2 * orders + 1);
}

/**
 * Expansion microscopy resolution in pre-expansion units, √((d/E)² + L²), with the label displacement
 * L = √(probe² + linker²). A label applied before expansion expands with the sample, so L is not reduced; a label
 * applied after expansion binds the expanded sample, so L becomes L/E (A. T. Wassie, Y. Zhao, E. S. Boyden, Nat.
 * Methods 16, 33 (2019), doi:10.1038/s41592-018-0219-4). d is the microscope's resolution; all lengths in m.
 */
export function expansionEffectiveResolution(
  resolution: number, expansion: number, probe: number, linker: number, labelling: "pre" | "post",
): number {
  if (!positive(resolution) || !(Number.isFinite(expansion) && expansion >= 1)) return NaN;
  if (!(Number.isFinite(probe) && probe >= 0 && Number.isFinite(linker) && linker >= 0)) return NaN;
  const L = Math.hypot(probe, linker) / (labelling === "post" ? expansion : 1);
  return Math.hypot(resolution / expansion, L);
}
