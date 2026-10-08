/**
 * Axial resolution and optical-section thickness of widefield, confocal and two-photon microscopes.
 * SI units in and out (wavelengths and lengths in m). Model tier: textbook approximation.
 *
 * All the high-NA forms use n − √(n² − NA²), which reduces to NA²/(2n) at low NA.
 * - Widefield depth of field 2nλ/NA²: the distance from focus to the first axial zero of the paraxial
 *   PSF, I(u) ∝ [sin(u/4)/(u/4)]² with u = 2π NA² z/(nλ) (Born & Wolf, Principles of Optics, §8.8).
 *   A widefield microscope has no optical sectioning: defocused light is blurred, not rejected.
 * - Confocal, finite pinhole (geometric-optical regime, PH ≥ 1 AU), FWHM of the optical section:
 *     FWHM = √[(0.88 λ/(n − √(n² − NA²)))² + (√2 · n · PH/NA)²],
 *   PH = object-side pinhole diameter, 1 AU = 1.22 λ/NA. Point-like pinhole (PH < 0.25 AU), wave-optical:
 *     FWHM = 0.64 λ/(n − √(n² − NA²)).
 *   R. Wilhelm, B. Gröbler, M. Gluch, H. Heinz, "Confocal Laser Scanning Microscopy: Principles"
 *   (Carl Zeiss, 2003). λ is the emission wavelength (the geometric term) or the mean wavelength.
 * - Two-photon excitation: the axial 1/e radius of the squared illumination intensity is
 *     ω_z = (0.532 λ/√2) / (n − √(n² − NA²))  (fit for NA > 0.7),
 *   W. R. Zipfel, R. M. Williams, W. W. Webb, Nat. Biotechnol. 21, 1369 (2003); FWHM = 2√(ln 2) ω_z.
 */

const valid = (lambda: number, n: number, NA: number) =>
  lambda > 0 && NA > 0 && n >= 1 && NA < n && Number.isFinite(lambda * n * NA);

/** n − √(n² − NA²), computed as NA²/(n + √(n² − NA²)) to avoid cancellation at low NA. */
function axialDenominator(n: number, NA: number): number {
  return (NA * NA) / (n + Math.sqrt(n * n - NA * NA));
}

/** Object-side Airy unit (Airy disk diameter) 1.22 λ/NA, m. */
export function airyUnit(lambda: number, NA: number): number {
  return lambda > 0 && NA > 0 ? (1.22 * lambda) / NA : NaN;
}

/** Widefield depth of field 2nλ/NA² (focus to first axial zero, paraxial), m. */
export function widefieldDepthOfField(lambda: number, n: number, NA: number): number {
  return valid(lambda, n, NA) ? (2 * n * lambda) / (NA * NA) : NaN;
}

/** Axial FWHM of the one-photon detection PSF, 0.88 λ/(n − √(n² − NA²)), m. */
export function axialPsfFwhm(lambda: number, n: number, NA: number): number {
  return valid(lambda, n, NA) ? (0.88 * lambda) / axialDenominator(n, NA) : NaN;
}

/** Confocal optical-section FWHM for a pinhole of `pinholeAU` Airy units (geometric regime, ≥ 1 AU), m. */
export function confocalSectionFwhm(lambda: number, n: number, NA: number, pinholeAU: number): number {
  if (!valid(lambda, n, NA) || !(pinholeAU >= 0) || !Number.isFinite(pinholeAU)) return NaN;
  const diffraction = axialPsfFwhm(lambda, n, NA);
  const geometric = (Math.SQRT2 * n * pinholeAU * airyUnit(lambda, NA)) / NA;
  return Math.hypot(diffraction, geometric);
}

/** Confocal optical-section FWHM for a point-like pinhole (< 0.25 AU), 0.64 λ/(n − √(n² − NA²)), m. */
export function confocalSectionFwhmPointPinhole(lambda: number, n: number, NA: number): number {
  return valid(lambda, n, NA) ? (0.64 * lambda) / axialDenominator(n, NA) : NaN;
}

/** Two-photon axial FWHM 2√(ln 2) · 0.532 λ_exc/(√2 (n − √(n² − NA²))) (Zipfel et al. 2003, NA > 0.7), m. */
export function twoPhotonAxialFwhm(lambdaExcitation: number, n: number, NA: number): number {
  if (!valid(lambdaExcitation, n, NA)) return NaN;
  return (2 * Math.sqrt(Math.LN2) * 0.532 * lambdaExcitation) / (Math.SQRT2 * axialDenominator(n, NA));
}
