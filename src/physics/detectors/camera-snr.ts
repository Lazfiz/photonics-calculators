/**
 * Camera pixel SNR, EM gain and full-well limits. Signals and noise in electrons (e⁻) per pixel per frame, so the
 * functions are unit-free except where a name says otherwise. Invalid inputs give NaN.
 *
 * - Pixel SNR (J. R. Janesick, Photon Transfer, SPIE 2007, doi:10.1117/3.725073): Poisson signal S, dark charge D and
 *   clock-induced charge C, read noise σ_r. Behind a gain register of mean gain G and excess noise factor F²
 *   SNR = S/√(F²·(S + D + C) + (σ_r/G)²); a conventional sensor has G = 1 and F² = 1.
 * - EM register (M. S. Robbins, B. J. Hadwen, IEEE Trans. Electron Devices 50, 1227 (2003),
 *   doi:10.1109/TED.2003.813462): N stages that each multiply an electron with probability p give G = (1 + p)^N and
 *   F² = 2(G − 1)·G^(−(N+1)/N) + 1/G. The Galton–Watson variance of a binomial stage, Var = p(1 − p), gives the same
 *   expression as F² = 1 + (1 − p)(1 − 1/G)/(1 + p). F² → 2 − 1/G when N → ∞ at fixed G, and F² = 1 at p = 1.
 *   The N → ∞ form puts an SNR optimum at G = 2σ_r²/(S + C); with N = 604 F² peaks (1.978) near G = 300 and then falls
 *   slowly, so in the read-noise-limited regime the SNR keeps rising with G instead.
 * - Dynamic range 20·log₁₀(S_max/σ_floor). Under EM gain the gain register's well caps the input charge at
 *   W_reg/G while the read noise referred to the input is σ_r/G, so DR ≈ 20·log₁₀(W_reg/σ_r) whatever G
 *   (Andor iXon Ultra specifications: 180 ke⁻ pixel well, 800 ke⁻ gain-register well).
 * - Pixel capacitance C = N_well·q/V_swing; conversion gain q/C. Quantization noise of an ADC step Δ is Δ/√12.
 */

import { q } from "../constants";

/** Stages in the gain register of the e2v CCD201 (iXon Ultra 888), the usual EMCCD default. */
export const EM_REGISTER_STAGES = 604;

/** Per-stage multiplication probability p = G^(1/N) − 1 of an N-stage register with mean gain G; NaN if p > 1. */
export function emStageProbability(gain: number, stages: number): number {
  if (!(gain >= 1) || !(stages >= 1)) return NaN;
  const p = Math.expm1(Math.log(gain) / stages);
  return p <= 1 + 1e-12 ? Math.min(p, 1) : NaN;
}

/** Robbins & Hadwen excess noise factor F² = 2(G − 1)·G^(−(N+1)/N) + 1/G of an N-stage EM register. */
export function emExcessNoiseFactorSq(gain: number, stages: number): number {
  const p = emStageProbability(gain, stages);
  if (!Number.isFinite(p)) return NaN;
  // G^(−(N+1)/N) = 1/(G·(1 + p)).
  return (2 * (1 - 1 / gain)) / (1 + p) + 1 / gain;
}

export interface CameraSnrInputs {
  /** Mean photoelectrons, e⁻. */
  signal: number;
  /** Read noise at the output amplifier, e⁻ rms. */
  read: number;
  /** Mean dark charge, e⁻. */
  dark?: number;
  /** Mean clock-induced charge, e⁻. */
  cic?: number;
  /** Mean background photoelectrons under the signal, e⁻ (subtracted, so only its shot noise remains). */
  background?: number;
  /** Mean gain ahead of the read noise (1 for a conventional sensor). */
  gain?: number;
  /** Excess noise factor F² of that gain (1 for a conventional sensor). */
  excessNoiseFactorSq?: number;
}

/** Total noise √(F²·(S + B + D + C) + (σ_r/G)²) referred to the input, e⁻ rms. */
export function cameraNoise({ signal, read, dark = 0, cic = 0, background = 0, gain = 1, excessNoiseFactorSq = 1 }: CameraSnrInputs): number {
  if (!(signal >= 0) || !(read >= 0) || !(dark >= 0) || !(cic >= 0) || !(background >= 0) || !(gain >= 1) || !(excessNoiseFactorSq >= 1)) {
    return NaN;
  }
  return Math.sqrt(excessNoiseFactorSq * (signal + background + dark + cic) + (read / gain) ** 2);
}

/** SNR = S/√(F²·(S + B + D + C) + (σ_r/G)²); NaN when the noise is zero. */
export function cameraSnr(inputs: CameraSnrInputs): number {
  const noise = cameraNoise(inputs);
  return noise > 0 ? inputs.signal / noise : NaN;
}

/**
 * Read noise of a b×b super-pixel, e⁻ rms. Charge binning (CCD) sums the charge before the amplifier, so it is read
 * once: σ_r. Digital binning (CMOS) adds b² independent reads: b·σ_r (Janesick, Photon Transfer, ch. 5).
 */
export function binnedReadNoise(read: number, binning: number, mode: "charge" | "digital"): number {
  if (!(read >= 0) || !(binning >= 1)) return NaN;
  return mode === "charge" ? read : binning * read;
}

/** Largest input charge before a well fills: min(pixel well, register well/G), e⁻. */
export function emMaxSignal(pixelWell: number, registerWell: number, gain: number): number {
  if (!(pixelWell > 0) || !(registerWell > 0) || !(gain >= 1)) return NaN;
  return Math.min(pixelWell, registerWell / gain);
}

/** Dynamic range 20·log₁₀(S_max/σ_floor), dB. */
export function dynamicRangeDb(maxSignal: number, noiseFloor: number): number {
  if (!(maxSignal > 0) || !(noiseFloor > 0)) return NaN;
  return 20 * Math.log10(maxSignal / noiseFloor);
}

/** Sense-node capacitance N_well·q/V_swing that a full well swings by V_swing (V), F. */
export function pixelCapacitance(fullWell: number, voltageSwing: number): number {
  if (!(fullWell > 0) || !(voltageSwing > 0)) return NaN;
  return (fullWell * q) / voltageSwing;
}

/** Quantization noise Δ/√12 of an ADC step of Δ electrons per DN, e⁻ rms. */
export function quantizationNoise(electronsPerDn: number): number {
  if (!(electronsPerDn >= 0)) return NaN;
  return electronsPerDn / Math.sqrt(12);
}

/**
 * Illustrative compressive response S·(1 − n·S/W) up to the full well W, flat at W·(1 − n) above it: the deviation from
 * the ideal line grows as S² and reaches −n·W at full well. Monotonic for n ≤ 0.5 (the slope 1 − 2n·S/W stays ≥ 0).
 */
export function compressiveResponse(signal: number, fullWell: number, nonlinearity: number): number {
  if (!(signal >= 0) || !(fullWell > 0) || !(nonlinearity >= 0 && nonlinearity <= 0.5)) return NaN;
  const s = Math.min(signal, fullWell);
  return s * (1 - (nonlinearity * s) / fullWell);
}
