/**
 * Guided modes of a symmetric step-index slab waveguide (core n₁, thickness d, cladding n₂ on both sides). SI units.
 * Model tier: exact (scalar planar-waveguide eigenvalue equations solved by bisection).
 *
 * V = (π d/λ)√(n₁² − n₂²) (half-thickness convention, V = k·(d/2)·NA), b = (n_eff² − n₂²)/(n₁² − n₂²),
 * u = V√(1 − b), w = V√b. Mode m solves u = mπ/2 + arctan(r·w/u), with r = 1 (TE) or n₁²/n₂² (TM); this is the
 * symmetric case of H. Kogelnik, V. Ramaswamy, Appl. Opt. 13, 1857 (1974), doi:10.1364/AO.13.001857, whose V is
 * twice ours. Mode m is cut off at V = mπ/2, so the slab carries ⌊2V/π⌋ + 1 TE modes and as many TM modes.
 */

import { numericalAperture } from "../fiber-optics/step-index-modes";

/** Normalized frequency V = (π d/λ)√(n₁² − n₂²); NaN without guidance (n₁ ≤ n₂). */
export function slabV(n1: number, n2: number, thickness: number, lambda: number): number {
  if (!(n1 > n2 && n2 > 0 && thickness > 0 && lambda > 0)) return NaN;
  return ((Math.PI * thickness) / lambda) * Math.sqrt(n1 * n1 - n2 * n2);
}

/** Number of guided modes of one polarization: ⌊2V/π⌋ + 1. */
export function slabModeCount(V: number): number {
  return V > 0 ? Math.floor((2 * V) / Math.PI) + 1 : 0;
}

/**
 * Normalized index b of mode m for V, with r = 1 (TE) or n₁²/n₂² (TM). Bisection on u ∈ [mπ/2, min(V, (m+1)π/2)],
 * where u − mπ/2 − arctan(r√(V² − u²)/u) rises monotonically; 200 halvings or |Δu| < 1e-15·V. NaN below cutoff.
 */
export function slabModeB(V: number, m: number, r = 1): number {
  if (!(V > 0 && m >= 0 && Number.isInteger(m) && r > 0)) return NaN;
  const lo0 = (m * Math.PI) / 2;
  if (V <= lo0) return NaN;
  const f = (u: number) => u - lo0 - Math.atan((r * Math.sqrt(Math.max(0, V * V - u * u))) / u);
  let lo = Math.max(lo0, 1e-300);
  let hi = Math.min(V, lo0 + Math.PI / 2);
  for (let i = 0; i < 200 && hi - lo > 1e-15 * V; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) < 0) lo = mid;
    else hi = mid;
  }
  const u = (lo + hi) / 2;
  return 1 - (u * u) / (V * V);
}

/** Effective index from b: n_eff = √(n₂² + b(n₁² − n₂²)). */
export function slabEffectiveIndex(b: number, n1: number, n2: number): number {
  return Math.sqrt(n2 * n2 + b * (n1 * n1 - n2 * n2));
}

/**
 * Fraction of TE-mode power inside the core, Γ = (1 + s)/(1 + s + cos²u/w) for even m and (1 − s)/(1 − s + sin²u/w)
 * for odd m, with s = sin(2u)/(2u): ∫E² over the core and the two evanescent tails.
 */
export function slabTEConfinement(V: number, b: number, m: number): number {
  if (!(V > 0 && b > 0 && b < 1)) return NaN;
  const u = V * Math.sqrt(1 - b);
  const w = V * Math.sqrt(b);
  const s = Math.sin(2 * u) / (2 * u);
  const even = m % 2 === 0;
  const core = even ? 1 + s : 1 - s;
  const edge = even ? Math.cos(u) ** 2 : Math.sin(u) ** 2;
  return core / (core + edge / w);
}

/** TE field of mode m at x (same units as the half-thickness a), unit amplitude at the core centre or its peak. */
export function slabTEField(x: number, a: number, V: number, b: number, m: number): number {
  const u = V * Math.sqrt(1 - b);
  const w = V * Math.sqrt(b);
  const even = m % 2 === 0;
  const inner = (t: number) => (even ? Math.cos(u * t) : Math.sin(u * t));
  const t = x / a;
  if (Math.abs(t) <= 1) return inner(t);
  return inner(Math.sign(t)) * Math.exp(-w * (Math.abs(t) - 1));
}

export interface SlabSummary {
  V: number;
  /** Numerical aperture √(n₁² − n₂²). */
  NA: number;
  /** Guided modes per polarization (0 without guidance). */
  modes: number;
  bTE: number;
  bTM: number;
  neffTE: number;
  neffTM: number;
  /** TE₀ power fraction in the core. */
  confinement: number;
  /** Critical angle asin(n₂/n₁), rad. */
  criticalAngle: number;
  /** Acceptance half-angle in air asin(NA), rad (π/2 when NA ≥ 1). */
  acceptance: number;
  /** Largest thickness with a single guided mode per polarization (V = π/2): λ/(2 NA), m. */
  singleModeThickness: number;
}

/** Everything the page and the API show for a symmetric slab. TM₀ uses r = n₁²/n₂². NaN fields without guidance. */
export function slabSummary(n1: number, n2: number, thickness: number, lambda: number): SlabSummary {
  const V = slabV(n1, n2, thickness, lambda);
  const guided = Number.isFinite(V);
  const NA = guided ? numericalAperture(n1, n2) : NaN;
  const bTE = slabModeB(V, 0);
  const bTM = slabModeB(V, 0, (n1 * n1) / (n2 * n2));
  return {
    V,
    NA,
    modes: guided ? slabModeCount(V) : 0,
    bTE,
    bTM,
    neffTE: slabEffectiveIndex(bTE, n1, n2),
    neffTM: slabEffectiveIndex(bTM, n1, n2),
    confinement: slabTEConfinement(V, bTE, 0),
    criticalAngle: guided ? Math.asin(n2 / n1) : NaN,
    acceptance: NA >= 1 ? Math.PI / 2 : Math.asin(NA),
    singleModeThickness: guided ? lambda / (2 * NA) : NaN,
  };
}
