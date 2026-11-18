/**
 * Sensor MTF page summary: pixel aperture × charge spread × optical blur at the Nyquist frequency. SI units: lengths in m,
 * spatial frequency in cycles/m. The terms are in sensor-mtf.ts (Holst & Lomheim, CMOS/CCD Sensors and Camera Systems,
 * 2nd ed., SPIE 2011, ch. 10, doi:10.1117/3.2524677.ch10).
 */

import { exponentialSpreadMtf, gaussianBlurMtf, pixelApertureMtf } from "./sensor-mtf";

export interface ModulationTransferInputs {
  /** Pixel pitch p, m. */
  pitch: number;
  /** 1/e length ℓ of the exponential line spread, m. */
  spreadLength: number;
  /** Active-area fill factor (square active area, √FF per axis). */
  fillFactor: number;
  /** Gaussian optical blur σ, m. */
  blurSigma: number;
}

export interface MtfTerms {
  pixel: number;
  diffusion: number;
  blur: number;
  total: number;
}

/** Active width a = p·√FF of a square active area, m. */
export function activeWidth(pitch: number, fillFactor: number): number {
  return pitch * Math.sqrt(fillFactor);
}

/** The three MTF terms and their product at spatial frequency f (cycles/m). */
export function mtfTerms(f: number, p: ModulationTransferInputs): MtfTerms {
  const pixel = pixelApertureMtf(f, activeWidth(p.pitch, p.fillFactor));
  const diffusion = exponentialSpreadMtf(f, p.spreadLength);
  const blur = gaussianBlurMtf(f, p.blurSigma);
  return { pixel, diffusion, blur, total: pixel * diffusion * blur };
}

export interface ModulationTransferSummary extends MtfTerms {
  /** Nyquist frequency 1/(2p), cycles/m. */
  nyquist: number;
  /** Active width, m. */
  aperture: number;
}

/** The terms at the Nyquist frequency 1/(2p). */
export function modulationTransferSummary(p: ModulationTransferInputs): ModulationTransferSummary {
  const nyquist = 1 / (2 * p.pitch);
  return { nyquist, aperture: activeWidth(p.pitch, p.fillFactor), ...mtfTerms(nyquist, p) };
}
