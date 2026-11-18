/**
 * SNDR page: signal-to-noise-and-distortion ratios of an ADC input. Powers in one common unit (W, normalised), ratios in dB,
 * bits as a count. A ratio with zero noise or distortion power is ±Infinity (no result); invalid inputs give NaN.
 *
 * SNR = S/N, SINAD = S/(N + D), SDR = S/D, THD = D/S (all 10·log₁₀ of the power ratio); the ADC quantisation noise adds to
 * the analog noise and distortion as power, 1/SINAD = 1/SQNR + (N + D)/S, and ENOB = (SINAD − 1.76)/6.02 (IEEE Std
 * 1241-2010, doi:10.1109/IEEESTD.2011.5692956). The primitives are in `noise.ts`.
 */

import { enobFromSinad, idealSqnrDb, sinadWithQuantizationDb } from "./noise";

export interface SndrSummary {
  /** Signal-to-noise ratio 10·log₁₀(S/N), dB. */
  snr: number;
  /** SINAD of the analog front end alone, 10·log₁₀(S/(N + D)), dB. */
  sinad: number;
  /** Signal to total distortion 10·log₁₀(S/D), dB. */
  sdr: number;
  /** Total harmonic distortion 10·log₁₀(D/S), dBc. */
  thd: number;
  /** SINAD including the ideal quantisation noise of the ADC, dB. */
  sinadQuantized: number;
  /** Effective number of bits of `sinadQuantized`. */
  enob: number;
  /** Ideal N-bit SQNR 6.02·N + 1.76 dB. */
  sqnr: number;
}

/** Signal, noise and distortion power (same unit) and the ADC resolution; bits is rounded to an integer. */
export function sndrSummary({ signalPower, noisePower, distortionPower, bits }: { signalPower: number; noisePower: number; distortionPower: number; bits: number }): SndrSummary {
  const n = Math.round(bits);
  const sinadQuantized = sinadWithQuantizationDb(signalPower, noisePower, distortionPower, n);
  return {
    snr: 10 * Math.log10(signalPower / noisePower),
    sinad: 10 * Math.log10(signalPower / (noisePower + distortionPower)),
    sdr: 10 * Math.log10(signalPower / distortionPower),
    thd: 10 * Math.log10(distortionPower / signalPower),
    sinadQuantized,
    enob: enobFromSinad(sinadQuantized),
    sqnr: idealSqnrDb(n),
  };
}
