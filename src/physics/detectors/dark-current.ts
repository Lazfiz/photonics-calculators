/**
 * Temperature scaling of photodiode and image-sensor dark current. SI units: K, J (E_g in eV where noted).
 *
 * The intrinsic density n_i = √(N_c·N_v)·exp(−E_g/(2k_B·T)) with N_c, N_v ∝ T^(3/2), so n_i ∝ T^(3/2)·exp(−E_g/(2k_B·T)).
 * Depletion-region generation current ∝ n_i; diffusion current ∝ n_i². S. M. Sze, K. K. Ng, Physics of Semiconductor
 * Devices, 3rd ed. (Wiley 2007), ch. 1 (n_i) and ch. 2 (ideal-diode J_s ∝ n_i², generation current ∝ n_i).
 * E_g is either fixed or follows Varshni's law E_g(T) = E_g(0) − α·T²/(T + β) (Y. P. Varshni, Physica 34, 149 (1967),
 * doi:10.1016/0031-8914(67)90062-6). The empirical doubling law I ∝ 2^(ΔT/T_d) is the local form of the same scaling.
 */

import { k_B, q } from "../constants";

export type DarkCurrentMechanism = "generation" | "diffusion";

/** Varshni coefficients: E_g(0) in eV, α in eV/K, β in K. */
export interface VarshniParams {
  Eg0_eV: number;
  alpha_eV_per_K: number;
  beta_K: number;
}

/** S. M. Sze, Physics of Semiconductor Devices, 2nd ed. (Wiley 1981), ch. 1; as tabulated in V. Palankovski, PhD thesis, TU Wien (2000), §3.3.1.1. */
export const VARSHNI: Record<"si" | "ge", VarshniParams> = {
  si: { Eg0_eV: 1.17, alpha_eV_per_K: 4.73e-4, beta_K: 636 },
  ge: { Eg0_eV: 0.7437, alpha_eV_per_K: 4.774e-4, beta_K: 235 },
};

/** Varshni band gap E_g(T) in eV. */
export function varshniBandGap(T: number, p: VarshniParams): number {
  if (!(T >= 0)) return NaN;
  return p.Eg0_eV - (p.alpha_eV_per_K * T * T) / (T + p.beta_K);
}

/**
 * Intrinsic-density ratio n_i(T)/n_i(T_ref) for band gaps in eV at T and at T_ref. With a fixed gap pass one value;
 * with Varshni pass E_g(T) and E_g(T_ref).
 */
export function intrinsicDensityRatio(T: number, Tref: number, bandGap_eV: number, bandGapRef_eV = bandGap_eV): number {
  if (!(T > 0) || !(Tref > 0) || !(bandGap_eV > 0) || !(bandGapRef_eV > 0)) return NaN;
  const exponent = (-q / (2 * k_B)) * (bandGap_eV / T - bandGapRef_eV / Tref);
  return Math.pow(T / Tref, 1.5) * Math.exp(exponent);
}

/** Dark-current ratio I_d(T)/I_d(T_ref): n_i ratio for generation current, its square for diffusion current. */
export function darkCurrentRatio(
  T: number,
  Tref: number,
  bandGap_eV: number,
  mechanism: DarkCurrentMechanism,
  bandGapRef_eV = bandGap_eV,
): number {
  const r = intrinsicDensityRatio(T, Tref, bandGap_eV, bandGapRef_eV);
  return mechanism === "diffusion" ? r * r : r;
}

/** Empirical doubling law I_d(T)/I_d(T_ref) = 2^((T − T_ref)/T_d), with the doubling temperature T_d in K. */
export function doublingLawRatio(T: number, Tref: number, doublingT: number): number {
  if (!Number.isFinite(T) || !Number.isFinite(Tref) || !(doublingT > 0)) return NaN;
  return Math.pow(2, (T - Tref) / doublingT);
}

/**
 * Local doubling temperature T_d = ln 2 / (d ln I_d/dT) of the n_i scaling at T, for a fixed gap (eV) or a Varshni gap.
 * d ln n_i/dT = 3/(2T) + (E_g − T·dE_g/dT)/(2k_B·T²); for Varshni E_g − T·dE_g/dT = E_g(0) + α·β·T²/(T + β)².
 * Diffusion current (∝ n_i²) doubles twice as fast.
 */
export function localDoublingTemperature(T: number, bandGap: number | VarshniParams, mechanism: DarkCurrentMechanism): number {
  if (!(T > 0)) return NaN;
  const activation_eV =
    typeof bandGap === "number"
      ? bandGap
      : bandGap.Eg0_eV + (bandGap.alpha_eV_per_K * bandGap.beta_K * T * T) / (T + bandGap.beta_K) ** 2;
  if (!(activation_eV > 0)) return NaN;
  const dLnNi = 1.5 / T + (activation_eV * q) / (2 * k_B * T * T);
  return Math.LN2 / ((mechanism === "diffusion" ? 2 : 1) * dLnNi);
}
