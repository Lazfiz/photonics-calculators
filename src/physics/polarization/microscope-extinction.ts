/**
 * Extinction of a polarizing microscope: finite-extinction polarizers plus the rotation of polarization by uncoated
 * flat air–glass surfaces (slide, cover glass) for the oblique rays of the illumination cone. Model tier: textbook
 * approximation (incoherent sum over the pupil, multiple reflections and lens surfaces neglected).
 *
 * - Two sheets with principal transmittances k₁, k₂ (ER = k₁/k₂) at angle θ, unpolarized input (Shurcliff, Polarized
 *   Light, 1962, ch. 3): H(θ) = H₀ cos²θ + H₉₀ sin²θ, H₀ = (k₁² + k₂²)/2, H₉₀ = k₁k₂. With k₁ = 1:
 *   H(θ) = ½[(1 + 1/ER²) cos²θ + (2/ER) sin²θ].
 * - A ray at angle θ in air whose plane of incidence is at azimuth φ to the polarizer crosses m surfaces with power
 *   transmittances T_p, T_s (fresnel.ts; a plate's exit face transmits as its entry face). The field amplitudes become
 *   a_p = T_p^{m/2}, a_s = T_s^{m/2}, which turns the polarization and leaks ½(a_p − a_s) sin 2φ into the analyzer
 *   (Inoué & Hyde, J. Biophys. Biochem. Cytol. 3, 831 (1957), doi:10.1083/jcb.3.6.831). Averaged over φ:
 *     L = (a_p − a_s)²/8 (leaked),   G = (3a_p² + 2a_p a_s + 3a_s²)/8 (kept),   G + L = (a_p² + a_s²)/2.
 *   With the sheets: I_crossed = ½[(k₁² + k₂²)L + 2k₁k₂G], I_parallel = ½[(k₁² + k₂²)G + 2k₁k₂L].
 * - Pupil: uniformly filled, ν = sin θ ≤ NA = min(condenser NA, objective NA) < 1, weighted by area (2πν dν).
 *   L ∝ θ⁴ for small θ, so the pupil-averaged leak grows as NA⁴ at small NA and faster above, where T_p − T_s grows
 *   faster than θ².
 * - Smallest retardance seen against the background (signal = background), specimen at 45° between crossed
 *   polars: sin²(Γ/2) = 1/ER_sys, R_min ≈ λ/(π√ER_sys).
 */
import { fresnel } from "./fresnel";

/** Crossed-or-rotated pair of sheet polarizers with extinction ratio ER: H(θ)/k₁², unpolarized input. */
export function sheetPairTransmission(theta: number, ER: number): number {
  if (!(ER >= 1)) return NaN;
  return 0.5 * ((1 + 1 / (ER * ER)) * Math.cos(theta) ** 2 + (2 / ER) * Math.sin(theta) ** 2);
}

/** φ-averaged kept (G) and leaked (L) fractions for one ray at θ (air) through m air–glass surfaces of index n. */
export function rayLeakTerms(n: number, theta: number, m: number): { G: number; L: number } {
  const f = fresnel(1, n, theta);
  if (!(m >= 0) || !Number.isFinite(f.Tp)) return { G: NaN, L: NaN };
  const ap = f.Tp ** (m / 2), as = f.Ts ** (m / 2);
  return { G: (3 * ap * ap + 2 * ap * as + 3 * as * as) / 8, L: (ap - as) ** 2 / 8 };
}

/** G and L averaged over a uniformly filled pupil of numerical aperture NA (< 1), Simpson's rule in ν. */
export function pupilLeakTerms(n: number, NA: number, m: number, steps = 200): { G: number; L: number } {
  if (!(NA >= 0 && NA < 1)) return { G: NaN, L: NaN };
  if (NA === 0) return rayLeakTerms(n, 0, m);
  let G = 0, L = 0;
  const h = NA / steps;
  for (let i = 0; i <= steps; i++) {
    const nu = i * h, w = (i === 0 || i === steps ? 1 : i % 2 ? 4 : 2) * nu;
    const t = rayLeakTerms(n, Math.asin(nu), m);
    G += w * t.G;
    L += w * t.L;
  }
  const norm = (h / 3) * (2 / (NA * NA));
  return { G: G * norm, L: L * norm };
}

export interface MicroscopeExtinction {
  /** Crossed and parallel transmissions relative to the unpolarized source (k₁ = 1). */
  crossed: number;
  parallel: number;
  /** System extinction ratio I_parallel/I_crossed. */
  ER: number;
  /** Extinction ratio of the surfaces alone (ideal polarizers), G/L; Infinity with no leak. */
  ERsurfaces: number;
}

/** System extinction for polarizers of extinction ratio ER and m uncoated surfaces of index n in a cone of NA. */
export function microscopeExtinction(ER: number, n: number, m: number, NA: number): MicroscopeExtinction {
  const { G, L } = pupilLeakTerms(n, NA, m);
  if (!(ER >= 1) || !Number.isFinite(G)) return { crossed: NaN, parallel: NaN, ER: NaN, ERsurfaces: NaN };
  const k2 = 1 / ER, sq = 1 + k2 * k2;
  const crossed = 0.5 * (sq * L + 2 * k2 * G);
  const parallel = 0.5 * (sq * G + 2 * k2 * L);
  return { crossed, parallel, ER: parallel / crossed, ERsurfaces: L > 0 ? G / L : Infinity };
}

/** Retardance (m) whose signal at 45° between crossed polars equals the background 1/ER_sys: λ/(π√ER) for ER ≫ 1. */
export function minimumRetardance(lambda: number, ERsys: number): number {
  if (!(ERsys > 1) || !(lambda > 0)) return NaN;
  return (lambda / Math.PI) * Math.asin(1 / Math.sqrt(ERsys));
}

/**
 * Transmission with the analyzer at θ from the parallel position. The φ-averaged surfaces and the sheets act as
 * diagonal Mueller matrices, so I(θ) = I_parallel cos²θ + I_crossed sin²θ.
 */
export function analyzerTransmission(e: MicroscopeExtinction, theta: number): number {
  return e.parallel * Math.cos(theta) ** 2 + e.crossed * Math.sin(theta) ** 2;
}
