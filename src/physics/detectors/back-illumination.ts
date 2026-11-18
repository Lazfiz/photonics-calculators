/**
 * Back-illumination page: effective QE of a front- and a back-illuminated pixel and the SNR gain of the QE ratio.
 * Fractions (0–1) and dB. Invalid inputs give NaN.
 *
 * QE_eff = min(1, QE·microlens gain)·CFA transmission; SNR gain √r (shot-limited) or r (read-limited) for a QE ratio r,
 * an amplitude ratio, so dB = 20·log₁₀: J. R. Janesick, Photon Transfer (SPIE Press 2007), doi:10.1117/3.725073.
 */

import { qeRatioSnrGain } from "./noise";

export type NoiseRegime = "shot" | "read";

/** The two noise regimes of the page, in display order. */
export const NOISE_REGIMES: readonly NoiseRegime[] = ["shot", "read"];

export interface BackIlluminationInputs {
  /** Front-illuminated peak QE, 0–1. */
  fiQE: number;
  /** Back-illuminated peak QE, 0–1. */
  biQE: number;
  /** Colour-filter-array transmission, 0–1. */
  cfa: number;
  /** Microlens fill-factor gain, ≥ 1. */
  microlensGain: number;
  regime: NoiseRegime;
}

export interface BackIlluminationSummary {
  effectiveFi: number;
  effectiveBi: number;
  /** Effective BI/FI QE; NaN if the front-side QE is 0. */
  qeRatio: number;
  /** SNR gain (amplitude ratio); NaN unless both QEs are > 0. */
  snrGain: number;
  /** 20·log₁₀(SNR gain). */
  snrGainDb: number;
}

export function backIlluminationSummary({ fiQE, biQE, cfa, microlensGain, regime }: BackIlluminationInputs): BackIlluminationSummary {
  // The microlens gain cannot push the effective QE above 1.
  const effectiveFi = Math.min(1, fiQE * microlensGain) * cfa;
  const effectiveBi = Math.min(1, biQE * microlensGain) * cfa;
  const qeRatio = effectiveFi > 0 ? effectiveBi / effectiveFi : NaN;
  const snrGain = qeRatioSnrGain(qeRatio, regime);
  return { effectiveFi, effectiveBi, qeRatio, snrGain, snrGainDb: 20 * Math.log10(snrGain) };
}
