/**
 * How deep light gets into an absorbing medium. SI units (m, 1/m), angles in rad.
 * Model tier: exact (plane waves, one planar interface, local linear optics).
 *
 * Absorption depth. A medium with complex index N = n + ik attenuates the intensity as exp(−αz) with
 *   α = 4πk/λ₀,   δ = 1/α,
 * so δ is the depth where the intensity inside falls to 1/e; the field falls to 1/e at 2δ, which for a metal at
 * normal incidence is the skin depth λ₀/(2πk). The fraction of the light that enters and is absorbed within a
 * thickness d is 1 − exp(−αd) (reflection at the surface not included); a fraction f is absorbed by −ln(1 − f)/α.
 *
 * Oblique incidence. Light from a lossless medium of index n₀ at incidence θ keeps its tangential wavevector
 * k₀n₀ sin θ, so the normal component in the medium is k_z = k₀ √(N² − n₀² sin²θ), the root with Im ≥ 0 (M. Born,
 * E. Wolf, Principles of Optics, 7th ed., Cambridge 1999, ch. 14). The intensity decays with depth z as
 * exp(−2 Im(k_z) z), so the 1/e intensity depth measured along the surface normal is
 *   d_p = λ₀ / (4π Im √(N² − n₀² sin²θ)).
 * At normal incidence this is 1/α. For k = 0 and n₀ sin θ > n (total internal reflection) it is the evanescent
 * depth λ₀/(4π √(n₀² sin²θ − n²)) of D. Axelrod, Traffic 2, 764 (2001), doi:10.1034/j.1600-0854.2001.21104.x.
 * For k = 0 below the critical angle the wave propagates without loss and d_p is infinite.
 */
import { complex, sqrt } from "../complex";

const positive = (x: number) => Number.isFinite(x) && x > 0;

/** Absorption coefficient α = 4πk/λ₀, 1/m; NaN unless λ₀ > 0 and k ≥ 0. */
export function absorptionCoefficient(k: number, lambda: number): number {
  return positive(lambda) && Number.isFinite(k) && k >= 0 ? (4 * Math.PI * k) / lambda : NaN;
}

/** Absorption depth δ = 1/α, m; Infinity for α = 0, NaN for α < 0. */
export function absorptionDepth(alpha: number): number {
  if (!(alpha >= 0)) return NaN;
  return alpha === 0 ? Infinity : 1 / alpha;
}

/** Fraction 1 − exp(−αd) of the transmitted light absorbed within thickness d. */
export function absorbedFraction(alpha: number, d: number): number {
  return alpha >= 0 && d >= 0 ? -Math.expm1(-alpha * d) : NaN;
}

/** Depth −ln(1 − f)/α at which a fraction f (0 ≤ f < 1) has been absorbed, m. */
export function depthForAbsorbedFraction(alpha: number, f: number): number {
  if (!(alpha > 0 && f >= 0 && f < 1)) return NaN;
  return -Math.log1p(-f) / alpha;
}

/**
 * 1/e intensity penetration depth normal to the surface, d_p = λ₀/(4π Im √(N² − n₀² sin²θ)), m, for light from a
 * lossless medium n₀ at incidence θ into N = n + ik. Infinity when the wave propagates without loss.
 */
export function penetrationDepth(lambda: number, n0: number, n: number, k: number, theta: number): number {
  if (!(positive(lambda) && positive(n0) && positive(n) && k >= 0 && theta >= 0 && theta < Math.PI / 2)) return NaN;
  const s = n0 * Math.sin(theta);
  const q = sqrt(complex(n * n - k * k - s * s, 2 * n * k));
  return q.im > 0 ? lambda / (4 * Math.PI * q.im) : Infinity;
}
