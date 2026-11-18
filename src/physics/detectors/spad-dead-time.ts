/**
 * SPAD dead-time page summary: recorded rate, count loss, correction factor, the true rate at 10 % loss and the
 * paralyzable peak. Seconds, counts/s. The physics is in `dead-time.ts` (Knoll 2010 ch. 4; Müller 1973).
 */

import { countLoss, type DeadTimeModel, measuredRate, paralyzablePeakRate, trueRateAtLoss } from "./dead-time";

/** The loss at which the page reports the true rate. */
export const DEAD_TIME_REFERENCE_LOSS = 0.1;

export interface SpadDeadTimeSummary {
  /** Recorded rate m, 1/s. */
  measured: number;
  /** Fraction lost, 1 − m/R (also the dead fraction of the time). */
  loss: number;
  /** Correction factor R/m (Infinity if m underflows to 0). */
  correction: number;
  /** True rate at 10 % loss, 1/s. */
  rateAtLoss: number;
  /** Highest recorded rate of a paralyzable counter, 1/(eτ), 1/s. */
  peakRate: number;
  /** Paralyzable and past its peak (Rτ > 1). */
  pastPeak: boolean;
}

export function spadDeadTimeSummary(deadTime: number, trueRate: number, model: DeadTimeModel): SpadDeadTimeSummary {
  const measured = measuredRate(trueRate, deadTime, model);
  return {
    measured,
    loss: countLoss(trueRate, deadTime, model),
    correction: trueRate / measured,
    rateAtLoss: trueRateAtLoss(DEAD_TIME_REFERENCE_LOSS, deadTime, model),
    peakRate: paralyzablePeakRate(deadTime),
    pastPeak: model === "paralyzable" && trueRate * deadTime > 1,
  };
}
