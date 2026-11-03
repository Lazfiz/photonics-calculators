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
 * - Diffusion tail: light absorbed below the depletion width W in a field-free substrate gives minority carriers that
 *   diffuse to the junction. Gärtner's DC split (W. W. Gärtner, Phys. Rev. 116, 84 (1959), doi:10.1103/PhysRev.116.84):
 *   drift 1 − e^(−αW), diffusion e^(−αW)·αL/(1 + αL). Under modulation e^(iωt) the continuity equation
 *   D·p'' − p/τ − iω·p + g = 0 keeps the steady-state form with L replaced by L_ω = L/√(1 + iωτ), τ = L²/D
 *   (L. M. Peter, Chem. Rev. 90, 753 (1990), doi:10.1021/cr00103a005; J. Bisquert, J. Phys. Chem. B 106, 325 (2002),
 *   doi:10.1021/jp011941g). With p(W) = 0 and a semi-infinite substrate, the diffusion current is
 *   qΦ·e^(−αW)·αL_ω/(1 + αL_ω). Transit and RC limits act on top of this intrinsic response.
 */

import { epsilon_0 } from "../constants";
import { abs as cabs, add, complex, div, sqrt as csqrt, type Complex } from "../complex";

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

/** Share of the DC photocurrent generated inside W: (1 − e^(−αW))/(1 − e^(−αW)/(1 + αL)) (Gärtner 1959). α in 1/m, W and L in m. */
export function driftFraction(alpha: number, width: number, diffusionLength: number): number {
  if (!(alpha > 0) || !(width >= 0) || !(diffusionLength >= 0) || alpha === Infinity) return NaN;
  const aL = alpha * diffusionLength;
  const drift = -Math.expm1(-alpha * width);
  const total = (aL - Math.expm1(-alpha * width)) / (1 + aL);
  return total > 0 ? drift / total : NaN;
}

/**
 * Intrinsic photocurrent response at frequency f normalised to DC (complex):
 * [1 − e^(−αW) + e^(−αW)·αL/(αL + √(1 + iωτ))]/[1 − e^(−αW)/(1 + αL)], τ = L²/D. D in m²/s.
 */
export function diffusionResponse(f: number, alpha: number, width: number, diffusionLength: number, diffusivity: number): Complex {
  const share = driftFraction(alpha, width, diffusionLength);
  if (!(f >= 0) || !(diffusivity > 0) || !Number.isFinite(share)) return complex(NaN, NaN);
  const aL = alpha * diffusionLength;
  const tau = diffusionLength ** 2 / diffusivity;
  const decay = Math.exp(-alpha * width);
  const total = (aL - Math.expm1(-alpha * width)) / (1 + aL);
  const s = csqrt(complex(1, 2 * Math.PI * f * tau));
  const diffusion = div(complex(decay * aL), add(complex(aL), s));
  return div(add(complex(-Math.expm1(-alpha * width)), diffusion), complex(total));
}

/**
 * First frequency where g(f) = |H(f)| − 1/√2 turns ≤ 0: scan in 0.01-decade steps from 10^(log0) over `decades`
 * decades, then 100 bisections in log f (relative tolerance < 1e-12). Infinity when no crossing lies in the range.
 */
function firstCrossing(g: (f: number) => number, log0: number, decades: number): number {
  let lo = log0;
  if (!(g(10 ** lo) > 0)) return NaN;
  for (let i = 1; i <= decades * 100; i++) {
    let hi = log0 + i * 0.01;
    if (g(10 ** hi) <= 0) {
      for (let k = 0; k < 100; k++) {
        const mid = (lo + hi) / 2;
        if (g(10 ** mid) > 0) lo = mid;
        else hi = mid;
      }
      return 10 ** ((lo + hi) / 2);
    }
    lo = hi;
  }
  return Infinity;
}

/**
 * Frequency where |diffusionResponse| falls to 1/√2, Hz. Infinity when the drift share is ≥ 1/√2: the diffusion term
 * keeps a phase between 0 and −45°, so |H| stays above the drift share (and |H| falls monotonically, one crossing).
 * Scan over ±8 decades around D·(α² + 1/L²)/2π; a share within ≈ 1e-6 of 1/√2 puts the crossing beyond it: Infinity.
 */
export function diffusionBandwidth(alpha: number, width: number, diffusionLength: number, diffusivity: number): number {
  const share = driftFraction(alpha, width, diffusionLength);
  if (!Number.isFinite(share) || !(diffusivity > 0)) return NaN;
  if (share >= Math.SQRT1_2 || diffusionLength === 0) return Infinity;
  const g = (f: number) => cabs(diffusionResponse(f, alpha, width, diffusionLength, diffusivity)) - Math.SQRT1_2;
  const center = Math.log10((diffusivity * (alpha ** 2 + diffusionLength ** -2)) / (2 * Math.PI));
  return firstCrossing(g, center - 8, 16);
}

export interface PhotodiodeResponseInputs {
  /** Absorption coefficient α, 1/m. */
  alpha: number;
  /** Depletion width W, m. */
  width: number;
  /** Substrate minority-carrier diffusion length L, m. */
  diffusionLength: number;
  /** Minority-carrier diffusivity D, m²/s. */
  diffusivity: number;
  /** Transit-limited −3 dB frequency 0.443·v/W, Hz. */
  fTransit: number;
  /** RC-limited −3 dB frequency, Hz. */
  fRC: number;
}

/**
 * |H(f)| of the whole photodiode: intrinsic drift + diffusion response × transit |sin(πfτ)/(πfτ)| (τ = 0.443/f_tr,
 * a sheet crossing all of W, exact for diffusion carriers entering at one edge) × RC pole 1/√(1 + (f/f_RC)²).
 */
export function photodiodeResponse(f: number, p: PhotodiodeResponseInputs): number {
  if (!(p.fTransit > 0) || !(p.fRC > 0)) return NaN;
  const x = (Math.PI * f * TRANSIT_FACTOR) / p.fTransit;
  const transit = x === 0 ? 1 : Math.abs(Math.sin(x) / x);
  return (cabs(diffusionResponse(f, p.alpha, p.width, p.diffusionLength, p.diffusivity)) * transit) / Math.hypot(1, f / p.fRC);
}

/** First −3 dB frequency of photodiodeResponse, Hz: scan from 1e-8 of the lowest corner up to 2× the highest. */
export function photodiodeBandwidth(p: PhotodiodeResponseInputs): number {
  const corners = [p.fTransit, p.fRC, (p.diffusivity * (p.alpha ** 2 + p.diffusionLength ** -2)) / (2 * Math.PI)]
    .filter(f => f > 0 && Number.isFinite(f));
  if (!(p.fTransit > 0) || !(p.fRC > 0) || !Number.isFinite(driftFraction(p.alpha, p.width, p.diffusionLength))) return NaN;
  const log0 = Math.log10(Math.min(...corners)) - 8;
  const decades = Math.ceil(Math.log10(2 * Math.max(...corners)) - log0);
  return firstCrossing(f => photodiodeResponse(f, p) - Math.SQRT1_2, log0, decades);
}
