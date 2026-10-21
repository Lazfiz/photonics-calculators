/**
 * Degenerate four-wave mixing in a fibre (pump ω_p, signal ω_s, idler ω_i = 2ω_p − ω_s): the fibre optical parametric
 * amplifier with an undepleted CW pump. SI units: wavelengths in m, β₂ in s²/m, β₄ in s⁴/m, γ in 1/(W·m), powers in W.
 * Model tier: textbook approximation (undepleted, lossless, co-polarized CW waves; β expanded to fourth order about the pump).
 *
 * Sources:
 * - R. H. Stolen, J. E. Bjorkholm, IEEE J. Quantum Electron. 18, 1062 (1982), doi:10.1109/JQE.1982.1071660: parametric
 *   gain in fibres with the nonlinear phase-mismatch term.
 * - J. Hansryd, P. A. Andrekson, M. Westlund, J. Li, P.-O. Hedekvist, IEEE J. Sel. Top. Quantum Electron. 8, 506 (2002),
 *   doi:10.1109/JSTQE.2002.1016354: G_s = 1 + [(γP/g) sinh(gL)]², g² = (γP)² − (κ/2)², κ = Δβ + 2γP,
 *   Δβ = β₂Ω² + β₄Ω⁴/12 (odd orders cancel about the pump); peak gain cosh²(γPL) where κ = 0.
 * - G. P. Agrawal, Nonlinear Fiber Optics, 6th ed. (Academic Press, 2019), ch. 10: the same gain and the weak-pump limit
 *   (γPL)² sinc²(ΔβL/2).
 * The gain has the form of the χ⁽²⁾ OPA gain with Γ = γP and Δk = κ, so it reuses three-wave.ts.
 */
import { c } from "../constants";
import { parametricGain } from "./three-wave";

/** Idler wavelength from 2ω_p = ω_s + ω_i: 1/λ_i = 2/λ_p − 1/λ_s. NaN when the signal is above twice the pump frequency. */
export function fwmIdlerWavelength(lambdaPump: number, lambdaSignal: number): number {
  if (!(lambdaPump > 0 && lambdaSignal > 0)) return NaN;
  const inv = 2 / lambdaPump - 1 / lambdaSignal;
  return inv > 0 ? 1 / inv : NaN;
}

/** Angular detuning Ω = ω_s − ω_p (rad/s). */
export function fwmDetuning(lambdaPump: number, lambdaSignal: number): number {
  return 2 * Math.PI * c * (1 / lambdaSignal - 1 / lambdaPump);
}

/** Linear phase mismatch Δβ = β_s + β_i − 2β_p = β₂Ω² + β₄Ω⁴/12 (1/m). */
export function fwmLinearMismatch(beta2: number, omega: number, beta4 = 0): number {
  const o2 = omega * omega;
  return beta2 * o2 + (beta4 * o2 * o2) / 12;
}

/** Signal power gain G = 1 + [(γP/g) sinh(gL)]², κ = Δβ + 2γP (sin for g² < 0). */
export function fwmSignalGain(gammaP: number, deltaBeta: number, length: number): number {
  return parametricGain(gammaP, deltaBeta + 2 * gammaP, length);
}

/** Parametric gain coefficient g (1/m) = √((γP)² − (κ/2)²); NaN outside the gain band (g² < 0). */
export function fwmGainCoefficient(gammaP: number, deltaBeta: number): number {
  const kappa = deltaBeta + 2 * gammaP;
  const g2 = gammaP * gammaP - (kappa * kappa) / 4;
  return g2 >= 0 ? Math.sqrt(g2) : NaN;
}

/** Idler power (λ_s/λ_i)(G − 1)P_s: one idler photon per added signal photon. */
export function fwmIdlerPower(gain: number, signalPower: number, lambdaSignal: number, lambdaIdler: number): number {
  if (!(gain >= 1 && signalPower >= 0 && lambdaSignal > 0 && lambdaIdler > 0)) return NaN;
  return (lambdaSignal / lambdaIdler) * (gain - 1) * signalPower;
}

/**
 * Smallest detuning |Ω| (rad/s) at which κ = 0, i.e. β₂Ω² + β₄Ω⁴/12 = −2γP: the peak of the gain band. NaN if there is
 * none (e.g. β₂ ≥ 0 with β₄ ≥ 0).
 */
export function fwmPhaseMatchedDetuning(beta2: number, gammaP: number, beta4 = 0): number {
  const a = beta4 / 12;
  const b = beta2;
  const cc = 2 * gammaP;
  let roots: number[];
  if (a === 0) {
    roots = b !== 0 ? [-cc / b] : [];
  } else {
    const disc = b * b - 4 * a * cc;
    if (disc < 0) return NaN;
    const qq = -(b + (b >= 0 ? 1 : -1) * Math.sqrt(disc)) / 2;
    roots = [qq / a, qq !== 0 ? cc / qq : NaN];
  }
  const positive = roots.filter((x) => x > 0 && Number.isFinite(x));
  return positive.length ? Math.sqrt(Math.min(...positive)) : NaN;
}
