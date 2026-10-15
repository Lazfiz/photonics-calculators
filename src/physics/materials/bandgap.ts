/**
 * Semiconductor band gaps vs temperature. E_g in eV, T in K.
 *
 * Varshni's law E_g(T) = E_g(0) − α·T²/(T + β): Y. P. Varshni, Physica 34, 149 (1967),
 * doi:10.1016/0031-8914(67)90062-6. III–V coefficients and the GaInAs bowing: I. Vurgaftman, J. R. Meyer,
 * L. R. Ram-Mohan, J. Appl. Phys. 89, 5815 (2001), doi:10.1063/1.1368156 (Tables I–X, XIII).
 */

/** Varshni coefficients: E_g(0) in eV, α in eV/K, β in K. */
export interface VarshniParams {
  Eg0_eV: number;
  alpha_eV_per_K: number;
  beta_K: number;
}

/**
 * Varshni sets for the lowest gap of each material. Si, Ge: S. M. Sze, Physics of Semiconductor Devices, 2nd ed.
 * (Wiley 1981), ch. 1, as tabulated in V. Palankovski, PhD thesis, TU Wien (2000), §3.3.1.1. III–V: Vurgaftman et al.
 * (2001): Γ gap for GaAs (Table I), InAs (III), InP (VI), GaSb (VII), InSb (IX) and wurtzite GaN (X); X gap for GaP (IV).
 */
export const VARSHNI = {
  si: { Eg0_eV: 1.17, alpha_eV_per_K: 4.73e-4, beta_K: 636 },
  ge: { Eg0_eV: 0.7437, alpha_eV_per_K: 4.774e-4, beta_K: 235 },
  gaas: { Eg0_eV: 1.519, alpha_eV_per_K: 5.405e-4, beta_K: 204 },
  inas: { Eg0_eV: 0.417, alpha_eV_per_K: 2.76e-4, beta_K: 93 },
  inp: { Eg0_eV: 1.4236, alpha_eV_per_K: 3.63e-4, beta_K: 162 },
  gap: { Eg0_eV: 2.35, alpha_eV_per_K: 5.771e-4, beta_K: 372 },
  gasb: { Eg0_eV: 0.812, alpha_eV_per_K: 4.17e-4, beta_K: 140 },
  insb: { Eg0_eV: 0.235, alpha_eV_per_K: 3.2e-4, beta_K: 170 },
  gan: { Eg0_eV: 3.507, alpha_eV_per_K: 9.09e-4, beta_K: 830 },
} as const satisfies Record<string, VarshniParams>;

/** Varshni band gap E_g(T) in eV. */
export function varshniBandGap(T: number, p: VarshniParams): number {
  if (!(T >= 0)) return NaN;
  return p.Eg0_eV - (p.alpha_eV_per_K * T * T) / (T + p.beta_K);
}

/** Γ-gap bowing parameter of Ga₁₋ₓInₓAs, eV, independent of temperature (Vurgaftman et al. 2001, Table XIII). */
export const GAINAS_BOWING_EV = 0.477;

/** In fraction of In₀.₅₃Ga₀.₄₇As, lattice-matched to InP. */
export const INGAAS_LATTICE_MATCHED_X = 0.53;

/**
 * Γ gap of InₓGa₁₋ₓAs in eV: E_g = (1 − x)·E_g(GaAs, T) + x·E_g(InAs, T) − x(1 − x)·C, C = 0.477 eV
 * (Vurgaftman et al. 2001, §III.B.2). 0.816 eV at x = 0.53, 0 K; 0.737 eV at 300 K.
 */
export function ingaasBandGap(x: number, T: number): number {
  if (!(x >= 0 && x <= 1)) return NaN;
  return (1 - x) * varshniBandGap(T, VARSHNI.gaas) + x * varshniBandGap(T, VARSHNI.inas) - x * (1 - x) * GAINAS_BOWING_EV;
}
