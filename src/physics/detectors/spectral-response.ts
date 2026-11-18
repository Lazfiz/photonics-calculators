/**
 * Spectral-response calculator summary: the Gärtner silicon photodiode responsivity over 250–1450 nm, its peak and
 * half-response band, the 650 nm value, and the quantum efficiency implied by a datasheet responsivity. SI (m); the
 * wavelength grid and the reported wavelengths are in nm where a name says so. Composition of `photodiode-qe.ts`
 * (Gärtner 1959, doi:10.1103/PhysRev.116.84: η = (1 − R)·[1 − e^(−αW)/(1 + αL)]), `materials/silicon-absorption.ts`
 * (Green 2008, α = 4π·k/λ) and `responsivity.ts` (ℛ = η·q·λ/(h·c)). Kept apart so the pages that import those modules
 * do not ship it. Invalid inputs give NaN.
 */

import { siliconAbsorption } from "../materials/silicon-absorption";
import { photodiodeQe } from "./photodiode-qe";
import { quantumEfficiencyFromResponsivity, responsivity } from "./responsivity";

/** The spectrum runs from 250 nm in 5 nm steps, 241 samples (to 1450 nm, the end of Green's table). */
export const SPECTRUM_START_NM = 250;
export const SPECTRUM_STEP_NM = 5;
export const SPECTRUM_SAMPLES = 241;
/** The wavelength of the fixed third result card, nm. */
export const REFERENCE_WAVELENGTH_NM = 650;

export interface SpectralResponseParams {
  /** Depletion width W, m. */
  W: number;
  /** Substrate diffusion length L, m (0 = none). */
  L: number;
  /** Surface reflectance R, 0–1. */
  reflectance: number;
  /** Datasheet responsivity to check, A/W. */
  measuredResponsivity: number;
  /** Wavelength of the datasheet value, m. */
  measuredWavelength: number;
}

export interface SpectralResponseSummary {
  /** Wavelength grid, nm. */
  wavelengthNm: number[];
  /** QE at each grid wavelength. */
  qe: number[];
  /** Responsivity at each grid wavelength, A/W. */
  responsivity: number[];
  /** Responsivity of an ideal detector (η = 1) at each grid wavelength, A/W. */
  limit: number[];
  peakResponsivity: number;
  /** Grid wavelength of the peak, nm. */
  peakWavelengthNm: number;
  peakQe: number;
  /** Short- and long-wavelength half-response edges, nm; NaN when the crossing lies outside the grid. */
  halfShortNm: number;
  halfLongNm: number;
  /** Responsivity and QE at 650 nm. */
  responsivity650: number;
  qe650: number;
  /** η implied by the datasheet value, 0–1 (above 1 needs internal gain). */
  impliedQe: number;
  /** η = 1 responsivity at the datasheet wavelength, A/W. */
  limitAtMeasured: number;
}

/** First position (linear interpolation) where y crosses `level`, scanning from index `from` in steps of `dir`. */
export function crossing(x: number[], y: number[], from: number, dir: 1 | -1, level: number): number {
  for (let i = from; i + dir >= 0 && i + dir < y.length; i += dir) {
    const a = y[i];
    const b = y[i + dir];
    if (a >= level && b < level) return x[i] + ((a - level) / (a - b)) * (x[i + dir] - x[i]);
  }
  return NaN;
}

export function spectralResponseSummary(p: SpectralResponseParams): SpectralResponseSummary {
  const qeAt = (nm: number) =>
    photodiodeQe({ alpha: siliconAbsorption(nm * 1e-9), reflectance: p.reflectance, depletionWidth: p.W, diffusionLength: p.L });
  const wavelengthNm = Array.from({ length: SPECTRUM_SAMPLES }, (_, i) => SPECTRUM_START_NM + i * SPECTRUM_STEP_NM);
  const qe = wavelengthNm.map(qeAt);
  const resp = wavelengthNm.map((w, i) => responsivity(qe[i], w * 1e-9));
  const peakIndex = resp.reduce((best, r, i) => (r > resp[best] ? i : best), 0);
  const peak = resp[peakIndex];
  const qe650 = qeAt(REFERENCE_WAVELENGTH_NM);
  return {
    wavelengthNm,
    qe,
    responsivity: resp,
    limit: wavelengthNm.map((w) => responsivity(1, w * 1e-9)),
    peakResponsivity: peak,
    peakWavelengthNm: wavelengthNm[peakIndex],
    peakQe: qe[peakIndex],
    halfShortNm: crossing(wavelengthNm, resp, peakIndex, -1, peak / 2),
    halfLongNm: crossing(wavelengthNm, resp, peakIndex, 1, peak / 2),
    responsivity650: responsivity(qe650, REFERENCE_WAVELENGTH_NM * 1e-9),
    qe650,
    impliedQe: quantumEfficiencyFromResponsivity(p.measuredResponsivity, p.measuredWavelength),
    limitAtMeasured: responsivity(1, p.measuredWavelength),
  };
}
