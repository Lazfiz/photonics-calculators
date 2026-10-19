/*
 * Two budgets of computational imaging: the SNR of N fused exposures, and the synthetic aperture of Fourier
 * ptychography.
 *
 * Fusion: summing N independent exposures adds signal N·S and variance N·(S + B + σ_r²), so with a fixed signal per
 * view SNR_N = √N·SNR₁. With a fixed total dose split over N views each view carries S/N and B/N but its own read noise,
 * so SNR_N = S/√(S + B + N σ_r²): only the read noise grows (Janesick, Photon Transfer, SPIE 2007).
 *
 * Synthetic aperture: a coherent image through an objective of numerical aperture NA_obj passes spatial frequencies up
 * to NA_obj/λ, so the finest period is λ/NA_obj. Oblique illumination up to NA_ill shifts the pupil, and stitching the
 * images in Fourier space gives a synthetic pupil of NA_obj + NA_ill (Zheng, Horstmeyer & Yang, Nat. Photonics 7, 739
 * (2013)). Incoherent widefield imaging through the same objective reaches λ/(2NA_obj).
 */

import { cameraSnr } from "../detectors/camera-snr";

const finitePositive = (x: number) => Number.isFinite(x) && x > 0;

export type DoseMode = "perView" | "totalDose";

export interface FusionInputs {
  /** Signal photoelectrons per pixel: per view ("perView") or summed over all views ("totalDose"), e⁻. */
  signal: number;
  /** Mean background photoelectrons per pixel, on the same basis as `signal`, e⁻. */
  background: number;
  /** Read noise per exposure, e⁻ rms. */
  read: number;
  /** Number of fused exposures N (integer ≥ 1). */
  views: number;
  mode: DoseMode;
}

/** SNR of one exposure (shot noise of signal and background plus read noise), with the per-view share of the dose. */
export function singleViewSnr({ signal, background, read, views, mode }: FusionInputs): number {
  if (!(Number.isInteger(views) && views >= 1)) return NaN;
  const share = mode === "totalDose" ? 1 / views : 1;
  return cameraSnr({ signal: signal * share, background: background * share, read });
}

/** SNR of the sum of N exposures. */
export function fusedSnr({ signal, background, read, views, mode }: FusionInputs): number {
  if (!(Number.isInteger(views) && views >= 1)) return NaN;
  return mode === "totalDose"
    ? cameraSnr({ signal, background, read: Math.sqrt(views) * read })
    : Math.sqrt(views) * cameraSnr({ signal, background, read });
}

/** Synthetic numerical aperture NA_obj + NA_ill of Fourier ptychography. */
export function syntheticNa(naObjective: number, naIllumination: number): number {
  return finitePositive(naObjective) && naIllumination >= 0 && Number.isFinite(naIllumination)
    ? naObjective + naIllumination
    : NaN;
}

/** Finest period passed by a coherent pupil of numerical aperture NA: λ/NA, m. */
export function coherentCutoffPeriod(lambda: number, NA: number): number {
  return finitePositive(lambda) && finitePositive(NA) ? lambda / NA : NaN;
}

/** Finest period passed by an incoherent pupil of numerical aperture NA: λ/(2NA), m. */
export function incoherentCutoffPeriod(lambda: number, NA: number): number {
  return finitePositive(lambda) && finitePositive(NA) ? lambda / (2 * NA) : NaN;
}

/** Space-bandwidth gain over a single coherent image at the same field of view: (NA_syn/NA_obj)². */
export function spaceBandwidthGain(naObjective: number, naIllumination: number): number {
  return (syntheticNa(naObjective, naIllumination) / naObjective) ** 2;
}
