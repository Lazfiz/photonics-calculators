/**
 * Low-water-peak fibre comparison: per-fibre summary of the silica loss model (silica-attenuation.ts) at the
 * G.652.D water-peak wavelength, over the E-band and on the ITU-T G.694.2 CWDM grid. Model tier: textbook
 * approximation (it inherits the empirical fits and illustrative OH band shapes of silica-attenuation.ts).
 * Kept apart from silica-attenuation.ts, which the attenuation page also imports.
 */
import { intervalStats } from "../math";
import { CWDM_CHANNELS, silicaLossDbPerKm, type SilicaLossParams } from "./silica-attenuation";

/** E-band, ITU-T G-series band plan (Supplement 39): 1360–1460 nm, m. */
export const E_BAND: [number, number] = [1360e-9, 1460e-9];
/** ITU-T G.652.D cable: maximum attenuation over 1310–1625 nm, which also bounds 1383 nm after hydrogen ageing, dB/km. */
export const G652D_MAX = 0.4;

export interface LowWaterPeakSummary {
  /** Loss at 1310 nm and at 1383 nm, dB/km. */
  at1310: number;
  at1383: number;
  /** Mean loss over the E-band, dB/km (trapezoid rule, 200 intervals). */
  eBandMean: number;
  /** Loss of each CWDM channel over the fibre length, dB. */
  channels: number[];
  /** Index in `channels` of the lossiest channel. */
  worst: number;
}

/** Summary of one fibre (its silica loss parameters) over `lengthKm` km. */
export function lowWaterPeakSummary(p: SilicaLossParams, lengthKm: number): LowWaterPeakSummary {
  const at = (l: number) => silicaLossDbPerKm(p, l).total;
  const channels = CWDM_CHANNELS.map((l) => at(l) * lengthKm);
  let worst = 0;
  for (let i = 1; i < channels.length; i++) if (channels[i] > channels[worst]) worst = i;
  return {
    at1310: at(1310e-9),
    at1383: at(1383e-9),
    eBandMean: intervalStats(at, E_BAND[0], E_BAND[1], 200).mean,
    channels,
    worst,
  };
}
