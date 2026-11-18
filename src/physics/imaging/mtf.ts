/**
 * Page summary of the MTF calculator: cutoff, in-focus MTF and the defocused OTF and Strehl ratio, paraxial and with
 * the exact high-NA phase. SI in (m, dimensionless ν), waves out where the page shows waves. A new module so that the
 * page and the API schema share one dispatch; the physics is in diffraction-mtf.ts and wavefront.ts (not appended
 * to: other pages import them). Model tier: textbook approximation (scalar, uniform pupil), see diffraction-mtf.ts.
 */
import {
  cutoffFrequency, defocusW020, defocusedOtf, diffractionMtf, highNaDefocusOtf, highNaDefocusStrehl,
} from "./diffraction-mtf";
import { defocusStrehlExact } from "./wavefront";

/** The paraxial W₀₂₀ counts as optimistic when the exact edge path difference exceeds it by this factor. */
export const PARAXIAL_OPTIMISTIC_RATIO = 1.1;

export interface MtfSummary {
  /** Cutoff 2NA/λ, cycles/m. */
  cutoff: number;
  /** Paraxial W₀₂₀ = Δz·NA²/(2n) in waves (signed). */
  w020Waves: number;
  /** Exact edge path difference n·Δz(1 − cos θ) in waves, sin θ = NA/n (signed). */
  edgeWaves: number;
  /** D = nΔz/λ, waves. */
  dWaves: number;
  /** s = NA/n. */
  s: number;
  inFocus: number;
  defocusedParaxial: number;
  defocusedExact: number;
  strehlParaxial: number;
  strehlExact: number;
  /** True when the paraxial W₀₂₀ is below the exact edge path by more than PARAXIAL_OPTIMISTIC_RATIO. */
  paraxialOptimistic: boolean;
}

/**
 * na: numerical aperture (≤ n), lambda: vacuum wavelength m, n: index on the NA side, dz: defocus on the NA side m
 * (signed), nu: normalised frequency f/f_c.
 */
export function mtfSummary(na: number, lambda: number, n: number, dz: number, nu: number): MtfSummary {
  const w020Waves = defocusW020(dz, na, n) / lambda;
  const edgeWaves = (n * dz * (1 - Math.sqrt(1 - (na / n) ** 2))) / lambda;
  const dWaves = (n * dz) / lambda;
  const s = na / n;
  return {
    cutoff: cutoffFrequency(na, lambda),
    w020Waves,
    edgeWaves,
    dWaves,
    s,
    inFocus: diffractionMtf(nu),
    defocusedParaxial: defocusedOtf(nu, w020Waves),
    defocusedExact: highNaDefocusOtf(nu, dWaves, s),
    strehlParaxial: defocusStrehlExact(Math.abs(w020Waves) / Math.sqrt(12)),
    strehlExact: highNaDefocusStrehl(dWaves, s),
    paraxialOptimistic: Math.abs(edgeWaves) > PARAXIAL_OPTIMISTIC_RATIO * Math.abs(w020Waves),
  };
}
