/**
 * Degenerate four-wave mixing in a fibre (pump ω_p, signal ω_s, idler ω_i = 2ω_p − ω_s): the fibre optical parametric
 * amplifier with an undepleted CW pump. SI units: wavelengths in m, β₂ in s²/m, β₄ in s⁴/m, γ in 1/(W·m), powers in W.
 * Model tier: textbook approximation (undepleted, co-polarized CW waves; β expanded to fourth order about the pump; fibre
 * loss through fwmLossyEvolution).
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

export interface FwmLossyPoint {
  /** Position z, m. */
  z: number;
  /** Net signal gain P_s(z)/P_s(0), loss included. */
  gain: number;
  /** Idler power over the seed power, |A_i(z)|²/P_s(0), loss included (multiply by λ_s/λ_i for photon conservation). */
  idler: number;
}

/**
 * Fibre OPA with loss α (power, 1/m) on all three waves and an undepleted pump P(z) = P₀e^(−αz). With A_j = B_j e^(−αz/2)
 * the linearized coupled equations (Agrawal, Nonlinear Fiber Optics, 6th ed., §10.2, loss added) are
 *   dB_s/dz = iγP(z)[2B_s + e^(iθ) B_i*],  dB_i/dz = iγP(z)[2B_i + e^(iθ) B_s*],  θ = 2γP₀L_eff(z) − Δβz,
 * L_eff(z) = (1 − e^(−αz))/α. In the frame b = B e^(−iθ/2) they read d(b_s, b_i*)/dz = M(b_s, b_i*) with
 * M = [[iκ/2, iγP], [−iγP, −iκ/2]], κ = Δβ + 2γP(z): constant coefficients once P is frozen. Each segment uses P at its
 * midpoint and the exact exponential e^(Mh) = cosh(gh)·1 + (sinh(gh)/g)·M, g² = (γP)² − (κ/2)² (cos/sin when g² < 0),
 * so the step count depends on αL and γP₀L, not on Δβ. Segments keep αh ≤ 0.01 and γP₀L(αh)² ≤ 1e-5 (relative error
 * ≲ 1e-6 against a converged run, tests). |b| = |B|, so the gains need no phase. `samples` points are returned, the last at z = L; empty for
 * invalid input or more than 10⁶ segments (αL in the thousands: the signal is gone). At α = 0 it is fwmSignalGain.
 */
export function fwmLossyEvolution(gamma: number, pumpPower: number, deltaBeta: number, alpha: number, length: number, samples = 1): FwmLossyPoint[] {
  if (!(gamma >= 0 && pumpPower >= 0 && Number.isFinite(deltaBeta) && alpha >= 0 && length > 0 && samples >= 1)) return [];
  const gP0 = gamma * pumpPower;
  const aL = alpha * length;
  const needed = Math.max(aL / 0.01, aL * Math.sqrt((gP0 * length) / 1e-5), 1);
  const per = Math.max(1, Math.ceil(needed / samples));
  if (per * samples > 1e6) return [];
  const steps = per * samples;
  const h = length / steps;
  // (b_s, conj b_i) as [Re b_s, Im b_s, Re b_i*, Im b_i*].
  let sr = 1, si = 0, ir = 0, ii = 0;
  const out: FwmLossyPoint[] = [];
  for (let s = 0; s < steps; s++) {
    const gP = gP0 * Math.exp(-alpha * (s + 0.5) * h);
    const k2 = (deltaBeta + 2 * gP) / 2;
    const g2 = gP * gP - k2 * k2;
    let C: number, S: number; // cosh(gh), sinh(gh)/g
    if (g2 > 0) { const g = Math.sqrt(g2); C = Math.cosh(g * h); S = Math.sinh(g * h) / g; }
    else if (g2 < 0) { const q = Math.sqrt(-g2); C = Math.cos(q * h); S = Math.sin(q * h) / q; }
    else { C = 1; S = h; }
    // b_s' = (C + iκ/2·S) b_s + iγP S b_i*;  b_i*' = −iγP S b_s + (C − iκ/2·S) b_i*.
    const a = k2 * S, c = gP * S;
    const nsr = C * sr - a * si - c * ii, nsi = C * si + a * sr + c * ir;
    const nir = c * si + C * ir + a * ii, nii = -c * sr + C * ii - a * ir;
    sr = nsr; si = nsi; ir = nir; ii = nii;
    if ((s + 1) % per === 0) {
      const z = (s + 1) * h, att = Math.exp(-alpha * z);
      out.push({ z, gain: (sr * sr + si * si) * att, idler: (ir * ir + ii * ii) * att });
    }
  }
  return out;
}
