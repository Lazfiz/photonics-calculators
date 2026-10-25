/**
 * Single-thin-lens mode matching between two TEM₀₀ Gaussian beams, paraxial, one wavelength λ (in the medium).
 * SI units. The input waist w₁ sits at z = 0, the target waist w₂ at z = d, the lens at s₁ from the input waist and
 * s₂ = d − s₁ from the target waist. Model tier: exact within the paraxial thin-lens model.
 *
 * Closed form (Kogelnik & Li 1966, section on mode matching): with f₀ = π w₁ w₂/λ = √(z_R1 z_R2), a lens of focal
 * length f ≥ f₀ matches at s₁ = f ± (w₁/w₂) √(f² − f₀²), s₂ = f ± (w₂/w₁) √(f² − f₀²). Fixing d = s₁ + s₂ gives
 *   (w₁/w₂ − w₂/w₁)² f² + 4 d f − d² − (w₁/w₂ + w₂/w₁)² f₀² = 0,
 * whose roots have a negative product, so exactly one f > 0 works. Then √(f² − f₀²) = |d − 2f|/(w₁/w₂ + w₂/w₁), so
 *   s₁ = f + (d − 2f) w₁²/(w₁² + w₂²),  s₂ = f + (d − 2f) w₂²/(w₁² + w₂²),
 * free of cancellation. The same f and s₁ satisfy Self's Gaussian lens equation and magnification
 * m = 1/√((1 − s₁/f)² + (z_R1/f)²) = w₂/w₁ (S. A. Self, Appl. Opt. 22, 658 (1983), doi 10.1364/AO.22.000658).
 * H. Kogelnik & T. Li, Appl. Opt. 5, 1550 (1966), doi 10.1364/AO.5.001550.
 *
 * Power coupling of two coaxial Gaussian beams with parameters q₁, q₂ at the same plane (overlap integral of the
 * normalised fields): η = 4 Im q₁ Im q₂ / |q₁ − q₂*|², 1 only for q₁ = q₂. At a common waist plane it reduces to
 * η = 4/(w₁/w₂ + w₂/w₁)² (Joyce & DeLoach, Appl. Opt. 23, 4187 (1984), doi 10.1364/AO.23.004187).
 */

import { div, type Complex } from "../complex";

export interface ModeMatchProblem {
  /** Wavelength in the medium, m, > 0. */
  lambda: number;
  /** Input waist radius (1/e² intensity), m, > 0. */
  w1: number;
  /** Target waist radius, m, > 0. */
  w2: number;
  /** Distance from the input waist to the target waist, m, > 0. */
  d: number;
}

export interface ModeMatchSolution {
  /** Focal length of the matching lens, m. */
  f: number;
  /** Lens distance from the input waist, m. */
  s1: number;
  /** Lens distance to the target waist, m (s₁ + s₂ = d). */
  s2: number;
  /** Characteristic length f₀ = π w₁ w₂/λ: no lens shorter than this can match, m. */
  f0: number;
  /** Both s₁ and s₂ ≥ 0, so the lens lies between the two waists. Otherwise one waist would have to be virtual. */
  lensBetweenWaists: boolean;
}

const validProblem = ({ lambda, w1, w2, d }: ModeMatchProblem) =>
  lambda > 0 && w1 > 0 && w2 > 0 && d > 0 && Number.isFinite(lambda * w1 * w2 * d);

const nanSolution: ModeMatchSolution = { f: NaN, s1: NaN, s2: NaN, f0: NaN, lensBetweenWaists: false };

/** The unique positive-focal-length single thin lens that maps waist w₁ onto waist w₂ a distance d away. */
export function singleLensModeMatch(p: ModeMatchProblem): ModeMatchSolution {
  if (!validProblem(p)) return nanSolution;
  const { lambda, w1, w2, d } = p;
  const f0 = (Math.PI * w1 * w2) / lambda;
  const r = w1 / w2;
  const A = (r - 1 / r) ** 2;
  const C = d * d + (r + 1 / r) ** 2 * f0 * f0;
  // Positive root of A f² + 4d f − C = 0 in the form 2C/(B + √(B² + 4AC)), stable as A → 0 (w₁ = w₂).
  const B = 4 * d;
  const f = (2 * C) / (B + Math.sqrt(B * B + 4 * A * C));
  const share1 = (w1 * w1) / (w1 * w1 + w2 * w2);
  const s1 = f + (d - 2 * f) * share1;
  const s2 = f + (d - 2 * f) * (1 - share1);
  return { f, s1, s2, f0, lensBetweenWaists: s1 >= 0 && s2 >= 0 };
}

/**
 * Complex beam parameter q = z + i z_R a distance L after a thin lens of focal length f, for a beam whose waist w₁
 * lies s before the lens: q₀ = s + i z_R1, 1/q₁ = 1/q₀ − 1/f, q = q₁ + L. Im q > 0; its waist lies at L − Re q.
 */
export function qAfterLens(lambda: number, w1: number, s: number, f: number, L: number): Complex {
  const zR1 = (Math.PI * w1 * w1) / lambda;
  // q₁ = f q₀ / (f − q₀)
  const q1 = div({ re: f * s, im: f * zR1 }, { re: f - s, im: -zR1 });
  return { re: q1.re + L, im: q1.im };
}

/**
 * Beam radius from the complex beam parameter: 1/q = 1/R − iλ/(πw²) gives w² = λ|q|²/(π Im q) (Kogelnik & Li 1966,
 * eq. 17), m. NaN unless Im q > 0 and λ > 0.
 */
export function beamRadiusFromQ(q: Complex, lambda: number): number {
  if (!(q.im > 0 && lambda > 0) || !Number.isFinite(q.re)) return NaN;
  return Math.sqrt((lambda * (q.re * q.re + q.im * q.im)) / (Math.PI * q.im));
}

/** Power coupling η = 4 Im q₁ Im q₂ / |q₁ − q₂*|² of two coaxial Gaussian beams at one plane (same λ); 0…1. */
export function gaussianOverlap(q1: Complex, q2: Complex): number {
  if (!(q1.im > 0 && q2.im > 0)) return NaN;
  const dr = q1.re - q2.re;
  const di = q1.im + q2.im;
  return (4 * q1.im * q2.im) / (dr * dr + di * di);
}

/** η of the beam reaching z = d through a lens f placed s from the input waist, against the target waist at z = d. */
export function couplingAtLensPosition(p: ModeMatchProblem, f: number, s: number): number {
  if (!validProblem(p) || !(f !== 0 && Number.isFinite(f)) || !(s >= 0 && s <= p.d)) return NaN;
  const q = qAfterLens(p.lambda, p.w1, s, f, p.d - s);
  return gaussianOverlap(q, { re: 0, im: (Math.PI * p.w2 * p.w2) / p.lambda });
}

/**
 * Best placement of a given lens f between the waists: maximises η over s ∈ [0, d] by a 400-interval scan and a
 * golden-section refinement of the best bracket (80 steps, |Δs| < 1e-12 d). η is smooth in s with at most a few
 * local maxima, so the scan finds the global one.
 */
export function bestLensPosition(p: ModeMatchProblem, f: number): { s: number; eta: number } {
  if (!validProblem(p) || !(f !== 0 && Number.isFinite(f))) return { s: NaN, eta: NaN };
  const n = 400;
  const eta = (s: number) => couplingAtLensPosition(p, f, s);
  let iBest = 0;
  let best = -Infinity;
  for (let i = 0; i <= n; i++) {
    const e = eta((i * p.d) / n);
    if (e > best) {
      best = e;
      iBest = i;
    }
  }
  let a = (Math.max(0, iBest - 1) * p.d) / n;
  let b = (Math.min(n, iBest + 1) * p.d) / n;
  const g = (Math.sqrt(5) - 1) / 2;
  let x1 = b - g * (b - a);
  let x2 = a + g * (b - a);
  let e1 = eta(x1);
  let e2 = eta(x2);
  for (let k = 0; k < 80 && b - a > 1e-12 * p.d; k++) {
    if (e1 < e2) {
      a = x1;
      x1 = x2;
      e1 = e2;
      x2 = a + g * (b - a);
      e2 = eta(x2);
    } else {
      b = x2;
      x2 = x1;
      e2 = e1;
      x1 = b - g * (b - a);
      e1 = eta(x1);
    }
  }
  const sMid = (a + b) / 2;
  const eMid = eta(sMid);
  return eMid >= best ? { s: sMid, eta: eMid } : { s: (iBest * p.d) / n, eta: best };
}
