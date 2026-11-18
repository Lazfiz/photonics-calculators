/**
 * Signal-to-noise page: SNR of a b × b binned super-pixel, with background, dark charge, read noise, frame averaging
 * and the Rose criterion. Electrons (e⁻) per super-pixel per frame; the exposure is in s. Model tier: textbook.
 * SNR = S/√(S + S_bg + D + σ_read²) (J. R. Janesick, Photon Transfer, SPIE 2007, doi:10.1117/3.725073), averaging N
 * frames of independent noise gives SNR_N = √N·SNR (ch. 5), and the Rose criterion SNR ≥ 5 (A. Rose, Vision: Human and Electronic,
 * Plenum 1973). The noise sum is `cameraNoise` and the binning rule `binnedReadNoise`
 * in `detectors/camera-snr.ts`, the frame count `framesForSnr`. A separate module because camera-snr is also imported
 * by other pages.
 */

import { binnedReadNoise, cameraNoise, framesForSnr } from "../detectors/camera-snr";

/** Rose criterion: SNR needed to see a feature reliably. */
export const ROSE_SNR = 5;

export type BinningMode = "charge" | "digital";

export interface SignalToNoiseInputs {
  /** Signal and background photons per pixel per exposure. */
  signalPhotons: number;
  backgroundPhotons: number;
  quantumEfficiency: number;
  /** Read noise per pixel, e⁻ rms. */
  read: number;
  /** Dark current per pixel, e⁻/s. */
  darkRate: number;
  /** Exposure time, s. */
  exposure: number;
  /** Binning factor b (integer, b × b pixels). */
  binning: number;
  binningMode: BinningMode;
  /** Averaged frames (an integer). */
  frames: number;
  targetSnr: number;
}

export interface NoiseBudgetTerm {
  name: string;
  /** Variance, e⁻². */
  variance: number;
}

export interface SignalToNoiseSummary {
  /** Signal, background and dark charge of the super-pixel, e⁻. */
  signal: number;
  background: number;
  dark: number;
  /** Read noise of the super-pixel, e⁻ rms. */
  readBinned: number;
  /** Total noise of one frame, e⁻ rms. */
  noise: number;
  /** One-frame SNR (NaN when the noise is 0) and the SNR after averaging `frames` frames. */
  snr: number;
  snrAveraged: number;
  /** Frames needed for the target SNR; NaN without signal. */
  framesNeeded: number;
  budget: NoiseBudgetTerm[];
  /** noise², e⁻². */
  totalVariance: number;
  dominant: NoiseBudgetTerm;
  /** snrAveraged ≥ ROSE_SNR. */
  detectable: boolean;
}

export function signalToNoiseSummary(i: SignalToNoiseInputs): SignalToNoiseSummary {
  // Per super-pixel and frame: b² pixels add their photoelectrons and dark charge.
  const pixels = i.binning ** 2;
  const readBinned = binnedReadNoise(i.read, i.binning, i.binningMode);
  const dark = i.darkRate * i.exposure * pixels;
  const signal = i.quantumEfficiency * i.signalPhotons * pixels;
  const background = i.quantumEfficiency * i.backgroundPhotons * pixels;
  const noise = cameraNoise({ signal, background, dark, read: readBinned });
  const snr = noise > 0 ? signal / noise : NaN;
  const snrAveraged = snr * Math.sqrt(i.frames);
  // Variance budget of one frame: each Poisson term adds its mean, the read noise its square.
  const budget = [
    { name: "Signal shot noise", variance: signal },
    { name: "Background shot noise", variance: background },
    { name: "Dark-charge shot noise", variance: dark },
    { name: "Read noise", variance: readBinned ** 2 },
  ];
  return {
    signal, background, dark, readBinned, noise, snr, snrAveraged,
    framesNeeded: framesForSnr(snr, i.targetSnr),
    budget,
    totalVariance: noise ** 2,
    dominant: budget.reduce((a, b) => (b.variance > a.variance ? b : a)),
    detectable: snrAveraged >= ROSE_SNR,
  };
}
