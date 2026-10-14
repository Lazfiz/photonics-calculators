/**
 * Weighted comparison of FSO wavelengths. Model tier: illustrative. Two of the four scores are computed; the other two
 * are editorial ratings, and the weights are a choice.
 *
 * - Eye safety: the IEC 60825-1:2014 Class 1 CW limit of a point source (`cwClassLimit`, d = 0, 100 s time base),
 *   scored on a log scale, 0 at 0.1 mW and 100 at 1 W: 25 log₁₀(P/0.1 mW). It is 0.77 mW at 850 nm, 1.9 mW at
 *   1064 nm, 9.6 mW at 1550 nm (corneal limit through 3.5 mm), and 0.50 W at 1310 nm: C₇ = 8 + 10^(0.04(λ − 1250 nm))
 *   ≈ 259 raises the retinal limit to about the 0.5 W Class 3B cap.
 * - Atmosphere: 100 − 5 × the link loss in dB (0 from 20 dB), loss from `totalExtinction` (Rayleigh + Kim aerosol).
 * - Components and cost: fixed 0–100 ratings (maturity of sources, detectors and amplifiers; relative price).
 *
 * The total is Σ wᵢsᵢ / Σ wᵢ, so it stays on 0–100 whatever the weights.
 */
import { cwClassLimit } from "../laser-safety/laser-classes";
import { DB_PER_NEPER, totalExtinction } from "./atmospheric-attenuation";

export interface Candidate {
  readonly lambda: number; // m
  readonly components: number; // 0–100
  readonly cost: number; // 0–100
}

export const CANDIDATES: readonly Candidate[] = [
  { lambda: 850e-9, components: 90, cost: 90 },
  { lambda: 1064e-9, components: 70, cost: 70 },
  { lambda: 1310e-9, components: 85, cost: 75 },
  { lambda: 1550e-9, components: 95, cost: 65 },
];

export interface Weights {
  readonly eyeSafety: number;
  readonly atmosphere: number;
  readonly components: number;
  readonly cost: number;
}

export interface WavelengthScore {
  readonly lambda: number;
  readonly classOneLimit: number; // W
  readonly lossDb: number;
  readonly eyeSafety: number;
  readonly atmosphere: number;
  readonly components: number;
  readonly cost: number;
  readonly total: number;
}

const clampScore = (x: number) => Math.min(100, Math.max(0, x));

/** Eye-safety score of a Class 1 CW limit P (W): 25 log₁₀(P / 0.1 mW), clamped to 0–100. */
export function eyeSafetyScore(classOneLimit: number): number {
  return clampScore(25 * Math.log10(classOneLimit / 1e-4));
}

/** Atmosphere score of a link loss in dB: 100 − 5 × loss, clamped to 0–100. */
export function atmosphereScore(lossDb: number): number {
  return clampScore(100 - 5 * lossDb);
}

/** Scores of each candidate over a range (m) at a visibility (m), in the candidates' order; NaN totals for bad inputs. */
export function scoreWavelengths(
  range: number,
  visibility: number,
  weights: Weights,
  candidates: readonly Candidate[] = CANDIDATES,
): WavelengthScore[] {
  const sumW = weights.eyeSafety + weights.atmosphere + weights.components + weights.cost;
  return candidates.map((c) => {
    const classOneLimit = cwClassLimit("1", c.lambda, 0).power;
    const lossDb = range >= 0 ? totalExtinction(c.lambda, visibility) * range * DB_PER_NEPER : NaN;
    const s = { eyeSafety: eyeSafetyScore(classOneLimit), atmosphere: atmosphereScore(lossDb) };
    const total = sumW > 0
      ? (weights.eyeSafety * s.eyeSafety + weights.atmosphere * s.atmosphere + weights.components * c.components
        + weights.cost * c.cost) / sumW
      : NaN;
    return { lambda: c.lambda, classOneLimit, lossDb, ...s, components: c.components, cost: c.cost, total };
  });
}
