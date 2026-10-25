/**
 * Irradiance (power density) of a round beam from its power and 1/e² diameter. SI in and out: P in W, lengths in m,
 * irradiance in W/m². Model tier: exact for an ideal TEM₀₀ Gaussian or a uniform (top-hat) disc.
 *
 * Source: Saleh & Teich, Fundamentals of Photonics, ch. 3.1: I(ρ) = (2P/πW²) exp(−2ρ²/W²), so the Gaussian peak is
 * I₀ = 2P/(πw²) = 8P/(πd²) with w = d/2 the 1/e² radius. The mean over the 1/e² disc is P/(πw²) = I₀/2 (a convention:
 * only 1 − e⁻² = 86.5 % of the power falls inside that disc). A top-hat of diameter d is uniform at P/(πw²).
 * Not modelled: aperture averaging for an exposure limit, clipping, non-Gaussian profiles.
 */

import { relativeIntensity } from "./beam-diameter";

export type BeamProfile = "gaussian" | "tophat";

export interface BeamIrradiance {
  /** Peak (on-axis) irradiance, W/m². */
  readonly peak: number;
  /** Power divided by the 1/e² disc area, W/m². */
  readonly mean: number;
  /** Area π(d/2)² of the 1/e² disc, m². */
  readonly area: number;
}

/** Peak and mean irradiance of a beam of power P and 1/e² diameter d. NaN for P < 0 or d ≤ 0. */
export function beamIrradiance(power: number, d: number, profile: BeamProfile): BeamIrradiance {
  if (!(power >= 0 && d > 0 && Number.isFinite(power) && Number.isFinite(d))) return { peak: NaN, mean: NaN, area: NaN };
  const area = (Math.PI * d * d) / 4;
  const mean = power / area;
  return { peak: profile === "gaussian" ? 2 * mean : mean, mean, area };
}

/** Irradiance at radius r, W/m²: I₀ exp(−2r²/w²) for a Gaussian, I₀ inside r ≤ d/2 for a top-hat. NaN for r < 0. */
export function irradianceAt(r: number, power: number, d: number, profile: BeamProfile): number {
  const { peak } = beamIrradiance(power, d, profile);
  if (!(r >= 0)) return NaN;
  if (profile === "gaussian") return peak * relativeIntensity(r, d / 2);
  return r <= d / 2 ? peak : 0;
}
