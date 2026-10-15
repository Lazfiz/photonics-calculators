/**
 * InₓGa₁₋ₓAs p-i-n photodiode: band gap, absorption edge and intrinsic density. SI units (λ in m, α in 1/m, n_i in
 * m⁻³, T in K); E_g in eV. Band gap: `materials/bandgap.ts` (Vurgaftman et al. 2001).
 */

import { hc_eV_nm } from "../constants";
import { INGAAS_LATTICE_MATCHED_X, VARSHNI, ingaasBandGap, varshniBandGap } from "../materials/bandgap";
import { intrinsicDensityRatio } from "./dark-current";
import { photodiodeQe } from "./photodiode-qe";

/**
 * Intrinsic density of In₀.₅₃Ga₀.₄₇As at 300 K, 6.3e11 cm⁻³: S. Paul, J. B. Roy, P. K. Basu, J. Appl. Phys. 69, 827
 * (1991), doi:10.1063/1.348919, as tabulated in the Ioffe NSM archive (GaInAs, band structure). In m⁻³.
 */
export const INGAAS_NI_300K = 6.3e17;

/**
 * Intrinsic density n_i(x, T) in m⁻³: 6.3e17 m⁻³ at x = 0.53, 300 K, scaled with T^(3/2)·exp(−E_g/(2k_B·T)) and the
 * Vurgaftman gap. The composition dependence of N_c·N_v is left out; only the gap changes with x.
 */
export function ingaasIntrinsicDensity(x: number, T: number): number {
  return (
    INGAAS_NI_300K *
    intrinsicDensityRatio(T, 300, ingaasBandGap(x, T), ingaasBandGap(INGAAS_LATTICE_MATCHED_X, 300))
  );
}

/**
 * Direct-gap absorption prefactor A in α = A·√(E − E_g), 1/(m·eV^½). Least-squares fit to Adachi's model for
 * In₀.₅₂Ga₀.₄₈As (S. Adachi, J. Appl. Phys. 66, 6030 (1989), doi:10.1063/1.343580, tabulated n, k at
 * refractiveindex.info) from 0.95 to 1.62 µm with the Vurgaftman gap: A = 2.40e4 cm⁻¹·eV^−½, within ±12 % of Adachi
 * (6.8e3 cm⁻¹ at 1.53 µm, 1.09e4 cm⁻¹ at 1.25 µm).
 */
export const INGAAS_ABSORPTION_PREFACTOR = 2.4e6;

/** Absorption coefficient α(λ) = A·√(hc/λ − E_g) in 1/m for λ in m and E_g in eV; 0 below the gap. */
export function ingaasAbsorption(wavelength: number, bandGap_eV: number): number {
  if (!(wavelength > 0) || !(bandGap_eV > 0)) return NaN;
  const excess = hc_eV_nm / (wavelength * 1e9) - bandGap_eV;
  return excess > 0 ? INGAAS_ABSORPTION_PREFACTOR * Math.sqrt(excess) : 0;
}

/** Cutoff wavelength hc/E_g in m for E_g in eV. */
export function cutoffWavelength(bandGap_eV: number): number {
  if (!(bandGap_eV > 0)) return NaN;
  return (hc_eV_nm / bandGap_eV) * 1e-9;
}

/**
 * Short-wavelength edge hc/E_g,InP(T) of an InP window or substrate in m: 916.4 nm at 300 K with Vurgaftman's InP gap
 * 1.3529 eV. A standard front-illuminated InGaAs p-i-n has an InP cap and is read through it; visible-extended
 * devices remove it.
 */
export function inpWindowEdge(T: number): number {
  return cutoffWavelength(varshniBandGap(T, VARSHNI.inp));
}

export interface IngaasPinInputs {
  /** In fraction x of InₓGa₁₋ₓAs. */
  x: number;
  /** Temperature, K. */
  T: number;
  /** Fully depleted absorber thickness, m. */
  thickness: number;
  /** Front-surface power reflectance, 0–1. */
  reflectance: number;
  /** true: an InP window, taken as opaque above its gap (QE 0 below inpWindowEdge). */
  inpWindow: boolean;
}

/**
 * QE (1 − R)·(1 − e^(−α·d)) of an InGaAs slab absorber (photodiodeQe with L = 0) at wavelength λ (m), times 0 or 1 for
 * the InP window. The window is a step: a thin cap (≈ 1 µm) passes part of the light just short of 916 nm.
 */
export function ingaasPinQe(wavelength: number, { x, T, thickness, reflectance, inpWindow }: IngaasPinInputs): number {
  const alpha = ingaasAbsorption(wavelength, ingaasBandGap(x, T));
  const qe = photodiodeQe({ alpha, reflectance, depletionWidth: thickness });
  if (!inpWindow || !Number.isFinite(qe)) return qe;
  const edge = inpWindowEdge(T);
  return Number.isFinite(edge) ? (wavelength > edge ? qe : 0) : NaN;
}
