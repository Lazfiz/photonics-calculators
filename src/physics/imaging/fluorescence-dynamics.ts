/**
 * Fluorescence dynamics: fluorescence correlation spectroscopy (FCS) and fluorescence recovery after
 * photobleaching (FRAP). SI units in and out (m, s, mol/m³). Model tier: textbook.
 *
 * FCS, 3D Gaussian detection volume with 1/e² radii w₀ (lateral) and z₀ (axial), κ = z₀/w₀:
 *   V_eff = π^(3/2) w₀² z₀, N = c N_A V_eff, G(0) = 1/N, τ_D = w₀²/(4D)
 *   G(τ) = (1/N) (1 + τ/τ_D)⁻¹ (1 + τ/(κ²τ_D))^(−1/2) [1 + T/(1 − T) e^(−τ/τ_T)]
 * (S. T. Hess, W. W. Webb, Biophys. J. 83, 2300 (2002), doi:10.1016/S0006-3495(02)73990-8, for V_eff and the
 * diffusion term; J. Widengren, Ü. Mets, R. Rigler, J. Phys. Chem. 99, 13368 (1995), doi:10.1021/j100036a009, for
 * the triplet term with T the mean triplet fraction). Shot-noise SNR of the shortest lag channel, with the
 * number-fluctuation (fourth-order) terms dropped, valid for ε²Δτ τ_D ≪ 1: SNR = ε √(Δτ T_meas)/√(1 + 1/N), independent
 * of N for N ≫ 1 (D. E. Koppel, Phys. Rev. A 10, 1938 (1974), doi:10.1103/PhysRevA.10.1938).
 *
 * FRAP, 2D diffusion after an instantaneous bleach, with τ_D = w²/(4D) and the fractional recovery
 * f(t) = (F(t) − F(0))/(F(∞) − F(0)):
 *   uniform circular disk of radius w: f = e^(−2τ_D/t) [I₀(2τ_D/t) + I₁(2τ_D/t)]
 *   (D. M. Soumpasis, Biophys. J. 41, 95 (1983), doi:10.1016/S0006-3495(83)84410-5);
 *   Gaussian beam of 1/e² radius w, first-order bleach depth K:
 *   F(t)/F_i = Σₙ (−K)ⁿ/n! · 1/(1 + n(1 + 2t/τ_D)), F(0)/F_i = (1 − e^(−K))/K
 *   (D. Axelrod et al., Biophys. J. 16, 1055 (1976), doi:10.1016/S0006-3495(76)85755-4).
 * The half-recovery time is τ½ = γ τ_D, so D = γ w²/(4 τ½); γ = 0.8946 for the disk, 1.097 for the beam at K = 1.
 */
import { N_A } from "../constants";
import { besselIScaled01, firstCrossing } from "../math";

const positive = (x: number) => Number.isFinite(x) && x > 0;

/** Effective FCS volume π^(3/2) w₀² z₀ of a 3D Gaussian with 1/e² radii w₀ and z₀, m³. */
export function fcsEffectiveVolume(w0: number, z0: number): number {
  return positive(w0) && positive(z0) ? Math.PI ** 1.5 * w0 * w0 * z0 : NaN;
}

/** Mean number of molecules c·N_A·V in the effective volume; c in mol/m³ (1 nM = 1e-6 mol/m³). */
export function fcsMeanNumber(concentration: number, volume: number): number {
  return Number.isFinite(concentration) && concentration >= 0 && positive(volume) ? concentration * N_A * volume : NaN;
}

/** Diffusion coefficient w₀²/(4τ_D), m²/s. */
export function fcsDiffusionCoefficient(w0: number, tauD: number): number {
  return positive(w0) && positive(tauD) ? (w0 * w0) / (4 * tauD) : NaN;
}

export interface FcsParams {
  /** Mean number of molecules in V_eff. */
  N: number;
  /** Lateral diffusion time, s. */
  tauD: number;
  /** Structure parameter z₀/w₀. */
  kappa: number;
  /** Mean triplet fraction, 0 ≤ T < 1. */
  T: number;
  /** Triplet relaxation time, s. */
  tauT: number;
}

/** Diffusion part of G(τ) only: (1/N)(1 + τ/τ_D)⁻¹(1 + τ/(κ²τ_D))^(−1/2). */
export function fcsDiffusionCorrelation(tau: number, { N, tauD, kappa }: FcsParams): number {
  if (!(positive(N) && positive(tauD) && positive(kappa) && tau >= 0)) return NaN;
  const u = tau / tauD;
  return 1 / (N * (1 + u) * Math.sqrt(1 + u / (kappa * kappa)));
}

/** Full G(τ) with the Widengren triplet factor 1 + T/(1 − T)·e^(−τ/τ_T); G(0⁺) = 1/(N(1 − T)). */
export function fcsAutocorrelation(tau: number, p: FcsParams): number {
  if (!(p.T >= 0 && p.T < 1 && positive(p.tauT))) return NaN;
  return fcsDiffusionCorrelation(tau, p) * (1 + (p.T / (1 - p.T)) * Math.exp(-tau / p.tauT));
}

/**
 * Koppel's shot-noise SNR of G at the shortest lag, ε √(Δτ T_meas)/√(1 + 1/N); ε in counts per molecule per second.
 * With εΔτ ≪ 1 the channel products n_i n_(i+1) are Poisson-like with mean ⟨n⟩²(1 + G), so σ²(G) = (1 + G)/(M⟨n⟩²),
 * M = T_meas/Δτ, G = 1/N. N = ∞ (the default) gives Koppel's N-independent ε √(Δτ T_meas).
 */
export function koppelSnr(brightness: number, channelWidth: number, measurementTime: number, N = Infinity): number {
  return positive(brightness) && positive(channelWidth) && positive(measurementTime) && N > 0
    ? (brightness * Math.sqrt(channelWidth * measurementTime)) / Math.sqrt(1 + 1 / N)
    : NaN;
}

/** Soumpasis fractional recovery of a uniformly bleached disk, f(t) with u = t/τ_D; f(0) = 0, f(∞) = 1. */
export function soumpasisRecovery(u: number): number {
  if (Number.isNaN(u) || u < 0) return NaN;
  if (u === 0) return 0;
  if (u === Infinity) return 1;
  const x = 2 / u;
  // e^(−x)(I₀ + I₁) ≈ (2/√(2πx))(1 − 1/(8x) − 3/(128x²)) (DLMF 10.40.1); the next term is < 1e-9 here.
  if (x > 500) return (2 / Math.sqrt(2 * Math.PI * x)) * (1 - 1 / (8 * x) - 3 / (128 * x * x));
  const [i0, i1] = besselIScaled01(x);
  return i0 + i1;
}

/** Axelrod F(t)/F_i for a Gaussian-beam bleach of depth K at u = t/τ_D (alternating series, |K| ≤ 20). */
export function axelrodFluorescence(u: number, K: number): number {
  if (!(u >= 0 && K > 0 && K <= 20)) return NaN;
  let sum = 0;
  let term = 1;
  for (let n = 0; n < 400; n++) {
    if (n > 0) term *= -K / n;
    sum += term / (1 + n * (1 + 2 * u));
    if (n > K && Math.abs(term) < 1e-17) break;
  }
  return sum;
}

/** Post-bleach F(0)/F_i = (1 − e^(−K))/K of the Axelrod Gaussian-beam bleach. */
export function axelrodPostBleach(K: number): number {
  return K > 0 && K <= 20 ? -Math.expm1(-K) / K : NaN;
}

/** Axelrod fractional recovery f(t) = (F(t) − F(0))/(F_i − F(0)), u = t/τ_D. */
export function axelrodRecovery(u: number, K: number): number {
  const F0 = axelrodPostBleach(K);
  if (u === Infinity) return Number.isNaN(F0) ? NaN : 1;
  return (axelrodFluorescence(u, K) - F0) / (1 - F0);
}

/** γ = τ½/τ_D, where the fractional recovery reaches ½ (bisection, relative tolerance 1e-13). */
export function frapHalfTimeRatio(model: "disk" | "gaussian", K = 1): number {
  const f = model === "disk" ? soumpasisRecovery : (u: number) => axelrodRecovery(u, K);
  return firstCrossing(f, 0, 50, 0.5, 2000);
}

/** FRAP diffusion coefficient γ w²/(4 τ½), m²/s. */
export function frapDiffusionCoefficient(w: number, tHalf: number, gamma: number): number {
  return positive(w) && positive(tHalf) && positive(gamma) ? (gamma * w * w) / (4 * tHalf) : NaN;
}

// ---- Page summaries (the FCS and FRAP pages and their API schemas call these; SI in, SI out) ----

/** N below this: number fluctuations dominate and the shot-noise SNR is optimistic. */
export const FCS_MIN_MOLECULES = 0.5;
/** N above this: G(0) = 1/N is buried under background and afterpulsing in practice. */
export const FCS_MAX_MOLECULES = 1000;
/** Koppel's shot-noise limit assumes ε Δτ and ε² Δτ τ_D well below this. */
export const FCS_SHOT_LIMIT = 0.1;
/** A lag channel wider than τ_D divided by this has G decayed within it. */
export const FCS_CHANNEL_FRACTION = 10;

export interface FcsSummaryInputs {
  /** Lateral and axial 1/e² radii, m. */
  w0: number;
  z0: number;
  /** Lateral diffusion time, s. */
  tauD: number;
  /** Brightness per molecule ε, counts per second. */
  brightness: number;
  /** Concentration, mol/m³. */
  concentration: number;
  /** Mean triplet fraction. */
  T: number;
  /** Triplet relaxation time, s. */
  tauT: number;
  /** Shortest lag channel width Δτ, s. */
  binWidth: number;
  /** Measurement time, s. */
  time: number;
}

/** The FCS page's results: V_eff (m³), N, G(0), G(0⁺), D (m²/s), count rate N·ε (1/s), Koppel SNR, plus the page's warnings. */
export function fcsSummary(i: FcsSummaryInputs) {
  const kappa = i.z0 / i.w0;
  const volume = fcsEffectiveVolume(i.w0, i.z0);
  const N = fcsMeanNumber(i.concentration, volume);
  const D = fcsDiffusionCoefficient(i.w0, i.tauD);
  const p: FcsParams = { N, tauD: i.tauD, kappa, T: i.T, tauT: i.tauT };
  const g0 = fcsDiffusionCorrelation(0, p);
  const g0Triplet = fcsAutocorrelation(0, p);
  const countRate = N * i.brightness;
  const snr = koppelSnr(i.brightness, i.binWidth, i.time, N);
  const countsPerBin = i.brightness * i.binWidth;
  const fluctuationRatio = i.brightness * countsPerBin * i.tauD; // ε²Δτ τ_D: number-fluctuation vs shot-noise variance
  const warnings: string[] = [];
  if (N < FCS_MIN_MOLECULES) warnings.push(`N = ${N.toFixed(2)} is below one molecule: number fluctuations dominate the noise and the shot-noise SNR is optimistic.`);
  if (N > FCS_MAX_MOLECULES) warnings.push(`N = ${N.toFixed(0)}: G(0) = ${g0.toExponential(1)} is buried under background and detector afterpulsing in practice.`);
  if (countsPerBin > FCS_SHOT_LIMIT) warnings.push(`ε·Δτ = ${countsPerBin.toFixed(2)} counts per molecule per channel: Koppel's shot-noise limit assumes ≪ 1.`);
  if (fluctuationRatio > FCS_SHOT_LIMIT) warnings.push(`ε²·Δτ·τ_D = ${fluctuationRatio.toPrecision(2)}: number fluctuations add to the shot noise, so the SNR shown is an upper bound.`);
  if (i.binWidth > i.tauD / FCS_CHANNEL_FRACTION) warnings.push("The lag channel is not much shorter than τ_D, so G has already decayed within it.");
  return { kappa, volume, N, D, g0, g0Triplet, countRate, snr, countsPerBin, fluctuationRatio, params: p, warnings };
}

export interface FrapSummaryInputs {
  model: "disk" | "gaussian";
  /** Disk radius or 1/e² beam radius, m. */
  w: number;
  /** Half-recovery time, s. */
  tHalf: number;
  /** Mobile fraction M. */
  mobile: number;
  /** Disk: post-bleach F(0)/F_i. */
  postBleach: number;
  /** Gaussian: bleach depth K. */
  bleachK: number;
}

/** The FRAP page's results: γ = τ½/τ_D, τ_D (s), D (m²/s), F(0)/F_i, F(∞)/F_i and the immobile fraction. */
export function frapSummary(i: FrapSummaryInputs) {
  const F0 = i.model === "gaussian" ? axelrodPostBleach(i.bleachK) : i.postBleach;
  const gamma = frapHalfTimeRatio(i.model, i.bleachK);
  const tauD = i.tHalf / gamma;
  const D = frapDiffusionCoefficient(i.w, i.tHalf, gamma);
  const plateau = F0 + i.mobile * (1 - F0);
  return { F0, gamma, tauD, D, plateau, immobile: 1 - i.mobile };
}
