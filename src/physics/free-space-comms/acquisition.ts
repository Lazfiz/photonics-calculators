/**
 * Illustrative acquisition and tracking numbers for a laser terminal: stare probability, raster scan time and the
 * noise-equivalent angle of a quadrant-detector tracker. SI units: rad, rad/s, s. Model tier: illustrative (no
 * turnaround time, overlap, dwell or false-alarm statistics; the uncertainty is a circular Gaussian).
 *
 * Stare: if the pointing error is a circular Gaussian with σ per axis, the probability that the target lies inside a
 * circular field of view of full angle Θ is the Rayleigh CDF 1 − exp(−(Θ/2)²/(2σ²)).
 *
 * Raster: a square of side 2U (U the 3σ radius) is swept in lines spaced by the full FOV, each line of length 2U at
 * angular rate ω: N = ⌈2U/Θ⌉ lines, T = N·2U/ω. The square holds a fraction erf(U/(√2σ))² of the targets (99.46 % at 3σ).
 *
 * Tracking: the rms angle error of a quadrant detector viewing a point source through an aperture D is
 * σ = (3π/16)(λ/D)/SNR_v, SNR_v the voltage SNR of the four quadrants summed: G. A. Tyler, D. L. Fried, J. Opt. Soc.
 * Am. 72, 804 (1982), abstract (circular object of zero angular size).
 */

import { erf } from "../math";

/** Probability that a circular-Gaussian target (σ per axis) lies inside a circular FOV of full angle Θ. */
export function stareProbability(fovFull: number, sigma: number): number {
  if (!(sigma > 0)) return fovFull > 0 ? 1 : 0;
  const r = fovFull / 2;
  return -Math.expm1(-(r * r) / (2 * sigma * sigma));
}

/** Fraction of a circular-Gaussian target distribution (σ per axis) inside the square |x|, |y| ≤ U. */
export function squareCoverage(halfSide: number, sigma: number): number {
  if (!(sigma > 0)) return halfSide >= 0 ? 1 : 0;
  return erf(halfSide / (Math.SQRT2 * sigma)) ** 2;
}

export interface RasterScan {
  /** Number of scan lines ⌈2U/Θ⌉. */
  lines: number;
  /** Total scan time N·2U/ω, s. */
  time: number;
}

/** Raster over a square of side 2U with line spacing Θ (full FOV) at angular rate ω (rad/s). */
export function rasterScan(uncertainty3Sigma: number, fovFull: number, scanRate: number): RasterScan {
  if (!(fovFull > 0) || !(scanRate > 0) || !(uncertainty3Sigma >= 0)) return { lines: NaN, time: NaN };
  const side = 2 * uncertainty3Sigma;
  const lines = Math.max(1, Math.ceil(side / fovFull - 1e-9));
  return { lines, time: (lines * side) / scanRate };
}

/** Quadrant-detector noise-equivalent angle (3π/16)(λ/D)/SNR_v, rms per axis, rad (Tyler & Fried 1982). */
export function quadCellNea(lambda: number, apertureDiameter: number, snrVoltage: number): number {
  if (!(apertureDiameter > 0) || !(snrVoltage > 0)) return NaN;
  return ((3 * Math.PI) / 16) * (lambda / apertureDiameter) / snrVoltage;
}
