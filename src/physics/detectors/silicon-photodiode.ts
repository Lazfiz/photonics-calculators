/**
 * Silicon photodiode calculator summary: band gap, spectral QE and responsivity, generation dark current and junction
 * capacitance. SI (K, m, m², s); wavelengths in nm where noted. Composition of `photodiode-qe.ts` (Gärtner 1959,
 * doi:10.1103/PhysRev.116.84: η = (1 − R)·[1 − e^(−αW)/(1 + αL)]), `silicon-absorption.ts` (Green 2008), `responsivity.ts`,
 * `dark-current.ts` (I = q·n_i·W·A/τ_g), `photodiode-rc.ts` (C = ε₀ε_r·A/W) and `materials/bandgap.ts` (Varshni).
 * Kept apart so the pages that import those modules do not ship it.
 */

import { hc_eV_nm } from "../constants";
import { VARSHNI, varshniBandGap } from "../materials/bandgap";
import { siliconAbsorption } from "../materials/silicon-absorption";
import { generationCurrent, siliconIntrinsicDensity } from "./dark-current";
import { photodiodeQe } from "./photodiode-qe";
import { EPS_R_SILICON, depletionCapacitance } from "./photodiode-rc";
import { responsivity } from "./responsivity";

/** The spectrum runs from 300 nm in 4 nm steps. */
export const SPECTRUM_START_NM = 300;
export const SPECTRUM_STEP_NM = 4;
export const SPECTRUM_SAMPLES = 226;

export interface SiliconPhotodiodeParams {
  /** K. */
  T: number;
  /** Depletion width W, m. */
  W: number;
  /** Diffusion length L, m (0 = none). */
  L: number;
  /** m². */
  area: number;
  /** Front reflectance, fraction. */
  reflectance: number;
  /** Generation lifetime τ_g, s. */
  lifetime: number;
}

/** QE at λ (nm) for the device, optionally with another depletion width or diffusion length. */
export function siliconPhotodiodeQe(nm: number, p: SiliconPhotodiodeParams, width = p.W, diffusion = p.L): number {
  return photodiodeQe({ alpha: siliconAbsorption(nm * 1e-9), reflectance: p.reflectance, depletionWidth: width, diffusionLength: diffusion });
}

/** Responsivity at λ (nm), A/W. */
export function siliconPhotodiodeResponsivity(nm: number, p: SiliconPhotodiodeParams): number {
  return responsivity(siliconPhotodiodeQe(nm, p), nm * 1e-9);
}

/** Generation dark current at temperature T (K) with the device's W, area and τ_g, A. */
export function siliconPhotodiodeDark(T: number, p: SiliconPhotodiodeParams): number {
  return generationCurrent(siliconIntrinsicDensity(T), p.W, p.area, p.lifetime);
}

export interface SiliconPhotodiodeSummary {
  /** eV. */
  bandGap: number;
  /** h·c/E_g, nm. */
  bandGapWavelength: number;
  /** Spectrum sample wavelengths, nm. */
  wl: number[];
  /** Responsivity at each sample, A/W. */
  resp: number[];
  peakIndex: number;
  /** A/W. */
  peakResponsivity: number;
  /** nm. */
  peakWavelength: number;
  qe700: number;
  /** A/W. */
  responsivity900: number;
  qe900: number;
  /** A. */
  darkCurrent: number;
  /** F. */
  capacitance: number;
}

export function siliconPhotodiodeSummary(p: SiliconPhotodiodeParams): SiliconPhotodiodeSummary {
  const bandGap = varshniBandGap(p.T, VARSHNI.si);
  const wl = Array.from({ length: SPECTRUM_SAMPLES }, (_, i) => SPECTRUM_START_NM + i * SPECTRUM_STEP_NM);
  const resp = wl.map((nm) => siliconPhotodiodeResponsivity(nm, p));
  const peakIndex = resp.reduce((best, r, i) => (r > resp[best] ? i : best), 0);
  return {
    bandGap,
    bandGapWavelength: hc_eV_nm / bandGap,
    wl,
    resp,
    peakIndex,
    peakResponsivity: resp[peakIndex],
    peakWavelength: wl[peakIndex],
    qe700: siliconPhotodiodeQe(700, p),
    responsivity900: siliconPhotodiodeResponsivity(900, p),
    qe900: siliconPhotodiodeQe(900, p),
    darkCurrent: siliconPhotodiodeDark(p.T, p),
    capacitance: depletionCapacitance(p.area, p.W, EPS_R_SILICON),
  };
}
