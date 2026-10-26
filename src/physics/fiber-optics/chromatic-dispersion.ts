/**
 * Chromatic dispersion of single-mode and multimode fibre: D(λ) and slope models, the D ↔ β₂, β₃ conversion,
 * Gaussian-pulse broadening, dispersion-limited bit rate and length, and fibre delay. SI units in and out: D in
 * s/m² (1 ps/(nm·km) = 1e-6 s/m²), S = dD/dλ in s/m³ (1 ps/(nm²·km) = 1e3 s/m³), β₂ in s²/m (1 ps²/km =
 * 1e-27 s²/m), β₃ in s³/m (1 ps³/km = 1e-39 s³/m), lengths and wavelengths in m, times in s, rates in 1/s.
 * Model tier: textbook approximation.
 *
 * D(λ) models:
 * - Sellmeier form for dispersion-unshifted fibre (ITU-T G.652; IEC 60793-1-42 three-term fit of the group delay
 *   τ = τ₀ + (S₀/8)(λ − λ₀²/λ)²): D(λ) = (S₀/4)(λ − λ₀⁴/λ³), S(λ) = (S₀/4)(1 + 3λ₀⁴/λ⁴). G.652 bounds λ₀ to
 *   1300–1324 nm and S₀ ≤ 0.092 ps/(nm²·km); λ₀ = 1310 nm and S₀ = 0.092 give 17.46 ps/(nm·km) at 1550 nm. The
 *   same form describes graded-index multimode fibre (IEC 60793-2-10). The standards use it to bound D(λ); fibre
 *   datasheets (e.g. Corning SMF-28) quote it as the model over 1200–1625 nm, the range used here for SMF.
 * - Linear about 1550 nm, D(λ) = D₁₅₅₀ + S₁₅₅₀(λ − 1550 nm), for dispersion-shifted (G.653), non-zero
 *   dispersion-shifted (G.655) and dispersion-compensating fibre. Valid across the S, C and L bands
 *   (≈ 1460–1625 nm); outside them the curvature of D(λ) matters, strongly so for DCF.
 *
 * Propagation constants (Agrawal, Fiber-Optic Communication Systems, eqs. (2.3.5) and (2.3.13)):
 *   β₂ = −λ²D/(2πc),  S = (2πc/λ²)² β₃ + (4πc/λ³) β₂  ⇒  β₃ = (λ²/(2πc))² (S + 2D/λ).
 *
 * Pulse broadening (Agrawal §2.4.2, after Marcuse, Appl. Opt. 19, 1653 (1980)): a chirped Gaussian input pulse of
 * rms width σ₀ and chirp C, from a source with a Gaussian spectrum of rms width σ_ω (V_ω = 2σ_ω σ₀), leaves a fibre
 * of length L with rms width σ where
 *   σ²/σ₀² = (1 + Cβ₂L/(2σ₀²))² + (1 + V_ω²)(β₂L/(2σ₀²))² + ½(1 + C² + V_ω²)²(β₃L/(4σ₀³))².
 * For V_ω ≫ 1 this tends to σ₀² + σ_D² with σ_D from `rmsBroadening` (dispersion-comp.ts); for V_ω = 0, C = 0,
 * β₃ = 0 it is the transform-limited σ = σ₀√(1 + (L/L_D)²), L_D = T₀²/|β₂| with T₀ = √2 σ₀.
 *
 * Bit-rate limits (criterion 4Bσ ≤ 1 on the output width, Agrawal §2.4.3), with the input width σ₀ chosen to
 * minimise σ. σ² is convex in u = σ₀² (terms in u, 1/u, 1/u², constants), so a golden-section search in ln u finds
 * it. Limits: broad source (V_ω ≫ 1) 4Bσ_D ≤ 1; coherent source, β₃ = 0: σ₀² = |β₂|L/2, σ² = |β₂|L,
 * B√(|β₂|L) ≤ ¼; with a source width σ² = σ_D² + |β₂|L; at λ₀, σ² = 1.5(|β₃|L/4)^(2/3), B(|β₃|L)^(1/3) ≤ 0.324.
 *
 * Impulse-response bandwidth: a Gaussian impulse response of rms width σ has an optical (−3 dB optical power)
 * bandwidth f₃dB = √(2 ln 2)/(2πσ) ≈ 0.187/σ. A multimode fibre specified by a modal bandwidth–length product
 * BW·L is modelled as such a Gaussian of rms σ = 0.187 L/(BW·L).
 *
 * Group delay τ = n_g L/c. Its temperature coefficient for standard SMF-28 is 37.4 ps/(km·K) measured, 39 ps/(km·K)
 * calculated (Slavík et al., Sci. Rep. 5, 15447 (2015)); it is mostly dn/dT, with ≈ 2 ps/(km·K) from expansion.
 *
 * Not included: intermodal dispersion of SMF below cutoff, the differential mode delay structure of laser-launched
 * MMF, polarization-mode dispersion (polarization-mode-dispersion.ts), nonlinear effects.
 */

import { c } from "../constants";
import { GAUSSIAN_FWHM_PER_SIGMA } from "../math";

/** 1550 nm, the reference wavelength of the linear presets, m. */
export const LAMBDA_REF = 1550e-9;
/** ITU-T G.652 zero-dispersion wavelength used for the standard-fibre curve, m. */
export const G652_LAMBDA0 = 1310e-9;
/** ITU-T G.652 maximum zero-dispersion slope S₀ = 0.092 ps/(nm²·km), s/m³. */
export const G652_S0 = 0.092e3;
/** FWHM → rms for a Gaussian: 1/(2√(2 ln 2)). */
export const FWHM_TO_RMS = 1 / GAUSSIAN_FWHM_PER_SIGMA;
/** f₃dB·σ for a Gaussian impulse response: √(2 ln 2)/(2π) ≈ 0.1874. */
export const GAUSSIAN_BANDWIDTH_RMS_PRODUCT = Math.sqrt(2 * Math.LN2) / (2 * Math.PI);

/** Dispersion and slope of one fibre at a reference wavelength (D in s/m², S in s/m³). */
export interface LinearDispersion {
  D: number;
  S: number;
}

/** D(λ) = (S₀/4)(λ − λ₀⁴/λ³) for the Sellmeier (G.652) form, s/m². NaN for λ ≤ 0. */
export function sellmeierDispersion(lambda: number, lambda0: number, S0: number): number {
  if (!(lambda > 0)) return NaN;
  return (S0 / 4) * (lambda - lambda0 ** 4 / lambda ** 3);
}

/** S(λ) = dD/dλ = (S₀/4)(1 + 3λ₀⁴/λ⁴) for the Sellmeier form, s/m³. NaN for λ ≤ 0. */
export function sellmeierSlope(lambda: number, lambda0: number, S0: number): number {
  if (!(lambda > 0)) return NaN;
  return (S0 / 4) * (1 + (3 * lambda0 ** 4) / lambda ** 4);
}

/** Dispersion and slope of the Sellmeier form at λ. */
export function sellmeierAt(lambda: number, lambda0: number, S0: number): LinearDispersion {
  return { D: sellmeierDispersion(lambda, lambda0, S0), S: sellmeierSlope(lambda, lambda0, S0) };
}

/** D(λ) = D_ref + S(λ − λ_ref) for a fibre specified at λ_ref, s/m². */
export function linearDispersion(fiber: LinearDispersion, lambda: number, lambdaRef = LAMBDA_REF): number {
  return fiber.D + fiber.S * (lambda - lambdaRef);
}

/** Zero-dispersion wavelength λ_ref − D/S of the linear model, m. NaN when S = 0. */
export function linearZeroDispersionWavelength(fiber: LinearDispersion, lambdaRef = LAMBDA_REF): number {
  if (fiber.S === 0) return NaN;
  return lambdaRef - fiber.D / fiber.S;
}

/** β₂ = −λ²D/(2πc), s²/m. */
export function beta2FromD(D: number, lambda: number): number {
  return (-(lambda ** 2) * D) / (2 * Math.PI * c);
}

/** D = −2πcβ₂/λ², s/m². */
export function dFromBeta2(beta2: number, lambda: number): number {
  return (-2 * Math.PI * c * beta2) / lambda ** 2;
}

/** β₃ = (λ²/(2πc))² (S + 2D/λ), s³/m. */
export function beta3FromDS(D: number, S: number, lambda: number): number {
  return (lambda ** 2 / (2 * Math.PI * c)) ** 2 * (S + (2 * D) / lambda);
}

/** Dispersion length L_D = T₀²/|β₂| for a Gaussian of 1/e intensity half-width T₀, m (∞ when β₂ = 0). */
export function dispersionLength(T0: number, beta2: number): number {
  return T0 ** 2 / Math.abs(beta2);
}

/** Angular-frequency rms width σ_ω = 2πc σ_λ/λ² of a source with wavelength rms width σ_λ, rad/s. */
export function sigmaOmegaFromLambda(sigmaLambda: number, lambda: number): number {
  return (2 * Math.PI * c * sigmaLambda) / lambda ** 2;
}

export interface PulseBroadeningInput {
  /** Input rms width σ₀, s (> 0). */
  sigma0: number;
  /** s²/m. */
  beta2: number;
  /** s³/m. */
  beta3: number;
  /** Fibre length, m. */
  L: number;
  /** Source rms spectral width σ_ω, rad/s (0 for a coherent, transform-limited source). */
  sigmaOmega: number;
  /** Chirp parameter C (default 0). */
  chirp?: number;
}

/** Output rms width σ of a Gaussian pulse, Agrawal §2.4.2 (Marcuse 1980), s. NaN when σ₀ ≤ 0. */
export function gaussianPulseRmsWidth({ sigma0, beta2, beta3, L, sigmaOmega, chirp = 0 }: PulseBroadeningInput): number {
  if (!(sigma0 > 0)) return NaN;
  const V2 = (2 * sigmaOmega * sigma0) ** 2;
  const b2 = (beta2 * L) / (2 * sigma0 ** 2);
  const b3 = (beta3 * L) / (4 * sigma0 ** 3);
  const ratio2 = (1 + chirp * b2) ** 2 + (1 + V2) * b2 ** 2 + 0.5 * (1 + chirp ** 2 + V2) ** 2 * b3 ** 2;
  return sigma0 * Math.sqrt(ratio2);
}

/** Bit-rate limit 1/(4√(|β₂|L)) of a transform-limited Gaussian source at its optimum width, 1/s. */
export function transformLimitedBitRate(beta2: number, L: number): number {
  return 1 / (4 * Math.sqrt(Math.abs(beta2) * L));
}

const GOLDEN = (Math.sqrt(5) - 1) / 2;

/**
 * Output rms width minimised over the input width σ₀ (unchirped Gaussian, Agrawal §2.4.2 formula), s. 0 when
 * β₂ = β₃ = 0. Golden-section search in ln σ₀² over ±14 e-folds of the scale of the minimum; 120 iterations
 * shrink the bracket to < 1e-20 of its width, far below double precision of σ.
 */
export function optimumOutputRmsWidth(beta2: number, beta3: number, L: number, sigmaOmega: number): number {
  const a2 = Math.abs(beta2) * L, a3 = Math.abs(beta3) * L;
  const scale = Math.max(a2, (a3 / 4) ** (2 / 3), a3 * sigmaOmega);
  if (!(scale > 0)) return scale === 0 ? 0 : NaN;
  const width = (x: number) => gaussianPulseRmsWidth({ sigma0: Math.exp(x / 2), beta2, beta3, L, sigmaOmega });
  let lo = Math.log(scale) - 14, hi = Math.log(scale) + 14;
  let x1 = hi - GOLDEN * (hi - lo), x2 = lo + GOLDEN * (hi - lo);
  let f1 = width(x1), f2 = width(x2);
  for (let i = 0; i < 120; i++) {
    if (f1 < f2) { hi = x2; x2 = x1; f2 = f1; x1 = hi - GOLDEN * (hi - lo); f1 = width(x1); }
    else { lo = x1; x1 = x2; f1 = f2; x2 = lo + GOLDEN * (hi - lo); f2 = width(x2); }
  }
  return Math.min(f1, f2);
}

/** Dispersion state of a fibre at one wavelength for the length search: β₂, β₃ per metre and σ_ω. */
export interface ChannelDispersion {
  beta2: number;
  beta3: number;
  sigmaOmega: number;
  /** Extra rms spread per metre added in quadrature (modal dispersion of MMF), s/m; default 0. */
  extraRmsPerM?: number;
}

/** Output rms width at length L with the optimum input pulse, plus any extra spread in quadrature, s. */
export function channelRmsWidth(ch: ChannelDispersion, L: number): number {
  return Math.hypot(optimumOutputRmsWidth(ch.beta2, ch.beta3, L, ch.sigmaOmega), (ch.extraRmsPerM ?? 0) * L);
}

/**
 * Longest fibre with 4Bσ ≤ 1 (σ from `channelRmsWidth`, increasing in L), m. Bisection in ln L over
 * 1 mm … 1e9 m, 200 iterations or bracket width 1e-12 in ln L. ∞ when even 1e9 m meets the limit; 0 below 1 mm.
 */
export function dispersionLimitedLength(ch: ChannelDispersion, bitRate: number): number {
  const target = 1 / (4 * bitRate);
  if (!(target > 0)) return NaN;
  let lo = Math.log(1e-3), hi = Math.log(1e9);
  if (channelRmsWidth(ch, Math.exp(hi)) <= target) return Infinity;
  if (channelRmsWidth(ch, Math.exp(lo)) > target) return 0;
  for (let i = 0; i < 200 && hi - lo > 1e-12; i++) {
    const mid = 0.5 * (lo + hi);
    if (channelRmsWidth(ch, Math.exp(mid)) <= target) lo = mid;
    else hi = mid;
  }
  return Math.exp(0.5 * (lo + hi));
}

/** Channel state of a fibre with dispersion D and slope S at λ for a source of rms width σ_λ. */
export function channelAt(fiber: LinearDispersion, lambda: number, sigmaLambda: number, extraRmsPerM = 0): ChannelDispersion {
  return {
    beta2: beta2FromD(fiber.D, lambda),
    beta3: beta3FromDS(fiber.D, fiber.S, lambda),
    sigmaOmega: sigmaOmegaFromLambda(sigmaLambda, lambda),
    extraRmsPerM,
  };
}

/** Optical 3-dB bandwidth √(2 ln 2)/(2πσ) of a Gaussian impulse response of rms width σ, Hz. */
export function gaussianBandwidth(sigma: number): number {
  return GAUSSIAN_BANDWIDTH_RMS_PRODUCT / sigma;
}

/** rms width of the Gaussian impulse response with optical 3-dB bandwidth f, s. */
export function gaussianRmsFromBandwidth(f3dB: number): number {
  return GAUSSIAN_BANDWIDTH_RMS_PRODUCT / f3dB;
}

/** Group delay n_g L/c, s. */
export function groupDelay(L: number, groupIndex: number): number {
  return (groupIndex * L) / c;
}

/** Free spectral range c/(n_g L) of a recirculating loop of length L, Hz. */
export function loopFsr(L: number, groupIndex: number): number {
  return c / (groupIndex * L);
}

/** Thermal delay coefficient of bare/coated standard SMF-28, measured at 1535 nm: 37.4 ps/(km·K), s/(m·K). */
export const SMF_THERMAL_DELAY_COEFF = 37.4e-15;

/** Linear-about-1550 nm fibre presets. D in s/m², S in s/m³ at 1550 nm; α in dB/km (typical, for loss totals). */
export interface FiberPreset extends LinearDispersion {
  label: string;
  alphaDbPerKm: number;
}

const PS_NM_KM = 1e-6;
const PS_NM2_KM = 1e3;

const G652_AT_REF = sellmeierAt(LAMBDA_REF, G652_LAMBDA0, G652_S0);
/** Relative dispersion slope S/D of G.652 fibre at 1550 nm, 1/m (≈ 0.0033 nm⁻¹). */
export const G652_RDS = G652_AT_REF.S / G652_AT_REF.D;

/**
 * Typical values; a real fibre's datasheet takes precedence.
 * G.653: λ₀ = 1550 nm and S₀ = 0.085 ps/(nm²·km) (the G.653 maximum). G.655: |D| between 1 and 10 ps/(nm·km)
 * over 1530–1565 nm; NZ-DSF+ 4.5 and 0.05 (λ₀ = 1460 nm), NZ-DSF− −4 and 0.06. DCF: −80 ps/(nm·km), slope
 * matched to G.652 (equal RDS), so the pair compensates across the band.
 */
export const FIBER_PRESETS = {
  G652: { label: "SMF (G.652)", D: G652_AT_REF.D, S: G652_AT_REF.S, alphaDbPerKm: 0.2 },
  DSF: { label: "DSF (G.653)", D: 0, S: 0.085 * PS_NM2_KM, alphaDbPerKm: 0.21 },
  NZDSF_PLUS: { label: "NZ-DSF+ (G.655)", D: 4.5 * PS_NM_KM, S: 0.05 * PS_NM2_KM, alphaDbPerKm: 0.22 },
  NZDSF_MINUS: { label: "NZ-DSF− (G.655)", D: -4 * PS_NM_KM, S: 0.06 * PS_NM2_KM, alphaDbPerKm: 0.22 },
  DCF: { label: "DCF", D: -80 * PS_NM_KM, S: -80 * PS_NM_KM * G652_RDS, alphaDbPerKm: 0.5 },
} satisfies Record<string, FiberPreset>;

export type FiberPresetKey = keyof typeof FIBER_PRESETS;

/** D(λ) of a preset: the Sellmeier form for G.652, linear about 1550 nm for the others, s/m². */
export function presetDispersion(key: FiberPresetKey, lambda: number): number {
  return key === "G652"
    ? sellmeierDispersion(lambda, G652_LAMBDA0, G652_S0)
    : linearDispersion(FIBER_PRESETS[key], lambda);
}

/** Sellmeier-form fibre with an optional modal bandwidth–length product (multimode). */
export interface SellmeierFiber {
  label: string;
  /** m. */
  lambda0: number;
  /** s/m³. */
  S0: number;
  /** Modal bandwidth × length at 850 nm, Hz·m (0 for single-mode). */
  modalBandwidthLength: number;
}

const MHZ_KM = 1e9;

/**
 * Specification-limit pairs (λ₀, S₀max). SMF: ITU-T G.652. 50 µm MMF (OM2–OM4): 1295 ≤ λ₀ ≤ 1340 nm,
 * S₀ ≤ 0.105 ps/(nm²·km) for λ₀ ≤ 1310 nm; 62.5 µm (OM1): 1320 ≤ λ₀ ≤ 1365 nm, S₀ ≤ 0.11 for λ₀ ≤ 1348 nm
 * (IEC 60793-2-10, as quoted in Prysmian OM1/OM3 datasheets). Modal bandwidth at 850 nm (ISO/IEC 11801):
 * OM1 200 and OM2 500 MHz·km overfilled launch; OM3 2000 and OM4 4700 MHz·km effective modal bandwidth.
 */
export const SELLMEIER_FIBERS = {
  SMF: { label: "SMF (G.652)", lambda0: 1310e-9, S0: 0.092 * PS_NM2_KM, modalBandwidthLength: 0 },
  OM1: { label: "OM1 62.5/125 µm", lambda0: 1320e-9, S0: 0.11 * PS_NM2_KM, modalBandwidthLength: 200 * MHZ_KM },
  OM2: { label: "OM2 50/125 µm", lambda0: 1310e-9, S0: 0.105 * PS_NM2_KM, modalBandwidthLength: 500 * MHZ_KM },
  OM3: { label: "OM3 50/125 µm", lambda0: 1310e-9, S0: 0.105 * PS_NM2_KM, modalBandwidthLength: 2000 * MHZ_KM },
  OM4: { label: "OM4 50/125 µm", lambda0: 1310e-9, S0: 0.105 * PS_NM2_KM, modalBandwidthLength: 4700 * MHZ_KM },
} satisfies Record<string, SellmeierFiber>;

export type SellmeierFiberKey = keyof typeof SELLMEIER_FIBERS;
