/**
 * Chirped-pulse amplification: stretch a transform-limited Gaussian pulse with group-delay dispersion, amplify it, and
 * recompress it with a Treacy grating-pair compressor.
 * SI units: times in s, GDD in s², TOD in s³, lengths in m, angles in rad, frequencies in Hz.
 * Model tier: textbook (Gaussian pulses, quadratic spectral phase; gain narrowing, B-integral and residual higher orders
 * are not modelled).
 *
 * A Gaussian pulse of transform-limited intensity FWHM τ₀ given a GDD φ₂ lasts
 *   τ = τ₀ √(1 + (4 ln2 φ₂/τ₀²)²)
 * (Diels & Rudolph, Ultrashort Laser Pulse Phenomena, 2nd ed., ch. 1), so a stretch ratio r = τ/τ₀ needs
 * |φ₂| = (τ₀²/4 ln2) √(r² − 1). The compressor undoes the stretcher's +φ₂ (Strickland & Mourou 1985).
 *
 * Treacy grating pair (Treacy 1969, IEEE J. Quantum Electron. 5, 454), first order, perpendicular separation G, groove
 * spacing d, incidence angle α and diffraction angle β with sin β = λ/d − sin α:
 *   φ₂ = −N G λ³/(2π c² d² cos³β),   φ₃ = −φ₂ (3λ/2πc) [1 + λ sin β/(d cos²β)]
 * per N passes through the pair (N = 2 for the usual folded compressor). φ₃ is dφ₂/dω.
 */

import { c } from "../constants";

const FOUR_LN2 = 4 * Math.LN2;

/** Intensity FWHM, s, of a Gaussian pulse of transform-limited FWHM τ₀ (s) after a GDD φ₂ (s²). NaN for τ₀ ≤ 0. */
export function chirpedGaussianDuration(tau0: number, gdd: number): number {
  if (!(tau0 > 0 && Number.isFinite(tau0) && Number.isFinite(gdd))) return NaN;
  return tau0 * Math.hypot(1, (FOUR_LN2 * gdd) / tau0 ** 2);
}

/** GDD magnitude, s², that stretches a transform-limited Gaussian of FWHM τ₀ (s) by r = τ/τ₀ ≥ 1. NaN otherwise. */
export function gddForStretch(tau0: number, ratio: number): number {
  if (!(tau0 > 0 && ratio >= 1 && Number.isFinite(tau0) && Number.isFinite(ratio))) return NaN;
  return (tau0 ** 2 / FOUR_LN2) * Math.sqrt((ratio - 1) * (ratio + 1));
}

/** First-order diffraction angle β, rad, from sin β = λ/d − sin α. NaN when |sin β| > 1 (no propagating order). */
export function gratingDiffractionAngle(lambda: number, groove: number, incidence: number): number {
  if (!(lambda > 0 && groove > 0)) return NaN;
  const s = lambda / groove - Math.sin(incidence);
  return Math.abs(s) <= 1 ? Math.asin(s) : NaN;
}

export interface TreacyCompressor {
  /** Diffraction angle β, rad. */
  beta: number;
  /** GDD, s² (negative). */
  gdd: number;
  /** Third-order dispersion, s³. */
  tod: number;
}

/**
 * Treacy grating-pair dispersion for perpendicular separation G (m), groove spacing d (m), incidence α (rad) and N passes.
 * NaN fields when the first order does not propagate or cos β = 0.
 */
export function treacyCompressor(lambda: number, groove: number, incidence: number, separation: number, passes = 2): TreacyCompressor {
  const beta = gratingDiffractionAngle(lambda, groove, incidence);
  const cb = Math.cos(beta);
  if (!(cb > 0) || !Number.isFinite(separation)) return { beta, gdd: NaN, tod: NaN };
  const gdd = -(passes * separation * lambda ** 3) / (2 * Math.PI * c ** 2 * groove ** 2 * cb ** 3);
  const tod = -gdd * ((3 * lambda) / (2 * Math.PI * c)) * (1 + (lambda * Math.sin(beta)) / (groove * cb ** 2));
  return { beta, gdd, tod };
}
