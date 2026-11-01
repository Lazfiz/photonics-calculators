/**
 * Throughput (étendue) of Fourier-transform and slit spectrometers, and the Jacquinot advantage. Angles in rad,
 * lengths in m; wavenumber and resolution in any one consistent unit (cm⁻¹ on the pages).
 * Model tier: textbook approximation (geometric optics; the slit spectrometer is slit-width limited, i.e. its
 * diffraction limit mNρ is well above the resolving power compared; the FTS beam fills a circular field stop).
 *
 * FTS field of view. A ray at angle θ to the interferometer axis sees the path difference x cos θ, so its line
 * appears at ν̃ cos θ. Over a cone of half-angle α the line spreads by ν̃(1 − cos α); setting this equal to the
 * resolution Δν̃ gives 1 − cos α = Δν̃/ν̃, and the solid angle of the cone is exactly
 *   Ω_max = 2π(1 − cos α) = 2π Δν̃/ν̃ = 2π/R,   R = ν̃/Δν̃
 * (P. Jacquinot, J. Opt. Soc. Am. 44, 761 (1954), doi 10.1364/JOSA.44.000761; P. R. Griffiths, J. A. de Haseth,
 * Fourier Transform Infrared Spectrometry, 2nd ed., Wiley 2007, ch. 7). The field (J-) stop at the focus of a
 * collimator of focal length f has diameter 2f tan α.
 *
 * Slit spectrometer. A grating at incidence α and diffraction β (mρλ = sin α + sin β) has angular dispersion
 * dα/dλ = mρ/cos α at the entrance, so an entrance slit of width w behind a collimator of focal length f passes
 * δλ = w cos α/(mρ f): w/f = (sin α + sin β)/(R cos α). With slit height h the slit subtends
 *   Ω_G = (w/f)(h/f) = (h/f)(sin α + sin β)/(R cos α).
 * For the same collimated beam area and the same R the étendue ratio is
 *   Ω_FTS/Ω_G = 2π f cos α / (h (sin α + sin β)),   Littrow (α = β = θ): π f/(h tan θ).
 * Jacquinot's 2πf/h is the case (sin α + sin β)/cos α = 1 (Littrow θ = 26.57°).
 *
 * Mirror cone. A spherical mirror of radius of curvature R_c (focal length R_c/2) and diameter D has sag
 * s = R_c − √(R_c² − D²/4); from its focus the rim is at axial distance f − s, so the half-angle of the cone is
 * atan((D/2)/(f − s)). Solid angle of a cone 2π(1 − cos α) = 4π sin²(α/2); a flat Lambertian area A sends
 * A·π sin²α of étendue into it (projected solid angle; W. J. Smith, Modern Optical Engineering, 4th ed.,
 * McGraw-Hill 2008, ch. 12). The paraxial π tan²α = π(D/2f)² (no sag) overstates both: by 18 % at f/1.
 */

/** Ω_max = 2π Δν̃/ν̃, sr: the largest FTS field at resolution Δν̃. NaN unless 0 < Δν̃ ≤ ν̃. */
export function ftsMaxSolidAngle(wavenumber: number, resolution: number): number {
  if (!(wavenumber > 0 && resolution > 0 && resolution <= wavenumber)) return NaN;
  return (2 * Math.PI * resolution) / wavenumber;
}

/** Half-angle α of the largest FTS field, from 1 − cos α = Δν̃/ν̃: α = 2 asin √(Δν̃/(2ν̃)), rad. */
export function ftsMaxHalfAngle(wavenumber: number, resolution: number): number {
  if (!(wavenumber > 0 && resolution > 0 && resolution <= wavenumber)) return NaN;
  return 2 * Math.asin(Math.sqrt(resolution / (2 * wavenumber)));
}

/** Field-stop diameter 2f tan α at the focus of a collimator of focal length f, m. NaN unless 0 ≤ α < π/2, f > 0. */
export function fieldStopDiameter(halfAngle: number, focalLength: number): number {
  if (!(halfAngle >= 0 && halfAngle < Math.PI / 2 && focalLength > 0)) return NaN;
  return 2 * focalLength * Math.tan(halfAngle);
}

/** Solid angle of a cone of half-angle α, 4π sin²(α/2), sr. NaN outside 0 ≤ α ≤ π. */
export function coneSolidAngle(halfAngle: number): number {
  if (!(halfAngle >= 0 && halfAngle <= Math.PI)) return NaN;
  return 4 * Math.PI * Math.sin(halfAngle / 2) ** 2;
}

/** Projected solid angle π sin²α of a cone seen from a flat Lambertian area, sr. NaN outside 0 ≤ α ≤ π/2. */
export function projectedSolidAngle(halfAngle: number): number {
  if (!(halfAngle >= 0 && halfAngle <= Math.PI / 2)) return NaN;
  return Math.PI * Math.sin(halfAngle) ** 2;
}

/**
 * Half-angle of the cone from the focus of a spherical mirror to its rim, atan((D/2)/(f − s)), f = R_c/2, rad.
 * NaN unless 0 < D and the rim lies beyond the focus (D < √3 R_c).
 */
export function mirrorRimHalfAngle(radiusOfCurvature: number, diameter: number): number {
  const a = diameter / 2;
  if (!(radiusOfCurvature > 0 && a > 0 && a < radiusOfCurvature)) return NaN;
  const sag = radiusOfCurvature - Math.sqrt(radiusOfCurvature ** 2 - a * a);
  const axial = radiusOfCurvature / 2 - sag;
  return axial > 0 ? Math.atan(a / axial) : NaN;
}

/** Slit-limited resolving power f(sin α + sin β)/(w cos α) of a grating spectrometer. NaN unless w, f > 0, |α| < π/2. */
export function slitResolvingPower(focalLength: number, slitWidth: number, alpha: number, beta: number): number {
  if (!(focalLength > 0 && slitWidth > 0 && Math.abs(alpha) < Math.PI / 2)) return NaN;
  const g = (Math.sin(alpha) + Math.sin(beta)) / Math.cos(alpha);
  return g > 0 ? (focalLength * g) / slitWidth : NaN;
}

/**
 * Jacquinot advantage: FTS over slit-spectrometer étendue for the same beam area and resolving power,
 * 2π f cos α/(h (sin α + sin β)). NaN unless f, h > 0, |α| < π/2 and sin α + sin β > 0.
 */
export function jacquinotRatio(focalLength: number, slitHeight: number, alpha: number, beta: number): number {
  if (!(focalLength > 0 && slitHeight > 0 && Math.abs(alpha) < Math.PI / 2)) return NaN;
  const g = (Math.sin(alpha) + Math.sin(beta)) / Math.cos(alpha);
  return g > 0 ? (2 * Math.PI * focalLength) / (slitHeight * g) : NaN;
}
