/**
 * NA-and-f-number page summary: image-side NA of a lens at infinite conjugate from its f-number, the cone half-angle
 * and the Airy disk diameter. SI in and out (m, rad). Built on diffraction-psf.ts, which has many importers, so this
 * module is separate. NA = 1/(2N) (sine condition, M. Born, E. Wolf, Principles of Optics, ch. 4), Airy first zero
 * radius j₁,₁/(2π)·λ/NA (Born & Wolf §8.5.2), diameter twice that, 1.2197 λ/NA = 2.44 λN.
 */

import { airyFirstZeroRadius, naFromFNumber, thinLensNa } from "./diffraction-psf";

export interface NaFNumberSummary {
  na: number;
  /** Half-angle of the cone asin(NA), rad. */
  halfAngle: number;
  /** Thin-lens tangent form NA, 1/√(1 + 4N²). */
  thinLensNa: number;
  /** Airy disk diameter, m. */
  airyDiameter: number;
}

/** NA, half-angle, thin-lens NA and Airy diameter for f-number N and wavelength lambda (m). */
export function naFNumberSummary(N: number, lambda: number): NaFNumberSummary {
  const na = naFromFNumber(N);
  return {
    na,
    halfAngle: Math.asin(na),
    thinLensNa: thinLensNa(N),
    airyDiameter: 2 * airyFirstZeroRadius(lambda, na),
  };
}
