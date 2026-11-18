/**
 * Afterpulsing page summary: the recorded rate, the afterpulse probability and the first-order afterpulse rate for
 * up to two trap levels. SI units (s, counts/s). The physics is in `dead-time.ts` (Cova et al. 1991; Ziarkash et al.
 * 2018); this module only combines it, so the page and the API schema share one code path.
 */

import { afterpulseProbability, measuredRate } from "./dead-time";

/** P_ap above which afterpulses trigger afterpulses of their own and the first-order rate is no longer reliable. */
export const AFTERPULSE_FIRST_ORDER_LIMIT = 0.1;

/** R·τ above which traps that are still full at the next photon are partly emptied by that avalanche. */
export const AFTERPULSE_RATE_TAU_LIMIT = 0.1;

export interface AfterpulsingInput {
  /** Trap 1 lifetime, s. */
  tau1: number;
  /** Trap 1 amplitude (P_ap at t_d = 0). */
  eta1: number;
  /** Trap 2 lifetime, s. */
  tau2: number;
  /** Trap 2 amplitude; 0 switches the level off. */
  eta2: number;
  /** Dead time t_d, s. */
  deadTime: number;
  /** True count rate, counts/s. */
  countRate: number;
}

export interface AfterpulsingSummary {
  /** Recorded rate R/(1 + R·t_d), counts/s. */
  measured: number;
  /** Afterpulse probability per recorded avalanche (can exceed 1: mean number of afterpulses). */
  pAp: number;
  /** First-order afterpulse rate measured·P_ap, counts/s. */
  apRate: number;
  /** Fraction of trap 1 released within the dead time, 1 − e^(−t_d/τ₁). */
  release1: number;
  /** Lifetime of the slowest active trap, s. */
  tauMax: number;
  warnings: string[];
}

export function afterpulsingSummary(p: AfterpulsingInput): AfterpulsingSummary {
  const traps = [{ eta: p.eta1, tau: p.tau1 }, { eta: p.eta2, tau: p.tau2 }];
  // Only recorded avalanches fill traps: photons arriving while the diode is dead never trigger one.
  const measured = measuredRate(p.countRate, p.deadTime, "nonparalyzable");
  const pAp = afterpulseProbability(traps, p.deadTime);
  const apRate = measured * pAp; // first order in P_ap: afterpulses of afterpulses are left out
  const release1 = -Math.expm1(-p.deadTime / p.tau1);
  const tauMax = p.eta2 > 0 ? Math.max(p.tau1, p.tau2) : p.tau1;
  const warnings: string[] = [];
  if (pAp > AFTERPULSE_FIRST_ORDER_LIMIT) {
    warnings.push("P_ap above 10 %: afterpulses then trigger afterpulses of their own and steal dead time, which this first-order rate leaves out.");
  }
  if (p.countRate * tauMax > AFTERPULSE_RATE_TAU_LIMIT) {
    warnings.push("First-order rate: traps still full at the next photon are partly emptied by that avalanche, so R_ap is overestimated when R·τ ≳ 0.1.");
  }
  return { measured, pAp, apRate, release1, tauMax, warnings };
}
