/**
 * Optically pumped four-level laser in a standing-wave resonator: round-trip loss, threshold pump power, small-signal
 * gain, saturation and the Rigrod output. SI units; reflectances and losses are fractions, gains and losses as natural logs of power
 * (not nepers: ISO 80000-3 defines 1 Np on a field ratio, so these are 2× the neper value).
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
import { gParameter, resonatorStability, twoMirrorMode } from "./two-mirror-resonator";
import { optimumOutputCoupler, rigrodOutput } from "../fiber-optics/doped-fiber-gain";

/** Logarithmic loss −ln(1 − f) = −log1p(−f) (natural log of power) of a fractional power loss f per pass; NaN outside 0 ≤ f < 1. */
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

/** Single-pass small-signal gain g₀l = η_p σ τ P_p λ_p/(h c A), natural log of power; P_p is the absorbed pump power. */
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

export interface DyeLaserInputs {
  /** Laser and pump wavelength, m. */
  lambda: number;
  lambdaP: number;
  /** Absorbed pump power, W. */
  pump: number;
  etaP: number;
  /** Pump spot radius in the jet, m. */
  wp: number;
  /** Emission and triplet-absorption cross-sections, m². */
  sigmaE: number;
  sigmaT: number;
  /** Singlet lifetime, s. */
  tau: number;
  /** Intersystem crossing rate, 1/s. */
  kST: number;
  /** Triplet lifetime, s. */
  tauT: number;
  /** Jet flow speed, m/s. */
  flow: number;
  /** Mirror spacing, m; mirror radii in m (Infinity = flat, 0 is read as flat by the caller). */
  L: number;
  R1: number;
  R2: number;
  /** Output-coupler reflectance and other loss per pass (fraction of power). */
  R_oc: number;
  lossPerPass: number;
}

/**
 * CW dye laser with a flowing jet at the waist of a two-mirror resonator: g parameters, TEM₀₀ mode, triplet-reduced
 * gain, threshold, small-signal gain, Rigrod output and slope efficiency (the page's chain, kept in one place).
 * Model tier: textbook, see the module header and `tripletGainFactor` / `flowTripletLifetime` for the triplet model. `pTh`, `pOut` and `slope`
 * are NaN when the cavity is not stable or triplets kill the gain (`factor` ≤ 0).
 */
export function dyeLaserCw(p: DyeLaserInputs) {
  const g1 = gParameter(p.L, p.R1);
  const g2 = gParameter(p.L, p.R2);
  const stability = resonatorStability(g1, g2);
  const mode = twoMirrorMode(p.lambda, p.L, g1, g2);
  const internal = logarithmicLoss(p.lossPerPass);
  const tauEff = flowTripletLifetime(p.tauT, p.flow, mode.w0, p.wp);
  const factor = tripletGainFactor(p.sigmaE, p.sigmaT, p.kST, tauEff);
  const sigmaNet = p.sigmaE * factor;
  const pumpArea = gaussianOverlapArea(mode.w0, p.wp);
  const modeArea = gaussianSlopeSaturationArea(mode.w0, p.wp);
  const delta = roundTripLoss(1, p.R_oc, internal);
  const pTh = factor > 0 ? fourLevelThreshold(delta, p.lambdaP, sigmaNet, p.tau, pumpArea, p.etaP) : NaN;
  const g0l = factor > 0 ? fourLevelGain(p.pump, p.lambdaP, sigmaNet, p.tau, pumpArea, p.etaP) : NaN;
  const iSat = saturationIntensity(p.lambda, p.sigmaE, p.tau);
  const pSat = iSat * modeArea;
  const pOut = laserOutput(g0l, 1, p.R_oc, internal, pSat);
  const slope = factor > 0
    ? factor * fourLevelSlopeEfficiency(p.lambda, p.lambdaP, 1, p.R_oc, internal, modeArea, pumpArea, p.etaP)
    : NaN;
  return { g1, g2, stability, mode, internal, tauEff, factor, pumpArea, modeArea, delta, pTh, g0l, iSat, pSat, pOut, slope };
}

export interface GasLaserInputs {
  /** Wavelength, m. */
  lambda: number;
  /** Mirror spacing = gain length, m. */
  L: number;
  /** Bore radius, m. */
  boreRadius: number;
  /** Mirror radii of curvature, m (Infinity = flat). */
  R1: number;
  R2: number;
  /** Reflectances of the high reflector and the output coupler. */
  R_hr: number;
  R_oc: number;
  /** Other loss per pass (fraction of power). */
  lossPerPass: number;
  /** Small-signal gain coefficient, 1/m. */
  g0: number;
  /** Saturation intensity, W/m². */
  iSat: number;
}

/**
 * Gas laser (HeNe, Ar⁺, CO₂ type) with a measured gain coefficient in a two-mirror resonator: g parameters, TEM₀₀ mode,
 * Fresnel number, bore clipping, threshold gain, Rigrod output with P_sat = I_sat π⟨w²⟩/2 and the optimum coupler (the
 * page's chain, kept in one place). Model tier: textbook; the clipping loss is reported, not folded into the loss.
 */
export function gasLaserCw(p: GasLaserInputs) {
  const g1 = gParameter(p.L, p.R1);
  const g2 = gParameter(p.L, p.R2);
  const stability = resonatorStability(g1, g2);
  const mode = twoMirrorMode(p.lambda, p.L, g1, g2);
  const internal = logarithmicLoss(p.lossPerPass);
  const a = p.boreRadius;
  const fresnel = (a * a) / (p.lambda * p.L);
  const wMax = Math.max(mode.w1, mode.w2);
  const clipLoss = Math.exp((-2 * a * a) / (wMax * wMax)); // power outside the bore at the larger mirror spot
  const g0l = p.g0 * p.L;
  const pSat = (p.iSat * Math.PI * meanSquareRadius(mode.w0, mode.zR, mode.z1, p.L)) / 2;
  const delta = roundTripLoss(p.R_hr, p.R_oc, internal);
  const gTh = delta / (2 * p.L);
  const pOut = laserOutput(g0l, p.R_hr, p.R_oc, internal, pSat);
  const rearR = p.R_hr * Math.exp(-2 * internal);
  const best = optimumOutputCoupler(g0l, rearR);
  const pBest = best.output * pSat;
  return { g1, g2, stability, mode, internal, fresnel, wMax, clipLoss, g0l, pSat, delta, gTh, pOut, best, pBest };
}
