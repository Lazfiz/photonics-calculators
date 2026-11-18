/**
 * Photon counting page summary: shot-noise SNR of a Poisson count and the recorded rate, loss and corrected-rate SNR
 * of a non-paralyzable counter. SI units (s, 1/s). The dead-time physics is in `dead-time.ts`; this module only combines it.
 */

import { countLoss, measuredRate, nonParalyzableFano } from "./dead-time";

export interface PhotonCountingInput {
  /** Expected counts per interval μ. */
  meanCounts: number;
  /** Dead time, s. */
  deadTime: number;
  /** Incident count rate, 1/s. */
  countRate: number;
  /** Integration time, s. */
  integrationTime: number;
}

export interface PhotonCountingSummary {
  /** √μ */
  snr: number;
  /** 10·log₁₀ μ (20·log₁₀ of the amplitude ratio √μ). */
  snrDb: number;
  /** 1/√μ */
  relativeError: number;
  /** Recorded rate, 1/s. */
  measured: number;
  /** Fraction of events lost. */
  loss: number;
  recordedCounts: number;
  fano: number;
  /** The dead-time-corrected rate has relative error 1/√N of the recorded counts. */
  correctedSnr: number;
}

export function photonCountingSummary(p: PhotonCountingInput): PhotonCountingSummary {
  const snr = Math.sqrt(p.meanCounts);
  const measured = measuredRate(p.countRate, p.deadTime, "nonparalyzable");
  const recordedCounts = measured * p.integrationTime;
  return {
    snr, snrDb: 10 * Math.log10(p.meanCounts), relativeError: 1 / snr, measured,
    loss: countLoss(p.countRate, p.deadTime, "nonparalyzable"), recordedCounts,
    fano: nonParalyzableFano(p.countRate, p.deadTime), correctedSnr: Math.sqrt(recordedCounts),
  };
}
