/**
 * Lens–pinhole spatial filter for a TEM₀₀ Gaussian beam, paraxial. SI units, radii at 1/e² intensity.
 * Model tier: exact within the paraxial model for M² = 1; for M² > 1 the embedded-Gaussian spot M² w_f and the
 * Gaussian throughput are an estimate (the filter's job is to strip the non-Gaussian part).
 *   Fourier-plane spot  w_f = M² λ f / (π w_in)  (exact for the input waist at the front focal plane, and for a
 *     collimated input with z_R,in ≫ f),
 *   pinhole of radius a passes T = 1 − exp(−2a²/w_f²): 86.47 % at a = w_f, 98.89 % at a = 1.5 w_f,
 *   transmitted far field at distance z (or the back focal plane of a collimating lens of focal length z):
 *     E(ρ)/E_full(0) = (2/w²) ∫₀ᵃ exp(−r²/w²) J₀(2π r ρ / (λ z)) r dr, on axis 1 − exp(−a²/w²),
 *   which tends to the Gaussian exp(−ρ²/W²), W = λ z/(π w), as a → ∞.
 * K. Uehara & H. Kikuchi, Appl. Opt. 25, 4514 (1986), doi 10.1364/AO.25.004514 (transmission and diffraction of a
 * Gaussian beam by a circular aperture); H. Kogelnik & T. Li, Appl. Opt. 5, 1550 (1966), doi 10.1364/AO.5.001550.
 * Airy pattern of a uniformly filled aperture of diameter D: first-zero diameter 2.44 λ f / D.
 */

import { besselJ, integrateSimpson } from "../math";

/** Fourier-plane (focal) 1/e² spot radius w_f = M² λ f / (π w_in), m. */
export function focusedSpotRadius(lambda: number, wIn: number, f: number, m2 = 1): number {
  if (!(lambda > 0 && wIn > 0 && f > 0 && m2 > 0) || !Number.isFinite(lambda * wIn * f * m2)) return NaN;
  return (m2 * lambda * f) / (Math.PI * wIn);
}

/** Power fraction of a centred Gaussian (1/e² radius w) through a circular pinhole of radius a: 1 − exp(−2a²/w²). */
export function pinholeTransmission(a: number, w: number): number {
  if (!(a >= 0 && w > 0) || !Number.isFinite(a / w)) return NaN;
  return -Math.expm1((-2 * a * a) / (w * w));
}

/** Pinhole radius that passes the power fraction T ∈ (0, 1): a = w √(−ln(1 − T)/2). */
export function pinholeRadiusForTransmission(T: number, w: number): number {
  if (!(T > 0 && T < 1 && w > 0)) return NaN;
  return w * Math.sqrt(-Math.log1p(-T) / 2);
}

/** First-zero (Airy disk) diameter 2.44 λ f / D of a uniformly filled aperture of diameter D, m. */
export function airyDiskDiameter(lambda: number, f: number, D: number): number {
  if (!(lambda > 0 && f > 0 && D > 0)) return NaN;
  return (2.44 * lambda * f) / D;
}

/**
 * Far-field intensity at radius ρ of the Gaussian (radius w at the pinhole) cut by a pinhole of radius a, at
 * distance z, relative to the peak of the uncut beam. Simpson rule over [0, a] with 16 + 16 a/w + 8 κa panels
 * (κ = 2πρ/(λz)): 16 per Gaussian radius w and 25 per half-period of J₀(κr), error ≲ 1e-5 of the on-axis peak.
 */
export function pinholeFarFieldIntensity(lambda: number, w: number, a: number, z: number, rho: number): number {
  if (!(lambda > 0 && w > 0 && a >= 0 && z > 0 && rho >= 0) || !Number.isFinite(lambda * w * a * z * rho)) return NaN;
  if (a === 0) return 0;
  const kappa = (2 * Math.PI * rho) / (lambda * z);
  const panels = 16 + 16 * Math.ceil(a / w) + 8 * Math.ceil(kappa * a);
  const amp = (2 / (w * w)) * integrateSimpson((r) => Math.exp(-(r * r) / (w * w)) * besselJ(0, kappa * r) * r, 0, a, panels);
  return amp * amp;
}
