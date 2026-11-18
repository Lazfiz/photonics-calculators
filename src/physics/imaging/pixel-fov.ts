/**
 * Page summary of the pixel-IFOV calculator: instantaneous field of view of a (binned) pixel behind a lens focused at
 * infinity, its sampling frequencies and the full angular field of the sensor. SI units in and out (lengths in m,
 * angles in rad, spatial frequencies in cycles/m or cycles/rad). Model tier: exact first-order geometry; the formulas
 * and references (Holst, Electro-Optical Imaging System Performance, 2017) are in field-of-view.ts.
 */
import { nyquistFrequency, pixelIfov, subtendedAngle } from "./field-of-view";

export interface PixelFovSummary {
  /** Pixel IFOV 2·atan(b·p/(2f)), rad. */
  ifov: number;
  /** Binned pixel pitch b·p, m. */
  effectivePixel: number;
  /** Sensor Nyquist frequency 1/(2bp), cycles/m. */
  sensorNyquist: number;
  /** Angular Nyquist frequency 1/(2·IFOV), cycles/rad. */
  angularNyquist: number;
  /** Full angle subtended by `pixels` pixels of pitch p (unbinned), rad. */
  fullField: number;
}

/** Pixel IFOV and sampling for pitch p (m), focal length f (m), b × b binning and `pixels` pixels across the sensor. */
export function pixelFovSummary(pitch: number, focalLength: number, binning: number, pixels: number): PixelFovSummary {
  const ifov = pixelIfov(pitch, focalLength, binning);
  const effectivePixel = pitch * binning;
  return {
    ifov,
    effectivePixel,
    sensorNyquist: nyquistFrequency(effectivePixel),
    angularNyquist: nyquistFrequency(ifov),
    fullField: subtendedAngle(pixels * pitch, focalLength),
  };
}
