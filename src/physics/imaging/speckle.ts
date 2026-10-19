/**
 * Laser speckle from a rough surface. SI units: wavelengths, distances and roughness in m. Model tier: textbook.
 *
 * J. W. Goodman, Speckle Phenomena in Optics, 2nd ed. (SPIE, 2020), https://doi.org/10.1117/3.2548484:
 * - free-space (objective) speckle at distance z from a uniformly lit circular spot of diameter D: the intensity
 *   correlation is |2J₁(v)/v|² with v = πDr/(λz), so λz/D sets the size and the first zero lies at
 *   r = 1.22 λz/D (ch. 5);
 * - imaged (subjective) speckle: the same with the exit pupil seen from the image, λz_i/D_p = λ(1 + M)N for a lens
 *   of f-number N at magnification M;
 * - a Gaussian surface of rms height σ_h seen in reflection near normal incidence gives a phase of rms
 *   σ_φ = 4πσ_h/λ. The field is a specular phasor of intensity e^(−σ_φ²) plus a circular Gaussian (diffuse) part
 *   1 − e^(−σ_φ²) (many surface correlation cells in the spot), and the Rician contrast √(1 + 2r)/(1 + r), with
 *   r the specular-to-diffuse ratio, reduces to C = √(1 − e^(−2σ_φ²)), observed in the specular direction (ch. 3);
 * - the sum of N uncorrelated speckle patterns of equal mean has contrast C/√N.
 */

/** First zero of |2J₁(v)/v|² in units of λz/D: j₁,₁/π. */
export const SPECKLE_FIRST_ZERO = 3.8317059702075125 / Math.PI;

/** Objective speckle size λz/D, m. NaN unless λ, z, D > 0. */
export function objectiveSpeckleSize(lambda: number, distance: number, spotDiameter: number): number {
  if (!(lambda > 0) || !(distance > 0) || !(spotDiameter > 0)) return NaN;
  return (lambda * distance) / spotDiameter;
}

/** Subjective (imaged) speckle size λ(1 + M)N, m. NaN unless λ, N > 0 and M ≥ 0. */
export function subjectiveSpeckleSize(lambda: number, fNumber: number, magnification: number): number {
  if (!(lambda > 0) || !(fNumber > 0) || !(magnification >= 0)) return NaN;
  return lambda * (1 + magnification) * fNumber;
}

/** Rms phase 4πσ_h/λ of a surface with rms height σ_h, seen in reflection at normal incidence, rad. */
export function surfacePhaseRms(roughness: number, lambda: number): number {
  if (!(roughness >= 0) || !(lambda > 0)) return NaN;
  return (4 * Math.PI * roughness) / lambda;
}

/** Speckle contrast √(1 − e^(−2σ_φ²)) of a Gaussian phase screen of rms σ_φ, specular direction. */
export function speckleContrast(phaseRms: number): number {
  if (!(phaseRms >= 0)) return NaN;
  return Math.sqrt(-Math.expm1(-2 * phaseRms * phaseRms));
}

/** Contrast C/√N after summing N uncorrelated patterns of equal mean. NaN unless N ≥ 1. */
export function averagedContrast(contrast: number, patterns: number): number {
  if (!(patterns >= 1)) return NaN;
  return contrast / Math.sqrt(patterns);
}
