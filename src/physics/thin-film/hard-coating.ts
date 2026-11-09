/**
 * Hard coating optics: one lossless film on a substrate at normal incidence, exact transfer matrix, back face
 * ignored (H. A. Macleod, Thin-Film Optical Filters, 4th ed., CRC Press 2010, ch. 2 and ch. 4). All lengths in m.
 * Tier: Exact (the optics); the stress side lives in `stoney.ts`.
 */
import { intervalStats } from "../math";
import { normalIncidenceReflectance } from "../polarization/fresnel";
import { quarterWaveStackReflectance, stackResponse } from "./transfer-matrix";

const NM = 1e-9;

/** Reflectance (0–1) of the coated face at wavelength λ (m) for a film of index n and thickness d (m) on a substrate. */
export function coatedReflectance(nCoat: number, nSub: number, d: number, lambda: number): number {
  return stackResponse({ incident: 1, layers: [{ n: nCoat, thickness: d }], substrate: { n: nSub } }, lambda).R;
}

export interface HardCoatingOptics {
  /** R at λ₀ of the coated face. */
  R0: number;
  /** R of the uncoated face. */
  bare: number;
  /** Band of the mean reflectance, m: 400–700 nm for visible designs (λ₀ in 400–700 nm), else 0.8–1.2 λ₀. */
  bandLo: number;
  bandHi: number;
  /** Mean, minimum and maximum of R over the band (300 intervals, trapezoidal rule). */
  mean: number;
  min: number;
  max: number;
  /** R at λ₀ of a quarter-wave film of this index (closed form). */
  quarterWave: number;
  /** λ₀/(2n), m: multiples of it are absentee thicknesses. */
  halfWave: number;
  /** The multiple (≥ 1) of the half wave nearest the thickness, m. */
  nearestAbsentee: number;
}

/** Optics of the hard coat; `d` is the film thickness and `lambda0` the design wavelength, both in m. */
export function hardCoatingOptics(nCoat: number, nSub: number, d: number, lambda0: number): HardCoatingOptics {
  const coated = (lam: number) => coatedReflectance(nCoat, nSub, d, lam);
  const halfWave = lambda0 / (2 * nCoat);
  const order = Math.max(1, Math.round(d / halfWave));
  const visible = lambda0 >= 400 * NM && lambda0 <= 700 * NM;
  const bandLo = visible ? 400 * NM : 0.8 * lambda0;
  const bandHi = visible ? 700 * NM : 1.2 * lambda0;
  const stats = intervalStats(coated, bandLo, bandHi, 300);
  return {
    R0: coated(lambda0),
    bare: normalIncidenceReflectance(1, nSub),
    bandLo,
    bandHi,
    mean: stats.mean,
    min: stats.min,
    max: stats.max,
    quarterWave: quarterWaveStackReflectance(1, [nCoat], nSub),
    halfWave,
    nearestAbsentee: order * halfWave,
  };
}
