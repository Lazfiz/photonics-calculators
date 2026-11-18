/**
 * Reset-noise page: kTC noise of a sense node reset through a switch. SI units (F, K, V); conversion gain in V/e⁻.
 * Invalid inputs give NaN.
 *
 * v_n = √(k_B·T/C), charge √(k_B·T·C) = q·N_e, independent of the switch resistance (Janesick, Photon Transfer,
 * SPIE Press 2007, doi:10.1117/3.725073). The primitive is `ktcNoise` in `noise.ts`.
 */

import { q } from "../constants";
import { ktcNoise } from "./noise";

export interface ResetNoiseSummary {
  /** kTC noise voltage, V rms. */
  noiseV: number;
  /** kTC noise charge in electrons, e⁻ rms. */
  noiseElectrons: number;
  /** Conversion gain q/C, V/e⁻. */
  conversionGain: number;
}

export function resetNoiseSummary(capacitance: number, temperature: number): ResetNoiseSummary {
  const { v, electrons } = ktcNoise(capacitance, temperature);
  return { noiseV: v, noiseElectrons: electrons, conversionGain: capacitance > 0 ? q / capacitance : NaN };
}
