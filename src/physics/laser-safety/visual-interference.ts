/**
 * Ranges at which a visible laser beam stops dazzling: where its peak irradiance falls to the ICAO flight-zone levels.
 * SI units: power in W, lengths in m, angles in rad, irradiance in W/m².
 * Model tier: textbook. The peak irradiance of a TEM₀₀ beam of 1/e² diameter d is 8P/(πd²) (the standards' 4P/(πd²)
 * with 1/e diameters); d grows with range as in `hazard-distance.ts`, and the range is where d reaches √(8P/(πE)).
 *
 * Levels (ICAO Annex 11; ICAO Doc 9815, Manual on Laser Emitters and Flight Safety, 2003): laser-beam free flight zone
 * 50 nW/cm² ("unlikely to cause any visual disruption"), critical flight zone 5 µW/cm² (no glare), sensitive flight zone
 * 100 µW/cm² (no flash-blindness or afterimage). Not modelled: the eye's spectral sensitivity (the FAA scales the
 * irradiance by a visual correction factor), atmospheric loss, scintillation.
 */
import { rangeToDiameter, type BeamGeometry } from "./hazard-distance";

/** ICAO flight-zone irradiance levels, W/m². */
export const ICAO_LEVELS = {
  sensitive: 1, // 100 µW/cm²
  critical: 0.05, // 5 µW/cm²
  laserFree: 5e-4, // 50 nW/cm²
} as const;

export type IcaoLevel = keyof typeof ICAO_LEVELS;

/** Peak irradiance, W/m², of a round TEM₀₀ beam of power P (W) and 1/e² diameter d (m): 8P/(πd²). */
export function peakIrradiance(P: number, d: number): number {
  return (8 * P) / (Math.PI * d * d);
}

/**
 * Range, m, beyond which the beam's peak irradiance stays at or below E (W/m²): 0 if it already does at the output,
 * Infinity if the beam doesn't spread enough; NaN for P < 0 or E ≤ 0.
 */
export function rangeToIrradiance(P: number, beam: BeamGeometry, E: number): number {
  if (!(P >= 0 && E > 0)) return NaN;
  return rangeToDiameter(beam, Math.sqrt((8 * P) / (Math.PI * E)));
}
