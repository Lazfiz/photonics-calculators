/**
 * Visual and camera magnification, pupils and illumination-limited resolution of an infinity-corrected microscope.
 * SI units in and out (lengths in m). Model tier: textbook (paraxial first-order layout, aberration-free objective).
 *
 * - Objective magnification M_obj = f_TL/f_obj (infinity-corrected: the tube lens forms the intermediate image).
 *   A marked magnification assumes its maker's tube lens (Nikon, Leica 200 mm; Olympus 180 mm; Zeiss 165 mm).
 *   Eyepiece power M_eye = 250 mm/f_eye, 250 mm being the reference viewing distance. Visual magnification
 *   M_obj·M_eye; on a camera the C-mount adapter (a relay) multiplies M_obj by its own magnification (0.5×, 1×).
 *   J. E. Greivenkamp, Field Guide to Geometrical Optics (SPIE 2004, doi:10.1117/3.547461), "Microscopes".
 * - Objective back aperture (exit pupil) diameter 2·f_obj·NA (Abbe sine condition). The tube lens and eyepiece
 *   image it to the eyepoint with lateral magnification f_eye/f_TL, so the microscope's exit pupil is
 *   D = 2·f_obj·NA·f_eye/f_TL = 2·(250 mm)·NA/(M_obj·M_eye) = 500 mm·NA/M_total.
 * - Range of useful visual magnification 500·NA to 1000·NA (Nikon MicroscopyU, "Useful Magnification Range"),
 *   i.e. an exit pupil between 1 mm and 0.5 mm. Below it the eye cannot resolve all the detail the objective
 *   passes; above it the magnification is empty.
 * - Köhler brightfield resolution with a condenser of aperture NA_c ≤ NA_obj: Abbe's grating limit (the zero and one
 *   first order pass for oblique illumination at NA_c) gives the period d = λ/(NA_obj + NA_c); the two-point rule of
 *   thumb 1.22·λ/(NA_obj + NA_c) (MicroscopyU, "Resolution") is Rayleigh's criterion only at NA_c = NA_obj; with
 *   coherent light two-point resolution depends on the phase. Evident's Köhler guide sets NA_c ≈ 0.7–0.8·NA_obj
 *   for contrast.
 */

const finite = Number.isFinite;

/** Reference viewing distance for eyepiece power and visual magnification, 250 mm. */
export const VISUAL_REFERENCE_DISTANCE = 0.25;

/** Objective magnification f_TL/f_obj; NaN unless both focal lengths are positive. */
export function objectiveMag(fObjective: number, fTubeLens: number): number {
  return fObjective > 0 && fTubeLens > 0 && finite(fObjective * fTubeLens) ? fTubeLens / fObjective : NaN;
}

/** Total magnification M_obj·M_relay, the relay being an eyepiece (visual) or a camera adapter; NaN unless both > 0. */
export function totalMag(objective: number, relay: number): number {
  return objective > 0 && relay > 0 && finite(objective * relay) ? objective * relay : NaN;
}

/** Pupil diameter 2·f·NA at a focal plane (Abbe sine condition): objective back aperture, condenser iris, m. */
export function apertureDiameter(f: number, NA: number): number {
  return f > 0 && NA >= 0 && finite(f * NA) ? 2 * f * NA : NaN;
}

/** Microscope exit pupil diameter 2·(250 mm)·NA/M_total = 500 mm·NA/M for visual magnification M, m. */
export function exitPupilDiameter(NA: number, visualMag: number): number {
  return NA > 0 && visualMag > 0 && finite(NA / visualMag) ? (2 * VISUAL_REFERENCE_DISTANCE * NA) / visualMag : NaN;
}

/** Range of useful visual magnification, 500·NA to 1000·NA. */
export function usefulMagRange(NA: number): { min: number; max: number } {
  return NA > 0 && finite(NA) ? { min: 500 * NA, max: 1000 * NA } : { min: NaN, max: NaN };
}

/** Condenser aperture used for brightfield resolution: min(NA_c, NA_obj); a larger cone adds darkfield light only. */
function effectiveCondenserNa(NAobjective: number, NAcondenser: number): number {
  return Math.min(NAcondenser, NAobjective);
}

const validNa = (NAo: number, NAc: number) => NAo > 0 && NAc >= 0 && finite(NAo + NAc);

/** Abbe grating limit with a condenser, period λ/(NA_obj + min(NA_c, NA_obj)), m. */
export function abbePeriodLimit(lambda: number, NAobjective: number, NAcondenser: number): number {
  if (!(lambda > 0) || !validNa(NAobjective, NAcondenser)) return NaN;
  return lambda / (NAobjective + effectiveCondenserNa(NAobjective, NAcondenser));
}

/** Two-point rule of thumb with a condenser, 1.22·λ/(NA_obj + min(NA_c, NA_obj)), m. */
export function rayleighCondenserResolution(lambda: number, NAobjective: number, NAcondenser: number): number {
  const d = abbePeriodLimit(lambda, NAobjective, NAcondenser);
  return 1.22 * d;
}
