/**
 * Optically pumped four-level laser in a standing-wave resonator: round-trip loss, threshold pump power, small-signal
 * gain, saturation and the Rigrod output. SI units; reflectances and losses are fractions, gains and losses in nepers.
 * Model tier: textbook. Homogeneous broadening, plane-wave saturation over an effective area, a four-level medium far
 * below full inversion (no ground-state absorption at λ), no thermal lens. O. Svelto, Principles of Lasers, 5th ed.
 * (Springer, 2010), doi 10.1007/978-1-4419-1302-9, ch. 6–7; W. Koechner, Solid-State Laser Engineering, 6th ed.
 * (Springer, 2006), doi 10.1007/0-387-29338-8, ch. 3; W. W. Rigrod, J. Appl. Phys. 36, 2487 (1965),
 * doi 10.1063/1.1714517.
 *
 *   δ = −ln(R₁R₂) + 2L_i                        round-trip loss, L_i = single-pass internal loss
 *   g₀l = η_p σ τ P_p λ_p/(h c A)              single-pass small-signal gain, pump absorbed over area A
 *   P_th = δ h c A/(2 η_p σ τ λ_p)              threshold (g₀l = δ/2)
 *   A = π r² (uniform pumping), A = π(w₀² + w_p²)/2 (Gaussian mode w₀ and pump w_p; Svelto ch. 6)
 *   I_sat = h c/(λ σ τ)
 *   P_out = I_sat A_m · rigrodOutput(g₀l, R₁e^{−2L_i}, R₂) = I_sat A_m K (g₀l + ln√(R₁'R₂)),
 *   K = (1 − R₂)√R₁'/((√R₁' + √R₂)(1 − √(R₁'R₂)))  → T/δ for small losses (Rigrod's T/2 form).
 */
import { c, h } from "../constants";
import { rigrodOutput } from "../fiber-optics/doped-fiber-gain";

/** Round-trip logarithmic loss −ln(R₁R₂) + 2L_i; NaN outside 0 < R ≤ 1 or for L_i < 0. */
export function roundTripLoss(R1: number, R2: number, internal = 0): number {
  if (!(R1 > 0 && R1 <= 1 && R2 > 0 && R2 <= 1 && internal >= 0)) return NaN;
  return -Math.log(R1 * R2) + 2 * internal;
}

/** Effective pumped area π(w₀² + w_p²)/2 of a Gaussian pump of radius w_p overlapping a Gaussian mode of radius w₀. */
export function gaussianOverlapArea(wMode: number, wPump: number): number {
  return wMode > 0 && wPump > 0 ? (Math.PI * (wMode * wMode + wPump * wPump)) / 2 : NaN;
}

/** Single-pass small-signal gain g₀l = η_p σ τ P_p λ_p/(h c A), nepers; P_p is the absorbed pump power. */
export function fourLevelGain(pump: number, lambdaPump: number, sigma: number, tau: number, area: number, etaP = 1): number {
  if (!(pump >= 0 && lambdaPump > 0 && sigma > 0 && tau > 0 && area > 0 && etaP > 0)) return NaN;
  return (etaP * sigma * tau * pump * lambdaPump) / (h * c * area);
}

/** Absorbed pump power at threshold, δ h c A/(2 η_p σ τ λ_p), W. */
export function fourLevelThreshold(delta: number, lambdaPump: number, sigma: number, tau: number, area: number, etaP = 1): number {
  if (!(delta >= 0 && lambdaPump > 0 && sigma > 0 && tau > 0 && area > 0 && etaP > 0)) return NaN;
  return (delta * h * c * area) / (2 * etaP * sigma * tau * lambdaPump);
}

/** Saturation intensity h c/(λ σ τ), W/m². */
export function saturationIntensity(lambda: number, sigma: number, tau: number): number {
  return lambda > 0 && sigma > 0 && tau > 0 ? (h * c) / (lambda * sigma * tau) : NaN;
}

/** Rigrod slope K = d(P_out/P_sat)/d(g₀l) above threshold; R₁ already includes the internal loss. */
export function rigrodSlope(R1: number, R2: number): number {
  if (!(R1 > 0 && R1 <= 1 && R2 > 0 && R2 < 1)) return NaN;
  const r = Math.sqrt(R1 * R2);
  return ((1 - R2) * Math.sqrt(R1)) / ((Math.sqrt(R1) + Math.sqrt(R2)) * (1 - r));
}

/** Output power P_sat · rigrodOutput(g₀l, R₁e^{−2L_i}, R₂), W; 0 below threshold. */
export function laserOutput(g0l: number, R1: number, R2: number, internal: number, pSat: number): number {
  if (!(internal >= 0 && pSat > 0)) return NaN;
  return pSat * rigrodOutput(g0l, R1 * Math.exp(-2 * internal), R2);
}

/**
 * Slope efficiency dP_out/dP_p = η_p (λ_p/λ)(A_m/A) K of a four-level laser whose gain grows linearly with the
 * absorbed pump power (A_m: saturation area of the mode, A: pumped area).
 */
export function fourLevelSlopeEfficiency(
  lambda: number, lambdaPump: number, R1: number, R2: number, internal: number, modeArea: number, pumpArea: number, etaP = 1,
): number {
  if (!(lambda > 0 && lambdaPump > 0 && internal >= 0 && modeArea > 0 && pumpArea > 0 && etaP > 0)) return NaN;
  return etaP * (lambdaPump / lambda) * (modeArea / pumpArea) * rigrodSlope(R1 * Math.exp(-2 * internal), R2);
}

/**
 * Dye laser: fraction of the singlet gain left after triplet-triplet absorption, 1 − σ_T k_ST τ_eff/σ_e, where triplets
 * live τ_eff = (1/τ_T + 1/t_transit)⁻¹ and t_transit = 2w_p/v is the flow transit time through the pump spot.
 * Negative: the triplet absorption exceeds the gain and the dye cannot lase CW. O. G. Peterson, S. A. Tuccio,
 * B. B. Snavely, Appl. Phys. Lett. 17, 245 (1970), doi 10.1063/1.1653384; J. P. Webb, W. C. McColgin,
 * O. G. Peterson et al., J. Chem. Phys. 53, 4227 (1970), doi 10.1063/1.1673926.
 */
export function tripletGainFactor(sigmaE: number, sigmaT: number, kST: number, tauT: number, transitTime: number): number {
  if (!(sigmaE > 0 && sigmaT >= 0 && kST >= 0 && tauT > 0 && transitTime > 0)) return NaN;
  const tauEff = 1 / (1 / tauT + 1 / transitTime);
  return 1 - (sigmaT * kST * tauEff) / sigmaE;
}

/** Mean-square TEM₀₀ radius over [0, L] for a waist w₀ at z₁ from mirror 1 with Rayleigh range z_R (reduced lengths). */
export function meanSquareRadius(w0: number, zR: number, z1: number, L: number): number {
  if (!(w0 > 0 && zR > 0 && L > 0 && Number.isFinite(z1))) return NaN;
  const a = -z1;
  const b = L - z1;
  return w0 * w0 * (1 + (a * a + a * b + b * b) / (3 * zR * zR));
}
