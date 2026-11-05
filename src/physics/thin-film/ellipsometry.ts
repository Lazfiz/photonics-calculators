/**
 * Pseudo-dielectric function and pseudo-refractive index from one ellipsometric measurement (Ψ, Δ),
 * by inverting the two-phase (ambient/substrate) model:
 *   ⟨ε⟩ = n₀² sin²θ [1 + tan²θ ((1 − ρ)/(1 + ρ))²],   ρ = r_p/r_s = tan Ψ e^(iΔ).
 *
 * Model tier: Exact for a bare, isotropic, semi-infinite substrate under a lossless ambient. For any
 * other sample (films, roughness, anisotropy) the result is a "pseudo" quantity, not a material constant.
 *
 * With a film model (ambient|film|substrate, one homogeneous transparent film of known index on a known
 * substrate, flat abrupt interfaces), the film thickness follows exactly from Azzam & Bashara's inversion,
 * up to whole thickness periods.
 *
 * Convention (Nebraska, used by commercial ellipsometers): r_p = −r_s at normal incidence, so Δ = 180°
 * there, and N = n − ik, ε = ε₁ − iε₂. An absorbing substrate then gives 0° < Δ < 180° and ε₂, k > 0.
 *
 * References: R. M. A. Azzam & N. M. Bashara, Ellipsometry and Polarized Light (North-Holland, 1977),
 * ch. 4 (ambient-substrate and ambient-film-substrate systems); D. E. Aspnes, in Handbook of Optical Constants of Solids, ed.
 * E. D. Palik (Academic Press, 1985), ch. 5 (pseudo-dielectric function).
 */

import { add, div, mul, sqrt as csqrt, sub, type Complex } from "../complex";

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

/** Substrate optical constants, N = n − ik (k ≥ 0 for absorption, as above). */
export interface OpticalConstants {
  n: number;
  k: number;
}

/** Nebraska-convention Fresnel coefficients of the interface i|j, given N and N cos φ of each side. */
function fresnel(Ni: Complex, qi: Complex, Nj: Complex, qj: Complex): { p: Complex; s: Complex } {
  // r_p = (N_j cos φ_i − N_i cos φ_j)/(N_j cos φ_i + N_i cos φ_j), r_s = (N_i cos φ_i − N_j cos φ_j)/(N_i cos φ_i + N_j cos φ_j)
  // (Azzam & Bashara ch. 4), with N cos φ = q and cos φ = q/N.
  const ci = div(qi, Ni);
  const cj = div(qj, Nj);
  const a = mul(Nj, ci);
  const b = mul(Ni, cj);
  return { p: div(sub(a, b), add(a, b)), s: div(sub(qi, qj), add(qi, qj)) };
}

interface ThreePhase {
  r01: { p: Complex; s: Complex };
  r12: { p: Complex; s: Complex };
  /** N₁ cos φ₁ of the film (real for a transparent film above the critical angle). */
  q1: number;
}

/** Interfaces ambient|film|substrate. N cos φ = √(N² − n₀² sin² φ₀), principal root (Im ≤ 0 for N = n − ik). */
function threePhase(angle: number, filmIndex: number, substrate: OpticalConstants, ambient: number): ThreePhase {
  const beta2 = (ambient * Math.sin(angle)) ** 2;
  const N0 = { re: ambient, im: 0 };
  const q0 = { re: ambient * Math.cos(angle), im: 0 };
  const N1 = { re: filmIndex, im: 0 };
  const q1 = Math.sqrt(filmIndex * filmIndex - beta2);
  const N2 = { re: substrate.n, im: -substrate.k };
  const root = csqrt({ re: substrate.n * substrate.n - substrate.k * substrate.k - beta2, im: -2 * substrate.n * substrate.k });
  // With k = 0 below the critical angle the argument's Im is −0 and the root can come out +i|q|: take the decaying −i|q|.
  const q2 = root.im > 0 ? { re: root.re, im: -root.im } : root;
  return { r01: fresnel(N0, q0, N1, { re: q1, im: 0 }), r12: fresnel(N1, { re: q1, im: 0 }, N2, q2), q1 };
}

function validFilmInputs(angle: number, wavelength: number, filmIndex: number, substrate: OpticalConstants, ambient: number) {
  return (
    angle > 0 && angle < Math.PI / 2 && wavelength > 0 && Number.isFinite(wavelength) && ambient > 0 &&
    filmIndex > ambient * Math.sin(angle) && Number.isFinite(filmIndex) &&
    substrate.n >= 0 && substrate.k >= 0 && substrate.n + substrate.k > 0 && Number.isFinite(substrate.n + substrate.k)
  );
}

/**
 * Thickness period of a transparent film, D_φ = λ / (2 √(n₁² − n₀² sin² φ₀)) (m): Ψ and Δ repeat with it
 * (Azzam & Bashara ch. 4). NaN when the film is evanescent (n₁ ≤ n₀ sin φ₀) or the input is invalid.
 */
export function filmThicknessPeriod(angle: number, wavelength: number, filmIndex: number, ambient = 1): number {
  if (!validFilmInputs(angle, wavelength, filmIndex, { n: 1, k: 0 }, ambient)) return NaN;
  return wavelength / (2 * Math.sqrt(filmIndex * filmIndex - (ambient * Math.sin(angle)) ** 2));
}

/**
 * Ψ and Δ (rad, Δ in [0, 2π)) of an ambient|film|substrate system (Azzam & Bashara ch. 4, Nebraska convention):
 *   R_ν = (r₀₁ν + r₁₂ν X) / (1 + r₀₁ν r₁₂ν X),   X = e^(−i2β),   β = 2π d N₁ cos φ₁ / λ,   tan Ψ e^(iΔ) = R_p/R_s.
 * @param thickness film thickness, m (≥ 0)
 * @param filmIndex real index of the transparent film, > n₀ sin φ₀
 */
export function filmPsiDelta(
  thickness: number, angle: number, wavelength: number, filmIndex: number, substrate: OpticalConstants, ambient = 1,
): { psi: number; delta: number } {
  if (!(thickness >= 0) || !validFilmInputs(angle, wavelength, filmIndex, substrate, ambient)) return { psi: NaN, delta: NaN };
  const { r01, r12, q1 } = threePhase(angle, filmIndex, substrate, ambient);
  const twoBeta = (4 * Math.PI * thickness * q1) / wavelength;
  const X = { re: Math.cos(twoBeta), im: -Math.sin(twoBeta) };
  const R = (v: "p" | "s") => div(add(r01[v], mul(r12[v], X)), add({ re: 1, im: 0 }, mul(mul(r01[v], r12[v]), X)));
  const rho = div(R("p"), R("s"));
  const delta = Math.atan2(rho.im, rho.re);
  return { psi: Math.atan(Math.hypot(rho.re, rho.im)), delta: delta < 0 ? delta + 2 * Math.PI : delta };
}

export interface FilmInversion {
  /** Film thickness in [−period/100, 0.99·period), m; add whole periods for thicker films. Below 0: bare within error. */
  thickness: number;
  /** Thickness period D_φ, m. */
  period: number;
  /** |X| of the chosen root: 1 when the data fit a transparent film of this index on this substrate. */
  absX: number;
}

/**
 * Thickness of a transparent film of known index on a known substrate from one (Ψ, Δ) measurement, by Azzam &
 * Bashara's inversion (ch. 4): ρ = R_p/R_s is a ratio of quadratics in X = e^(−i2β), so
 *   (ρ r₀₁p r₁₂p r₁₂s − r₁₂p r₀₁s r₁₂s) X² + (ρ(r₁₂s + r₀₁p r₁₂p r₀₁s) − r₁₂p − r₀₁p r₀₁s r₁₂s) X + ρ r₀₁s − r₀₁p = 0.
 * Of the two roots the one with |X| nearest 1 is kept; d = (−arg X mod 2π)/(2π)·D_φ. |X| ≠ 1 means the assumed
 * film index or substrate doesn't match the data (A&B find n₁ by asking for |X| = 1).
 * @returns NaN fields for invalid input, or thickness NaN when no root is usable (e.g. a film index equal to the
 *   ambient's or the substrate's, which leaves X undetermined).
 */
export function transparentFilmThickness(
  psi: number, delta: number, angle: number, wavelength: number, filmIndex: number, substrate: OpticalConstants, ambient = 1,
): FilmInversion {
  const invalid = { thickness: NaN, period: NaN, absX: NaN };
  if (!(psi >= 0 && psi < Math.PI / 2 && Number.isFinite(delta)) || !validFilmInputs(angle, wavelength, filmIndex, substrate, ambient)) {
    return invalid;
  }
  const period = filmThicknessPeriod(angle, wavelength, filmIndex, ambient);
  const { r01, r12 } = threePhase(angle, filmIndex, substrate, ambient);
  const t = Math.tan(psi);
  const rho = { re: t * Math.cos(delta), im: t * Math.sin(delta) };
  const a = sub(mul(rho, mul(r01.p, mul(r12.p, r12.s))), mul(r12.p, mul(r01.s, r12.s)));
  const b = sub(mul(rho, add(r12.s, mul(r01.p, mul(r12.p, r01.s)))), add(r12.p, mul(r01.p, mul(r01.s, r12.s))));
  const c = sub(mul(rho, r01.s), r01.p);
  const scaleAbc = Math.max(Math.hypot(a.re, a.im), Math.hypot(b.re, b.im), Math.hypot(c.re, c.im));
  if (!(scaleAbc > 0)) return { ...invalid, period };
  // Roots without cancellation: q = −(b + sgn·√(b² − 4ac))/2, X = q/a and c/q; a linear equation when a ≈ 0.
  const roots: Complex[] = [];
  if (Math.hypot(a.re, a.im) < 1e-14 * scaleAbc) {
    if (Math.hypot(b.re, b.im) > 1e-14 * scaleAbc) roots.push(div({ re: -c.re, im: -c.im }, b));
  } else {
    const s = csqrt(sub(mul(b, b), mul({ re: 4, im: 0 }, mul(a, c))));
    const sign = b.re * s.re + b.im * s.im >= 0 ? 1 : -1;
    const qq = { re: -0.5 * (b.re + sign * s.re), im: -0.5 * (b.im + sign * s.im) };
    roots.push(div(qq, a));
    if (Math.hypot(qq.re, qq.im) > 0) roots.push(div(c, qq));
  }
  let best: Complex | null = null;
  for (const X of roots) {
    const m = Math.hypot(X.re, X.im);
    if (Number.isFinite(m) && m > 1e-9 && (best === null || Math.abs(m - 1) < Math.abs(Math.hypot(best.re, best.im) - 1))) best = X;
  }
  if (best === null) return { ...invalid, period };
  const absX = Math.hypot(best.re, best.im);
  let phase = -Math.atan2(best.im, best.re);
  if (phase < 0) phase += 2 * Math.PI;
  // The last 1 % of the period reads as a slightly negative thickness: a bare substrate within measurement error.
  let thickness = (phase / (2 * Math.PI)) * period;
  if (thickness >= 0.99 * period) thickness -= period;
  return { thickness, period, absX };
}
