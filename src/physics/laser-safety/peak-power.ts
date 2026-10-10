/**
 * Pulse energy, duration and peak power of a pulse train from its average power, repetition rate and duty cycle.
 * SI units: power in W, rate in Hz, energy in J, time in s; the duty cycle is a fraction (0.001 = 0.1 %).
 * Model tier: exact for the definitions; the peak of a non-rectangular pulse uses its shape factor.
 *
 * Source: P_avg = E·f, so E = P_avg/f; the duty cycle is D = τ·f with τ the pulse's FWHM duration, so τ = D/f; a
 * rectangular pulse has peak P_pk = E/τ = P_avg/D.
 * - Gaussian pulse I(t) ∝ exp(−4 ln2 t²/τ²): E = P_pk·τ·√(π/(4 ln2)), so P_pk = 2√(ln2/π)·E/τ = 0.9394·E/τ.
 * - sech² pulse I(t) ∝ sech²(1.7627 t/τ): E = P_pk·τ/ln(1+√2), so P_pk = ln(1+√2)·E/τ = 0.8814·E/τ.
 *   (Diels & Rudolph, Ultrashort Laser Pulse Phenomena, 2nd ed., ch. 1, for the pulse shapes; Paschotta, RP Photonics
 *   Encyclopedia, "Peak power", quotes the factors 0.94 and 0.88.)
 *
 * Not modelled: pulse trains with a varying repetition rate, pulse pedestals, and the energy outside the FWHM
 * (a real pulse is never exactly rectangular, the shape factor is the usual approximation).
 */

export type PulseShape = "rectangular" | "gaussian" | "sech2";

/** Peak power of a pulse of energy E and FWHM duration τ as a multiple of E/τ. */
export const PULSE_SHAPE_FACTOR: Readonly<Record<PulseShape, number>> = {
  rectangular: 1,
  gaussian: 2 * Math.sqrt(Math.LN2 / Math.PI),
  sech2: Math.log(1 + Math.SQRT2),
};

export interface PulseTrain {
  /** Pulse energy P/f, J. */
  readonly energy: number;
  /** Pulse duration (FWHM) D/f, s. */
  readonly duration: number;
  /** Peak power of a rectangular pulse, P/D, W. */
  readonly peak: number;
}

/**
 * Pulse train of average power P (W), repetition rate f (Hz) and duty cycle D (fraction, 0 < D ≤ 1).
 * NaN for P < 0, f ≤ 0, D ≤ 0, D > 1 or any non-finite input. D = 1 is a continuous wave: peak = average.
 */
export function pulseTrain(avgPower: number, repRate: number, dutyFraction: number): PulseTrain {
  if (!(Number.isFinite(avgPower) && Number.isFinite(repRate) && Number.isFinite(dutyFraction))
    || !(avgPower >= 0 && repRate > 0 && dutyFraction > 0 && dutyFraction <= 1)) {
    return { energy: NaN, duration: NaN, peak: NaN };
  }
  return { energy: avgPower / repRate, duration: dutyFraction / repRate, peak: avgPower / dutyFraction };
}

/** Peak power, W, of a pulse of energy E (J) and FWHM duration τ (s): shape factor × E/τ. NaN for E < 0 or τ ≤ 0. */
export function peakPower(energy: number, fwhm: number, shape: PulseShape): number {
  if (!(Number.isFinite(energy) && Number.isFinite(fwhm) && energy >= 0 && fwhm > 0)) return NaN;
  return (PULSE_SHAPE_FACTOR[shape] * energy) / fwhm;
}
