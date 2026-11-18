/**
 * Headline numbers of the macrobending-loss page, in SI: kept out of macro-bending-loss.ts, whose exports every page
 * that imports that module ships. Model tier: textbook approximation (see macro-bending-loss.ts).
 */
import {
  DB_PER_E_FOLD, bendLossCoefficient, bendLossPerTurnDb, elastoOpticBendRadius, lp01Mode, lp11CutoffWavelength,
  modeFieldRadius, vNumber, type StepIndexFiber,
} from "./macro-bending-loss";
import { claddingIndex } from "./step-index-modes";

export interface MacroBendSummary {
  V: number;
  /** Cladding index n₂ = √(n₁² − NA²). */
  n2: number;
  /** Loss per turn, dB. */
  perTurn: number;
  /** Loss of `numBends` turns, dB. */
  total: number;
  /** Loss of the bent fibre, dB per metre of fibre length. */
  dBPerMetre: number;
  /** Mode-field diameter 2w (Marcuse's fit), m. */
  mfd: number;
  /** LP11 cutoff wavelength, m. */
  cutoff: number;
}

/** Fibre, wavelength λ (m), bend radius R (m), number of turns, optional elasto-optic correction. NaN outside the domain. */
export function macroBendSummary(f: StepIndexFiber, lambda: number, R: number, numBends: number, elastoOptic: boolean): MacroBendSummary {
  const V = vNumber(f, lambda);
  const mode = lp01Mode(V);
  const perTurn = bendLossPerTurnDb(f, lambda, R, mode, elastoOptic);
  return {
    V,
    n2: claddingIndex(f),
    perTurn,
    total: perTurn * numBends,
    dBPerMetre: DB_PER_E_FOLD * bendLossCoefficient(f, lambda, elastoOptic ? elastoOpticBendRadius(R, f.n1) : R, mode),
    mfd: 2 * modeFieldRadius(f, lambda),
    cutoff: lp11CutoffWavelength(f),
  };
}
