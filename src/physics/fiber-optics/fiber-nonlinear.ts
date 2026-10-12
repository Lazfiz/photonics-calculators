/**
 * Nonlinear limits of a single-mode fibre span. SI units in and out: lengths in m, power attenuation α in 1/m
 * (nepers of power), areas in m², powers in W, gains g_B and g_R in m/W, n₂ in m²/W, γ in 1/(W·m), frequencies in Hz.
 * Model tier: textbook approximation (undepleted pump, CW or slowly varying fields, scalar fields with a polarization
 * factor; no dispersion acting on SPM/XPM).
 *
 * Sources:
 * - G. P. Agrawal, Nonlinear Fiber Optics, 6th ed. (Academic Press, 2019), doi:10.1016/C2018-0-01168-8:
 *   L_eff (§4.1), γ = 2πn₂/(λA_eff) (§2.3), SPM of a Gaussian pulse (§4.1), XPM (§7.1), Raman gain (§8.1),
 *   Brillouin shift and gain (§9.1).
 * - R. G. Smith, Appl. Opt. 11, 2489 (1972), doi:10.1364/AO.11.002489: critical (threshold) pump power at which
 *   the Stokes wave grown from spontaneous scattering equals the transmitted pump, g·P·L_eff/A_eff ≈ 16 (forward
 *   SRS) and ≈ 21 (backward SBS), for co-polarized pump and Stokes.
 * - Polarization factor K (threshold × K): SBS in standard fibre with random birefringence has 2/3 of the
 *   co-polarized gain for the best Stokes polarization, so K = 1.5 (M. O. van Deventer, A. J. Boot, J. Lightwave
 *   Technol. 12, 585 (1994), doi:10.1109/50.285349); a pump depolarized faster than the ≈ 10 ns phonon lifetime
 *   has half the gain, K = 2 (A. Kobyakov, M. Sauer, D. Chowdhury, Adv. Opt. Photon. 2, 1 (2010),
 *   doi:10.1364/AOP.2.000001). For SRS the
 *   pump and Stokes (13 THz apart) decorrelate in polarization in non-PM fibre, so K = 2 (Agrawal NFO §8.1).
 * - Source linewidth: for a Lorentzian source of width Δν_s the Brillouin gain falls by Δν_B/(Δν_B + Δν_s), so the
 *   SBS threshold rises by the linear factor (1 + Δν_s/Δν_B) (Agrawal NFO §9.1).
 * - Four-wave mixing efficiency: K. Inoue, J. Lightwave Technol. 10, 1553 (1992), doi:10.1109/50.184893.
 */
import { c } from "../constants";
import { DB_PER_NEPER } from "./macro-bending-loss";

/** Smith's threshold gain-length product for forward SRS, g_R P L_eff/A_eff (co-polarized). */
export const SMITH_SRS_FACTOR = 16;
/** Smith's threshold gain-length product for backward SBS, g_B P L_eff/A_eff (co-polarized). */
export const SMITH_SBS_FACTOR = 21;

/** Polarization factor K for SBS: co-polarized (PM fibre), standard fibre (random birefringence), scrambled pump. */
export const SBS_POLARIZATION_FACTOR = { copolarized: 1, randomBirefringence: 1.5, scrambled: 2 } as const;
/** Polarization factor K for SRS: co-polarized (PM fibre), standard (non-PM) fibre. */
export const SRS_POLARIZATION_FACTOR = { copolarized: 1, standard: 2 } as const;

/** Bulk silica values from Agrawal NFO: n₂ (§2.3), g_B (§9.1), g_R peak for a 1 µm pump (§8.1). */
export const SILICA_N2 = 2.6e-20;
export const SILICA_BRILLOUIN_GAIN = 5e-11;
export const SILICA_RAMAN_GAIN_1UM = 1e-13;
/** Peak Raman shift of silica, ≈ 13.2 THz (Agrawal NFO §8.1). */
export const SILICA_RAMAN_SHIFT = 13.2e12;
/** Longitudinal acoustic velocity and mode index used for the Brillouin shift (Agrawal NFO §9.1: ν_B ≈ 11.1 GHz at 1.55 µm). */
export const SILICA_ACOUSTIC_VELOCITY = 5960;
export const SILICA_MODE_INDEX = 1.45;

/** Power attenuation in 1/m from dB/km. */
export function alphaFromDbPerKm(alphaDbPerKm: number): number {
  return alphaDbPerKm / DB_PER_NEPER / 1e3;
}

/**
 * Effective length L_eff = (1 − e^(−αL))/α, m. Uses expm1, so α → 0 gives L. NaN for α < 0 or L < 0.
 */
export function effectiveLength(alpha: number, L: number): number {
  if (!(alpha >= 0) || !(L >= 0)) return NaN;
  const x = alpha * L;
  return x < 1e-12 ? L * (1 - x / 2) : -Math.expm1(-x) / alpha;
}

/** Nonlinear coefficient γ = 2πn₂/(λA_eff), 1/(W·m). */
export function nonlinearCoefficient(n2: number, lambda: number, Aeff: number): number {
  if (!(lambda > 0) || !(Aeff > 0)) return NaN;
  return (2 * Math.PI * n2) / (lambda * Aeff);
}

/** Peak SPM phase φ_NL = γ P L_eff, rad. */
export function nonlinearPhase(gamma: number, P: number, Leff: number): number {
  return gamma * P * Leff;
}

/**
 * Peak XPM phase on one channel from N other channels of equal power, φ = 2γ P L_eff N, rad. Co-polarized and
 * without walk-off, so an upper bound (Agrawal NFO §7.1).
 */
export function xpmPhaseMax(gamma: number, P: number, Leff: number, otherChannels: number): number {
  return 2 * gamma * P * Leff * Math.max(0, otherChannels);
}

/**
 * Rms spectral broadening of an unchirped Gaussian pulse by SPM alone: Δω_rms/Δω₀ = √(1 + 4φ²/(3√3)).
 * Derived from ⟨ω²⟩ = ∫|∂A/∂T|² dT / ∫|A|² dT with φ(T) = φ_max e^(−T²/T₀²) (Agrawal NFO §4.1).
 */
export function spmRmsBroadening(phiMax: number): number {
  return Math.sqrt(1 + (4 * phiMax * phiMax) / (3 * Math.sqrt(3)));
}

export interface SbsThresholdInput {
  Aeff: number;
  gB: number;
  Leff: number;
  /** Polarization factor K (1 co-polarized, 1.5 standard fibre, 2 scrambled). */
  K?: number;
  /** Source linewidth Δν_s, Hz (0 for a narrow CW source). */
  sourceLinewidth?: number;
  /** Brillouin gain bandwidth Δν_B (FWHM), Hz. Needed only when sourceLinewidth > 0. */
  brillouinLinewidth?: number;
}

/** Linear linewidth factor 1 + Δν_s/Δν_B for a Lorentzian source. */
export function sbsLinewidthFactor(sourceLinewidth: number, brillouinLinewidth: number): number {
  if (!(sourceLinewidth >= 0)) return NaN;
  if (sourceLinewidth === 0) return 1;
  if (!(brillouinLinewidth > 0)) return NaN;
  return 1 + sourceLinewidth / brillouinLinewidth;
}

/** Smith SBS threshold P_th = 21 K A_eff (1 + Δν_s/Δν_B)/(g_B L_eff), W. */
export function sbsThreshold({ Aeff, gB, Leff, K = 1, sourceLinewidth = 0, brillouinLinewidth = NaN }: SbsThresholdInput): number {
  if (!(Aeff > 0) || !(gB > 0) || !(Leff > 0) || !(K > 0)) return NaN;
  return (SMITH_SBS_FACTOR * K * Aeff * sbsLinewidthFactor(sourceLinewidth, brillouinLinewidth)) / (gB * Leff);
}

/** Smith SRS threshold P_th = 16 K A_eff/(g_R L_eff), W. */
export function srsThreshold(Aeff: number, gR: number, Leff: number, K = 1): number {
  if (!(Aeff > 0) || !(gR > 0) || !(Leff > 0) || !(K > 0)) return NaN;
  return (SMITH_SRS_FACTOR * K * Aeff) / (gR * Leff);
}

/** Peak Raman gain at pump wavelength λ_p, scaled as 1/λ_p from 1e-13 m/W at 1 µm (Agrawal NFO §8.1). */
export function ramanGainAt(lambdaPump: number): number {
  if (!(lambdaPump > 0)) return NaN;
  return SILICA_RAMAN_GAIN_1UM * (1e-6 / lambdaPump);
}

/** Small-signal (undepleted pump) Raman on-off gain G = exp(g_R P L_eff/(K A_eff)), linear. */
export function ramanOnOffGain(gR: number, P: number, Leff: number, Aeff: number, K = 1): number {
  if (!(Aeff > 0) || !(K > 0)) return NaN;
  return Math.exp((gR * P * Leff) / (K * Aeff));
}

/** Brillouin frequency shift ν_B = 2 n v_A/λ_p, Hz. */
export function brillouinShift(lambdaPump: number, vA = SILICA_ACOUSTIC_VELOCITY, n = SILICA_MODE_INDEX): number {
  if (!(lambdaPump > 0)) return NaN;
  return (2 * n * vA) / lambdaPump;
}

/** Stokes wavelength for a downshift Δν: 1/λ_s = 1/λ_p − Δν/c, m. NaN if the Stokes frequency is ≤ 0. */
export function stokesWavelength(lambdaPump: number, shift: number): number {
  const inv = 1 / lambdaPump - shift / c;
  return lambdaPump > 0 && inv > 0 ? 1 / inv : NaN;
}

/**
 * FWM phase mismatch for the product ω_i + ω_j − ω_k, expanding β about ω_k:
 * Δβ = −Δω_ik Δω_jk [β₂ + β₃(Δω_ik + Δω_jk)/2], 1/m, with Δω_ik = 2π(f_i − f_k). Only Δβ² enters the efficiency.
 */
export function fwmPhaseMismatch(beta2: number, dfIK: number, dfJK: number, beta3 = 0): number {
  const a = 2 * Math.PI * dfIK;
  const b = 2 * Math.PI * dfJK;
  return -a * b * (beta2 + (beta3 * (a + b)) / 2);
}

/**
 * Inoue FWM efficiency η = |∫₀ᴸ e^((−α + iΔβ)z) dz|²/L_eff²
 *   = α²/(α² + Δβ²) · [1 + 4e^(−αL) sin²(ΔβL/2)/(1 − e^(−αL))²],
 * and sinc²(ΔβL/2) at α = 0. η = 1 when Δβ = 0.
 */
export function fwmEfficiency(alpha: number, L: number, deltaBeta: number): number {
  if (!(alpha >= 0) || !(L > 0)) return NaN;
  const s = Math.sin((deltaBeta * L) / 2);
  if (alpha * L < 1e-9) {
    const x = (deltaBeta * L) / 2;
    return x === 0 ? 1 : (s / x) ** 2;
  }
  const oneMinusE = -Math.expm1(-alpha * L);
  const a2 = alpha * alpha;
  return (a2 / (a2 + deltaBeta * deltaBeta)) * (1 + (4 * Math.exp(-alpha * L) * s * s) / (oneMinusE * oneMinusE));
}

/**
 * FWM product power over the output power of one channel, for equal channel powers P:
 * P_ijk/(P e^(−αL)) = η (d/3)² (γ P L_eff)², with degeneracy d = 3 (i = j) or 6 (i ≠ j) (Inoue 1992, Eq. 3,
 * written with γ). Co-polarized channels.
 */
export function fwmProductRatio(eta: number, phiNL: number, degenerate: boolean): number {
  const d = degenerate ? 3 : 6;
  return eta * (d / 3) ** 2 * phiNL * phiNL;
}
