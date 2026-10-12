/**
 * Interferometric and evanescent fibre sensors. SI units: wavelengths and lengths in m, temperatures in K.
 * Model tier: textbook (lossless two-mirror Airy cavity at normal incidence; plane-interface evanescent decay of a
 * guided mode; linear water index change with temperature).
 *
 * Sources:
 * - Extrinsic Fabry-Pérot cavity: reflected Airy function R = F sin²(δ/2)/(1 + F sin²(δ/2)), δ = 4πnd/λ, with
 *   F = 4ρ/(1 − ρ)² (M. Born, E. Wolf, Principles of Optics, 7th ed., §7.6.1, doi:10.1017/CBO9781139644181).
 *   A fringe at λ_m = 2nd/m moves by Δλ/λ = Δd/d, so a gap strained by ε shifts it by λε.
 * - Evanescent field of a mode with effective index n_eff at an interface with a medium n_ext < n_eff: the field
 *   decays as exp(−γx), γ = (2π/λ)√(n_eff² − n_ext²); penetration depth d_p = 1/γ (N. J. Harrick, Internal Reflection
 *   Spectroscopy, Wiley 1967, ch. 2, with n_eff = n₁ sin θ).
 * - Water: dn/dT ≈ −1.0e-4 /K near 20–25 °C across the visible and near infrared (I. Thormählen, J. Straub,
 *   U. Grigull, J. Phys. Chem. Ref. Data 14, 933 (1985), doi:10.1063/1.555743); n ≈ 1.318 at 1550 nm
 *   (G. M. Hale, M. R. Querry, Appl. Opt. 12, 555 (1973), doi:10.1364/AO.12.000555).
 */
import { coefficientOfFinesse } from "../thin-film/interference";

/** Water index change with temperature near room temperature, 1/K (Thormählen et al. 1985). */
export const WATER_DN_DT = -1.0e-4;
/** Water index at 1550 nm, 20 °C (Hale & Querry 1973). */
export const WATER_INDEX_1550 = 1.318;

/** Free spectral range λ²/(2nd) of a cavity of index n and length d. */
export function freeSpectralRange(lambda: number, n: number, d: number): number {
  return n > 0 && d > 0 ? (lambda * lambda) / (2 * n * d) : NaN;
}

/** Reflectance of a lossless two-mirror cavity (mirror reflectances R₁ = R₂ = R), Born & Wolf §7.6.1. */
export function cavityReflectance(lambda: number, n: number, d: number, mirrorR: number): number {
  const F = coefficientOfFinesse(mirrorR);
  const s = Math.sin((2 * Math.PI * n * d) / lambda); // sin(δ/2)
  return (F * s * s) / (1 + F * s * s);
}

/** Field decay constant γ = (2π/λ)√(n_eff² − n_ext²) outside a guide; NaN if the mode isn't guided (n_ext ≥ n_eff). */
export function evanescentDecay(lambda: number, nEff: number, nExt: number): number {
  const d = nEff * nEff - nExt * nExt;
  return d > 0 && lambda > 0 ? ((2 * Math.PI) / lambda) * Math.sqrt(d) : NaN;
}

/** Penetration depth d_p = 1/γ (field falls to 1/e; intensity to 1/e at d_p/2). */
export function penetrationDepth(lambda: number, nEff: number, nExt: number): number {
  return 1 / evanescentDecay(lambda, nEff, nExt);
}

/** d(d_p)/dn_ext = d_p·n_ext/(n_eff² − n_ext²), m per refractive-index unit. */
export function penetrationDepthSensitivity(lambda: number, nEff: number, nExt: number): number {
  return (penetrationDepth(lambda, nEff, nExt) * nExt) / (nEff * nEff - nExt * nExt);
}
