/**
 * Retinal exposure limit at the aversion (blink) response time, and the most power a visible beam can have to stay
 * within it: the basis of the 1 mW limit of laser Class 2. SI units: wavelength in m, time in s, radiant exposure in
 * J/m², irradiance in W/m², aperture in m, power in W.
 * Model tier: exact, i.e. the tabulated ICNIRP limits at one exposure time; a CW, point-source (collimated, small
 * source) beam viewed directly.
 *
 * Source: the limits and apertures are those of `eye-exposure-limits.ts` (ICNIRP, Health Phys. 105(3), 271–295 (2013),
 * Tables 3, 5 and 8). At 400–700 nm the retinal thermal limit is H = 18 t^0.75 J/m² for 5 µs – 10 s (C_A = 1), averaged
 * over a 7 mm aperture. The power the eye can take is then P = (H/t)·π(D/2)², D = 7 mm; at t = 0.25 s that is
 * 0.98 mW, which IEC 60825-1 rounds to the 1 mW Class 2 AEL.
 * - The aversion response (blink and head movement) is assumed to end the exposure within 0.25 s for visible light
 *   only (IEC 60825-1, ANSI Z136.1: 400–700 nm). An invisible beam triggers no response, so 0.25 s does not apply to it.
 * - The limit applies over the 7 mm aperture whatever the beam size: ICNIRP allows no modification "for reduced energy
 *   entering an assumed pupil size less than 7 mm", so a narrower beam doesn't raise the permitted power.
 *
 * Not modelled: pulses, extended sources, exposure by a beam wider than 7 mm (the 7 mm power is only a part of it),
 * and the Class 2 conditions of use (beam divergence, exposure times above 0.25 s).
 */

import { eyeLimits, exposureLimit, limitingAperture } from "./eye-exposure-limits";

/** Exposure time, s, assumed for visible light: the blink reflex. */
export const AVERSION_TIME = 0.25;

/** The aversion response is assumed for 400–700 nm only. */
export const AVERSION_LAMBDA_MIN = 400e-9;
export const AVERSION_LAMBDA_MAX = 700e-9;

export interface AversionLimit {
  /** Lowest retinal exposure limit at t, J/m². */
  readonly radiantExposure: number;
  /** The same as an irradiance, H/t, W/m². */
  readonly irradiance: number;
  /** Averaging aperture diameter of that limit, m. */
  readonly aperture: number;
  /** Largest power through that aperture within the limit, W. */
  readonly maxPower: number;
}

/**
 * The limit at wavelength λ (m) and exposure time t (s, default 0.25 s) as radiant exposure, irradiance and the
 * maximum power through its aperture. H is the lowest of the eye limits that are defined at t (at t < 10 s only the
 * thermal one; from 10 s the photochemical one too, at 400–600 nm).
 * Null outside 400–700 nm (no aversion response is assumed) and where no limit is defined at t (outside 1 ns – 30 ks).
 */
export function aversionLimit(lambda: number, t: number = AVERSION_TIME): AversionLimit | null {
  // 1e-9 relative absorbs 700 * 1e-9 = 7.000000000000001e-7.
  if (!(lambda >= AVERSION_LAMBDA_MIN * (1 - 1e-9) && lambda <= AVERSION_LAMBDA_MAX * (1 + 1e-9))) return null;
  if (!(t > 0)) return null;
  let best: { H: number; aperture: number } | null = null;
  for (const limit of eyeLimits(lambda)) {
    const H = exposureLimit(limit, t);
    if (Number.isFinite(H) && (best === null || H < best.H)) best = { H, aperture: limitingAperture(limit, t) };
  }
  if (best === null || !Number.isFinite(best.aperture)) return null;
  const irradiance = best.H / t;
  return {
    radiantExposure: best.H,
    irradiance,
    aperture: best.aperture,
    maxPower: irradiance * Math.PI * (best.aperture / 2) ** 2,
  };
}
