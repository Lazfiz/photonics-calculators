/**
 * Linear-mode APD page summary: responsivity, multiplied signal, noise currents, electrical SNR, optimum gain and NEP of
 * an APD receiver. SI units (m, W, A, Hz, Ω, K). The physics is in `apd.ts` (McIntyre 1966, Personick 1977); this module
 * only combines it.
 */

import { c, h, q } from "../constants";
import { APD_K_TABLE, apdReceiver, type ApdReceiverInput, type ApdReceiverNoise, excessNoiseFactor, optimumGain } from "./apd";

/** Largest gain the page offers; an optimum above it is shown as "> M_MAX". */
export const APD_GAIN_MAX = 1e4;

export const LINEAR_APD_MATERIALS = ["si", "ingaas", "ge", "custom"] as const;
export type LinearApdMaterial = (typeof LINEAR_APD_MATERIALS)[number];

/** Ionisation ratio of a material from the table; `customK` for "custom". */
export function linearApdIonizationRatio(material: LinearApdMaterial, customK: number): number {
  return material === "custom" ? customK : APD_K_TABLE.find((m) => m.id === material)!.k;
}

export interface LinearApdInput {
  gain: number;
  /** Ionisation ratio k (already resolved from the material). */
  k: number;
  qe: number;
  /** Bandwidth, Hz. */
  bandwidth: number;
  /** Bulk dark current, A (multiplied). */
  darkCurrent: number;
  /** m */
  wavelength: number;
  /** Incident power, W. */
  power: number;
  /** Ω */
  loadResistance: number;
  /** K */
  temperature: number;
}

export interface LinearApdSummary {
  /** Unity-gain responsivity, A/W. */
  responsivity: number;
  receiver: ApdReceiverInput;
  excessNoise: number;
  r: ApdReceiverNoise;
  /** Total rms noise current, A. */
  totalNoise: number;
  /** NEP at the operating gain from the noise with no light, W. */
  nep: number;
  optimumGain: number;
  /** The optimum gain capped at `APD_GAIN_MAX`. */
  optimumGainShown: number;
  snrAtOptimum: number;
}

export function linearApdSummary(p: LinearApdInput): LinearApdSummary {
  const responsivity = (p.qe * q * p.wavelength) / (h * c);
  const receiver: ApdReceiverInput = {
    photocurrent: p.power * responsivity, darkCurrent: p.darkCurrent, k: p.k, bandwidth: p.bandwidth,
    loadResistance: p.loadResistance, temperature: p.temperature,
  };
  const excessNoise = excessNoiseFactor(p.gain, p.k);
  const r = apdReceiver(receiver, p.gain);
  const darkShot = 2 * q * p.darkCurrent * p.gain * p.gain * excessNoise * p.bandwidth;
  const nep = Math.sqrt(darkShot + r.thermal) / (p.gain * responsivity);
  const optimum = optimumGain(receiver);
  const optimumGainShown = Math.min(optimum, APD_GAIN_MAX);
  return {
    responsivity, receiver, excessNoise, r, totalNoise: Math.sqrt(r.shot + r.thermal), nep, optimumGain: optimum,
    optimumGainShown, snrAtOptimum: apdReceiver(receiver, optimumGainShown).snr,
  };
}
