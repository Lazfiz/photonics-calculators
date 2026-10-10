/**
 * Retinal image of a laser beam viewed directly (intrabeam), and the cornea-to-retina irradiance gain. SI units:
 * wavelength and lengths in m, angles in rad, power in W, irradiance in W/m².
 * Model tier: textbook. The eye is a thin lens of 17 mm focal length (the air-equivalent reduced eye; Sliney &
 * Wolbarsht, "Safety with Lasers and Other Optical Sources", Plenum 1980) that accommodates to the beam, so a TEM₀₀
 * beam of 1/e² diameter d at the cornea focuses to the Gaussian spot 4λf/(πd); the pupil caps d at 7 mm. Aberrations,
 * scatter and eye movements keep the image from shrinking below α_min·f = 1.5 mrad × 17 mm = 25.5 µm, the smallest
 * image ICNIRP 2013 (Health Phys. 105:271) assumes. ICNIRP gives the cornea-to-retina irradiance gain for a point
 * source as "approximately 100,000"; here (7 mm / 25.5 µm)² = 7.5×10⁴.
 * `gaussianApparentSource` follows a beam from its waist and lets the eye accommodate between infinity and 100 mm.
 * Not modelled: absorption in the ocular media (the C_C factor of the limits accounts for it above 1150 nm),
 * aberrations of the eye, and the image of an extended (non-beam) source.
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

/** Accommodation range of the eye, m⁻¹ (dioptres): relaxed (focused at infinity) to a near point of 100 mm. */
export const MAX_ACCOMMODATION = 10;

export interface GaussianApparentSource {
  /** Beam quality M² used: the divergence over the TEM₀₀ divergence 4λ/(πd₀), at least 1. */
  readonly M2: number;
  /** 1/e² beam diameter at the cornea, m. */
  readonly dCornea: number;
  /** Wavefront curvature 1/R at the cornea, m⁻¹ (0 at the waist or for a collimated beam). */
  readonly curvature: number;
  /** Accommodation the eye uses to bring the image nearest to focus, m⁻¹ (0 – 10). */
  readonly accommodation: number;
  /** Curvature left uncorrected, m⁻¹ (> 0 when the waist is nearer than the near point). */
  readonly defocus: number;
  /** 1/e² diameter of the retinal image, m. */
  readonly retinalDiameter: number;
  /** Angular subtense of the apparent source, rad: the 63 % (1/e) image diameter over the eye's focal length. */
  readonly alpha: number;
}

/**
 * The apparent source of a beam seen from r ≥ 0 (m) beyond its waist (1/e² diameter d₀ in m, 1/e² full-angle far-field
 * divergence θ in rad, wavelength λ in m): the object the eye images to the smallest retinal spot within its
 * accommodation range (IEC 60825-1:2014, "apparent source"). Model tier: textbook.
 *
 * Embedded-Gaussian beam (M² as in ISO 11146-1; Siegman, Proc. SPIE 1224, 2, 1990): M² = θπd₀/(4λ), z_R = d₀/θ; at the cornea
 * w = (d₀/2)√(1 + (r/z_R)²) and 1/R = r/(r² + z_R²). The eye is a thin lens 17 mm (air-equivalent) from the retina that
 * adds A = min(1/R, 10 m⁻¹) to its relaxed power, so the curvature δ = 1/R − A is left (a waist nearer than 100 mm).
 * The retinal 1/e² radius is √(b² + s²): defocus blur b = min(w, D/2)·f·δ, and the focused spot
 * s = (λf/π)·max(M²/w, 2/D) — the image of the waist, (d₀/2)·f/√(r² + z_R²), unless the pupil (D) diffracts more, as
 * in `retinalImageDiameter`. α = √2·(retinal radius)/f; far from the waist that is d₀/(√2 r), the 63 % diameter over r.
 * NaN for λ ≤ 0, d₀ ≤ 0, θ < 0, r < 0 or D ≤ 0.
 */
export function gaussianApparentSource(lambda: number, d0: number, theta: number, r: number, D = PUPIL_DIAMETER): GaussianApparentSource {
  if (!(lambda > 0 && d0 > 0 && theta >= 0 && r >= 0 && D > 0)) {
    return { M2: NaN, dCornea: NaN, curvature: NaN, accommodation: NaN, defocus: NaN, retinalDiameter: NaN, alpha: NaN };
  }
  const f = EYE_FOCAL_LENGTH;
  const M2 = Math.max(1, (theta * Math.PI * d0) / (4 * lambda));
  const zR = (Math.PI * d0 * d0) / (4 * M2 * lambda);
  const w = (d0 / 2) * Math.hypot(1, r / zR);
  const curvature = r / (r * r + zR * zR);
  const accommodation = Math.min(curvature, MAX_ACCOMMODATION);
  const defocus = curvature - accommodation;
  const blur = Math.min(w, D / 2) * f * defocus;
  const spot = ((lambda * f) / Math.PI) * Math.max(M2 / w, 2 / D);
  const radius = Math.hypot(blur, spot);
  return { M2, dCornea: 2 * w, curvature, accommodation, defocus, retinalDiameter: 2 * radius, alpha: (Math.SQRT2 * radius) / f };
}
