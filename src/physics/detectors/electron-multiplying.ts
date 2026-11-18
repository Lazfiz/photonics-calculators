/**
 * EMCCD vs sCMOS pixel SNR at a given signal (page summary). Electrons per pixel per frame; the noise model and the EM
 * register's excess noise factor are in camera-snr.ts (Janesick 2007; Robbins & Hadwen 2003, doi:10.1109/TED.2003.813462).
 */

import { cameraSnr, emExcessNoiseFactorSq } from "./camera-snr";

export interface EmVsScmosInputs {
  /** Mean photoelectrons, e⁻. */
  signal: number;
  /** Mean dark charge, e⁻. */
  dark: number;
  /** EMCCD read noise at the output amplifier, e⁻ rms. */
  emccdRead: number;
  /** sCMOS read noise, e⁻ rms. */
  scmosRead: number;
  /** EM gain G. */
  gain: number;
  /** Gain-register stages N. */
  stages: number;
}

/** EMCCD pixel SNR with the gain register's F²; NaN if G > 2^N. */
export function emccdSnrAt(p: Omit<EmVsScmosInputs, "scmosRead">, signal: number = p.signal, gain: number = p.gain): number {
  return cameraSnr({ signal, dark: p.dark, read: p.emccdRead, gain, excessNoiseFactorSq: emExcessNoiseFactorSq(gain, p.stages) });
}

/** sCMOS pixel SNR: G = 1, F² = 1. */
export function scmosSnrAt(p: Pick<EmVsScmosInputs, "dark" | "scmosRead">, signal: number): number {
  return cameraSnr({ signal, dark: p.dark, read: p.scmosRead });
}

export function emVsScmosSummary(p: EmVsScmosInputs) {
  const enf2 = emExcessNoiseFactorSq(p.gain, p.stages);
  const emccdSnr = emccdSnrAt(p);
  const scmosSnr = scmosSnrAt(p, p.signal);
  const winner = !Number.isFinite(emccdSnr) || !Number.isFinite(scmosSnr) ? "—" : Math.abs(emccdSnr - scmosSnr) < 1e-9 ? "tie" : emccdSnr > scmosSnr ? "EMCCD" : "sCMOS";
  return { enf2, emccdSnr, scmosSnr, winner };
}
