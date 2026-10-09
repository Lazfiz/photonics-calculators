/**
 * Closed forms for multiple-beam interference in one film or etalon: the Airy coefficient of
 * finesse and peak width, and the reflection extrema of a single film.
 *
 * Model tier: Exact for lossless, non-dispersive media at normal incidence. The Airy function is the
 * exact sum of the multiply reflected beams, and R(λ) of one lossless film depends on λ only through
 * cos δ (δ = 4πnd/λ), so its extrema are exactly at δ = mπ.
 *
 * References: M. Born & E. Wolf, Principles of Optics, 7th ed. (Cambridge University Press, 1999),
 * §7.6.1: Airy formulae, coefficient of finesse F = 4ρ/(1 − ρ)², half-intensity width 4 asin(1/√F),
 * finesse π√F/2. E. Hecht, Optics, 5th ed. (Pearson, 2017), §9.4.1 (thin-film fringes, phase change
 * on reflection) and §9.6 (Fabry-Perot).
 */

/**
 * Coefficient of finesse F = 4ρ/(1 − ρ)², ρ = √(R₁R₂), of a cavity between two mirrors (or film
 * faces) of reflectance R₁ and R₂: T ∝ 1/(1 + F sin²(δ/2)). NaN unless 0 ≤ R₁, R₂ < 1.
 */
export function coefficientOfFinesse(R1: number, R2 = R1): number {
  if (!(R1 >= 0 && R1 < 1 && R2 >= 0 && R2 < 1)) return NaN;
  const rho = Math.sqrt(R1 * R2);
  return (4 * rho) / (1 - rho) ** 2;
}

/** Reflecting finesse ℱ = π√F/2: free spectral range over peak width when F ≫ 1. NaN unless F ≥ 0. */
export function reflectingFinesse(F: number): number {
  return F >= 0 ? (Math.PI * Math.sqrt(F)) / 2 : NaN;
}

/**
 * Full width at half maximum of an Airy peak 1/(1 + F sin²(δ/2)) in round-trip phase δ:
 * 4 asin(1/√F), ≈ 2π/ℱ when F ≫ 1. NaN for F < 1, where the minimum 1/(1 + F) is above ½.
 */
export function airyPeakWidth(F: number): number {
  return F >= 1 ? 4 * Math.asin(1 / Math.sqrt(F)) : NaN;
}

export interface AiryPeak {
  /** Interference order m ≥ 1. */
  order: number;
  /** Peak wavelength 2nd/m, m. */
  wavelength: number;
  /** Free spectral range at the peak, λ_m²/(2nd) = λ_m/m (first order in 1/m), m. */
  fsr: number;
  /** Exact half-intensity width in wavelength, λ(2πm − w/2) − λ(2πm + w/2), w = airyPeakWidth(F); NaN for F < 1. */
  fwhm: number;
}

/**
 * Transmission peak of an ideal etalon (normal incidence, no mirror phase, round-trip phase δ = 4πnd/λ)
 * nearest a wavelength: order m = round(2nd/λ), at least 1. opticalThickness = nd and wavelength in m.
 * The half-maximum points are at δ = 2πm ± w/2, i.e. λ = 4πnd/(2πm ∓ w/2) (Born & Wolf §7.6.1).
 * NaN fields unless nd > 0, λ > 0 and F ≥ 0.
 */
export function airyPeakNear(opticalThickness: number, wavelength: number, F: number): AiryPeak {
  if (!(opticalThickness > 0 && wavelength > 0 && F >= 0)) return { order: NaN, wavelength: NaN, fsr: NaN, fwhm: NaN };
  const order = Math.max(1, Math.round((2 * opticalThickness) / wavelength));
  const peak = (2 * opticalThickness) / order;
  const halfWidth = airyPeakWidth(F) / 2;
  const at = (delta: number) => (4 * Math.PI * opticalThickness) / delta;
  const centre = 2 * Math.PI * order;
  // The lower half-maximum point needs δ > 0: a peak wider than its own order has no lower edge.
  const fwhm = halfWidth < centre ? at(centre - halfWidth) - at(centre + halfWidth) : NaN;
  return { order, wavelength: peak, fsr: peak / order, fwhm };
}

/**
 * Net phase difference, beyond the path 2nd, between the beams reflected at the two faces of a film
 * at normal incidence. A reflection off a higher index adds π, so the result is 0 or π.
 * NaN if the film index equals a neighbour's (that face doesn't reflect) or an index isn't > 0.
 */
export function netReflectionPhase(nIncident: number, nFilm: number, nSubstrate: number): number {
  if (!(nIncident > 0 && nFilm > 0 && nSubstrate > 0) || nFilm === nIncident || nFilm === nSubstrate) return NaN;
  const shifts = (nFilm > nIncident ? 1 : 0) + (nSubstrate > nFilm ? 1 : 0);
  return shifts === 1 ? Math.PI : 0;
}

/**
 * Longest vacuum wavelengths (m) of constructive and destructive interference in reflection from a
 * lossless film of thickness d (m) at normal incidence. With net phase 0, maxima are at 2nd = mλ and
 * minima at 2nd = (m + ½)λ; a net phase π swaps them. These are the exact extrema of R(λ).
 * NaN when the net phase is undefined or d ≤ 0.
 */
export function firstReflectionExtrema(
  nIncident: number,
  nFilm: number,
  nSubstrate: number,
  thickness: number,
): { constructive: number; destructive: number } {
  const phase = netReflectionPhase(nIncident, nFilm, nSubstrate);
  if (Number.isNaN(phase) || !(thickness > 0)) return { constructive: NaN, destructive: NaN };
  const opd = 2 * nFilm * thickness;
  return phase === 0 ? { constructive: opd, destructive: 2 * opd } : { constructive: 2 * opd, destructive: opd };
}
