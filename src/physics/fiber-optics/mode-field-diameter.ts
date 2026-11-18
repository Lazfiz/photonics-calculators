/**
 * Headline numbers of the mode-field-diameter page, in SI. Model tier: textbook approximation (weakly guiding
 * step-index fibre, exact LP01 field; Marcuse's Gaussian fit and Petermann II radius; see macro-bending-loss.ts and
 * step-index-modes.ts).
 */
import { lp01Mode, lp11CutoffWavelength, modeFieldRadius, vNumber, type Lp01Mode, type StepIndexFiber } from "./macro-bending-loss";
import {
  claddingIndex, coreConfinement, effectiveIndex, normalizedB, petermannIIRadius, relativeIndexDifference,
} from "./step-index-modes";

/** Bend radius at which the page quotes the bend loss per turn, m. */
export const REFERENCE_BEND_RADIUS = 10 * 1e-3;

export interface ModeFieldSummary {
  V: number;
  mode: Lp01Mode;
  /** Relative index difference Δ = NA²/(2n₁²). */
  delta: number;
  /** Cladding index n₂. */
  n2: number;
  /** Mode-field radius from Marcuse's Gaussian fit, m. */
  wFit: number;
  /** Petermann II mode-field radius, m. */
  wPII: number;
  /** π wFit², m². */
  aeff: number;
  /** LP11 cutoff wavelength, m. */
  cutoff: number;
  /** Normalized propagation constant b. */
  b: number;
  nEff: number;
  /** Fraction of LP01 power in the core. */
  gamma: number;
}

/** Fibre and wavelength λ (m). NaN outside the domain (V < MIN_V, NA ≥ n₁). */
export function modeFieldSummary(f: StepIndexFiber, lambda: number): ModeFieldSummary {
  const V = vNumber(f, lambda);
  const mode = lp01Mode(V);
  const wFit = modeFieldRadius(f, lambda);
  return {
    V,
    mode,
    delta: relativeIndexDifference(f),
    n2: claddingIndex(f),
    wFit,
    wPII: petermannIIRadius(f, lambda, mode),
    aeff: Math.PI * wFit * wFit,
    cutoff: lp11CutoffWavelength(f),
    b: normalizedB(mode),
    nEff: effectiveIndex(f, lambda, mode),
    gamma: coreConfinement(mode),
  };
}
