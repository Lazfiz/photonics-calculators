/**
 * EM gain benefit at one operating point (page summary): SNR with the gain register, at G = 1 and through the
 * conventional output, and the crossover signal. Electrons per pixel per frame; noise model and F² in camera-snr.ts
 * (Janesick 2007; Robbins & Hadwen 2003, doi:10.1109/TED.2003.813462).
 */

import { cameraSnr, emCrossoverSignal, emExcessNoiseFactorSq, emStageProbability } from "./camera-snr";

export interface EmGainInputs {
  gain: number;
  /** Input signal, e⁻. */
  signal: number;
  /** Clock-induced charge, e⁻. */
  cic: number;
  /** EM-amplifier read noise, e⁻ rms. */
  read: number;
  /** Gain-register stages N. */
  stages: number;
  /** Read noise of the conventional output, e⁻ rms. */
  conventionalRead: number;
}

/** SNR with the EM register at gain G (the register's F²) for the given signal. */
export function emGainSnrAt(p: Pick<EmGainInputs, "cic" | "read" | "stages">, signal: number, gain: number): number {
  return cameraSnr({ signal, cic: p.cic, read: p.read, gain, excessNoiseFactorSq: emExcessNoiseFactorSq(gain, p.stages) });
}

/** SNR of the same EM amplifier at unity gain (G = 1, F² = 1). */
export function emGainSnrUnity(p: Pick<EmGainInputs, "cic" | "read">, signal: number): number {
  return cameraSnr({ signal, cic: p.cic, read: p.read });
}

export function emGainSummary(p: EmGainInputs) {
  const enf2 = emExcessNoiseFactorSq(p.gain, p.stages);
  const stageProbability = emStageProbability(p.gain, p.stages);
  const snrWithEM = emGainSnrAt(p, p.signal, p.gain);
  const snrWithoutEM = emGainSnrUnity(p, p.signal);
  // The same sensor read through its conventional (non-EM) amplifier: G = 1, F² = 1, lower read noise.
  const snrConventional = cameraSnr({ signal: p.signal, cic: p.cic, read: p.conventionalRead });
  const crossover = emCrossoverSignal({ gain: p.gain, excessNoiseFactorSq: enf2, emRead: p.read, conventionalRead: p.conventionalRead, cic: p.cic });
  return {
    enf2, stageProbability, snrWithEM, snrWithoutEM, snrConventional, crossover,
    emBenefit: snrWithEM / snrWithoutEM,
    emVsConventional: snrWithEM / snrConventional,
    outputSignal: p.signal * p.gain,
    effectiveRead: p.read / p.gain,
  };
}
