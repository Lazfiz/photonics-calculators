/**
 * Avalanche-gain page summary: Miller gain, McIntyre excess noise and the noise-current gain at one bias. Volts and
 * pure numbers. The physics is in `apd.ts` (Miller 1955; McIntyre 1966); this module only combines it.
 */

import { excessNoiseFactor, excessNoiseIndex, millerGain } from "./apd";

export interface AvalancheGainSummary {
  /** V/V_br. */
  ratio: number;
  /** Miller gain M; Infinity at or above breakdown. */
  gain: number;
  /** McIntyre excess noise factor F. */
  noiseFactor: number;
  /** Excess noise index x with F = M^x; NaN for M ≤ 1. */
  noiseIndex: number;
  /** Noise-current gain √F·M. */
  noiseGain: number;
  aboveBreakdown: boolean;
}

export function avalancheGainSummary(bias: number, breakdown: number, n: number, k: number): AvalancheGainSummary {
  const gain = millerGain(bias, breakdown, n);
  const noiseFactor = excessNoiseFactor(gain, k);
  return {
    ratio: bias / breakdown,
    gain,
    noiseFactor,
    noiseIndex: excessNoiseIndex(gain, k),
    noiseGain: Math.sqrt(noiseFactor) * gain,
    aboveBreakdown: gain === Infinity,
  };
}
