/**
 * Two-mirror (Fabry-Perot) laser resonator: stability, TEM₀₀ mode and mode frequencies. SI units. Mirror radii
 * R > 0 for concave, Infinity for flat; L is the physical mirror spacing in a medium of index n filling the cavity,
 * λ the vacuum wavelength. Model tier: exact within paraxial Gaussian-beam theory (spherical mirrors, no
 * aperture losses). H. Kogelnik & T. Li, Appl. Opt. 5, 1550 (1966), doi 10.1364/AO.5.001550; A. E. Siegman,
 * Lasers (University Science Books, 1986), ch. 19.
 *
 *   g_i = 1 − L/R_i, stable for 0 ≤ g₁g₂ ≤ 1 (the index cancels: the reduced spacing L/n meets mirror power 2n/R).
 *   z_R² = L² g₁g₂(1 − g₁g₂)/(g₁ + g₂ − 2g₁g₂)²,  z₁ = L g₂(1 − g₁)/(g₁ + g₂ − 2g₁g₂) (waist from mirror 1),
 *   w₁² = (λL/nπ) √(g₂/(g₁(1 − g₁g₂))),  w₂² = (λL/nπ) √(g₁/(g₂(1 − g₁g₂))),  w₀² = λ z_R/(nπ).
 *   ν_qmn = FSR [q + (m + n + 1) θ/π],  FSR = c/(2nL),  θ = acos(±√(g₁g₂)), sign of g₁ (Siegman ch. 19):
 *   for g < 0 the one-way Gouy phase is above π/2, so the transverse spacing FSR·θ/π exceeds FSR/2.
 */
import { c } from "../constants";

export type Stability = "stable" | "marginal" | "unstable";

/** g = 1 − L/R; R = Infinity gives 1 (flat mirror). NaN for R = 0 or L ≤ 0. */
export function gParameter(L: number, R: number): number {
  return L > 0 && R !== 0 && !Number.isNaN(R) ? 1 - L / R : NaN;
}

/** Stable inside 0 < g₁g₂ < 1, marginal on the boundary (within 1e-12), unstable outside or for NaN. */
export function resonatorStability(g1: number, g2: number): Stability {
  const p = g1 * g2;
  if (!Number.isFinite(p)) return "unstable";
  if (Math.abs(p) < 1e-12 || Math.abs(p - 1) < 1e-12) return "marginal";
  return p > 0 && p < 1 ? "stable" : "unstable";
}

export interface TwoMirrorMode {
  /** Waist radius, m. */
  w0: number;
  /** Rayleigh range in the medium, m. */
  zR: number;
  /** Waist position from mirror 1 towards mirror 2 (negative: behind mirror 1), m. */
  z1: number;
  /** Beam radii on mirror 1 and mirror 2, m. */
  w1: number;
  w2: number;
}

/**
 * TEM₀₀ mode of a two-mirror resonator. NaN fields unless stable; the symmetric confocal cavity (g₁ = g₂ = 0, on
 * the boundary) has the finite limit z_R = L/2, w₁ = w₂ = √2 w₀.
 */
export function twoMirrorMode(lambda: number, L: number, g1: number, g2: number, n = 1): TwoMirrorMode {
  const nan = { w0: NaN, zR: NaN, z1: NaN, w1: NaN, w2: NaN };
  if (!(lambda > 0 && L > 0 && n > 0)) return nan;
  const lm = lambda / n;
  if (g1 === 0 && g2 === 0) {
    const zR = L / 2;
    const w0 = Math.sqrt((lm * zR) / Math.PI);
    return { w0, zR, z1: L / 2, w1: Math.SQRT2 * w0, w2: Math.SQRT2 * w0 };
  }
  if (resonatorStability(g1, g2) !== "stable") return nan;
  const p = g1 * g2;
  const den = g1 + g2 - 2 * p; // = g₁(1 − g₂) + g₂(1 − g₁), non-zero inside the stable region
  const zR = (L * Math.sqrt(p * (1 - p))) / Math.abs(den);
  const s = (lm * L) / Math.PI;
  return {
    w0: Math.sqrt((lm * zR) / Math.PI),
    zR,
    z1: (L * g2 * (1 - g1)) / den,
    w1: Math.sqrt(s * Math.sqrt(g2 / (g1 * (1 - p)))),
    w2: Math.sqrt(s * Math.sqrt(g1 / (g2 * (1 - p)))),
  };
}

/** Axial free spectral range c/(2nL), Hz. */
export function resonatorFsr(L: number, n = 1): number {
  return L > 0 && n > 0 ? c / (2 * n * L) : NaN;
}

/** One-way Gouy phase θ = acos(±√(g₁g₂)) with the sign of g₁, rad; NaN outside 0 ≤ g₁g₂ ≤ 1. */
export function oneWayGouyPhase(g1: number, g2: number): number {
  const p = g1 * g2;
  if (!(p >= 0 && p <= 1)) return NaN;
  return Math.acos((g1 + g2 < 0 ? -1 : 1) * Math.sqrt(p));
}

/** Transverse mode spacing FSR·θ/π (between orders m + n and m + n + 1), Hz. */
export function transverseModeSpacing(fsr: number, g1: number, g2: number): number {
  return (fsr * oneWayGouyPhase(g1, g2)) / Math.PI;
}

/** ν_qmn = FSR [q + (m + n + 1) θ/π], Hz. */
export function modeFrequency(fsr: number, g1: number, g2: number, q: number, order: number): number {
  return fsr * (q + ((order + 1) * oneWayGouyPhase(g1, g2)) / Math.PI);
}
