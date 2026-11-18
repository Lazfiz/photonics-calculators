/**
 * Excess-noise page summary: McIntyre excess noise factor, its index and the shot-noise SNR penalty against a p-i-n
 * diode at one gain. Pure numbers. The physics is in `apd.ts` (McIntyre 1966); this module only combines it.
 */

import { excessNoiseFactor, excessNoiseIndex } from "./apd";

export interface ExcessNoiseSummary {
  /** McIntyre excess noise factor F. */
  factor: number;
  /** Excess noise index x with F = M^x; NaN for M ≤ 1. */
  index: number;
  /** Noise figure 10·log₁₀F, dB. */
  noiseFigureDb: number;
  /** Shot-limited amplitude SNR relative to a p-i-n diode, 1/√F. */
  snrRatio: number;
}

export function excessNoiseSummary(gain: number, k: number): ExcessNoiseSummary {
  const factor = excessNoiseFactor(gain, k);
  return {
    factor,
    index: excessNoiseIndex(gain, k),
    noiseFigureDb: 10 * Math.log10(factor),
    snrRatio: 1 / Math.sqrt(factor),
  };
}
