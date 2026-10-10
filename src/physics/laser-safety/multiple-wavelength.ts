/**
 * Eye exposure to a beam that carries several wavelengths (combined or co-aligned lines), on the ICNIRP 2013 eye limits
 * (`eye-exposure-limits.ts`). SI units: wavelength in m, power in W, diameter in m, time in s.
 * Model tier: exact for the limits and their aperture averages; the additivity rule is ICNIRP's.
 *
 * Source: ICNIRP, Health Phys. 105(3), 271–295 (2013), p. 279, "Multiple wavelengths": exposures at different
 * wavelengths add where the absorption site is the same (cornea or retina) and the injury mechanism is the same; where
 * the site is the same but the mechanisms differ, "for practical purposes, and in the absence of data, the exposures
 * are considered to be additive where the same tissue is the site of absorption" (conservative for thermal injury);
 * wavelengths absorbed mainly in different tissues "have to be considered independently".
 *
 * Each line's share of a limit is P / P_max, with P_max from `limitMaxPower` (the beam within that limit for every
 * exposure up to t, averaged over the limit's aperture). A line's share of a site is its largest share among the limits
 * at that site (one line's dual limits, retinal thermal and photochemical, are met separately, not summed). The sites:
 * the retina (retinal thermal and photochemical, 400–1400 nm) and the anterior eye (cornea and lens: the UV limit,
 * 180–400 nm; the anterior-segment limit, 1150–1400 nm; the IR limit, 1400 nm – 1 mm). The beam is within the limits
 * when each site's sum is at most 1. Adding the UV limit (photochemical below 315 nm) to the thermal IR ones is
 * ICNIRP's practical rule for one tissue with different mechanisms, and errs safe.
 *
 * Not modelled: skin, pulses and pulse trains, lines with different beam sizes or exposure durations.
 */
import { eyeLimits, limitMaxPower, type EyeLimitKind } from "./eye-exposure-limits";

export type EyeSite = "retina" | "anteriorEye";

export const EYE_SITES: readonly EyeSite[] = ["retina", "anteriorEye"];

/** The tissue each eye limit protects. */
export const SITE_OF_LIMIT: Record<EyeLimitKind, EyeSite> = {
  cornealUv: "anteriorEye",
  retinalThermal: "retina",
  retinalPhotochemical: "retina",
  anteriorSegment: "anteriorEye",
  cornealIr: "anteriorEye",
};

export interface SpectralLine {
  /** Wavelength, m. */
  readonly lambda: number;
  /** Power, W. */
  readonly P: number;
}

export interface LineLimitShare {
  readonly kind: EyeLimitKind;
  /** Largest power of this line within the limit on its own, W (Infinity: the limit doesn't apply up to t). */
  readonly pMax: number;
  /** P / pMax. */
  readonly share: number;
}

export interface LineExposure extends SpectralLine {
  readonly limits: readonly LineLimitShare[];
  /** The line's share of each site: its largest share among that site's limits (0 where it has none). */
  readonly sites: Record<EyeSite, number>;
}

export interface MultipleWavelengthExposure {
  readonly lines: readonly LineExposure[];
  /** Sum over the lines of each line's share of the site; above 1 the site's exposure exceeds the limits. */
  readonly sites: Record<EyeSite, number>;
  /** Sum over the lines of the share of each limit (same site and mechanism: the strictly additive part). */
  readonly limits: Partial<Record<EyeLimitKind, number>>;
  /** The largest site sum: the factor the whole beam must be attenuated by; NaN for invalid input. */
  readonly ratio: number;
  /** The site with that sum; null when no line has a share anywhere. */
  readonly limiting: EyeSite | null;
}

/**
 * Additive eye exposure of a beam of 1/e² diameter d (m) carrying the given lines, for exposures up to t (s). NaN ratio
 * if a line lies outside 180 nm – 1 mm, has P < 0, or d or t is invalid.
 */
export function multipleWavelengthExposure(lines: readonly SpectralLine[], d: number, t: number): MultipleWavelengthExposure {
  const sites: Record<EyeSite, number> = { retina: 0, anteriorEye: 0 };
  const limitSums: Partial<Record<EyeLimitKind, number>> = {};
  let valid = lines.length > 0;
  const out = lines.map((line): LineExposure => {
    const limits = eyeLimits(line.lambda).map((limit): LineLimitShare => {
      const pMax = limitMaxPower(limit, d, t);
      return { kind: limit.kind, pMax, share: line.P / pMax };
    });
    const lineSites: Record<EyeSite, number> = { retina: 0, anteriorEye: 0 };
    if (limits.length === 0 || !(line.P >= 0)) valid = false;
    for (const l of limits) {
      if (Number.isNaN(l.share)) valid = false;
      const site = SITE_OF_LIMIT[l.kind];
      lineSites[site] = Math.max(lineSites[site], l.share);
      limitSums[l.kind] = (limitSums[l.kind] ?? 0) + l.share;
    }
    for (const site of EYE_SITES) sites[site] += lineSites[site];
    return { ...line, limits, sites: lineSites };
  });
  if (!valid) return { lines: out, sites, limits: limitSums, ratio: NaN, limiting: null };
  const limiting = sites.retina >= sites.anteriorEye ? "retina" : "anteriorEye";
  const ratio = sites[limiting];
  return { lines: out, sites, limits: limitSums, ratio, limiting: ratio > 0 ? limiting : null };
}
