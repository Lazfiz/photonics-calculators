/**
 * Lossless Gires–Tournois interferometer (GTI): a layer of index n and thickness d between a partial front
 * reflector (power reflectance R) and a 100 % back mirror, at normal incidence. SI units. Model tier:
 * exact for this idealisation (no loss, n independent of λ, reflectors with a flat phase).
 *
 * Time dependence e^(−iωt), as in thin-film/transfer-matrix.ts. A round trip in the layer multiplies the
 * field by ρ·e^(iδ), with δ = 4πnd/λ = ω·t₀ and t₀ = 2nd/c. Here ρ = +√R: the front reflection seen from
 * outside and the back mirror have the same sign (air → high-index layer on a metal mirror, say); the
 * other sign only shifts δ by π. Up to a constant phase,
 *   r = (ρ + e^(iδ)) / (1 + ρ·e^(iδ)),  |r|² = 1 at every δ,
 *   φ = 2·arctan[(1 − ρ)/(1 + ρ) · tan(δ/2)],
 *   τ = dφ/dω = t₀ (1 − R) / (1 + R + 2ρ cos δ),
 *   GDD = dτ/dω = 2t₀² ρ (1 − R) sin δ / (1 + R + 2ρ cos δ)².
 * τ peaks at δ = π (mod 2π) at t₀ (1 + ρ)/(1 − ρ), and dips at δ = 0 to t₀ (1 − ρ)/(1 + ρ).
 * F. Gires & P. Tournois, C. R. Acad. Sci. Paris 258, 6112 (1964); J. Kuhl & J. Heppner,
 * IEEE J. Quantum Electron. 22, 182 (1986).
 */
import { c } from "../constants";

export interface GiresTournois {
  /** Power reflectance of the front reflector, 0 ≤ R < 1. */
  R: number;
  /** Refractive index of the layer, > 0. */
  n: number;
  /** Layer thickness, m, ≥ 0. */
  d: number;
}

const valid = ({ R, n, d }: GiresTournois, lambda: number) =>
  R >= 0 && R < 1 && n > 0 && d >= 0 && lambda > 0 && Number.isFinite(n * d * lambda);

/** Round-trip time t₀ = 2nd/c, s. */
export const gtiRoundTripTime = ({ n, d }: GiresTournois) => (2 * n * d) / c;

/** Round-trip phase δ = 4πnd/λ (unwrapped), rad, at the vacuum wavelength λ (m). NaN outside the domain. */
export function gtiRoundTripPhase(g: GiresTournois, lambda: number): number {
  return valid(g, lambda) ? (4 * Math.PI * g.n * g.d) / lambda : NaN;
}

/** Reflection phase φ, rad, wrapped to (−π, π]. */
export function gtiPhase(g: GiresTournois, lambda: number): number {
  const half = gtiRoundTripPhase(g, lambda) / 2;
  const rho = Math.sqrt(g.R);
  // r = N / N* with N = (1 + ρ) cos(δ/2) + i (1 − ρ) sin(δ/2), so φ = arg N².
  const re = (1 + rho) * Math.cos(half);
  const im = (1 - rho) * Math.sin(half);
  return Math.atan2(2 * re * im, re * re - im * im);
}

/** Group delay τ = dφ/dω, s. */
export function gtiGroupDelay(g: GiresTournois, lambda: number): number {
  const delta = gtiRoundTripPhase(g, lambda);
  const rho = Math.sqrt(g.R);
  return (gtiRoundTripTime(g) * (1 - g.R)) / (1 + g.R + 2 * rho * Math.cos(delta));
}

/** Group-delay dispersion GDD = dτ/dω, s². */
export function gtiGdd(g: GiresTournois, lambda: number): number {
  const delta = gtiRoundTripPhase(g, lambda);
  const rho = Math.sqrt(g.R);
  const t0 = gtiRoundTripTime(g);
  const den = 1 + g.R + 2 * rho * Math.cos(delta);
  return (2 * t0 * t0 * rho * (1 - g.R) * Math.sin(delta)) / (den * den);
}
