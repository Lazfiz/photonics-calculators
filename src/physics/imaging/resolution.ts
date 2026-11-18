/**
 * Page summary of the resolution calculator: Abbe, Rayleigh, Airy-FWHM and axial widefield FWHM for an NA in an
 * immersion medium. SI units in and out (lengths in m). Model tier: textbook approximation (incoherent, aberration-free,
 * uniformly filled pupil, scalar); the formulas and references are in super-resolution.ts (Abbe λ/(2NA), Rayleigh
 * 0.61 λ/NA), diffraction-psf.ts (Airy FWHM) and optical-sectioning-thickness.ts (axial 0.886 λ/(n − √(n² − NA²))).
 */
import { airyFwhm } from "./diffraction-psf";
import { axialPsfFwhm } from "./optical-sectioning-thickness";
import { abbeLateralFwhm, rayleighDistance } from "./super-resolution";

/** Immersion media of the page; index 3 takes the custom index. */
export const IMMERSION_MEDIA = [
  { label: "Air", n: 1.0 },
  { label: "Water", n: 1.33 },
  { label: "Oil", n: 1.518 },
  { label: "Custom", n: NaN },
] as const;

/** Index of the "Custom" entry of {@link IMMERSION_MEDIA}. */
export const CUSTOM_MEDIUM_INDEX = 3;

/** Refractive index of the medium at (rounded) position `mediumIdx`, or `customN` for the custom entry. */
export function immersionIndex(mediumIdx: number, customN: number): number {
  const i = Math.round(mediumIdx);
  if (i === CUSTOM_MEDIUM_INDEX) return customN;
  return i >= 0 && i < CUSTOM_MEDIUM_INDEX ? IMMERSION_MEDIA[i].n : NaN;
}

export interface ResolutionSummary {
  /** Abbe limit λ/(2NA), m. */
  abbe: number;
  /** Rayleigh criterion 0.61 λ/NA, m. */
  rayleigh: number;
  /** Airy FWHM 0.514 λ/NA, m. */
  fwhm: number;
  /** Widefield axial FWHM, m. */
  axial: number;
}

/** Resolution measures for vacuum wavelength λ (m), numerical aperture NA and medium index n; the lateral ones need NA < n. */
export function resolutionSummary(lambda: number, n: number, NA: number): ResolutionSummary {
  const naValid = NA < n;
  return {
    abbe: naValid ? abbeLateralFwhm(lambda, NA) : NaN,
    rayleigh: naValid ? rayleighDistance(lambda, NA) : NaN,
    fwhm: naValid ? airyFwhm(lambda, NA) : NaN,
    axial: axialPsfFwhm(lambda, n, NA),
  };
}
