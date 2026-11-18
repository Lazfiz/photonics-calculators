/**
 * Single-mode splice loss summary used by the splice-loss page and its API schema. SI units (m, rad, dB).
 * Model tier: textbook. Gaussian-mode overlap of two fibres with lateral offset, tilt, end-face gap and mode-field
 * mismatch, with the multiple-reflection factor of the gap (see gaussian-coupling.ts for the formulas and sources:
 * D. Marcuse, Bell Syst. Tech. J. 56, 703 (1977), doi:10.1002/j.1538-7305.1977.tb00534.x).
 */
import { gapReflectionFactor, gaussianCouplingWorstTilt, lossDb, type GaussianJoint } from "./gaussian-coupling";

/** Largest tilt the paraxial Gaussian joint is applied to, 30° (the page limits the input to 29°). */
export const SPLICE_MAX_TILT = Math.PI / 6;

export interface SpliceInput {
  /** Mode-field diameters of fibre 1 and 2, m. */
  mfd1: number;
  mfd2: number;
  /** Lateral offset, m. */
  offset: number;
  /** Tilt, rad. */
  tilt: number;
  /** End-face gap, m. */
  gap: number;
  /** Index of the medium the tilt and gap are in. */
  gapIndex: number;
  /** Fibre phase index. */
  fiberIndex: number;
  /** Vacuum wavelength, m. */
  lambda: number;
}

/**
 * Loss in dB of each effect alone between equal modes of fibre 1's radius (lateral, angular, gap incl. reflections),
 * the reflection loss, the mode-field mismatch alone and the full joint (all effects, tilt in its unfavourable sense,
 * times the reflection factor). All NaN for invalid input; Infinity where the coupling underflows to zero.
 */
export function spliceLossSummary(p: SpliceInput) {
  const valid = p.offset >= 0 && p.tilt >= 0 && p.tilt < SPLICE_MAX_TILT && p.mfd1 > 0 && p.mfd2 > 0 &&
    p.gap >= 0 && p.gapIndex >= 1 && p.fiberIndex >= 1 && p.lambda > 0;
  const w = p.mfd1 / 2;
  const base = { w1: w, w2: p.mfd2 / 2, lambda: p.lambda, n: p.gapIndex };
  const loss = (j: Partial<GaussianJoint>) => (valid ? lossDb(gaussianCouplingWorstTilt({ ...base, ...j })) : NaN);
  // Multiple reflections between the faces (coherent sum of Gaussian passes in fibre 1's mode): the gap and total
  // include them; the factor is 1 at physical contact (z = 0) and with index matching.
  const reflection = valid ? gapReflectionFactor(p.fiberIndex, p.gapIndex, p.gap, p.lambda, w) : NaN;
  return {
    latLoss: loss({ w2: w, offset: p.offset }),
    angLoss: loss({ w2: w, tilt: p.tilt }),
    gapLoss: loss({ w2: w, gap: p.gap }) + lossDb(reflection),
    reflectionLoss: lossDb(reflection),
    mismatchLoss: loss({}),
    totalLoss: loss({ offset: p.offset, tilt: p.tilt, gap: p.gap }) + lossDb(reflection),
  };
}
