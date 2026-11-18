/**
 * PMD of a link: the page's summary (mean and rms DGD, DGD per bit period, design maximum and its exceedance
 * probability, PMD-limited length). SI in and out (s/√m, m, 1/s, s). Kept apart from
 * polarization-mode-dispersion.ts, which the bandwidth page also imports. Model tier: textbook approximation
 * (Maxwellian statistics, see that module's header).
 */
import {
  MEAN_DGD_BIT_FRACTION, MEAN_TO_RMS, dgdExceedanceProbability, meanDgd, pmdLimitedLength,
} from "./polarization-mode-dispersion";

/** 1 ps/√km in s/√m. */
export const PS_PER_SQRT_KM = 1e-12 / Math.sqrt(1e3);
/** Minutes in a Julian year. */
export const MINUTES_PER_YEAR = 365.25 * 24 * 60;

export interface PmdParams {
  /** PMD coefficient, s/√m. */
  pmdCoefficient: number;
  /** Link length, m. */
  length: number;
  /** Bit rate, 1/s. */
  bitRate: number;
  /** Design maximum DGD as a multiple of the mean. */
  maxToMean: number;
}

export interface PmdSummary {
  mean: number;
  rms: number;
  meanOverT: number;
  maxDgd: number;
  maxOverT: number;
  /** P(DGD > maxDgd). */
  pOut: number;
  /** Longest link with mean DGD ≤ 0.1 bit period, m. */
  maxLength: number;
  withinRule: boolean;
}

export function pmdSummary(p: PmdParams): PmdSummary {
  const mean = meanDgd(p.pmdCoefficient, p.length);
  const bitPeriod = 1 / p.bitRate;
  const meanOverT = mean / bitPeriod;
  return {
    mean,
    rms: mean / MEAN_TO_RMS,
    meanOverT,
    maxDgd: p.maxToMean * mean,
    maxOverT: (p.maxToMean * mean) / bitPeriod,
    pOut: dgdExceedanceProbability(p.maxToMean * mean, mean),
    maxLength: pmdLimitedLength(p.pmdCoefficient, p.bitRate),
    withinRule: meanOverT <= MEAN_DGD_BIT_FRACTION,
  };
}
