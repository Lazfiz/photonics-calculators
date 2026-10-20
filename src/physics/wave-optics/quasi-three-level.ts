/**
 * Quasi-three-level laser (Yb:YAG thin disk) with a top-hat pump and mode of equal area: threshold inversion with
 * reabsorption at the laser wavelength, pump bleaching, multipass pump absorption, threshold pump power, slope efficiency
 * and the axial temperature rise of a disk cooled through its back face. SI units; cross-sections in m², N in 1/m³.
 * Model tier: textbook. Inversion uniform through the disk and clamped above threshold, cross-sections independent of
 * temperature, mean-field gain (small round-trip loss), no amplified spontaneous emission. T. Y. Fan, R. L. Byer, IEEE
 * J. Quantum Electron. 23, 605 (1987), doi 10.1109/JQE.1987.1073371; T. Taira, W. M. Tulloch, R. L. Byer, Appl. Opt.
 * 36, 1867 (1997), doi 10.1364/AO.36.001867; A. Giesen et al., Appl. Phys. B 58, 365 (1994), doi 10.1007/BF01081875.
 *
 *   β = N₂/N                         excited fraction
 *   m d N(β σ_e − (1 − β) σ_a) = δ   threshold, m laser passes through the disk of thickness d per round trip
 *   α_p = N(σ_ap − β(σ_ap + σ_ep))   pump absorption; η_abs = 1 − e^{−M α_p d} after M pump passes
 *   P_th = h c N d β_th A/(λ_p τ η_abs)
 *   dP_out/dP_p = η_abs (λ_p/λ) T_ln/δ,   T_ln = −ln R_oc
 *   ΔT = η_h η_abs P_p d/(2κA)       front-to-back rise, uniform heating, back face cooled
 */
import { c, h } from "../constants";

/** Excited fraction at which the round-trip gain m d N(βσ_e − (1 − β)σ_a) equals the loss δ. */
export function thresholdInversion(delta: number, passes: number, thickness: number, N: number, sigmaE: number, sigmaA: number): number {
  if (!(delta >= 0 && passes > 0 && thickness > 0 && N > 0 && sigmaE > 0 && sigmaA >= 0)) return NaN;
  return (delta / (passes * thickness * N) + sigmaA) / (sigmaE + sigmaA);
}

/** Pump absorption coefficient N(σ_ap − β(σ_ap + σ_ep)), 1/m; ≤ 0 means the pump is bleached. */
export function pumpAbsorption(N: number, sigmaAP: number, sigmaEP: number, beta: number): number {
  if (!(N > 0 && sigmaAP > 0 && sigmaEP >= 0 && beta >= 0 && beta <= 1)) return NaN;
  return N * (sigmaAP - beta * (sigmaAP + sigmaEP));
}

/** Pump fraction absorbed after M passes through thickness d, 1 − e^{−M α d}; 0 for a bleached medium. */
export function multipassAbsorption(alpha: number, thickness: number, pumpPasses: number): number {
  if (!(Number.isFinite(alpha) && thickness > 0 && pumpPasses > 0)) return NaN;
  return alpha <= 0 ? 0 : -Math.expm1(-pumpPasses * alpha * thickness);
}

/** Incident pump power that holds the inversion β over a pumped area A, h c N d β A/(λ_p τ η_abs), W. */
export function quasiThreeLevelThreshold(
  N: number, thickness: number, beta: number, area: number, lambdaPump: number, tau: number, etaAbs: number,
): number {
  if (!(N > 0 && thickness > 0 && beta >= 0 && area > 0 && lambdaPump > 0 && tau > 0)) return NaN;
  return etaAbs > 0 ? (h * c * N * thickness * beta * area) / (lambdaPump * tau * etaAbs) : NaN;
}

/** Slope efficiency η_abs (λ_p/λ) T_ln/δ with T_ln = −ln R_oc and δ the round-trip loss. */
export function quasiThreeLevelSlope(etaAbs: number, lambdaPump: number, lambda: number, Roc: number, delta: number): number {
  if (!(etaAbs >= 0 && lambdaPump > 0 && lambda > 0 && Roc > 0 && Roc < 1 && delta > 0)) return NaN;
  return (etaAbs * lambdaPump * -Math.log(Roc)) / (lambda * delta);
}

/** Front-to-back temperature rise η_h I_abs d/(2κ) of a disk heated uniformly and cooled through its back face, K. */
export function diskTemperatureRise(absorbedIntensity: number, heatFraction: number, thickness: number, kappa: number): number {
  if (!(absorbedIntensity >= 0 && heatFraction >= 0 && heatFraction <= 1 && thickness > 0 && kappa > 0)) return NaN;
  return (heatFraction * absorbedIntensity * thickness) / (2 * kappa);
}
