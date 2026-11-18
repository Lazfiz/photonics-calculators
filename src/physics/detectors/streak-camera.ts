/**
 * Streak-camera page summary: temporal resolution of a slit image, a pixel and Gaussian terms (tube, screen blur,
 * jitter) at one sweep speed, the data-sheet allowance for the tube term and the time window. SI units (m, s, m/s).
 * The physics is in `photoemission.ts`; this module only combines it. Defaults follow the Hamamatsu C16910 data sheet
 * SHSS0026E06.
 */

import {
  gaussianAllowance, limitingResolutionBlur, quadratureFwhm, rectGaussFwhm, streakTime, streakWindow,
} from "./photoemission";

/** MTF at which the data-sheet limiting resolution is read (5 %, the visibility limit of a bar target). */
export const STREAK_BLUR_MTF = 0.05;

/** Fastest C16910 sweep, mm/ns: 9.44 mm working height in 60 ps. */
export const STREAK_FASTEST_SWEEP_MM_NS = 9.44 / 0.06;

export interface StreakInput {
  /** Slit width at the cathode, m. */
  slitWidth: number;
  /** Tube magnification, cathode to screen. */
  magnification: number;
  /** Pixel size on the screen, m. */
  pixelSize: number;
  /** Pixels along the sweep. */
  pixels: number;
  /** Tube spread FWHM, s. */
  tube: number;
  /** Screen length along the sweep, m. */
  screenLength: number;
  /** Trigger jitter FWHM, s. */
  jitter: number;
  /** Limiting resolution at the cathode, lp/m. */
  limitingResolution: number;
  /** Data-sheet total temporal resolution, s. */
  spec: number;
}

export interface StreakTerms {
  slit: number;
  pixel: number;
  /** Quadrature sum of jitter and screen blur. */
  known: number;
  /** Quadrature sum of tube, blur and jitter. */
  gauss: number;
  /** FWHM of rect ⊗ rect ⊗ Gauss. */
  total: number;
  /** Quadrature of slit, pixel and Gaussian terms (overstates the rectangles). */
  quad: number;
}

/** Screen blur FWHM (m) from the cathode limiting resolution, times the magnification. */
export function streakBlur(p: StreakInput): number {
  return limitingResolutionBlur(p.limitingResolution, STREAK_BLUR_MTF) * p.magnification;
}

/** The resolution terms at a sweep speed v (m/s). */
export function streakTermsAt(p: StreakInput, sweepSpeed: number): StreakTerms {
  const slit = streakTime(p.slitWidth * p.magnification, sweepSpeed);
  const pixel = streakTime(p.pixelSize, sweepSpeed);
  const known = quadratureFwhm([p.jitter, streakTime(streakBlur(p), sweepSpeed)]);
  const gauss = quadratureFwhm([p.tube, known]);
  return { slit, pixel, known, gauss, total: rectGaussFwhm([slit, pixel], gauss), quad: quadratureFwhm([slit, pixel, gauss]) };
}

export interface StreakSummary extends StreakTerms {
  /** Screen blur term in time, s. */
  blurTime: number;
  /** Largest tube term the data sheet allows, s (NaN if the other terms already exceed it). */
  allowance: number;
  /** Time window, s. */
  window: number;
  /** The readout is longer than the screen. */
  screenLimited: boolean;
  /** The total FWHM is under two pixels. */
  undersampled: boolean;
  /** The total exceeds the data-sheet resolution. */
  overSpec: boolean;
  /** Name of the largest of the slit, pixel and Gaussian terms. */
  dominant: string;
}

export function streakSummary(p: StreakInput, sweepSpeed: number): StreakSummary {
  const t = streakTermsAt(p, sweepSpeed);
  const terms: [string, number][] = [["slit image", t.slit], ["pixel", t.pixel], ["tube, blur and jitter", t.gauss]];
  return {
    ...t,
    blurTime: streakTime(streakBlur(p), sweepSpeed),
    allowance: gaussianAllowance([t.slit, t.pixel], t.known, p.spec),
    window: streakWindow(p.pixels * p.pixelSize, p.screenLength, sweepSpeed),
    screenLimited: p.screenLength < p.pixels * p.pixelSize,
    undersampled: t.total < 2 * t.pixel,
    overSpec: t.total > p.spec * (1 + 1e-9),
    dominant: terms.reduce((a, b) => (b[1] > a[1] ? b : a))[0],
  };
}
