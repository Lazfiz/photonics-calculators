/**
 * Gaussian light sheet: thickness, Rayleigh range and the effective axial resolution of a light-sheet microscope.
 * SI units in and out. Model tier: textbook approximation (paraxial Gaussian beam focused by a cylindrical lens).
 *
 * - Waist (1/e² intensity half-thickness) of a sheet focused with numerical aperture NA = n sin θ in a medium of
 *   index n: w₀ = λ/(π n θ) ≈ λ/(π NA), λ the vacuum wavelength; Rayleigh range z_R = π n w₀²/λ, over which the
 *   sheet thickens by √2 (Siegman, Lasers, ch. 17). Intensity FWHM of the sheet profile √(2 ln 2) · w₀.
 * - The detected axial profile is the product of the sheet profile and the detection PSF along z. Treating both as
 *   Gaussians, the FWHMs combine as 1/FWHM² = 1/FWHM_sheet² + 1/FWHM_det²
 *   (C. J. Engelbrecht, E. H. K. Stelzer, Opt. Lett. 31, 1477 (2006), doi:10.1364/OL.31.001477).
 */

const positive = (x: number) => Number.isFinite(x) && x > 0;

/** Sheet waist w₀ = λ/(π NA) (1/e² intensity half-thickness at the focus), m. Paraxial: NA ≲ 0.3. */
export function gaussianSheetWaist(lambda: number, NA: number): number {
  return positive(lambda) && positive(NA) ? lambda / (Math.PI * NA) : NaN;
}

/** Rayleigh range π n w₀²/λ of the sheet (half the length over which it is at most √2 w₀ thick), m. */
export function gaussianSheetRayleighRange(lambda: number, NA: number, n: number): number {
  if (!(positive(lambda) && positive(NA) && Number.isFinite(n) && n >= 1)) return NaN;
  const w0 = gaussianSheetWaist(lambda, NA);
  return (Math.PI * n * w0 * w0) / lambda;
}

/** Intensity FWHM of the sheet at the waist, √(2 ln 2) · w₀, m. */
export function gaussianSheetFwhm(lambda: number, NA: number): number {
  return Math.sqrt(2 * Math.LN2) * gaussianSheetWaist(lambda, NA);
}

/** Effective axial FWHM of sheet × detection PSF, (1/a² + 1/b²)^(−1/2) for Gaussian profiles, m. */
export function effectiveAxialFwhm(sheetFwhm: number, detectionAxialFwhm: number): number {
  return positive(sheetFwhm) && positive(detectionAxialFwhm)
    ? 1 / Math.hypot(1 / sheetFwhm, 1 / detectionAxialFwhm)
    : NaN;
}

/** Far-field half-angle divergence of the sheet in the medium, λ/(π n w₀) = NA/n, rad (paraxial). */
export function gaussianSheetDivergence(NA: number, n: number): number {
  return positive(NA) && Number.isFinite(n) && n >= 1 ? NA / n : NaN;
}

/** 1/e² half-thickness w(x) = w₀ √(1 + (x/z_R)²) at a distance x from the waist along the sheet, m. */
export function gaussianSheetHalfThicknessAt(x: number, lambda: number, NA: number, n: number): number {
  if (!Number.isFinite(x)) return NaN;
  const zR = gaussianSheetRayleighRange(lambda, NA, n);
  return gaussianSheetWaist(lambda, NA) * Math.hypot(1, x / zR);
}
