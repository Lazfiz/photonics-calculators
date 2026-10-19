/**
 * Light-field (plenoptic) imaging with a microlens array at the main lens's image plane and the sensor one microlens
 * focal length behind it. SI units: lengths in m, angles in rad. Model tier: textbook.
 *
 * Light-field microscope: M. Levoy, R. Ng, A. Adams, M. Footer, M. Horowitz, "Light field microscopy", ACM Trans.
 * Graph. 25, 924 (2006), https://doi.org/10.1145/1141911.1141976:
 * - microlens f-number matched to the objective's image side, N = M/(2NA) (eq. 1);
 * - Sparrow limit in the image, R_obj = 0.47λM/NA (eq. 2), and N_u = W/R_obj resolvable spots behind a lenslet of
 *   width W (eq. 3); the lateral sample on the specimen is W/M;
 * - depth of field λn/NA² + ne/(M·NA) (eq. 4); with e = W this gives (2 + N_u)λn/(2NA²) for a refocused slice
 *   (eq. 5.2) and (2 + N_u²)λn/(2NA²) for a single view (eq. 5.3).
 *
 * Plenoptic camera: R. Ng, M. Levoy, M. Brédif, G. Duval, M. Horowitz, P. Hanrahan, "Light field photography with a
 * hand-held plenoptic camera", Stanford Tech. Rep. CTSR 2005-02 (2005):
 * - microlens f-number f_µ/p_µ matched to the main lens's image-side f-number, so micro-images (diameter f_µ/N_w)
 *   tile the sensor (§3.2);
 * - sensor-to-microlens spacing accurate to p_px·f_µ/p_µ (§3.1);
 * - with N pixels across each micro-image, refocusing is sharp within the depth of field of an aperture N times
 *   narrower (§4.2), here with the lenslet pitch as the circle of confusion.
 */

/** Sparrow factor in R = 0.47λ/NA (Levoy 2006 eq. 2, after Inoué 1997). */
export const SPARROW_FACTOR = 0.47;

/** Microlens f-number M/(2NA) matching an objective's image-side NA (Levoy eq. 1). NaN unless M, NA > 0. */
export function lensletFNumber(magnification: number, na: number): number {
  if (!(magnification > 0) || !(na > 0)) return NaN;
  return magnification / (2 * na);
}

/** Sparrow limit in the intermediate image, 0.47λM/NA, m (Levoy eq. 2). NaN unless λ, M, NA > 0. */
export function imageSparrowSpot(lambda: number, na: number, magnification: number): number {
  if (!(lambda > 0) || !(na > 0) || !(magnification > 0)) return NaN;
  return (SPARROW_FACTOR * lambda * magnification) / na;
}

export interface LightFieldMicroscopeInputs {
  /** Objective NA, below the medium index. */
  na: number;
  /** Objective lateral magnification M. */
  magnification: number;
  /** Refractive index n of the specimen medium. */
  n: number;
  /** Lenslet width (pitch) W, m. */
  lensletPitch: number;
  /** Sensor pixel pitch, m. */
  pixelPitch: number;
  /** Wavelength in vacuum, m. */
  lambda: number;
}

export interface LightFieldMicroscopeResult {
  /** Lateral sample on the specimen W/M, m. */
  lateralSample: number;
  /** Sparrow limit in the image 0.47λM/NA, m. */
  sparrowImage: number;
  /** Diffraction-limited resolvable spots across a lenslet, W/R_obj. */
  spotsDiffraction: number;
  /** Spots the pixels can sample at two pixels per spot, W/(2p_px). */
  spotsPixels: number;
  /** Resolvable spots used below, the smaller of the two. */
  nu: number;
  /** True when the pixels, not diffraction, limit N_u. */
  pixelLimited: boolean;
  /** Microlens f-number M/(2NA), and the matching focal length N·W, m. */
  lensletFNumber: number;
  lensletFocal: number;
  /** Depth of field without microlenses λn/NA² (eq. 5.1), of a refocused slice (5.2) and of one view (5.3), m. */
  dofConventional: number;
  dofRefocused: number;
  dofView: number;
}

/**
 * Light-field microscope design (Levoy 2006 eqs. 1–5). N_u is capped at W/(2p_px): Levoy reports that a lenslet
 * 15 pixels wide resolved only about 7 of 11.8 spots. NaN unless every input is positive and NA < n.
 */
export function lightFieldMicroscope(p: LightFieldMicroscopeInputs): LightFieldMicroscopeResult {
  const ok = p.na > 0 && p.n >= 1 && p.na < p.n && p.magnification > 0 && p.lensletPitch > 0 && p.pixelPitch > 0
    && p.lambda > 0;
  const sparrowImage = ok ? imageSparrowSpot(p.lambda, p.na, p.magnification) : NaN;
  const spotsDiffraction = p.lensletPitch / sparrowImage;
  const spotsPixels = ok ? p.lensletPitch / (2 * p.pixelPitch) : NaN;
  const nu = Math.min(spotsDiffraction, spotsPixels);
  const fNumber = ok ? lensletFNumber(p.magnification, p.na) : NaN;
  const wave = (p.lambda * p.n) / (p.na * p.na);
  return {
    lateralSample: ok ? p.lensletPitch / p.magnification : NaN,
    sparrowImage,
    spotsDiffraction,
    spotsPixels,
    nu,
    pixelLimited: spotsPixels < spotsDiffraction,
    lensletFNumber: fNumber,
    lensletFocal: fNumber * p.lensletPitch,
    dofConventional: ok ? wave : NaN,
    dofRefocused: ok ? ((2 + nu) * wave) / 2 : NaN,
    dofView: ok ? ((2 + nu * nu) * wave) / 2 : NaN,
  };
}

export interface PlenopticCameraInputs {
  /** Microlens pitch p_µ, m. */
  lensletPitch: number;
  /** Microlens focal length f_µ (microlens-to-sensor spacing), m. */
  lensletFocal: number;
  /** Sensor pixel pitch, m. */
  pixelPitch: number;
  /** Sensor size in pixels. */
  sensorWidthPx: number;
  sensorHeightPx: number;
  /** Main lens image-side (working) f-number N_w. */
  mainFNumber: number;
  /** Main lens focal length, m. */
  mainFocal: number;
  /** Object distance in focus on the microlens array, m (beyond the focal length). */
  focusDistance: number;
  /** Wavelength, m. */
  lambda: number;
}

export interface PlenopticCameraResult {
  /** Microlens f-number f_µ/p_µ. */
  lensletFNumber: number;
  /** Micro-image diameter f_µ/N_w over the pitch: above 1 the micro-images overlap, below 1 pixels go unused. */
  microImageFill: number;
  /** Whole pixels across one micro-image, N, and the N² views. */
  pixelsAcross: number;
  views: number;
  /** Lenslets (spatial samples) across the sensor. */
  lensletsX: number;
  lensletsY: number;
  /** 4D light-field samples, lenslets × N². */
  samples: number;
  /** Angle one pixel subtends at the microlens, atan(p_px/f_µ), rad. */
  angularStep: number;
  /** Airy-disk diameter of a microlens, 2.44λ·f_µ/p_µ, m. */
  lensletAiry: number;
  /** Tolerance on the microlens-to-sensor spacing, p_px·f_µ/p_µ, m (Ng §3.1). */
  spacingTolerance: number;
  /** Image-side half depth of field, N_w·p_µ conventional and N·N_w·p_µ refocusable, m. */
  imageDofConventional: number;
  imageRefocusRange: number;
  /** Object distances bounding the refocusable range, m (far is Infinity when beyond infinity focus). */
  refocusNear: number;
  refocusFar: number;
}

/** Thin-lens conjugate 1/(1/f − 1/s); Infinity when s ≤ f (object or image at or beyond infinity). */
function conjugate(f: number, s: number): number {
  return s > f ? (f * s) / (s - f) : Infinity;
}

/** Plenoptic 1.0 camera design (Ng 2005). NaN unless every input is positive and the focus distance exceeds f. */
export function plenopticCamera(p: PlenopticCameraInputs): PlenopticCameraResult {
  const ok = p.lensletPitch > 0 && p.lensletFocal > 0 && p.pixelPitch > 0 && p.sensorWidthPx >= 1
    && p.sensorHeightPx >= 1 && p.mainFNumber > 0 && p.mainFocal > 0 && p.focusDistance > p.mainFocal && p.lambda > 0;
  const nan = NaN;
  const fNumber = ok ? p.lensletFocal / p.lensletPitch : nan;
  const imageDiameter = p.lensletFocal / p.mainFNumber;
  // Whole pixels; the 1e-9 keeps exact ratios such as 4000·9/125 = 288 from flooring to 287.
  const pixelsAcross = ok ? Math.floor(Math.min(imageDiameter, p.lensletPitch) / p.pixelPitch + 1e-9) : nan;
  const lensletsX = ok ? Math.floor((p.sensorWidthPx * p.pixelPitch) / p.lensletPitch + 1e-9) : nan;
  const lensletsY = ok ? Math.floor((p.sensorHeightPx * p.pixelPitch) / p.lensletPitch + 1e-9) : nan;
  const views = pixelsAcross * pixelsAcross;
  const imageDofConventional = ok ? p.mainFNumber * p.lensletPitch : nan;
  const imageRefocusRange = pixelsAcross * imageDofConventional;
  const imageDistance = ok ? conjugate(p.mainFocal, p.focusDistance) : nan;
  return {
    lensletFNumber: fNumber,
    microImageFill: ok ? imageDiameter / p.lensletPitch : nan,
    pixelsAcross,
    views,
    lensletsX,
    lensletsY,
    samples: lensletsX * lensletsY * views,
    angularStep: ok ? Math.atan(p.pixelPitch / p.lensletFocal) : nan,
    lensletAiry: ok ? 2.44 * p.lambda * fNumber : nan,
    spacingTolerance: ok ? p.pixelPitch * fNumber : nan,
    imageDofConventional,
    imageRefocusRange,
    refocusNear: ok ? conjugate(p.mainFocal, imageDistance + imageRefocusRange) : nan,
    refocusFar: ok ? conjugate(p.mainFocal, imageDistance - imageRefocusRange) : nan,
  };
}
