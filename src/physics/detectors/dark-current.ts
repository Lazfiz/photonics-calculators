/**
 * Temperature scaling of photodiode dark current with a fixed band gap E_g. SI units: K, J (E_g in eV where noted).
 *
 * The intrinsic density n_i = √(N_c·N_v)·exp(−E_g/(2k_B·T)) with N_c, N_v ∝ T^(3/2), so n_i ∝ T^(3/2)·exp(−E_g/(2k_B·T)).
 * Depletion-region generation current ∝ n_i; diffusion current ∝ n_i². S. M. Sze, K. K. Ng, Physics of Semiconductor
 * Devices, 3rd ed. (Wiley 2007), ch. 1 (n_i) and ch. 2 (ideal-diode J_s ∝ n_i², generation current ∝ n_i).
 * E_g(T) is held constant: the Varshni shift is left out.
 */

import { k_B, q } from "../constants";

export type DarkCurrentMechanism = "generation" | "diffusion";

/** Intrinsic-density ratio n_i(T)/n_i(T_ref) for a band gap E_g in eV. */
export function intrinsicDensityRatio(T: number, Tref: number, bandGap_eV: number): number {
  if (!(T > 0) || !(Tref > 0) || !(bandGap_eV > 0)) return NaN;
  const egOverK = (bandGap_eV * q) / k_B;
  return Math.pow(T / Tref, 1.5) * Math.exp((-egOverK / 2) * (1 / T - 1 / Tref));
}

/** Dark-current ratio I_d(T)/I_d(T_ref): n_i ratio for generation current, its square for diffusion current. */
export function darkCurrentRatio(T: number, Tref: number, bandGap_eV: number, mechanism: DarkCurrentMechanism): number {
  const r = intrinsicDensityRatio(T, Tref, bandGap_eV);
  return mechanism === "diffusion" ? r * r : r;
}
