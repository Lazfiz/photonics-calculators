/**
 * Stokes vectors S = [S0, S1, S2, S3]: S1 = H − V, S2 = (+45°) − (−45°), S3 = RCP − LCP, with RCP as in the
 * CONVENTION of jones.ts (S3 = 2 Im(Ex* Ey) > 0). Model tier: exact. D. H. Goldstein, Polarized Light, 3rd ed.
 * (CRC Press, 2011), the Stokes parameters and the polarization ellipse; E. Collett, Field Guide to
 * Polarization (SPIE, 2005).
 *
 * A vector is physical when S0 ≥ 0 and |(S1, S2, S3)| ≤ S0. Its polarized part has intensity
 * I_p = |(S1, S2, S3)|, azimuth ψ = ½ atan2(S2, S1) and ellipticity angle χ = ½ asin(S3 / I_p); both angles
 * are undefined (NaN) for unpolarized light. Angles are in radians.
 */

export type Stokes = [number, number, number, number];

/** Relative tolerance on |S| ≤ S0, for rounding in the inputs and in matrix products. */
const TOL = 1e-9;

/** |(S1, S2, S3)|, the polarized intensity. */
export const polarizedIntensity = (S: Stokes) => Math.hypot(S[1], S[2], S[3]);

/** S0 > 0 (finite) and |(S1, S2, S3)| ≤ S0, within a relative 1e-9. */
export function isPhysicalStokes(S: Stokes): boolean {
  return S.every(Number.isFinite) && S[0] > 0 && polarizedIntensity(S) <= S[0] * (1 + TOL);
}

/** Degree of polarization I_p / S0, in [0, 1]; NaN unless the vector is physical. */
export function degreeOfPolarization(S: Stokes): number {
  return isPhysicalStokes(S) ? Math.min(1, polarizedIntensity(S) / S[0]) : NaN;
}

/** Degree of linear polarization √(S1² + S2²) / S0; NaN unless physical. */
export function degreeOfLinearPolarization(S: Stokes): number {
  return isPhysicalStokes(S) ? Math.min(1, Math.hypot(S[1], S[2]) / S[0]) : NaN;
}

/** Degree of circular polarization S3 / S0, signed (> 0 right-handed); NaN unless physical. */
export function degreeOfCircularPolarization(S: Stokes): number {
  return isPhysicalStokes(S) ? Math.max(-1, Math.min(1, S[3] / S[0])) : NaN;
}

/**
 * Ellipse of the polarized part: azimuth ψ ∈ (−π/2, π/2] and ellipticity angle χ ∈ [−π/4, π/4]. Both NaN when
 * the vector isn't physical or the light is unpolarized (I_p ≤ 1e-12 S0); ψ is NaN for circular light too.
 */
export function ellipseAngles(S: Stokes): { psi: number; chi: number } {
  const Ip = polarizedIntensity(S);
  if (!isPhysicalStokes(S) || Ip <= 1e-12 * S[0]) return { psi: NaN, chi: NaN };
  const chi = 0.5 * Math.asin(Math.max(-1, Math.min(1, S[3] / Ip)));
  const linear = Math.hypot(S[1], S[2]);
  const psi = linear <= 1e-12 * Ip ? NaN : 0.5 * Math.atan2(S[2], S[1]);
  return { psi, chi };
}

/** Axis ratio b/a = |tan χ| of the polarization ellipse, in [0, 1]; NaN for unpolarized light. */
export function axisRatio(S: Stokes): number {
  return Math.abs(Math.tan(ellipseAngles(S).chi));
}

export type Handedness = "right" | "left" | "linear" | "unpolarized";

/**
 * Sense of rotation of the polarized part, from the sign of S3. "linear" when |S3| ≤ tol·I_p, "unpolarized" when
 * I_p ≤ tol·S0 (or the vector isn't physical: then this returns "unpolarized" too, and callers show the error).
 */
export function handedness(S: Stokes, tol = 1e-6): Handedness {
  const Ip = polarizedIntensity(S);
  if (!isPhysicalStokes(S) || Ip <= tol * S[0]) return "unpolarized";
  if (Math.abs(S[3]) <= tol * Ip) return "linear";
  return S[3] > 0 ? "right" : "left";
}

/** Shape of the polarized part: linear (|χ| ≈ 0), circular (|χ| ≈ π/4) or elliptical, within tol on 2χ. */
export function ellipseShape(S: Stokes, tol = 1e-6): "linear" | "circular" | "elliptical" | "unpolarized" {
  const { chi } = ellipseAngles(S);
  if (Number.isNaN(chi)) return "unpolarized";
  const s = Math.abs(Math.sin(2 * chi));
  return s <= tol ? "linear" : s >= 1 - tol ? "circular" : "elliptical";
}

/**
 * Stokes vector of intensity I with degree of polarization P ∈ [0, 1] whose polarized part has azimuth ψ and
 * ellipticity angle χ: I·[1, P cos 2χ cos 2ψ, P cos 2χ sin 2ψ, P sin 2χ].
 */
export function stokesFromEllipse(I: number, psi: number, chi: number, P = 1): Stokes {
  const p = I * P;
  return [I, p * Math.cos(2 * chi) * Math.cos(2 * psi), p * Math.cos(2 * chi) * Math.sin(2 * psi), p * Math.sin(2 * chi)];
}

/** Intensity behind an ideal linear analyzer at θ: ½(S0 + S1 cos 2θ + S2 sin 2θ). */
export function analyzerIntensity(S: Stokes, theta: number): number {
  return 0.5 * (S[0] + S[1] * Math.cos(2 * theta) + S[2] * Math.sin(2 * theta));
}
