/**
 * 1/f (flicker) and shot noise of a current I in a band f_low…f_high. S_I = K_f·I^α/f (SPICE KF/AF form of Hooge's
 * law, F. N. Hooge, Phys. Lett. A 29, 139, 1969), σ_1/f = √(K_f·I^α·ln(f_high/f_low)), corner f_c = K_f·I^α/(2qI),
 * σ_shot = √(2qI·(f_high − f_low)) (Schottky 1918). Base functions in `noise.ts`.
 */

import { flickerRms, flickerShotCorner, shotNoiseCurrent } from "./noise";

export interface FlickerParams {
  /** K_f, A^(2−α). */
  kf: number;
  /** A. */
  current: number;
  alpha: number;
  /** Hz. */
  fLow: number;
  fHigh: number;
}

export interface FlickerSummary {
  /** 1/f–shot corner, Hz. */
  cornerFreq: number;
  flickerRms: number;
  shotRms: number;
  totalRms: number;
}

export function flickerSummary({ kf, current, alpha, fLow, fHigh }: FlickerParams): FlickerSummary {
  const flicker = flickerRms(kf, current, alpha, fLow, fHigh);
  const shotRms = fHigh > fLow ? shotNoiseCurrent(current, fHigh - fLow) : NaN;
  return {
    cornerFreq: flickerShotCorner(kf, current, alpha),
    flickerRms: flicker,
    shotRms,
    totalRms: Math.hypot(flicker, shotRms),
  };
}
