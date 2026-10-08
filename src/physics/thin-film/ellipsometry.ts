/**
 * Pseudo-dielectric function and pseudo-refractive index from one ellipsometric measurement (Ψ, Δ),
 * by inverting the two-phase (ambient/substrate) model:
 *   ⟨ε⟩ = n₀² sin²θ [1 + tan²θ ((1 − ρ)/(1 + ρ))²],   ρ = r_p/r_s = tan Ψ e^(iΔ).
 *
 * Model tier: Exact for a bare, isotropic, semi-infinite substrate under a lossless ambient. For any
 * other sample (films, roughness, anisotropy) the result is a "pseudo" quantity, not a material constant.
 *
 * Convention (Nebraska, used by commercial ellipsometers): r_p = −r_s at normal incidence, so Δ = 180°
 * there, and N = n − ik, ε = ε₁ − iε₂. An absorbing substrate then gives 0° < Δ < 180° and ε₂, k > 0.
 *
 * References: R. M. A. Azzam & N. M. Bashara, Ellipsometry and Polarized Light (North-Holland, 1977),
 * ch. 4 (ambient-substrate system); D. E. Aspnes, in Handbook of Optical Constants of Solids, ed.
 * E. D. Palik (Academic Press, 1985), ch. 5 (pseudo-dielectric function).
 */

import { div, mul, sqrt as csqrt, type Complex } from "../complex";

export interface PseudoOpticalConstants {
  /** ⟨ε₁⟩. */
  eps1: number;
  /** ⟨ε₂⟩, > 0 for absorption. */
  eps2: number;
  /** ⟨n⟩ ≥ 0. */
  n: number;
  /** ⟨k⟩, > 0 for absorption (N = n − ik). */
  k: number;
}

const INVALID: PseudoOpticalConstants = { eps1: NaN, eps2: NaN, n: NaN, k: NaN };

/**
 * @param psi Ψ, rad, in [0, π/2)
 * @param delta Δ, rad
 * @param angle angle of incidence, rad, in (0, π/2)
 * @param ambient refractive index of the ambient (> 0), default 1
 * @returns NaN in every field for invalid input or |1 + ρ| < 1e-9 (Ψ = 45°, Δ = 180°: only normal
 *   incidence gives ρ = −1, and ⟨ε⟩ diverges there)
 */
export function pseudoOpticalConstants(psi: number, delta: number, angle: number, ambient = 1): PseudoOpticalConstants {
  if (!(psi >= 0 && psi < Math.PI / 2 && Number.isFinite(delta) && angle > 0 && angle < Math.PI / 2 && ambient > 0)) {
    return INVALID;
  }
  const t = Math.tan(psi);
  const rho: Complex = { re: t * Math.cos(delta), im: t * Math.sin(delta) };
  const onePlus = { re: 1 + rho.re, im: rho.im };
  if (Math.hypot(onePlus.re, onePlus.im) < 1e-9) return INVALID;
  const q = div({ re: 1 - rho.re, im: -rho.im }, onePlus);
  const q2 = mul(q, q);
  const sin2 = Math.sin(angle) ** 2;
  const tan2 = Math.tan(angle) ** 2;
  const scale = ambient * ambient * sin2;
  // ε = ε₁ − iε₂ in this convention. An |ε₂| below 1e-12·|ε| is rounding (tan 45° ≠ 1 in floating
  // point): set it to +0 so a lossless metal gets k > 0 rather than a sign picked by noise.
  const eps1 = scale * (1 + tan2 * q2.re);
  const rawEps2 = -scale * tan2 * q2.im;
  const eps2 = Math.abs(rawEps2) < 1e-12 * Math.hypot(eps1, rawEps2) ? 0 : rawEps2;
  // n² − k² = ε₁ and 2nk = ε₂: the principal root of ε₁ + iε₂ (k ≥ 0 when ε₂ = 0 and ε₁ < 0).
  const N = csqrt({ re: eps1, im: eps2 });
  return { eps1, eps2, n: N.re, k: N.im };
}
