/**
 * Optical turbulence on a horizontal path with constant C_n² (Kolmogorov spectrum, zero inner scale, infinite
 * outer scale), plane-wave results. SI units: wavelengths, path lengths and diameters in m, C_n² in m^(−2/3),
 * angles in rad, speeds in m/s, frequencies in Hz. Model tier: textbook approximation.
 *
 * L. C. Andrews, R. L. Phillips, Laser Beam Propagation through Random Media, 2nd ed. (SPIE, 2005):
 * - Rytov variance σ_R² = 1.23 C_n² k^(7/6) L^(11/6);
 * - Fried parameter r₀ = (0.423 k² C_n² L)^(−3/5), the same as Fried's 0.185 λ^(6/5) (C_n² L)^(−3/5);
 * - isoplanatic angle θ₀ = (2.91 k² C_n² ∫₀ᴸ z^(5/3) dz)^(−3/5) = (2.91 · 3/8 · k² C_n² L^(8/3))^(−3/5);
 * - scintillation index of a plane wave in all regimes, for a receiver of diameter D, with d² = kD²/(4L):
 *   σ_I²(D) = exp[0.49σ_R² / (1 + 0.65d² + 1.11σ_R^(12/5))^(7/6)
 *                 + 0.51σ_R² (1 + 0.69σ_R^(12/5))^(−5/6) / (1 + 0.90d² + 0.62d²σ_R^(12/5))] − 1,
 *   which tends to σ_R² in weak turbulence and saturates at 1 in strong turbulence.
 * Fades: in weak fluctuations the received irradiance is log-normal with σ_ln² = ln(1 + σ_I²), so
 * P(I < F⟨I⟩) = Φ((ln F + σ_ln²/2)/σ_ln). (Moderate-to-strong turbulence needs gamma-gamma statistics.)
 *
 * Adaptive optics (a single turbulent layer moving at speed v):
 * - uncorrected phase variance 1.0299 (D/r₀)^(5/3), piston removed, and the residual after correcting the first
 *   J Zernike modes ≈ 0.2944 J^(−√3/2) (D/r₀)^(5/3) for large J (R. J. Noll, JOSA 66, 207 (1976));
 * - Greenwood frequency f_G = 0.427 v/r₀, servo-lag variance (f_G/f_3dB)^(5/3) for a first-order loop with
 *   closed-loop bandwidth f_3dB (D. P. Greenwood, JOSA 67, 390 (1977));
 * - Strehl ratio S ≈ e^(−σ²) + (1 − e^(−σ²))/(1 + (D/r₀)²), the Maréchal core plus the seeing halo, semi-empirical
 *   (R. R. Parenti, R. J. Sasiela, JOSA A 11, 288 (1994)). It tends to (r₀/D)² for an uncorrected D ≫ r₀.
 */

import { erfc } from "../math";

const waveNumber = (lambda: number) => (2 * Math.PI) / lambda;

/** Rytov variance σ_R² = 1.23 C_n² k^(7/6) L^(11/6) (plane wave). */
export function rytovVariance(cn2: number, lambda: number, pathLength: number): number {
  return 1.23 * cn2 * waveNumber(lambda) ** (7 / 6) * pathLength ** (11 / 6);
}

/** Fried parameter r₀ = (0.423 k² C_n² L)^(−3/5), m (plane wave). */
export function friedParameter(cn2: number, lambda: number, pathLength: number): number {
  return (0.423 * waveNumber(lambda) ** 2 * cn2 * pathLength) ** (-3 / 5);
}

/** Isoplanatic angle θ₀ = (2.91 · 3/8 · k² C_n² L^(8/3))^(−3/5), rad, uniform C_n² seen from one end. */
export function isoplanaticAngle(cn2: number, lambda: number, pathLength: number): number {
  return (2.91 * (3 / 8) * waveNumber(lambda) ** 2 * cn2 * pathLength ** (8 / 3)) ** (-3 / 5);
}

/** Fresnel zone √(L/k), m. */
export function fresnelZone(lambda: number, pathLength: number): number {
  return Math.sqrt(pathLength / waveNumber(lambda));
}

/** Scintillation index σ_I² of a plane wave for a receiver of diameter D (0 for a point receiver), all regimes. */
export function scintillationIndex(sigmaR2: number, lambda: number, pathLength: number, apertureDiameter = 0): number {
  const d2 = (waveNumber(lambda) * apertureDiameter ** 2) / (4 * pathLength);
  const s125 = sigmaR2 ** (6 / 5); // σ_R^(12/5)
  const lnX = (0.49 * sigmaR2) / (1 + 0.65 * d2 + 1.11 * s125) ** (7 / 6);
  const lnY = (0.51 * sigmaR2 * (1 + 0.69 * s125) ** (-5 / 6)) / (1 + 0.9 * d2 + 0.62 * d2 * s125);
  return Math.expm1(lnX + lnY);
}

/** Log-normal probability that the irradiance falls below F times its mean, for scintillation index σ_I². */
export function lognormalFadeProbability(fadeRatio: number, sigmaI2: number): number {
  if (sigmaI2 <= 0) return fadeRatio > 1 ? 1 : 0;
  const s2 = Math.log1p(sigmaI2);
  // Φ(x) = ½ erfc(−x/√2)
  return 0.5 * erfc(-(Math.log(fadeRatio) + s2 / 2) / Math.sqrt(2 * s2));
}

/** Uncorrected Kolmogorov phase variance over an aperture D, piston removed: 1.0299 (D/r₀)^(5/3), rad². */
export function uncorrectedPhaseVariance(diameter: number, r0: number): number {
  return 1.0299 * (diameter / r0) ** (5 / 3);
}

/** Residual phase variance after correcting the first J Zernike modes, 0.2944 J^(−√3/2) (D/r₀)^(5/3), rad². */
export function fittingErrorVariance(modes: number, diameter: number, r0: number): number {
  return 0.2944 * modes ** (-Math.sqrt(3) / 2) * (diameter / r0) ** (5 / 3);
}

/** Greenwood frequency f_G = 0.427 v/r₀, Hz. */
export function greenwoodFrequency(windSpeed: number, r0: number): number {
  return (0.427 * windSpeed) / r0;
}

/** Servo-lag phase variance (f_G/f_3dB)^(5/3), rad², for a first-order loop. */
export function servoLagVariance(greenwood: number, bandwidth: number): number {
  return (greenwood / bandwidth) ** (5 / 3);
}

/** Strehl ratio e^(−σ²) + (1 − e^(−σ²))/(1 + (D/r₀)²) (Parenti & Sasiela 1994). */
export function strehlRatio(phaseVariance: number, diameter: number, r0: number): number {
  const core = Math.exp(-phaseVariance);
  return core + (1 - core) / (1 + (diameter / r0) ** 2);
}
