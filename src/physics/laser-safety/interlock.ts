/**
 * Timing of a safety interlock on a laser guard (door, panel, light curtain): whether the emission stops before an
 * eye that comes through the opening has been in the beam for longer than the eye limits allow. SI units: wavelength
 * in m, power in W, lengths in m, time in s, speed in m/s.
 * Model tier: textbook. A person approaches at constant speed K from the moment the guard starts to open and the beam
 * lies a distance S behind the opening, so the eye can meet it after S/K (the separation-distance model of ISO 13855,
 * S = K·T, without an intrusion allowance; K = 2.0 m/s for hands and arms, 1.6 m/s for the body). The emission stops a
 * time T after the guard starts to open (detection, logic, shutter or laser off), so the eye is in the beam for
 * max(0, T − S/K), held still and centred: the worst case. That time has to be within the time the beam takes to
 * exceed the first ICNIRP 2013 eye limit (`exposureDuration`).
 *
 * Sources: ISO 13855:2010, Safety of machinery – Positioning of safeguards with respect to the approach speeds of
 * parts of the human body (S = K·T + C); ICNIRP, Health Phys. 105(3), 271–295 (2013), Tables 5 and 8.
 * Not modelled: reflections inside the enclosure, skin, the interlock's reliability (performance level), and
 * IEC 60825-1's requirement that a Class 3B or 4 product's interlock prevent access above the Class 1 limits.
 */

import { exposureDuration, type EyeLimitKind } from "./eye-exposure-limits";

export interface InterlockTiming {
  /** Time an approaching body part takes to reach the beam, S/K, s. */
  readonly accessTime: number;
  /** Time the eye is in the beam before the emission stops, max(0, T − S/K), s. */
  readonly exposure: number;
  /** Time the beam, held still on the eye, takes to exceed the first eye limit, s (Infinity: within it for 30 ks;
   *  NaN: exceeded within 1 ns). */
  readonly tMax: number;
  readonly limiting: EyeLimitKind | null;
  /** Longest stopping time that keeps the eye within the limits, S/K + t_max (t_max = 0 when under 1 ns), s. */
  readonly latestStop: number;
  /** Shortest distance from the opening to the beam for the stopping time T, K·max(0, T − t_max), m. */
  readonly minDistance: number;
  /** True when the eye's time in the beam is within t_max (always when it never meets the beam). */
  readonly within: boolean;
}

/**
 * Interlock timing for a CW beam of power P (W) and 1/e² diameter d (m) at λ (m) that lies S (m) behind the guard,
 * a stopping time T (s) and an approach speed K (m/s); α (rad) is the apparent source (default a point source).
 * NaN times for P < 0, d < 0, S < 0, T < 0 or K ≤ 0, or outside 180 nm – 1 mm.
 */
export function interlockTiming(lambda: number, P: number, d: number, T: number, S: number, K: number, alpha = 0): InterlockTiming {
  const limits = exposureDuration(lambda, P, d, alpha);
  if (!(P >= 0 && d >= 0 && T >= 0 && S >= 0 && K > 0) || limits.limits.length === 0) {
    return { accessTime: NaN, exposure: NaN, tMax: NaN, limiting: null, latestStop: NaN, minDistance: NaN, within: false };
  }
  const accessTime = S / K;
  const exposure = Math.max(0, T - accessTime);
  const { tMax } = limits;
  const tLimit = Number.isNaN(tMax) ? 0 : tMax;
  return {
    accessTime,
    exposure,
    tMax,
    limiting: Number.isNaN(tMax) ? (limits.limits.find((l) => Number.isNaN(l.tMax))?.kind ?? null) : limits.limiting,
    latestStop: accessTime + tLimit,
    minDistance: K * Math.max(0, T - tLimit),
    within: exposure <= tLimit,
  };
}
