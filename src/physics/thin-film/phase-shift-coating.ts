/**
 * Phase of r and t of one lossless film between semi-infinite media at normal incidence, e^(−iωt) convention
 * (M. Born, E. Wolf, Principles of Optics, 7th ed., §1.6.4; Macleod's e^(+iωt) flips every sign). All lengths in m.
 * Tier: Exact.
 */
import { stackResponse } from "./transfer-matrix";

/** Thickness of a film of `quarterWaves` quarter waves at λ₀: d = f λ₀/(4n), m. Round-trip phase 2β = π f. */
export function filmThicknessFromQuarterWaves(quarterWaves: number, lambda0: number, nFilm: number): number {
  return (quarterWaves * lambda0) / (4 * nFilm);
}

export interface PhaseShiftAtDesign {
  /** Film thickness, m. */
  thickness: number;
  /** arg r and arg t at λ₀, rad in (−π, π]. */
  argR: number;
  argT: number;
  /** R and T at λ₀. */
  R: number;
  T: number;
  /** Interface Fresnel coefficients (n_i − n_j)/(n_i + n_j) of incident–film and film–substrate. */
  r01: number;
  r12: number;
}

/** Response of the film at its design wavelength λ₀ (m); `quarterWaves` is the thickness in quarter waves at λ₀. */
export function phaseShiftAtDesign(
  n1: number, nFilm: number, nSub: number, lambda0: number, quarterWaves: number,
): PhaseShiftAtDesign {
  const thickness = filmThicknessFromQuarterWaves(quarterWaves, lambda0, nFilm);
  const at0 = stackResponse({ incident: n1, layers: [{ n: nFilm, thickness }], substrate: { n: nSub } }, lambda0);
  return {
    thickness,
    argR: Math.atan2(at0.r.im, at0.r.re),
    argT: Math.atan2(at0.t.im, at0.t.re),
    R: at0.R,
    T: at0.T,
    r01: (n1 - nFilm) / (n1 + nFilm),
    r12: (nFilm - nSub) / (nFilm + nSub),
  };
}
