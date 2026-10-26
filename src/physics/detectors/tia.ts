/**
 * Op-amp gain-bandwidth and transimpedance amplifiers (TIA). SI units: Ω, F, Hz, V/√Hz, A/√Hz. Invalid inputs give NaN.
 *
 * - Single-pole op amp A(f) = A₀/(1 + j·f/f₀), GBW = A₀·f₀; with feedback fraction β the closed loop has gain
 *   A₀/(1 + β·A₀) and bandwidth f₀·(1 + β·A₀), so gain × bandwidth stays GBW. S. Franco, Design with Operational
 *   Amplifiers and Analog Integrated Circuits, 4th ed. (McGraw-Hill 2015), ch. 6.
 * - TIA with feedback R_F ∥ C_F and total input capacitance C_S: Butterworth (Q = 1/√2) bandwidth
 *   f₋₃dB = √(GBW/(2π·R_F·C_S)) and input-referred current noise density
 *   i² = i_n² + 4k_B·T/R_F + (e_n/R_F)² + (e_n·2π·f·C_S)², integrated through the Butterworth response (a brick-wall
 *   limit F, SBOA122 eq. 13, replaces f² by F²/3 and misses the e_n·C noise above f₋₃dB). X. Ramus, Transimpedance Considerations for High-Speed Amplifiers, TI SBOA122 (2009), eqs. 6–7, 12, 13;
 *   J. G. Graeme, Photodiode Amplifiers: Op Amp Solutions (McGraw-Hill 1996).
 */

import { k_B } from "../constants";

export interface ClosedLoop {
  /** Open-loop −3 dB frequency GBW/A₀, Hz. */
  openLoopBandwidth: number;
  /** Closed-loop gain A₀/(1 + β·A₀), V/V. */
  gain: number;
  /** Closed-loop −3 dB frequency GBW/A_cl, Hz. */
  bandwidth: number;
}

/** Closed-loop gain and bandwidth of a single-pole op amp (DC gain A₀, GBW in Hz) with feedback fraction β. */
export function singlePoleClosedLoop(a0: number, gbw: number, beta: number): ClosedLoop {
  if (!(a0 > 0) || !(gbw > 0) || !(beta >= 0)) return { openLoopBandwidth: NaN, gain: NaN, bandwidth: NaN };
  const gain = a0 / (1 + beta * a0);
  return { openLoopBandwidth: gbw / a0, gain, bandwidth: gbw / gain };
}

/** Magnitude A₀/√((1 + β·A₀)² + (f/f₀)²) of the closed-loop gain at frequency f (β = 0 gives the open loop). */
export function closedLoopMagnitude(a0: number, gbw: number, beta: number, f: number): number {
  if (!(a0 > 0) || !(gbw > 0) || !(beta >= 0) || !(f >= 0)) return NaN;
  return a0 / Math.hypot(1 + beta * a0, f / (gbw / a0));
}

/** Butterworth TIA bandwidth √(GBW/(2π·R_F·C_S)), Hz (SBOA122 eq. 12). */
export function tiaBandwidth(gbw: number, feedbackR: number, inputC: number): number {
  if (!(gbw > 0) || !(feedbackR > 0) || !(inputC > 0)) return NaN;
  return Math.sqrt(gbw / (2 * Math.PI * feedbackR * inputC));
}

/**
 * Feedback capacitance for Q = 1/√2: SBOA122 eq. 7 with C_S ≫ C_F and A₀ ≫ 1 reads
 * Q = ω₀/(1/(R_F·C_S) + 2π·GBW·C_F/C_S), so C_F = (√2·ω₀·C_S − 1/R_F)/(2π·GBW), F. Tends to √(C_S/(π·R_F·GBW)).
 */
export function tiaButterworthCf(gbw: number, feedbackR: number, inputC: number): number {
  const omega0 = 2 * Math.PI * tiaBandwidth(gbw, feedbackR, inputC);
  const cf = (Math.SQRT2 * omega0 * inputC - 1 / feedbackR) / (2 * Math.PI * gbw);
  return cf > 0 ? cf : NaN;
}

export interface TiaNoiseInputs {
  /** Amplifier input current noise density i_n, A/√Hz. */
  currentNoise: number;
  /** Amplifier input voltage noise density e_n, V/√Hz. */
  voltageNoise: number;
  /** Feedback resistance R_F, Ω. */
  feedbackR: number;
  /** Total input capacitance C_S (photodiode + amplifier input), F. */
  inputC: number;
  /** Temperature of R_F, K. */
  temperature: number;
}

export interface TiaNoiseTerms {
  /** Each term as a squared current density, A²/Hz. */
  current: number;
  johnson: number;
  voltage: number;
  /** e_n·2π·f·C_S term at frequency f (spot) or averaged over 0…F (band). */
  capacitive: number;
  total: number;
}

function terms(p: TiaNoiseInputs, fSquared: number): TiaNoiseTerms {
  const { currentNoise: iN, voltageNoise: eN, feedbackR: rf, inputC: cs, temperature: T } = p;
  if (!(iN >= 0) || !(eN >= 0) || !(rf > 0) || !(cs >= 0) || !(T >= 0) || !(fSquared >= 0)) {
    return { current: NaN, johnson: NaN, voltage: NaN, capacitive: NaN, total: NaN };
  }
  const current = iN ** 2;
  const johnson = (4 * k_B * T) / rf;
  const voltage = (eN / rf) ** 2;
  const capacitive = (eN * 2 * Math.PI * cs) ** 2 * fSquared;
  return { current, johnson, voltage, capacitive, total: current + johnson + voltage + capacitive };
}

/** Input-referred spot noise density terms at frequency f, A²/Hz. */
export function tiaSpotNoise(p: TiaNoiseInputs, f: number): TiaNoiseTerms {
  return terms(p, f * f);
}

/**
 * ∫₀ᵘ dx/(1 + x⁴) and ∫₀ᵘ x²/(1 + x⁴) dx by partial fractions, both π/(2√2) as u → ∞ (Gradshteyn & Ryzhik 3.241.2). Series below u = 0.01, where
 * the closed forms cancel.
 */
function butterworthMoments(u: number): { m0: number; m2: number } {
  if (u === Infinity) return { m0: Math.PI / (2 * Math.SQRT2), m2: Math.PI / (2 * Math.SQRT2) };
  if (u < 0.01) {
    const u4 = u ** 4;
    return { m0: u * (1 - u4 / 5 + (u4 * u4) / 9), m2: u ** 3 * (1 / 3 - u4 / 7 + (u4 * u4) / 11) };
  }
  const log = Math.log((u * u + Math.SQRT2 * u + 1) / (u * u - Math.SQRT2 * u + 1)) / (4 * Math.SQRT2);
  const atan = (Math.atan(Math.SQRT2 * u + 1) + Math.atan(Math.SQRT2 * u - 1)) / (2 * Math.SQRT2);
  return { m0: atan + log, m2: atan - log };
}

/**
 * Input-referred noise through the Butterworth TIA response |H|² = 1/(1 + (f/f₀)⁴) and a brick-wall post-filter at B
 * (B = ∞ for none). Returns the density averaged over the noise-equivalent bandwidth, A²/Hz, and that bandwidth
 * f₀·∫₀^{B/f₀} dx/(1 + x⁴), Hz; total × enbw = i²_rms. The e_n·C term rises as f², so most of its power lies above f₀:
 * with B ≫ f₀ it weighs f₀³·π/(2√2), not the brick-wall f₀³/3 of SBOA122 eq. 13.
 */
export function tiaFilteredNoise(p: TiaNoiseInputs, f0: number, band: number): { terms: TiaNoiseTerms; enbw: number } {
  if (!(f0 > 0) || !(band > 0)) return { terms: terms(p, NaN), enbw: NaN };
  const { m0, m2 } = butterworthMoments(band / f0);
  return { terms: terms(p, f0 * f0 * (m2 / m0)), enbw: f0 * m0 };
}
