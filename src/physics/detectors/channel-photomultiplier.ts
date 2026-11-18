/**
 * Channel photomultiplier page summary: anode sensitivity, photoelectron and dark rates, counting and analog SNR and
 * the pulse resolution. SI units (m, A, s) except the gain and the electrons per pulse. The physics is in
 * `electron-multiplier.ts` (Hamamatsu 2017 §4.3.7; Wiza 1979); this module only combines it.
 */

import { q } from "../constants";
import { analogSnr, anodeSensitivity, photonCountingSnr, pulseResolutionFwhm } from "./electron-multiplier";

/** Gain above which a channel saturates (PerkinElmer CPM data sheet); the analog output is then not proportional. */
export const CHANNEL_SATURATION_GAIN = 1e7;

export interface ChannelPmtInput {
  /** m */
  wavelength: number;
  quantumEff: number;
  gain: number;
  /** Excess noise factor F. */
  excessNoise: number;
  /** Dark counts/s (photocathode emission). */
  darkRate: number;
  /** Photons/s. */
  photonRate: number;
  /** Gate time, s. */
  gate: number;
  photonsPerPulse: number;
  /** Linear limit, electrons per pulse. */
  linearLimit: number;
}

export interface ChannelPmtSummary {
  /** Anode radiant sensitivity, A/W. */
  sensitivity: number;
  /** Photoelectron rate, 1/s. */
  signalRate: number;
  /** A */
  signalCurrent: number;
  /** A */
  darkCurrent: number;
  countSnr: number;
  analogSnr: number;
  /** Photoelectrons per pulse. */
  photoelectrons: number;
  /** Electrons at the anode per pulse. */
  pulseElectrons: number;
  linear: boolean;
  saturated: boolean;
  /** Relative FWHM of the pulse charge; NaN when the pulse is clipped. */
  resolution: number;
  warnings: string[];
}

export function channelPmtSummary(p: ChannelPmtInput): ChannelPmtSummary {
  const sensitivity = anodeSensitivity(p.quantumEff, p.wavelength, p.gain);
  const signalRate = p.photonRate * p.quantumEff;
  const signalCurrent = signalRate * q * p.gain;
  const darkCurrent = p.darkRate * q * p.gain; // dark counts come from the photocathode only
  const countSnr = photonCountingSnr(signalRate, p.darkRate, p.gate);
  const analog = analogSnr(signalRate, p.darkRate, 1 / (2 * p.gate), p.excessNoise);
  const photoelectrons = p.photonsPerPulse * p.quantumEff;
  const pulseElectrons = photoelectrons * p.gain;
  const linear = pulseElectrons <= p.linearLimit;
  const saturated = p.gain >= CHANNEL_SATURATION_GAIN;
  const resolution = linear ? pulseResolutionFwhm(photoelectrons, p.excessNoise) : NaN;
  const warnings: string[] = [];
  if (!linear) warnings.push("The pulse exceeds the linear limit: it is clipped and the resolution is not defined.");
  if (saturated) warnings.push("Gain at or above 10⁷: the channel saturates and the analog output is no longer proportional to the input.");
  return {
    sensitivity, signalRate, signalCurrent, darkCurrent, countSnr, analogSnr: analog, photoelectrons, pulseElectrons,
    linear, saturated, resolution, warnings,
  };
}
