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
import { logarithmicLoss, roundTripLoss } from "./laser-resonator";

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

/** Yttrium sites in YAG, 1.38e22 cm⁻³ in 1/m³: 1 at.% doping = 1.38e20 ions/cm³ (Koechner, Solid-State Laser Engineering, ch. 2). */
export const YAG_SITES = 1.38e28;

export interface ThinDiskInputs {
  /** Disk thickness and pump-spot diameter (top hat, mode of equal area), m. */
  thickness: number;
  spotDiameter: number;
  /** Yb doping as a fraction of the Y sites (0.1 = 10 at.%). */
  doping: number;
  /** Pump passes through the disk M and laser passes per round trip m (rounded to integers). */
  pumpPasses: number;
  laserPasses: number;
  /** Incident pump power, W. */
  pump: number;
  /** Output-coupler reflectance (the disk is the rear mirror) and other loss per round trip as a fraction of power. */
  R_oc: number;
  otherLoss: number;
  /** Laser and pump wavelength, m. */
  lambda: number;
  lambdaP: number;
  /** Cross-sections at λ (emission, absorption) and at λ_p (absorption, emission), m². */
  sigmaE: number;
  sigmaA: number;
  sigmaAP: number;
  sigmaEP: number;
  /** Upper-level lifetime, s; heat fraction of the absorbed pump; conductivity, W/(m K). */
  tau: number;
  heatFraction: number;
  kappa: number;
}

/**
 * Yb:YAG thin-disk laser (the page's chain, kept in one place): threshold inversion with reabsorption, pump absorption at
 * the threshold inversion after M passes, threshold pump power, slope efficiency, output power and the front-to-back
 * temperature rise of the disk. `pTh` and `pOut` are NaN when the threshold inversion bleaches the pump (β ≥ β_bleach).
 * Model tier: textbook (see the module header). The round-trip loss is δ = −ln R_oc plus the other loss.
 */
export function thinDiskLaser(p: ThinDiskInputs) {
  const N = p.doping * YAG_SITES;
  const M = Math.round(p.pumpPasses);
  const m = Math.round(p.laserPasses);
  const otherLoss = logarithmicLoss(p.otherLoss); // −ln(1 − f) of power per round trip
  const area = Math.PI * (p.spotDiameter / 2) ** 2;
  const delta = roundTripLoss(1, p.R_oc, otherLoss / 2);
  const beta = thresholdInversion(delta, m, p.thickness, N, p.sigmaE, p.sigmaA);
  const betaTr = p.sigmaA / (p.sigmaA + p.sigmaE);
  const betaBleach = p.sigmaAP / (p.sigmaAP + p.sigmaEP);
  const alphaUnpumped = pumpAbsorption(N, p.sigmaAP, p.sigmaEP, 0);
  const alphaTh = beta <= 1 ? pumpAbsorption(N, p.sigmaAP, p.sigmaEP, beta) : NaN;
  const etaAbs = multipassAbsorption(alphaTh, p.thickness, M);
  const pTh = quasiThreeLevelThreshold(N, p.thickness, beta, area, p.lambdaP, p.tau, etaAbs);
  const slope = quasiThreeLevelSlope(etaAbs, p.lambdaP, p.lambda, p.R_oc, delta);
  const pOut = Number.isFinite(pTh) ? Math.max(0, slope * (p.pump - pTh)) : NaN;
  const absorbedIntensity = (etaAbs * p.pump) / area;
  const dT = diskTemperatureRise(absorbedIntensity, p.heatFraction, p.thickness, p.kappa);
  return { N, M, area, delta, beta, betaTr, betaBleach, alphaUnpumped, alphaTh, etaAbs, pTh, slope, pOut, absorbedIntensity, dT };
}
