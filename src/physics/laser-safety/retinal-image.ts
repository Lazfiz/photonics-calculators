/**
 * Retinal image of a laser beam viewed directly (intrabeam), and the cornea-to-retina irradiance gain. SI units:
 * wavelength and lengths in m, angles in rad, power in W, irradiance in W/m².
 * Model tier: textbook. The eye is a thin lens of 17 mm focal length (the air-equivalent reduced eye; Sliney &
 * Wolbarsht, "Safety with Lasers and Other Optical Sources", Plenum 1980) that accommodates to the beam, so a TEM₀₀
 * beam of 1/e² diameter d at the cornea focuses to the Gaussian spot 4λf/(πd); the pupil caps d at 7 mm. Aberrations,
 * scatter and eye movements keep the image from shrinking below α_min·f = 1.5 mrad × 17 mm = 25.5 µm, the smallest
 * image ICNIRP 2013 (Health Phys. 105:271) assumes. ICNIRP gives the cornea-to-retina irradiance gain for a point
 * source as "approximately 100,000"; here (7 mm / 25.5 µm)² = 7.5×10⁴.
 * Not modelled: absorption in the ocular media (the C_C factor of the limits accounts for it above 1150 nm), a
 * wavefront the eye can't accommodate (a source nearer than 100 mm), and the image of an extended source.
 */
import { ALPHA_MIN } from "./eye-exposure-limits";

/** Air-equivalent focal length of the relaxed eye, m. */
export const EYE_FOCAL_LENGTH = 17e-3;

/** Largest (dark-adapted) pupil, m; also the aperture of the retinal limits (ICNIRP 2013 Table 8). */
export const PUPIL_DIAMETER = 7e-3;

/** Smallest retinal image, m: α_min · f = 25.5 µm. */
export const MIN_RETINAL_IMAGE = ALPHA_MIN * EYE_FOCAL_LENGTH;

/**
 * Diameter, m, of the retinal image of a TEM₀₀ beam of 1/e² diameter d (m) at the cornea, wavelength λ (m), seen
 * through a pupil of diameter D (m): the diffraction spot 4λf/(π·min(d, D)), but at least 25.5 µm. NaN for λ ≤ 0,
 * d ≤ 0 or D ≤ 0.
 */
export function retinalImageDiameter(lambda: number, d: number, D = PUPIL_DIAMETER): number {
  if (!(lambda > 0 && d > 0 && D > 0)) return NaN;
  return Math.max((4 * lambda * EYE_FOCAL_LENGTH) / (Math.PI * Math.min(d, D)), MIN_RETINAL_IMAGE);
}

/** Power, W, of a Gaussian beam (P in W, 1/e² diameter d in m) that passes a centred pupil of diameter D (m). */
export function pupilPower(P: number, d: number, D = PUPIL_DIAMETER): number {
  if (!(P >= 0 && d >= 0 && D > 0)) return NaN;
  return d === 0 ? P : P * -Math.expm1((-2 * D * D) / (d * d));
}

/**
 * Mean retinal irradiance over the image, W/m², ignoring absorption in the eye: the pupil power spread over a disc
 * of the image diameter s (m).
 */
export function retinalIrradiance(P: number, d: number, s: number, D = PUPIL_DIAMETER): number {
  if (!(s > 0)) return NaN;
  return pupilPower(P, d, D) / ((Math.PI * s * s) / 4);
}

/**
 * Ratio of retinal irradiance to the corneal irradiance averaged over the 7 mm aperture of the limits, for a 7 mm pupil
 * and a retinal image of diameter s (m): (7 mm / s)², whether the beam fills the pupil or not (pupil and aperture pass
 * the same power).
 */
export function retinalGain(s: number): number {
  return s > 0 ? (PUPIL_DIAMETER / s) ** 2 : NaN;
}
