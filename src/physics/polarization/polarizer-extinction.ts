/**
 * Transmission of imperfect linear polarizers modelled as ideal linear diattenuators with principal intensity
 * transmittances T∥ (pass axis) and T⊥ = T∥/ER (block axis), ER the linear extinction ratio. Angles in rad.
 * Model tier: exact for ideal diattenuators.
 *
 * Source: Goldstein, Polarized Light, 3rd ed. (2011), Mueller Matrices for Polarizing Components, pp. 93–115 (the
 * linear diattenuator with principal transmittances p², q²): linearly polarized light at θ to the pass axis is transmitted with T(θ) = T∥cos²θ + T⊥sin²θ
 * (Malus's law for T⊥ = 0). Aligned diattenuators in series multiply their principal transmittances, so n identical
 * polarizers give T∥ⁿ and T⊥ⁿ and the extinction ratio ERⁿ (n·ER_dB in dB).
 * Not modelled: depolarization and scatter (which cap a real cascade), misalignment between elements, reflections.
 */

/** Linear extinction ratio from decibels, 10^(dB/10). */
export function extinctionRatioFromDb(erDb: number): number {
  return 10 ** (erDb / 10);
}

/** T(θ) = T∥cos²θ + T⊥sin²θ for linearly polarized light at θ (rad) to the pass axis. */
export function analyzerTransmission(tPar: number, tPerp: number, theta: number): number {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  return tPar * c * c + tPerp * s * s;
}

/** Contrast T∥ / T(θ) in dB. NaN when T∥ or T(θ) is not positive. */
export function contrastDb(tPar: number, tTheta: number): number {
  if (!(tPar > 0 && tTheta > 0)) return NaN;
  return 10 * Math.log10(tPar / tTheta);
}

export interface Cascade {
  /** Pass-axis transmittance T∥ⁿ. */
  readonly tPar: number;
  /** Extinction ratio of the stack in dB, n·ER_dB. */
  readonly erDb: number;
}

/** n identical aligned polarizers in series. NaN for n < 1 or non-integer n. */
export function cascade(tPar: number, erDb: number, n: number): Cascade {
  if (!(Number.isInteger(n) && n >= 1)) return { tPar: NaN, erDb: NaN };
  return { tPar: tPar ** n, erDb: n * erDb };
}
