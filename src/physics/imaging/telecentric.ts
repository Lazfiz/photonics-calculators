/**
 * Object-side telecentricity. SI units in and out (lengths in m, angles in rad). Model tier: exact (paraxial chief
 * ray; the blur centroid is followed, aberrations ignored).
 *
 * - The chief ray passes through the centre of the entrance pupil, a distance s_EP from the object (positive when
 *   the pupil lies on the lens side, an ordinary "entocentric" lens; negative for a hypercentric lens; infinite for an
 *   object-side telecentric lens). At field height h it makes the angle atan(h/s_EP) with the axis.
 * - With the sensor fixed, the image of a point lands where its chief ray does, at a height proportional to its angle
 *   h/(s_EP + Δz). Moving the object Δz away from the lens therefore changes the magnification by
 *   Δm/m = −Δz/(s_EP + Δz) ≈ −Δz/s_EP, and by nothing for s_EP → ∞. Greivenkamp, Field Guide to Geometrical Optics
 *   (2004), "Telecentricity".
 * - A real telecentric lens leaves a residual chief-ray slope θ_t at the field edge h, equivalent to s_EP = h/tan θ_t.
 */

/** Object-side chief-ray angle atan(h/s_EP) at field height h (m) for an entrance pupil s_EP (m) away, rad. */
export function chiefRayAngle(fieldHeight: number, pupilDistance: number): number {
  if (!Number.isFinite(fieldHeight) || Number.isNaN(pupilDistance) || pupilDistance === 0) return NaN;
  return Number.isFinite(pupilDistance) ? Math.atan(fieldHeight / pupilDistance) : 0;
}

/**
 * Relative magnification change Δm/m = −Δz/(s_EP + Δz) when the object moves Δz (m, positive away from the lens)
 * with the sensor fixed, for an entrance pupil s_EP (m) from the nominal object plane. 0 for a telecentric lens.
 */
export function magnificationChange(dz: number, pupilDistance: number): number {
  if (!Number.isFinite(dz) || Number.isNaN(pupilDistance) || pupilDistance === 0) return NaN;
  if (!Number.isFinite(pupilDistance) || dz === 0) return 0;
  // The object must stay on the same side of the entrance pupil.
  if (!((pupilDistance + dz) / pupilDistance > 0)) return NaN;
  return -dz / (pupilDistance + dz);
}

/** Entrance-pupil distance h/tan θ_t equivalent to a residual chief-ray slope θ_t (rad) at field height h (m), m. */
export function pupilDistanceFromSlope(fieldHeight: number, slope: number): number {
  if (!(fieldHeight > 0) || !Number.isFinite(fieldHeight) || !(Math.abs(slope) < Math.PI / 2)) return NaN;
  return slope === 0 ? Infinity : fieldHeight / Math.tan(slope);
}
