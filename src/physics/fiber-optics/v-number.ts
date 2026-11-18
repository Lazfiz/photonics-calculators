/**
 * Summary of the V-number page, in SI: kept out of macro-bending-loss.ts and step-index-modes.ts, whose exports every
 * page that imports those modules ships. V = 2π a NA/λ with NA either entered or √(n₁² − n₂²); LP11 cutoff, exact LP
 * mode list (up to V = MAX_EXACT_MODE_V) and the V²/2 estimate. Model tier: weakly guiding step-index fibre (Gloge 1971).
 */
import { lp11CutoffWavelength, vNumber, type StepIndexFiber } from "./macro-bending-loss";
import { asymptoticModeCount, countModes, guidedLpModes, numericalAperture, type LpMode } from "./step-index-modes";

export type VInputMode = "na" | "indices";

export interface VNumberInput {
  mode: VInputMode;
  /** Core radius, m. */
  a: number;
  /** Wavelength, m. */
  lambda: number;
  /** Numerical aperture (used when mode is "na"). */
  na: number;
  /** Core index n₁ (used when mode is "indices"). */
  coreIndex: number;
  /** Cladding index n₂ (used when mode is "indices"). */
  claddingIndex: number;
}

export interface VNumberSummary {
  NA: number;
  /** The fibre the V-number belongs to. When the NA is entered directly, n₁ is only a placeholder above NA. */
  fiber: StepIndexFiber;
  V: number;
  /** LP11 cutoff wavelength, m. */
  cutoff: number;
  /** Exact guided mode count, NaN above V = MAX_EXACT_MODE_V. */
  modes: number;
  /** V²/2 estimate. */
  approx: number;
  lpModes: LpMode[];
  /** Acceptance half-angle in air, degrees (NaN for NA > 1). */
  acceptanceDeg: number;
}

export const INDEX_ORDER_PROBLEM = "The cladding index must be below the core index.";
export const NO_V_PROBLEM = "Enter a positive core radius, wavelength and NA (NA < n₁).";

export function vNumberSummary({ mode, a, lambda, na, coreIndex, claddingIndex }: VNumberInput): VNumberSummary {
  const NA = mode === "na" ? na : numericalAperture(coreIndex, claddingIndex);
  // n₁ only enters the NA; any n₁ > NA is valid when NA is entered directly.
  const fiber = { a, n1: mode === "na" ? Math.max(1, 2 * NA) : coreIndex, NA };
  const V = vNumber(fiber, lambda);
  const lpModes = guidedLpModes(V);
  return {
    NA,
    fiber,
    V,
    cutoff: lp11CutoffWavelength(fiber),
    modes: countModes(lpModes),
    approx: asymptoticModeCount(V),
    lpModes,
    acceptanceDeg: NA <= 1 ? (Math.asin(NA) * 180) / Math.PI : NaN,
  };
}

/** Why there is no result, or null if V is a number. */
export function vNumberProblem(mode: VInputMode, coreIndex: number, claddingIndex: number, V: number): string | null {
  if (mode === "indices" && !(claddingIndex < coreIndex)) return INDEX_ORDER_PROBLEM;
  return Number.isFinite(V) ? null : NO_V_PROBLEM;
}
