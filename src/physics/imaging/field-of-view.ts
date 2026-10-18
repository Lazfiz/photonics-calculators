/**
 * Object-side field of view of a microscope. SI units in and out (lengths in m). Model tier: exact (first-order
 * imaging; distortion ignored).
 *
 * - Visual field: the eyepiece field stop (field number FN, its diameter in the intermediate image) maps to the
 *   specimen through the objective, so the field diameter is FN/M_obj (any tube-lens factor multiplies M_obj).
 *   Nikon MicroscopyU, "Field of View".
 */

/** Object-side field diameter FN/M_obj for a field number FN (m) and objective magnification M_obj, m. */
export function objectFieldDiameter(fieldNumber: number, objectiveMag: number): number {
  return fieldNumber > 0 && objectiveMag > 0 && Number.isFinite(fieldNumber / objectiveMag)
    ? fieldNumber / objectiveMag
    : NaN;
}
