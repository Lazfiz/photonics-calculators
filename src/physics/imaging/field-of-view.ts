/**
 * Field of view and sampling of an imaging system. SI units in and out (lengths in m, angles in rad). Model tier:
 * exact (first-order imaging; distortion ignored).
 *
 * - Visual field: the eyepiece field stop (field number FN, its diameter in the intermediate image) maps to the
 *   specimen through the objective, so the field diameter is FN/M_obj (any tube-lens factor multiplies M_obj).
 *   Nikon MicroscopyU, "Field of View".
 * - Camera field: the sensor (or a binned pixel) maps to the object through the magnification M at the sensor, so
 *   the object-side size is the image-side size divided by M.
 * - Angular field: an element of size s centred on the axis of a lens focused at infinity subtends 2·atan(s/(2f));
 *   for a pixel this is the instantaneous field of view (IFOV), ≈ p/f. Holst, Electro-Optical Imaging System
 *   Performance (2017).
 * - Nyquist: a pitch p samples up to 1/(2p). An incoherent image carries frequencies up to 2NA/λ, so Nyquist needs an
 *   object-side pixel no larger than λ/(4NA). Pawley, Handbook of Biological Confocal Microscopy (2006), ch. 4.
 */

const positive = (...xs: number[]) => xs.every((x) => x > 0 && Number.isFinite(x));

/** Object-side field diameter FN/M_obj for a field number FN (m) and objective magnification M_obj, m. */
export function objectFieldDiameter(fieldNumber: number, objectiveMag: number): number {
  return fieldNumber > 0 && objectiveMag > 0 && Number.isFinite(fieldNumber / objectiveMag)
    ? fieldNumber / objectiveMag
    : NaN;
}

/** Object-side field of a sensor width × height (m) at magnification M: width, height and diagonal, m. */
export function objectFov(
  sensorWidth: number,
  sensorHeight: number,
  M: number,
): { width: number; height: number; diagonal: number } {
  if (!positive(sensorWidth, sensorHeight, M)) return { width: NaN, height: NaN, diagonal: NaN };
  const width = sensorWidth / M;
  const height = sensorHeight / M;
  return { width, height, diagonal: Math.hypot(width, height) };
}

/** Object-side size of a pixel of pitch p (m), binned b × b, at magnification M, m. */
export function pixelFootprint(pitch: number, M: number, binning = 1): number {
  return positive(pitch, M, binning) ? (pitch * binning) / M : NaN;
}

/** Full angle subtended by an on-axis element of size s (m) at focal length f (m), 2·atan(s/(2f)), rad. */
export function subtendedAngle(size: number, focalLength: number): number {
  return positive(size, focalLength) ? 2 * Math.atan(size / (2 * focalLength)) : NaN;
}

/** Instantaneous field of view of a pixel of pitch p (m), binned b × b, behind focal length f (m), rad. */
export function pixelIfov(pitch: number, focalLength: number, binning = 1): number {
  return positive(binning) ? subtendedAngle(pitch * binning, focalLength) : NaN;
}

/** Nyquist frequency 1/(2p) of a sampling pitch p: cycles per metre for a length, cycles per radian for an angle. */
export function nyquistFrequency(pitch: number): number {
  return positive(pitch) ? 1 / (2 * pitch) : NaN;
}

/** Largest object-side pixel that samples the incoherent cutoff 2NA/λ at Nyquist, λ/(4NA), m. */
export function nyquistPixel(lambda: number, NA: number): number {
  return positive(lambda, NA) ? lambda / (4 * NA) : NaN;
}
