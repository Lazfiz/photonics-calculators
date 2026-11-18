/**
 * Single-photon counting module page summary: photon and avalanche rates, the non-paralyzable dead-time loss,
 * afterpulses and the counting SNR. SI units (W, m, s, 1/s). The physics is in `dead-time.ts` (Knoll 2010 ch. 4) and
 * `spad.ts`; this module only combines it.
 */

import { countLoss, measuredRate } from "./dead-time";
import { countingSnr, photonRate } from "./spad";

/** Recorded counts in the gate below which the SNR formula (asymptotic in m·T) is only indicative. */
export const MIN_GATE_COUNTS = 10;
/** Dead-time loss above which a real module departs from the fixed-τ model. */
export const MAX_MODEL_LOSS = 0.1;

export interface SpcmInput {
  /** s */
  deadTime: number;
  /** Dark counts/s */
  darkRate: number;
  pde: number;
  /** W */
  power: number;
  /** m */
  wavelength: number;
  afterpulseProb: number;
  /** Counting gate, s. */
  gate: number;
}

export interface SpcmSummary {
  photons: number;
  /** Photon avalanche rate, 1/s. */
  signal: number;
  /** Avalanche rate R = signal + dark, 1/s. */
  rate: number;
  /** Recorded rate m = R/(1 + Rτ), 1/s. */
  recorded: number;
  /** Fraction of avalanches lost to the dead time. */
  loss: number;
  /** R/m = 1 + Rτ. */
  correction: number;
  afterpulseRate: number;
  /** m(1 + P_ap), 1/s. */
  totalOutput: number;
  snr: number;
  snrIdeal: number;
  warnings: string[];
}

export function spcmSummary(p: SpcmInput): SpcmSummary {
  const photons = photonRate(p.power, p.wavelength);
  const signal = photons * p.pde;
  const rate = signal + p.darkRate;
  const recorded = measuredRate(rate, p.deadTime, "nonparalyzable");
  const loss = countLoss(rate, p.deadTime, "nonparalyzable");
  const afterpulseRate = recorded * p.afterpulseProb;
  const snr = countingSnr({ signalRate: signal, darkRate: p.darkRate, afterpulseProb: p.afterpulseProb, deadTime: p.deadTime, gateTime: p.gate });
  const snrIdeal = countingSnr({ signalRate: signal, darkRate: p.darkRate, afterpulseProb: 0, deadTime: 0, gateTime: p.gate });
  const warnings: string[] = [];
  if (recorded * p.gate < MIN_GATE_COUNTS) {
    warnings.push(`Fewer than ${MIN_GATE_COUNTS} counts are recorded in the gate: the SNR formula assumes many counts and is only indicative here.`);
  }
  if (loss > MAX_MODEL_LOSS) {
    warnings.push(`${(loss * 100).toFixed(0)} % of the avalanches fall in the dead time: real modules drift from the non-paralyzable model here, so use the module's own correction table.`);
  }
  return {
    photons, signal, rate, recorded, loss, correction: 1 + rate * p.deadTime, afterpulseRate,
    totalOutput: recorded + afterpulseRate, snr, snrIdeal, warnings,
  };
}
