/**
 * Sensor-uniformity calculator summary: total, spatial and temporal noise of a pixel, the SNR before and after
 * flat-field correction, the shot-to-PRNU crossover and the spatial rms of the displayed PRNU map. Electrons (e⁻) per
 * pixel per frame; PRNU is a fraction of the mean photo signal. Composition of `sensor-noise.ts` (EMVA Standard 1288,
 * Release 3.1 (2016), Eq. (45)–(48); Janesick, Photon Transfer, SPIE 2007, doi:10.1117/3.725073, ch. 5). Kept apart so
 * the pages that import that module do not ship it. Invalid inputs give NaN.
 */

import { sensorNoise, shotPrnuCrossover, type SensorNoise } from "./sensor-noise";

export interface UniformityParams {
  /** Mean photo signal above dark, e⁻. */
  signal: number;
  /** Mean dark charge, e⁻. */
  dark: number;
  /** Read noise, e⁻ rms. */
  read: number;
  /** PRNU as a fraction of the mean signal. */
  prnu: number;
  /** DSNU, e⁻ rms. */
  dsnu: number;
}

export interface UniformitySummary {
  noise: SensorNoise;
  /** Signal-to-noise ratio of one frame S/σ_total; NaN when σ_total = 0. */
  snr: number;
  /** SNR after flat-field correction S/σ_temporal. */
  snrFlat: number;
  /** Signal at which shot noise equals the PRNU noise, 1/PRNU² e⁻ (Infinity without PRNU). */
  crossover: number;
}

/** 20·log₁₀ of an SNR (dB); NaN unless the SNR is positive. */
export function snrToDb(snr: number): number {
  return snr > 0 ? 20 * Math.log10(snr) : NaN;
}

export function uniformitySummary({ signal, dark, read, prnu, dsnu }: UniformityParams): UniformitySummary {
  const noise = sensorNoise({ signal, dark, read, prnu, dsnu });
  return {
    noise,
    snr: noise.total > 0 ? signal / noise.total : NaN,
    snrFlat: noise.temporal > 0 ? signal / noise.temporal : NaN,
    crossover: shotPrnuCrossover(prnu),
  };
}

/** The photo-response map S·(1 + PRNU·pattern) and its spatial rms (sample standard deviation, MN − 1). */
export function prnuMap(signal: number, prnu: number, pattern: number[][]): { z: number[][]; rms: number } {
  const z = pattern.map((row) => row.map((v) => signal * (1 + prnu * v)));
  const values = z.flat();
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const rms = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1));
  return { z, rms };
}
