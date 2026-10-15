/**
 * Photodiode capacitance and speed. SI units: F, V, Ω, m, m/s, Hz. Invalid inputs give NaN.
 *
 * - Junction capacitance C_j = C_j0/(1 + V_R/V_bi)^m with m = 1/2 (abrupt) or 1/3 (linearly graded); depletion width
 *   W = ε₀·ε_r·A/C. S. M. Sze, K. K. Ng, Physics of Semiconductor Devices, 3rd ed. (Wiley 2007), ch. 2.
 * - RC limit f_RC = 1/(2π·R·C) of a first-order low-pass; white noise of density S₀ through it integrates to
 *   S₀·f_RC·atan(B/f_RC), which tends to S₀·f_RC·π/2 (k_B·T/C for Johnson noise of R).
 * - Transit-time limit: a charge sheet crossing W at speed v gives a rectangular current pulse of length τ = W/v,
 *   |H(f)| = |sin(πfτ)/(πfτ)|, so f_tr = 0.443·v/W (root of sin x/x = 1/√2, x = 1.3916). Uniform generation with equal
 *   electron and hole speeds gives a triangular pulse and 0.553·v/W. Combined bandwidth 1/f² = 1/f_RC² + 1/f_tr²:
 *   J. E. Bowers, C. A. Burrus, J. Lightwave Technol. 5, 1339 (1987), doi:10.1109/JLT.1987.1075419.
 */

import { epsilon_0 } from "../constants";

/** Grading exponent m of C ∝ (V_bi + V_R)^−m: abrupt 1/2, linearly graded 1/3 (Sze & Ng ch. 2). */
export const GRADING_EXPONENT = { abrupt: 1 / 2, graded: 1 / 3 } as const;

/** f_tr·τ for a rectangular transit pulse: x/π where sin x/x = 1/√2. */
export const TRANSIT_FACTOR = 0.44294647;

/** Junction capacitance C_j0/(1 + V_R/V_bi)^m at reverse bias V_R ≥ 0 (same unit as C_j0). */
export function junctionCapacitance(c0: number, reverseBias: number, builtIn: number, m: number): number {
  if (!(c0 > 0) || !(reverseBias >= 0) || !(builtIn > 0) || !(m > 0)) return NaN;
  return c0 / Math.pow(1 + reverseBias / builtIn, m);
}

/** Depletion width ε₀·ε_r/C'' of a parallel-plate junction with capacitance per area C'' (F/m²), m. */
export function depletionWidth(capacitancePerArea: number, epsR: number): number {
  if (!(capacitancePerArea > 0) || !(epsR > 0)) return NaN;
  return (epsilon_0 * epsR) / capacitancePerArea;
}

/** Relative permittivity of silicon, 11.9 (Sze & Ng 2007, appendix G). */
export const EPS_R_SILICON = 11.9;

/** Depletion capacitance ε₀·ε_r·A/W of a parallel-plate junction of area A (m²) and width W (m), F. */
export function depletionCapacitance(area: number, width: number, epsR: number): number {
  if (!(area >= 0) || !(width > 0) || !(epsR > 0)) return NaN;
  return (epsilon_0 * epsR * area) / width;
}

/** −3 dB frequency 1/(2π·R·C) of a first-order RC low-pass, Hz. */
export function rcBandwidth(resistance: number, capacitance: number): number {
  if (!(resistance > 0) || !(capacitance > 0)) return NaN;
  return 1 / (2 * Math.PI * resistance * capacitance);
}

/** Transit-time −3 dB frequency 0.443·v/W of a carrier sheet crossing the depletion width W at speed v, Hz. */
export function transitBandwidth(velocity: number, width: number): number {
  if (!(velocity > 0) || !(width > 0)) return NaN;
  return (TRANSIT_FACTOR * velocity) / width;
}

/** Combined −3 dB frequency 1/√(1/f_RC² + 1/f_tr²), Hz. */
export function combinedBandwidth(fRC: number, fTransit: number): number {
  if (!(fRC > 0) || !(fTransit > 0)) return NaN;
  return 1 / Math.sqrt(1 / fRC ** 2 + 1 / fTransit ** 2);
}

/** White noise of density S₀ (per Hz) through a first-order low-pass f_c, integrated from 0 to B: S₀·f_c·atan(B/f_c). */
export function rcFilteredNoise(density: number, fCorner: number, bandwidth: number): number {
  if (!(density >= 0) || !(fCorner > 0) || !(bandwidth >= 0)) return NaN;
  return density * fCorner * Math.atan(bandwidth / fCorner);
}
