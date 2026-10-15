/**
 * Counter dead time and afterpulsing for photon counting. SI units: s, counts/s. Invalid inputs give NaN.
 *
 * - Non-paralyzable dead time m = R/(1 + Rτ) and paralyzable m = R·e^{−Rτ}, R the true and m the recorded rate:
 *   G. F. Knoll, Radiation Detection and Measurement, 4th ed. (Wiley 2010), ch. 4 §VII; J. W. Müller,
 *   Nucl. Instrum. Methods 112, 47 (1973), doi:10.1016/0029-554X(73)90773-8.
 * - Count variance with a non-paralyzable dead time: the recorded events form a renewal process with intervals
 *   τ + Exp(R) (mean τ + 1/R, variance 1/R²). For long gates Var N/E N = σ²/μ² = 1/(1 + Rτ)², the asymptotic
 *   variance of renewal counts (D. R. Cox, Renewal Theory, Methuen 1962; Müller 1973).
 * - Afterpulsing: a carrier trapped during an avalanche and released after the dead time t_d retriggers the diode.
 *   One trap level gives P_ap = η·e^{−t_d/τ}: S. Cova, A. Lacaita, G. Ripamonti, IEEE Electron Device Lett. 12, 685
 *   (1991), doi:10.1109/55.116955. Several levels add: the multiple-exponential model of A. W. Ziarkash et al.,
 *   Sci. Rep. 8, 5076 (2018), doi:10.1038/s41598-018-23398-z, here integrated from t_d to ∞ (η_k = A_k·τ_k).
 */

export type DeadTimeModel = "nonparalyzable" | "paralyzable";

export const DEAD_TIME_MODELS: readonly DeadTimeModel[] = ["nonparalyzable", "paralyzable"];

/** Maps a URL string onto a model id, defaulting to non-paralyzable. */
export function parseDeadTimeModel(s: string): DeadTimeModel {
  return DEAD_TIME_MODELS.find((m) => m === s) ?? "nonparalyzable";
}

const valid = (rate: number, deadTime: number) => rate >= 0 && deadTime >= 0 && Number.isFinite(rate) && Number.isFinite(deadTime);

/** Recorded rate m for a true rate R (counts/s) and dead time τ (s). */
export function measuredRate(trueRate: number, deadTime: number, model: DeadTimeModel): number {
  if (!valid(trueRate, deadTime)) return NaN;
  const x = trueRate * deadTime;
  return model === "paralyzable" ? trueRate * Math.exp(-x) : trueRate / (1 + x);
}

/** Fraction of true events lost, 1 − m/R: Rτ/(1 + Rτ) or 1 − e^{−Rτ}. Equals the dead fraction of the time. */
export function countLoss(trueRate: number, deadTime: number, model: DeadTimeModel): number {
  if (!valid(trueRate, deadTime)) return NaN;
  const x = trueRate * deadTime;
  return model === "paralyzable" ? 0 - Math.expm1(-x) : x / (1 + x);
}

/** True rate R at which the loss reaches `loss` (0 ≤ loss < 1): loss/[(1 − loss)τ] or −ln(1 − loss)/τ. */
export function trueRateAtLoss(loss: number, deadTime: number, model: DeadTimeModel): number {
  if (!(loss >= 0 && loss < 1 && deadTime > 0)) return NaN;
  return model === "paralyzable" ? -Math.log1p(-loss) / deadTime : loss / ((1 - loss) * deadTime);
}

/** Highest recorded rate of a paralyzable counter, 1/(e·τ), reached at R = 1/τ. */
export function paralyzablePeakRate(deadTime: number): number {
  return deadTime > 0 ? 1 / (Math.E * deadTime) : NaN;
}

/** Fano factor Var N / E N of the recorded counts for a non-paralyzable dead time and a long gate: 1/(1 + Rτ)². */
export function nonParalyzableFano(trueRate: number, deadTime: number): number {
  if (!valid(trueRate, deadTime)) return NaN;
  return 1 / (1 + trueRate * deadTime) ** 2;
}

export interface TrapLevel {
  /** Afterpulse probability if the diode were re-armed at once (t_d = 0). */
  eta: number;
  /** De-trapping lifetime (s). */
  tau: number;
}

/** Afterpulse probability per avalanche Σ η_k·e^{−t_d/τ_k}; levels with η = 0 are ignored. */
export function afterpulseProbability(traps: readonly TrapLevel[], deadTime: number): number {
  if (!(deadTime >= 0)) return NaN;
  let p = 0;
  for (const { eta, tau } of traps) {
    if (!(eta >= 0 && eta <= 1)) return NaN;
    if (eta === 0) continue;
    if (!(tau > 0)) return NaN;
    p += eta * Math.exp(-deadTime / tau);
  }
  return p;
}
