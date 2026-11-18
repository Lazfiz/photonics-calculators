/**
 * Camera field of view and sampling of a microscope camera port, SI in and out (the page's mm/µm/nm convert at its edge).
 * Model tier: exact first-order imaging; the formulas and references are in `field-of-view.ts`.
 */

import { nyquistPixel, objectFieldDiameter, objectFov, pixelFootprint } from "./field-of-view";

export interface FovCalculatorInputs {
  /** Sensor width and height, m. */
  sensorWidth: number;
  sensorHeight: number;
  /** Magnification at the sensor. */
  magnification: number;
  /** Pixel pitch, m. */
  pixelSize: number;
  /** Objective NA. */
  na: number;
  wavelength: number;
  /** Eyepiece field number, m. */
  fieldNumber: number;
}

export interface FovCalculatorSummary {
  fovWidth: number;
  fovHeight: number;
  fovDiagonal: number;
  /** Object-side pixel footprint p/M, m. */
  footprint: number;
  /** Nyquist pixel λ/(4NA), m. */
  nyquist: number;
  /** footprint / nyquist: above 1 is undersampled. */
  ratio: number;
  /** Magnification at which the pixel footprint equals the Nyquist pixel, p/(λ/4NA). */
  nyquistMag: number;
  /** Eyepiece field FN/M, m. */
  eyepieceField: number;
  verdict: string;
}

export function fovCalculatorSummary(i: FovCalculatorInputs): FovCalculatorSummary {
  const fov = objectFov(i.sensorWidth, i.sensorHeight, i.magnification);
  const footprint = pixelFootprint(i.pixelSize, i.magnification);
  const nyquist = nyquistPixel(i.wavelength, i.na);
  const ratio = footprint / nyquist;
  return {
    fovWidth: fov.width,
    fovHeight: fov.height,
    fovDiagonal: fov.diagonal,
    footprint,
    nyquist,
    ratio,
    nyquistMag: i.pixelSize / nyquist,
    eyepieceField: objectFieldDiameter(i.fieldNumber, i.magnification),
    verdict: ratio > 1
      ? `undersampled by ${ratio.toFixed(2)}×: the camera loses detail the objective passes`
      : `sampled at ${(1 / ratio).toFixed(2)}× Nyquist`,
  };
}
