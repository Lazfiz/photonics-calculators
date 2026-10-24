/**
 * Static locking range of an injection-locked laser. Rates in rad/s (or any frequency unit, consistently).
 * Model tier: textbook approximation (single-mode rate equations, weak injection ρ ≪ 1, steady state only).
 *
 * Locked solutions with detuning Δω = ω_master − ω_free-running slave exist and are stable against phase slips for
 *   −k_c √ρ √(1 + α²) ≤ Δω ≤ k_c √ρ,   ρ = P_inj/P_slave,
 * with k_c the injection coupling rate and α the linewidth enhancement factor (R. Lang, IEEE J. Quantum Electron. 18,
 * 976 (1982), doi:10.1109/JQE.1982.1071632; F. Mogensen, H. Olesen, G. Jacobsen, IEEE J. Quantum Electron. 21, 784 (1985),
 * doi:10.1109/JQE.1985.1072760). For α = 0 it is Adler's symmetric range ±k_c√ρ (R. Adler, Proc. IRE 34, 351 (1946),
 * doi:10.1109/JRPROC.1946.229930).
 */
import { c } from "../constants";

export interface LockingRange {
  /** Lower (red-side) edge, −k_c√ρ√(1 + α²). */
  lower: number;
  /** Upper (blue-side) edge, k_c√ρ. */
  upper: number;
}

/** Locking range for coupling rate k_c, injection ratio ρ = P_inj/P_slave and linewidth enhancement factor α. */
export function lockingRange(couplingRate: number, injectionRatio: number, alpha: number): LockingRange {
  if (!(couplingRate >= 0 && injectionRatio >= 0 && Number.isFinite(alpha))) return { lower: NaN, upper: NaN };
  const edge = couplingRate * Math.sqrt(injectionRatio);
  return { lower: -edge * Math.hypot(1, alpha), upper: edge };
}

/**
 * Coupling rate through the injection facet of a Fabry–Pérot cavity, k_c = (1 − R)/(τ_rt √R), τ_rt = 2n_gL/c, rad/s.
 * N. M. Kondratiev et al., Front. Phys. 18, 21305 (2023), doi:10.1007/s11467-022-1245-3, Eq. (4):
 * κ_do = (1 − R_o²)/(τ_LC R_o) with amplitude reflectivity R_o = √R. Other authors move (1 − R)/√R into the injection
 * ratio or differ by factors of order unity, so this is an estimate. NaN outside 0 < R < 1, L > 0, n_g > 0.
 */
export function facetCouplingRate(R: number, L: number, ng: number): number {
  if (!(R > 0 && R < 1 && L > 0 && ng > 0)) return NaN;
  return ((1 - R) * c) / (2 * ng * L * Math.sqrt(R));
}

