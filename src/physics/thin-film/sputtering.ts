/**
 * DC magnetron sputtering of an elemental target in argon: the ion current to the target, the sputtered
 * atom rate from a measured yield, the on-axis growth rate from a cosine-emitting disk, the most probable
 * energy of the sputtered atoms, and the argon mean free path that decides whether they arrive ballistic.
 *
 * Model tier: Textbook approximation. Yields are measured values at 500 eV Ar⁺ (normal incidence), so the
 * rate is right only near a 500 V discharge unless a measured yield is entered. The target emits
 * uniformly over a disk with a cosine distribution (a real racetrack erodes a ring), every arriving atom
 * sticks, the film has bulk density, and gas scattering is ignored, which overestimates the rate once the
 * distance exceeds about one mean free path. The argon–argon λ (with its √2) is a conservative proxy for
 * the longer mean free path of a fast sputtered atom.
 *
 * References: N. Laegreid, G. K. Wehner, J. Appl. Phys. 32, 365 (1961), doi:10.1063/1.1736012 (yields), as
 * tabulated in M. Ohring, The Materials Science of Thin Films (1992), Table 3-4. A. V. Phelps, Z. Lj. Petrović,
 * Plasma Sources Sci. Technol. 8, R21 (1999), doi:10.1088/0963-0252/8/3/201 (γ ≈ 0.07 for Ar⁺ on clean metal).
 * M. W. Thompson, Philos. Mag. 18, 377 (1968), doi:10.1080/14786436808227358 (energy distribution, peak at
 * U_s/2). M. Ohring, Materials Science of Thin Films, 2nd ed. (2002), ch. 2 (mean free path), ch. 3
 * (cosine-source deposition), ch. 5 (sputtering). C. Kittel, Introduction to Solid State Physics, 8th ed.,
 * Table 3.1 (cohesive energies used as U_s). CRC Handbook (densities, melting points).
 */
import { N_A, k_B, q } from "../constants";

export interface SputterTarget {
  name: string;
  /** Molar mass (kg/mol). */
  M: number;
  /** Bulk density (kg/m³). */
  rho: number;
  /** Surface binding energy taken as the cohesive energy (eV/atom). */
  Us: number;
  /** Sputter yield at 500 eV Ar⁺, normal incidence (atoms/ion). */
  Y500: number;
  /** Melting point (K). */
  Tm: number;
}

/**
 * Y500: Laegreid & Wehner via Ohring (1992) Table 3-4 (Maissel & Glang ch. 4 Table 2 gives 0–17 % more at
 * 600 eV). U_s: Kittel Table 3.1. M: IUPAC. ρ (20 °C) and T_m: CRC Handbook.
 */
export const SPUTTER_TARGETS = {
  Al: { name: "Al", M: 26.982e-3, rho: 2700, Us: 3.39, Y500: 1.05, Tm: 933.47 },
  Si: { name: "Si", M: 28.085e-3, rho: 2329, Us: 4.63, Y500: 0.5, Tm: 1687 },
  Ti: { name: "Ti", M: 47.867e-3, rho: 4506, Us: 4.85, Y500: 0.51, Tm: 1941 },
  Cu: { name: "Cu", M: 63.546e-3, rho: 8960, Us: 3.49, Y500: 2.35, Tm: 1357.77 },
  Mo: { name: "Mo", M: 95.95e-3, rho: 10280, Us: 6.82, Y500: 0.8, Tm: 2896 },
  Ag: { name: "Ag", M: 107.868e-3, rho: 10490, Us: 2.95, Y500: 3.12, Tm: 1234.93 },
  Ta: { name: "Ta", M: 180.948e-3, rho: 16690, Us: 8.1, Y500: 0.57, Tm: 3290 },
  W: { name: "W", M: 183.84e-3, rho: 19250, Us: 8.9, Y500: 0.57, Tm: 3695 },
  Pt: { name: "Pt", M: 195.084e-3, rho: 21450, Us: 5.84, Y500: 1.4, Tm: 2041.4 },
  Au: { name: "Au", M: 196.967e-3, rho: 19300, Us: 3.81, Y500: 2.4, Tm: 1337.33 },
} as const satisfies Record<string, SputterTarget>;

export type SputterTargetId = keyof typeof SPUTTER_TARGETS;

/** Ion current (A) to the target: I/(1 + γ) with I = P/V, γ the ion-induced secondary-electron yield. */
export function targetIonCurrent(P: number, V: number, gamma: number): number {
  if (!(P >= 0 && V > 0 && gamma >= 0)) return NaN;
  return P / V / (1 + gamma);
}

/** Sputtered atoms per second from an ion current I_i (A) and yield Y: (I_i/e) Y. */
export function sputteredAtomRate(Ii: number, Y: number): number {
  if (!(Ii >= 0 && Y >= 0)) return NaN;
  return (Ii / q) * Y;
}

/**
 * On-axis flux (m⁻² s⁻¹) at distance d from a disk of radius a emitting Φ atoms/s uniformly with a cosine
 * distribution, onto a parallel plane: Φ / (π (a² + d²)). It tends to the point-source Φ/(π d²) for a ≪ d.
 */
export function diskOnAxisFlux(Phi: number, a: number, d: number): number {
  if (!(Phi >= 0 && a >= 0 && d > 0)) return NaN;
  return Phi / (Math.PI * (a * a + d * d));
}

/** Growth rate (m/s) of a film of molar mass M and density ρ from an atom flux F: F M / (ρ N_A). */
export function growthRate(F: number, M: number, rho: number): number {
  if (!(F >= 0 && M > 0 && rho > 0)) return NaN;
  return (F * M) / (rho * N_A);
}

/** Most probable energy (eV) of the Thompson distribution E/(E + U_s)³: U_s/2. */
export function thompsonPeakEnergy(Us: number): number {
  return Us > 0 ? Us / 2 : NaN;
}

/**
 * Hard-sphere diameter of argon (m) from its viscosity at 273 K, 21.0 µPa·s (CRC Handbook), through the
 * Chapman–Enskog hard-sphere relation η = (5/16) √(π m k_B T) / (π d²). It falls slowly with temperature
 * (3.59 Å from 22.7 µPa·s at 300 K).
 */
export const D_AR = 3.64e-10;

/** Mean free path of argon atoms (m) at pressure p (Pa) and temperature T (K): k_B T / (√2 π d² p). */
export function argonMeanFreePath(p: number, T: number): number {
  if (!(p > 0 && T > 0)) return NaN;
  return (k_B * T) / (Math.SQRT2 * Math.PI * D_AR * D_AR * p);
}
