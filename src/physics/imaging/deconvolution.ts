/**
 * Wiener-deconvolution page summary: the passband of a diffraction-limited objective and what a Wiener filter at a
 * given signal-to-noise power ratio restores. SI units in and out (m, 1/m); the noise-to-signal ratio is a plain
 * number. The filter and the MTF live in `diffraction-mtf.ts`.
 */
import { cutoffFrequency, wienerHalfFrequency } from "./diffraction-mtf";
import { rayleighDistance } from "./super-resolution";

/** Noise-to-signal power ratio 10^(−dB/10) of a signal-to-noise power ratio in dB. */
export function noiseToSignalRatio(snrDb: number): number {
  return Number.isFinite(snrDb) ? 10 ** (-snrDb / 10) : NaN;
}

export function wienerRestorationSummary(na: number, lambda: number, snrDb: number) {
  const nsr = noiseToSignalRatio(snrDb);
  const cutoff = cutoffFrequency(na, lambda);
  const nuHalf = wienerHalfFrequency(nsr);
  const passbandPeriod = 1 / cutoff;
  return {
    nsr,
    cutoff,
    passbandPeriod,
    rayleighDistance: rayleighDistance(lambda, na),
    nuHalf,
    /** Finest period restored to half contrast; Infinity when ν_½ = 0 (NSR ≥ 1). */
    restoredPeriod: passbandPeriod / nuHalf,
    peakGain: 1 / (2 * Math.sqrt(nsr)),
  };
}
