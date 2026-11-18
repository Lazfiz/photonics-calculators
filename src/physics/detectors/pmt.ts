/**
 * Photomultiplier-tube page summary: gain and noise figure of a chain of equal dynodes, the photocurrent and the
 * analog SNR. SI units (A, Hz, 1/s). The physics is in `electron-multiplier.ts` (Hamamatsu 2017 §4.3.7); this module
 * only combines it.
 */

import { q } from "../constants";
import { analogSnr, dynodeExcessNoise, dynodeGain, uniformDynodes } from "./electron-multiplier";

export interface PmtInput {
  /** Number of dynodes; rounded to an integer. */
  numDynodes: number;
  /** Secondary emission ratio δ of every dynode. */
  delta: number;
  quantumEff: number;
  /** Anode dark current, A. */
  darkCurrent: number;
  /** Photons/s. */
  photonRate: number;
  /** Bandwidth, Hz. */
  bandwidth: number;
}

export interface PmtSummary {
  gain: number;
  /** Excess noise factor F of the chain. */
  excessNoise: number;
  /** δ/(δ − 1), the limit of F for infinitely many stages. */
  excessNoiseLimit: number;
  /** Photoelectrons/s at the cathode. */
  signalElectrons: number;
  /** Anode signal current, A. */
  signalCurrent: number;
  /** Anode dark current referred to the cathode, electrons/s. */
  darkElectrons: number;
  snr: number;
}

export function pmtSummary(p: PmtInput): PmtSummary {
  const chain = uniformDynodes(p.delta, Math.round(p.numDynodes));
  const gain = dynodeGain(chain);
  const excessNoise = dynodeExcessNoise(chain);
  const signalElectrons = p.photonRate * p.quantumEff;
  const signalCurrent = signalElectrons * q * gain;
  const darkElectrons = p.darkCurrent / (q * gain);
  return {
    gain, excessNoise, excessNoiseLimit: p.delta / (p.delta - 1), signalElectrons, signalCurrent, darkElectrons,
    snr: analogSnr(signalElectrons, darkElectrons, p.bandwidth, excessNoise),
  };
}

/** SNR for another δ with the cathode dark emission held at `darkElectrons` (only F changes with δ). */
export function pmtSnrAtDelta(delta: number, numDynodes: number, signalElectrons: number, darkElectrons: number, bandwidth: number): number {
  return analogSnr(signalElectrons, darkElectrons, bandwidth, dynodeExcessNoise(uniformDynodes(delta, Math.round(numDynodes))));
}
