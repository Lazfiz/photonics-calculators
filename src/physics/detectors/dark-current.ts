/**
 * Temperature scaling of photodiode and image-sensor dark current. SI units: K, J (E_g in eV where noted).
 *
 * The intrinsic density n_i = √(N_c·N_v)·exp(−E_g/(2k_B·T)) with N_c, N_v ∝ T^(3/2), so n_i ∝ T^(3/2)·exp(−E_g/(2k_B·T)).
 * Depletion-region generation current ∝ n_i; diffusion current ∝ n_i². S. M. Sze, K. K. Ng, Physics of Semiconductor
 * Devices, 3rd ed. (Wiley 2007), ch. 1 (n_i) and ch. 2 (ideal-diode J_s ∝ n_i², generation current ∝ n_i).
 * E_g is either fixed or follows Varshni's law (`materials/bandgap.ts`). The empirical doubling law I ∝ 2^(ΔT/T_d)
 * is the local form of the same scaling.
 */

import { k_B, q } from "../constants";
import { VARSHNI, varshniBandGap, type VarshniParams } from "../materials/bandgap";

export type DarkCurrentMechanism = "generation" | "diffusion";

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
 * Temperature at which the dark shot noise √(D_ref·t·2^((T − T_ref)/T_d)) equals the read noise σ_r:
 * T* = T_ref + T_d·log₂(σ_r²/(D_ref·t)). Cooling below T* gains little. Same units for T, T_ref and T_d; NaN without dark charge.
 */
export function darkReadCrossoverTemperature(read: number, darkChargeRef: number, Tref: number, doublingT: number): number {
  if (!(read > 0) || !(darkChargeRef > 0) || !Number.isFinite(Tref) || !(doublingT > 0)) return NaN;
  return Tref + doublingT * Math.log2(read ** 2 / darkChargeRef);
}

/** Dark current density q·R/p² of a square pixel of pitch p (m) that collects R e⁻/s, A/m². */
export function darkCurrentDensity(electronsPerSecond: number, pitch: number): number {
  if (!(electronsPerSecond >= 0) || !(pitch > 0)) return NaN;
  return (q * electronsPerSecond) / pitch ** 2;
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

/**
 * Intrinsic density of silicon at 300 K, 9.65e9 cm⁻³: P. P. Altermatt, A. Schenk, F. Geelhaar, G. Heiser, J. Appl.
 * Phys. 93, 1598 (2003), doi:10.1063/1.1529297. In m⁻³.
 */
export const SILICON_NI_300K = 9.65e15;

/** Intrinsic density of silicon n_i(T), m⁻³: 9.65e15 m⁻³ at 300 K scaled with T^(3/2) and the Varshni gap. */
export function siliconIntrinsicDensity(T: number): number {
  return SILICON_NI_300K * intrinsicDensityRatio(T, 300, varshniBandGap(T, VARSHNI.si), varshniBandGap(300, VARSHNI.si));
}

/**
 * Depletion-region generation current q·n_i·W·A/τ_g in A (n_i in m⁻³, W in m, A in m², τ_g in s). τ_g is the
 * generation lifetime; a midgap trap with τ_n = τ_p = τ gives τ_g = 2τ. Sze & Ng (2007), ch. 2.
 */
export function generationCurrent(ni: number, width: number, area: number, generationLifetime: number): number {
  if (!(ni >= 0) || !(width >= 0) || !(area >= 0) || !(generationLifetime > 0)) return NaN;
  return (q * ni * width * area) / generationLifetime;
}

/**
 * Magnitude of the space-charge generation–recombination current at bias V ≤ 0 (V in V, T in K):
 * I = I_gen·(1 − e^{qV/(2k_B·T)}), the n = 2 diode term of Sze & Ng (2007), ch. 2. I_gen is the reverse-bias
 * generation current (`generationCurrent`). Forward bias returns NaN.
 */
export function generationCurrentAtBias(generation: number, bias: number, T: number): number {
  if (!(generation >= 0) || !(bias <= 0) || !(T > 0)) return NaN;
  return 0 - generation * Math.expm1((q * bias) / (2 * k_B * T)); // 0 − …, not −…: no −0 at zero bias
}

/**
 * Current-noise density √(2q·I_gen) in A/√Hz of a generation-limited photodiode at V ≤ 0. It equals the Johnson noise
 * 4k_B·T/R₀ at zero bias (R₀ = 2k_B·T/(q·I_gen) for the n = 2 term) and the shot noise 2q·I at |V| ≫ 2k_B·T/q.
 */
export function generationNoiseDensity(generation: number): number {
  if (!(generation >= 0)) return NaN;
  return Math.sqrt(2 * q * generation);
}
