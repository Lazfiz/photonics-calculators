/**
 * Op-amp gain-bandwidth and transimpedance amplifiers (TIA). SI units: Ω, F, Hz, V/√Hz, A/√Hz. Invalid inputs give NaN.
 *
 * - Single-pole op amp A(f) = A₀/(1 + j·f/f₀), GBW = A₀·f₀; with feedback fraction β the closed loop has gain
 *   A₀/(1 + β·A₀) and bandwidth f₀·(1 + β·A₀), so gain × bandwidth stays GBW. S. Franco, Design with Operational
 *   Amplifiers and Analog Integrated Circuits, 4th ed. (McGraw-Hill 2015), ch. 6.
 * - TIA with feedback R_F ∥ C_F and total input capacitance C_S: Butterworth (Q = 1/√2) bandwidth
 *   f₋₃dB = √(GBW/(2π·R_F·C_S)) and input-referred current noise density
 *   i² = i_n² + 4k_B·T/R_F + (e_n/R_F)² + (e_n·2π·f·C_S)², whose band average to a brick-wall limit F replaces f² by
 *   F²/3. X. Ramus, Transimpedance Considerations for High-Speed Amplifiers, TI SBOA122 (2009), eqs. 6–7, 12, 13;
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

/** Input-referred noise density averaged over a brick-wall band 0…F (SBOA122 eq. 13), A²/Hz; × F gives A². */
export function tiaBandNoise(p: TiaNoiseInputs, band: number): TiaNoiseTerms {
  return terms(p, (band * band) / 3);
}
