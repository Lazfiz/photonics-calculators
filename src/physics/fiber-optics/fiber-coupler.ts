/**
 * Page summary for the fiber-coupler page and its API schema, built on coupled-mode.ts (sources there). Kept apart
 * from that module because the bundler doesn't drop unused exports: code here would ship on every page that imports
 * coupled-mode. SI units.
 */
import { couplingCoefficient } from "./coupled-mode";
import { lp11CutoffWavelength, vNumber, type StepIndexFiber } from "./macro-bending-loss";
import { relativeIndexDifference } from "./step-index-modes";

/** Coupled-mode (weak-coupling) accuracy limits of the page warnings: Δ above 2 % or a core spacing below 2.5 core radii. */
export const WEAK_GUIDANCE_MAX_DELTA = 0.02;
export const MIN_SPACING_IN_RADII = 2.5;
/** The coupler page plots, and checks the LP11 cutoff against, a window of ±100 nm around the wavelength. */
export const SPECTRAL_WINDOW_HALF_WIDTH = 100e-9;

export interface CouplerSummary {
  V: number;
  /** κ, 1/m. */
  kappa: number;
  /** Fraction of the power coupled to port 2 before excess loss, sin²(κL). */
  ratio: number;
  /** Port powers after excess loss, dBm (−Infinity when a port is dark). */
  throughDbm: number;
  coupledDbm: number;
  /** Length for 50:50 and for full transfer, m. */
  L5050: number;
  Lfull: number;
  /** Fractional change of κ per nm, from κ at ±1 nm. */
  slopePerNm: number;
  /** Relative index step Δ and the LP11 cutoff wavelength, m. */
  delta: number;
  cutoffWavelength: number;
}

/**
 * Two identical cores (radius, n₁, NA in `fiber`) a distance D apart, coupled over length L (all SI): κ from
 * `couplingCoefficient`, coupled fraction sin²(κL), port powers with an excess loss in dB.
 */
export function couplerSummary(fiber: StepIndexFiber, lambda: number, D: number, L: number, excessLossDb: number, inputDbm: number): CouplerSummary {
  const kappaAt = (lam: number) => couplingCoefficient(fiber, lam, D);
  const kappa = kappaAt(lambda);
  const ratio = Math.sin(kappa * L) ** 2;
  const lossLinear = 10 ** (-excessLossDb / 10);
  return {
    V: vNumber(fiber, lambda),
    kappa,
    ratio,
    throughDbm: inputDbm + 10 * Math.log10((1 - ratio) * lossLinear),
    coupledDbm: inputDbm + 10 * Math.log10(ratio * lossLinear),
    L5050: Math.PI / (4 * kappa),
    Lfull: Math.PI / (2 * kappa),
    slopePerNm: (kappaAt(lambda + 1e-9) - kappaAt(lambda - 1e-9)) / (2 * kappa),
    delta: relativeIndexDifference(fiber),
    cutoffWavelength: lp11CutoffWavelength(fiber),
  };
}
