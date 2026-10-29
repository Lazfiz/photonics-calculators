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
import { erfcx } from "../math";
import { rigrodOutput } from "../fiber-optics/doped-fiber-gain";

/** Logarithmic loss −ln(1 − f) = −log1p(−f), nepers, of a fractional power loss f per pass; NaN outside 0 ≤ f < 1. */
export function logarithmicLoss(fraction: number): number {
  return fraction >= 0 && fraction < 1 ? -Math.log1p(-fraction) : NaN;
}

/** Round-trip logarithmic loss −ln(R₁R₂) + 2L_i; NaN outside 0 < R ≤ 1 or for L_i < 0. */
export function roundTripLoss(R1: number, R2: number, internal = 0): number {
  if (!(R1 > 0 && R1 <= 1 && R2 > 0 && R2 <= 1 && internal >= 0)) return NaN;
  return -Math.log(R1 * R2) + 2 * internal;
}

/** Effective pumped area π(w₀² + w_p²)/2 of a Gaussian pump of radius w_p overlapping a Gaussian mode of radius w₀. */
export function gaussianOverlapArea(wMode: number, wPump: number): number {
  return wMode > 0 && wPump > 0 ? (Math.PI * (wMode * wMode + wPump * wPump)) / 2 : NaN;
}

/**
 * Near-threshold saturation area of a Gaussian mode w₀ pumped by a Gaussian of radius w_p (end pumping, no diffraction
 * over the gain length): A_s = π w₀²(w₀² + 2w_p²)/(2(w₀² + w_p²)). With it, P_out = I_sat A_s K (g₀l − δ/2) has the
 * Laporta–Brussard slope, whose overlap factor A_s/A = w₀²(w₀² + 2w_p²)/(w₀² + w_p²)² = (∫s r dV)²/(∫s² r dV) (s, r
 * normalized mode and pump densities): 1 for w_p ≪ w₀, ¾ at w_p = w₀, 2w₀²/w_p² for w_p ≫ w₀. It is the near-threshold
 * value; well above threshold the mode wings saturate as well and only a full spatial model follows that. P. Laporta and
 * M. Brussard, IEEE J. Quantum Electron. 27, 2319 (1991), doi 10.1109/3.97276; G. Shayeganrad, in Solid State Laser
 * (InTech, 2012), eqs. 10–12, doi 10.5772/38902.
 */
export function gaussianSlopeSaturationArea(wMode: number, wPump: number): number {
  if (!(wMode > 0 && wPump > 0)) return NaN;
  const m2 = wMode * wMode;
  const p2 = wPump * wPump;
  return (Math.PI * m2 * (m2 + 2 * p2)) / (2 * (m2 + p2));
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
 * Dye laser: fraction of the singlet gain left after triplet-triplet absorption, 1 − σ_T k_ST τ_eff/σ_e, where τ_eff
 * is the effective triplet lifetime in the pumped region (τ_T without flow, flowTripletLifetime in a jet).
 * Negative: the triplet absorption exceeds the gain and the dye cannot lase CW. O. G. Peterson, S. A. Tuccio,
 * B. B. Snavely, Appl. Phys. Lett. 17, 245 (1970), doi 10.1063/1.1653384; J. P. Webb, W. C. McColgin,
 * O. G. Peterson et al., J. Chem. Phys. 53, 4227 (1970), doi 10.1063/1.1673926.
 */
export function tripletGainFactor(sigmaE: number, sigmaT: number, kST: number, tauEff: number): number {
  if (!(sigmaE > 0 && sigmaT >= 0 && kST >= 0 && tauEff >= 0)) return NaN;
  return 1 - (sigmaT * kST * tauEff) / sigmaE;
}

/**
 * Effective triplet lifetime in a dye jet flowing at v across a CW Gaussian pump spot (radius w_p) and mode (w₀), small
 * signal: triplets made upstream decay as e^(−s/(vτ_T)) while they drift a distance s, and the triplet loss is weighted by
 * the mode. The pump–mode cross-correlation along the flow is e^(−s²/c²), c² = (w₀² + w_p²)/2, so
 * τ_eff = (1/v)∫₀^∞ e^(−s²/c² − s/(vτ_T)) ds = (c√π/(2v)) erfcx(c/(2vτ_T)).
 * Limits: τ_T when vτ_T ≪ c; transit time c√π/(2v) = √(π/8)√(w₀² + w_p²)/v (0.886 w_p/v at w₀ = w_p) when vτ_T ≫ c.
 * The transverse profile across the flow cancels for Gaussian beams. Own derivation from the rate equation
 * v dN_T/dx = k_ST N_S − N_T/τ_T; flow regime as in L. Hollberg, in Dye Laser Principles (Academic, 1990), ch. 5,
 * doi 10.1016/B978-0-12-222700-4.50010-3.
 */
export function flowTripletLifetime(tauT: number, v: number, wMode: number, wPump: number): number {
  if (!(tauT > 0 && v >= 0 && wMode > 0 && wPump > 0) || !Number.isFinite(v)) return NaN;
  if (v === 0) return tauT;
  const cLen = Math.sqrt((wMode * wMode + wPump * wPump) / 2);
  return ((cLen * Math.sqrt(Math.PI)) / (2 * v)) * erfcx(cLen / (2 * v * tauT));
}

/** Mean-square TEM₀₀ radius over [0, L] for a waist w₀ at z₁ from mirror 1 with Rayleigh range z_R (reduced lengths). */
export function meanSquareRadius(w0: number, zR: number, z1: number, L: number): number {
  if (!(w0 > 0 && zR > 0 && L > 0 && Number.isFinite(z1))) return NaN;
  const a = -z1;
  const b = L - z1;
  return w0 * w0 * (1 + (a * a + a * b + b * b) / (3 * zR * zR));
}
