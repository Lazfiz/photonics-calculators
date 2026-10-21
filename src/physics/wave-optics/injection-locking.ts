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

