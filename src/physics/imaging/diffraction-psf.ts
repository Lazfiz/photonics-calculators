/**
 * Diffraction-limited point spread function of an aberration-free system with a uniformly filled circular pupil.
 * SI units in and out (wavelengths and lengths in m). Model tier: textbook approximation (scalar theory).
 *
 * - Lateral (focal plane), Airy pattern: I(v) = [2 J₁(v)/v]², v = 2π NA r/λ (Born & Wolf, Principles of Optics,
 *   §8.5.2). First zero at v = j₁,₁ = 3.8317 → r = 0.6098 λ/NA; half maximum at v = 1.6163 → FWHM
 *   0.5145 λ/NA. Energy inside radius v: L(v) = 1 − J₀²(v) − J₁²(v) (Lord Rayleigh; Born & Wolf §8.5.2),
 *   83.8 % inside the first dark ring.
 * - Axial (on the optical axis), paraxial: I(u) = [sin(u/4)/(u/4)]², u = 2π NA² z/(nλ) (Born & Wolf §8.8,
 *   with sin α = NA/n). First zero at u = 4π, z = 2nλ/NA².
 * - Axial, high NA: the Debye integral over the pupil with uniform weight in cos θ gives on axis
 *   I(z) = sinc²(π z (n − √(n² − NA²))/λ), FWHM 0.886 λ/(n − √(n² − NA²)), first zero at λ/(n − √(n² − NA²)).
 *   At low NA, n − √(n² − NA²) → NA²/(2n) and this is the paraxial form. The 0.88 FWHM of the
 *   optical-sectioning-thickness module (Wilhelm et al., Carl Zeiss 2003) is this result, rounded.
 *   Vectorial effects (polarization) widen the real focus by up to ≈ 10–20 % above NA ≈ 0.9.
 * - NA and f-number, object at infinity: an aplanatic lens obeys the sine condition, so NA = n sin α = D/(2f)
 *   = 1/(2N) exactly (Born & Wolf ch. 4). NA = 1/√(1 + 4N²) is the thin-lens (tan α = D/2f) form, which is
 *   not what a corrected lens does.
 */

import { besselJ, sinc } from "../math";

/** First zero of J₁, j₁,₁ (Abramowitz & Stegun Table 9.5). */
export const BESSEL_J1_FIRST_ZERO = 3.8317059702075123;
/** v where [2J₁(v)/v]² = ½ (root of the Airy pattern; checked by bisection in the test). */
export const AIRY_HALF_MAX_V = 1.6163399483107024;
/** x where (sin x/x)² = ½. */
export const SINC2_HALF_MAX_X = 1.3915573782515103;

const positive = (x: number) => Number.isFinite(x) && x > 0;
const validMedium = (lambda: number, n: number, NA: number) =>
  positive(lambda) && positive(NA) && Number.isFinite(n) && n >= 1 && NA < n;

/** n − √(n² − NA²), written as NA²/(n + √(n² − NA²)) to avoid cancellation at low NA. */
function axialDenominator(n: number, NA: number): number {
  return (NA * NA) / (n + Math.sqrt(n * n - NA * NA));
}

/** Normalised Airy intensity [2J₁(v)/v]² at the optical coordinate v = 2π NA r/λ. */
export function airyIntensity(v: number): number {
  if (!Number.isFinite(v)) return NaN;
  const a = Math.abs(v);
  // Series 2J₁(v)/v = 1 − v²/8 + v⁴/192 (A&S 9.1.10) where the quadrature loses relative precision.
  const amp = a < 1e-3 ? 1 - (a * a) / 8 + (a * a * a * a) / 192 : (2 * besselJ(1, a)) / a;
  return amp * amp;
}

/** Optical coordinate v = 2π NA r/λ. */
export function lateralOpticalCoordinate(r: number, lambda: number, NA: number): number {
  return positive(lambda) && positive(NA) && Number.isFinite(r) ? (2 * Math.PI * NA * r) / lambda : NaN;
}

/** Radius of the first dark ring (Airy disk radius) j₁,₁/(2π) · λ/NA = 0.6098 λ/NA, m. */
export function airyFirstZeroRadius(lambda: number, NA: number): number {
  return positive(lambda) && positive(NA) ? (BESSEL_J1_FIRST_ZERO / (2 * Math.PI)) * (lambda / NA) : NaN;
}

/** FWHM of the Airy pattern, 0.5145 λ/NA, m. */
export function airyFwhm(lambda: number, NA: number): number {
  return positive(lambda) && positive(NA) ? (AIRY_HALF_MAX_V / Math.PI) * (lambda / NA) : NaN;
}

/** Fraction of the total energy inside optical radius v: 1 − J₀²(v) − J₁²(v). */
export function encircledEnergyAiry(v: number): number {
  if (!(Number.isFinite(v) && v >= 0)) return NaN;
  if (v < 1e-3) return (v * v) / 4 - (v * v * v * v) / 32; // series: avoids 1 − (1 − v²/4 …) cancellation
  const j0 = besselJ(0, v);
  const j1 = besselJ(1, v);
  return 1 - j0 * j0 - j1 * j1;
}

/** Paraxial on-axis intensity [sin(u/4)/(u/4)]² at the axial optical coordinate u = 2π NA² z/(nλ). */
export function paraxialAxialIntensity(u: number): number {
  if (!Number.isFinite(u)) return NaN;
  const s = sinc(u / 4);
  return s * s;
}

/** Axial optical coordinate u = 2π NA² z/(nλ). */
export function axialOpticalCoordinate(z: number, lambda: number, n: number, NA: number): number {
  return validMedium(lambda, n, NA) && Number.isFinite(z) ? (2 * Math.PI * NA * NA * z) / (n * lambda) : NaN;
}

/** High-NA on-axis intensity sinc²(π z (n − √(n² − NA²))/λ) at defocus z (m) in a medium of index n. */
export function axialIntensity(z: number, lambda: number, n: number, NA: number): number {
  if (!validMedium(lambda, n, NA) || !Number.isFinite(z)) return NaN;
  const s = sinc((Math.PI * z * axialDenominator(n, NA)) / lambda);
  return s * s;
}

/** Distance from focus to the first axial zero, λ/(n − √(n² − NA²)), m (paraxial limit 2nλ/NA²). */
export function axialFirstZero(lambda: number, n: number, NA: number): number {
  return validMedium(lambda, n, NA) ? lambda / axialDenominator(n, NA) : NaN;
}

/** Image-side NA of a lens at infinite conjugate from its f-number, 1/(2N) (sine condition). */
export function naFromFNumber(N: number): number {
  return Number.isFinite(N) && N >= 0.5 ? 1 / (2 * N) : NaN;
}

/** f-number from the image-side NA in air, 1/(2NA); NA in (0, 1]. */
export function fNumberFromNa(NA: number): number {
  return positive(NA) && NA <= 1 ? 1 / (2 * NA) : NaN;
}

/** Thin-lens (tangent) NA 1/√(1 + 4N²), for comparison only: a corrected lens obeys the sine condition. */
export function thinLensNa(N: number): number {
  return Number.isFinite(N) && N > 0 ? 1 / Math.sqrt(1 + 4 * N * N) : NaN;
}
