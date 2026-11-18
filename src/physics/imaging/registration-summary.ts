/**
 * Registration page: displacement of a 2-D transform over the image and the point-based and intensity-based error
 * budgets, all in pixels (px; rotations and shear in rad). Model tier: textbook (first-order, small errors). The
 * formulas (Fitzpatrick, West & Maurer 1998, doi:10.1109/42.736021, in 2-D; Robinson & Milanfar 2004,
 * doi:10.1109/TIP.2004.832923) are in `registration.ts`, which the stitching page also imports; this module holds what
 * the page assembles from them: fiducials spread uniformly over the image, and the TRE at three target positions.
 */

import {
  type Matrix2,
  type TransformModel,
  displacementMax,
  displacementRms,
  fiducialRegistrationError,
  minControlPoints,
  targetRegistrationError,
  transformMatrix,
  translationCrlb,
} from "./registration";

/**
 * RMS distance f of fiducials spread uniformly over a square L × L image from their centroid: the mean squared radius
 * of the square is L²/6, as for targets averaged over the image, px.
 */
export function uniformFiducialRms(size: number): number {
  return size / Math.sqrt(6);
}

export interface RegistrationInputs {
  model: TransformModel;
  /** Image side L, px (square). */
  size: number;
  /** Rotation θ, rad. */
  theta: number;
  /** Translation, px. */
  tx: number;
  ty: number;
  /** Scale factor s (similarity and affine). */
  scale: number;
  /** Shear φ, rad (affine). */
  shear: number;
  /** Control-point pairs N. */
  points: number;
  /** Fiducial localisation error FLE, px (2-D rms). */
  fle: number;
  /** Texture SNR σ_s/σ_noise and correlation length ℓ (px) of the intensity-based bound. */
  snr: number;
  feature: number;
}

export interface RegistrationSummary {
  /** Linear part [a, b; c, d] of the transform. */
  matrix: Matrix2;
  /** RMS and largest displacement over the image, px. */
  rms: number;
  max: number;
  /** TRE averaged over the image (target at d = f), at the centre and at a corner, px; NaN with too few pairs. */
  treRms: number;
  treCentre: number;
  treCorner: number;
  /** Expected fiducial residual, px; NaN with too few pairs. */
  fre: number;
  /** N below ⌈p/2⌉. */
  tooFew: boolean;
  /** Cramér–Rao bound on the translation per axis over L² pixels, px. */
  crlb: number;
}

export function registrationSummary(i: RegistrationInputs): RegistrationSummary {
  const a = transformMatrix(i.model, i.theta, i.scale, i.shear);
  const fiducialRms = uniformFiducialRms(i.size);
  const tre = (targetDistance: number) =>
    targetRegistrationError({ model: i.model, n: i.points, fle: i.fle, fiducialRms, targetDistance });
  return {
    matrix: a,
    rms: displacementRms(a, i.tx, i.ty, i.size),
    max: displacementMax(a, i.tx, i.ty, i.size),
    treRms: tre(fiducialRms),
    treCentre: tre(0),
    treCorner: tre(i.size / Math.SQRT2),
    fre: fiducialRegistrationError(i.model, i.points, i.fle),
    tooFew: i.points < minControlPoints(i.model),
    crlb: translationCrlb(i.snr, i.feature, i.size * i.size),
  };
}
