/**
 * Optical summary of a single absorbing film at a reference wavelength (the numbers the spectrophotometry page
 * prints above its spectrum). SI units: thickness and wavelength in m, α in 1/m.
 * Model tier: exact for the definitions (nd, λ/4n, 2nd/λ, α = 4πk/λ); constant n and k assumed.
 */
import { absorptionCoefficient } from "../spectroscopy/depth";
import { quarterWaveThickness } from "./transfer-matrix";

/** The wavelength the page's summary lines use, m. */
export const SUMMARY_WAVELENGTH = 550e-9;

export interface FilmOpticalSummary {
  /** Optical thickness n·d, m. */
  opticalThickness: number;
  /** Quarter-wave optical thickness at the wavelength: physical thickness λ/(4n), m. */
  quarterWaveThickness: number;
  /** 2nd/λ: number of half waves in the film. */
  halfWaves: number;
  /** Absorption coefficient α = 4πk/λ, 1/m (n, k taken constant with wavelength). */
  alpha: number;
}

/** NaN in every field unless n > 0, k ≥ 0, d ≥ 0 and λ > 0. */
export function filmOpticalSummary(n: number, k: number, thickness: number, wavelength = SUMMARY_WAVELENGTH): FilmOpticalSummary {
  if (!(n > 0 && k >= 0 && thickness >= 0 && wavelength > 0)) {
    return { opticalThickness: NaN, quarterWaveThickness: NaN, halfWaves: NaN, alpha: NaN };
  }
  return {
    opticalThickness: n * thickness,
    quarterWaveThickness: quarterWaveThickness(n, wavelength),
    halfWaves: (2 * n * thickness) / wavelength,
    alpha: absorptionCoefficient(k, wavelength),
  };
}
