/**
 * Wavelength calibration of a Czerny–Turner spectrograph with a flat array detector. SI units: wavelengths, pixel
 * pitch and focal length in m, angles in rad; pixel positions are fractional indices 0 … N − 1. Model tier:
 * textbook approximation (the "true" pixel → wavelength map is the grating equation on a flat detector normal to the
 * central ray, with no aberrations, detector tilt or focal-plane curvature).
 *
 * Truth: pixel i sits at x = (i − (N − 1)/2)·p, the ray reaching it leaves the grating at β = β₀ + atan(x/f), and
 * λ = d(sin α + sin β)/m (C. Palmer, E. Loewen, Diffraction Grating Handbook, 6th ed., Newport 2005, ch. 2), with α
 * and β₀ from the fixed deviation and the centre wavelength (`detectorCoverage` in spectral-resolution.ts). Both
 * sin β and atan make λ(pixel) non-linear, which is why a linear calibration leaves errors at the detector edges.
 *
 * Calibration: lines of known wavelength are located at (noisy) pixel centroids and a polynomial λ(pixel) of degree
 * k is fitted by least squares. The pixel is mapped to u = (i − c)/h ∈ [−1, 1] before fitting so the normal
 * equations stay well conditioned. Air wavelengths are the right ones for an instrument in air, since the grating
 * equation holds for the wavelength in the medium around the grating.
 */

import { ols } from "../imaging/linear-unmixing";
import { detectorCoverage, gratingDiffractionAngle } from "./spectral-resolution";

export interface Spectrograph {
  grooveSpacing: number;
  order: number;
  incidence: number;
  beta0: number;
  focalLength: number;
  pixelPitch: number;
  pixels: number;
}

/** Czerny–Turner set to centre wavelength λ_c with deviation D_v (α − β₀); NaN angles if λ_c is unreachable. */
export function czernyTurner(
  lambdaCentre: number, grooveSpacing: number, order: number, deviation: number, focalLength: number,
  pixelPitch: number, pixels: number,
): Spectrograph {
  const { incidence, beta0 } = detectorCoverage(lambdaCentre, grooveSpacing, order, deviation, pixels * pixelPitch, focalLength);
  return { grooveSpacing, order, incidence, beta0, focalLength, pixelPitch, pixels };
}

/** True wavelength at fractional pixel i, m; NaN past grazing or before the zero order. */
export function pixelToWavelength(i: number, s: Spectrograph): number {
  const x = (i - (s.pixels - 1) / 2) * s.pixelPitch;
  const beta = s.beta0 + Math.atan(x / s.focalLength);
  if (!(Math.abs(beta) < Math.PI / 2 && Math.abs(s.incidence) < Math.PI / 2)) return NaN;
  const l = (s.grooveSpacing * (Math.sin(s.incidence) + Math.sin(beta))) / s.order;
  return l > 0 ? l : NaN;
}

/** Fractional pixel where wavelength λ lands (inverse of `pixelToWavelength`); NaN if it misses the detector. */
export function wavelengthToPixel(lambda: number, s: Spectrograph): number {
  const beta = gratingDiffractionAngle(lambda, s.grooveSpacing, s.order, s.incidence);
  if (!(Math.abs(beta - s.beta0) < Math.PI / 2)) return NaN;
  const i = (s.focalLength * Math.tan(beta - s.beta0)) / s.pixelPitch + (s.pixels - 1) / 2;
  return i >= 0 && i <= s.pixels - 1 ? i : NaN;
}

export interface PolyFit {
  degree: number;
  /** Coefficients of λ(u) = Σ c_k u^k, u = (i − centre)/halfWidth. */
  coeffs: number[];
  centre: number;
  halfWidth: number;
  /** Root-mean-square residual at the fitted points, same unit as y. */
  rms: number;
}

/** Least-squares polynomial of `degree` through (x, y); null with fewer than degree + 1 points or a singular fit. */
export function fitPolynomial(xs: readonly number[], ys: readonly number[], degree: number, centre: number, halfWidth: number): PolyFit | null {
  const n = Math.min(xs.length, ys.length);
  if (!(degree >= 0 && n >= degree + 1 && halfWidth > 0)) return null;
  const rows = xs.slice(0, n).map((x) => Array.from({ length: degree + 1 }, (_, k) => ((x - centre) / halfWidth) ** k));
  const coeffs = ols(rows, ys.slice(0, n));
  if (!coeffs.every(Number.isFinite)) return null;
  const fit: PolyFit = { degree, coeffs, centre, halfWidth, rms: 0 };
  fit.rms = Math.sqrt(xs.slice(0, n).reduce((acc, x, j) => acc + (evalPolynomial(fit, x) - ys[j]) ** 2, 0) / n);
  return fit;
}

/** Fitted λ at pixel x (Horner). */
export function evalPolynomial(fit: PolyFit, x: number): number {
  const u = (x - fit.centre) / fit.halfWidth;
  return fit.coeffs.reduceRight((acc, c) => acc * u + c, 0);
}

/** Fitted dispersion dλ/di at pixel x, per pixel. */
export function polynomialSlope(fit: PolyFit, x: number): number {
  const u = (x - fit.centre) / fit.halfWidth;
  let d = 0;
  for (let k = fit.coeffs.length - 1; k >= 1; k--) d = d * u + k * fit.coeffs[k];
  return d / fit.halfWidth;
}

/** Largest |fit − truth| over pixels 0 … N − 1 (every pixel), m. */
export function maxCalibrationError(fit: PolyFit, s: Spectrograph): number {
  let worst = 0;
  for (let i = 0; i < s.pixels; i++) {
    const e = Math.abs(evalPolynomial(fit, i) - pixelToWavelength(i, s));
    if (Number.isFinite(e)) worst = Math.max(worst, e);
  }
  return worst;
}
