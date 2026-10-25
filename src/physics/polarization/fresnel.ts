/**
 * Fresnel reflection and transmission at a plane interface between two isotropic, non-magnetic media. The incident
 * medium is lossless (index n₁); the second medium may absorb (N₂ = n₂ − iκ₂). Angles in radians. Model tier: exact
 * for plane waves at a flat interface (Born & Wolf, Principles of Optics, 7th ed., §1.5.2–1.5.4; Goldstein,
 * Polarized Light, 3rd ed., ch. Fresnel Equations).
 *
 * CONVENTION (the site's, Goldstein): time factor e^{i(ωt − kz)}, so absorption is N = n − iκ with κ ≥ 0 and a wave
 * that decays into medium 2 has Im(N₂ cos θ₂) < 0. With q = N cos θ = √(N² − n₁² sin²θ₁) (the root with Im q ≤ 0):
 *   r_s = (q₁ − q₂)/(q₁ + q₂),                 t_s = 2q₁/(q₁ + q₂),
 *   r_p = (N₂²q₁ − n₁²q₂)/(N₂²q₁ + n₁²q₂),     t_p = 2n₁N₂q₁/(N₂²q₁ + n₁²q₂),
 * i.e. r_p = (N₂ cos θ₁ − n₁ cos θ₂)/(N₂ cos θ₁ + n₁ cos θ₂) = tan(θ₁ − θ₂)/tan(θ₁ + θ₂) for real indices (Born &
 * Wolf §1.5.2 eq. 21; Hecht, Optics, eqs. 4.42–4.43). So r_p = −r_s at normal incidence: the ellipsometry (Nebraska)
 * convention of `thin-film/ellipsometry.ts`. `thin-film/transfer-matrix.ts` uses e^{−iωt} and r_p = r_s at normal
 * incidence instead; R and T agree, phases differ.
 * T_s = Re(q₂)/q₁ |t_s|², T_p = Re(conj(N₂) cos θ₂)/q₁ |t_p|² (z-flux just inside medium 2), so R + T = 1.
 *
 * Total internal reflection (n₁ sin θ₁ > n₂, κ₂ = 0): q₂ = −i√(n₁² sin²θ₁ − n₂²), |r_s| = |r_p| = 1, and both
 * reflections advance the phase; arg r_p − arg r_s = δ with tan(δ/2) = cos θ √(sin²θ − n²)/sin²θ, n = n₂/n₁ (Born &
 * Wolf §1.5.4; the same δ as `retarders.ts` `tirPhaseDifference`).
 */

import { abs2, complex, div, mul, sqrt as csqrt, sub, add, scale, type Complex } from "../complex";

export interface FresnelResult {
  rs: Complex;
  rp: Complex;
  ts: Complex;
  tp: Complex;
  Rs: number;
  Rp: number;
  Ts: number;
  Tp: number;
  /** Refraction angle, rad (real indices only); NaN in total internal reflection or an absorbing medium. */
  thetaT: number;
  /** True when no wave propagates into a lossless medium 2. */
  tir: boolean;
}

const NAN_C = complex(NaN, NaN);
const INVALID: FresnelResult = {
  rs: NAN_C, rp: NAN_C, ts: NAN_C, tp: NAN_C, Rs: NaN, Rp: NaN, Ts: NaN, Tp: NaN, thetaT: NaN, tir: false,
};

/**
 * Fresnel coefficients for incidence at θ (0 ≤ θ < π/2) from a lossless medium n₁ onto N₂ = n₂ − iκ₂.
 * NaN in every field for invalid input (n₁ ≤ 0, n₂ ≤ 0, κ₂ < 0, θ outside [0, π/2), non-finite values).
 */
export function fresnel(n1: number, n2: number, theta: number, k2 = 0): FresnelResult {
  const valid = Number.isFinite(n1) && n1 > 0 && Number.isFinite(n2) && n2 > 0 && Number.isFinite(k2) && k2 >= 0 &&
    theta >= 0 && theta < Math.PI / 2;
  if (!valid) return INVALID;

  const beta = n1 * Math.sin(theta);
  const q1 = complex(n1 * Math.cos(theta));
  const N2 = complex(n2, -k2);
  const N2sq = mul(N2, N2);
  const root = csqrt(complex(N2sq.re - beta * beta, N2sq.im));
  // Principal root has Re ≥ 0; the decaying branch needs Im ≤ 0 (Im N₂² ≤ 0, so only the TIR case −x + 0i flips).
  const q2 = complex(root.re, -Math.abs(root.im));
  const n1sq = n1 * n1;

  const rs = div(sub(q1, q2), add(q1, q2));
  const ts = div(scale(q1, 2), add(q1, q2));
  const pNum = sub(mul(N2sq, q1), scale(q2, n1sq));
  const pDen = add(mul(N2sq, q1), scale(q2, n1sq));
  const rp = div(pNum, pDen);
  const tp = div(scale(mul(N2, q1), 2 * n1), pDen);

  const cos2 = div(q2, N2);
  const Ts = (q2.re / q1.re) * abs2(ts);
  const Tp = (mul(complex(N2.re, -N2.im), cos2).re / q1.re) * abs2(tp);
  const tir = k2 === 0 && beta > n2;
  const thetaT = k2 === 0 && !tir ? Math.asin(beta / n2) : NaN;
  return { rs, rp, ts, tp, Rs: abs2(rs), Rp: abs2(rp), Ts, Tp, thetaT, tir };
}

/**
 * Normal-incidence power reflectance |(n₁ − N₂)/(n₁ + N₂)|² = ((n₁ − n₂)² + κ₂²)/((n₁ + n₂)² + κ₂²) from a lossless n₁
 * onto N₂ = n₂ − iκ₂ (Born & Wolf §1.5.3; Hecht eq. 4.67), the θ = 0 limit of `fresnel`. NaN unless n₁, n₂ > 0, κ₂ ≥ 0.
 */
export function normalIncidenceReflectance(n1: number, n2: number, k2 = 0): number {
  if (!(n1 > 0 && n2 > 0 && k2 >= 0 && Number.isFinite(n1 + n2 + k2))) return NaN;
  return ((n1 - n2) ** 2 + k2 * k2) / ((n1 + n2) ** 2 + k2 * k2);
}

/** Brewster angle atan(n₂/n₁) for lossless media, rad. */
export function brewsterAngle(n1: number, n2: number): number {
  return n1 > 0 && n2 > 0 ? Math.atan(n2 / n1) : NaN;
}

/** Critical angle asin(n₂/n₁), rad; NaN when n₂ ≥ n₁ (no total internal reflection). */
export function criticalAngle(n1: number, n2: number): number {
  return n1 > 0 && n2 > 0 && n2 < n1 ? Math.asin(n2 / n1) : NaN;
}

/**
 * Refraction angle from Snell's law n₁ sin θ₁ = n₂ sin θ₂ for lossless media (Born & Wolf §1.5.1), rad. NaN beyond
 * the critical angle (total internal reflection) and for n ≤ 0 or θ₁ outside [0, π/2].
 */
export function refractionAngle(n1: number, n2: number, theta1: number): number {
  if (!(n1 > 0 && n2 > 0 && theta1 >= 0 && theta1 <= Math.PI / 2)) return NaN;
  const s = (n1 / n2) * Math.sin(theta1);
  return s <= 1 ? Math.asin(s) : NaN;
}

/** arg z in (−π, π], with a rounding-level imaginary part read as zero (so a negative real number gives +π). */
export function phaseOf(z: Complex): number {
  const im = Math.abs(z.im) <= 1e-14 * Math.abs(z.re) ? 0 : z.im;
  return Math.atan2(im, z.re);
}

/** Phase of r_p relative to r_s, arg(r_p/r_s) in (−π, π]. NaN when either coefficient is 0. */
export function phaseDifference(rp: Complex, rs: Complex): number {
  if (abs2(rp) === 0 || abs2(rs) === 0) return NaN;
  return phaseOf(div(rp, rs));
}
