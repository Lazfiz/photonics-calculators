/**
 * NEP and D* of a detector from its dark-current shot noise and the Johnson noise of its load resistor. SI units
 * (A, A/W, Hz, K, Ω); area in cm²; D* in Jones (cm·√Hz/W). i_shot = √(2q·I_d·B), i_th = √(4k_BT·B/R_L), NEP = i_n/ℛ,
 * D* = √(A·B)/NEP: Dereniak & Boreman, Infrared Detectors and Systems (Wiley 1996), ch. 5; base functions in `noise.ts`.
 * No signal shot noise and no amplifier noise.
 */

import { johnsonNoise, noiseEquivalentPower, shotNoiseCurrent, specificDetectivity } from "./noise";

export interface NepParams {
  /** A. */
  darkCurrent: number;
  /** A/W. */
  responsivity: number;
  bandwidth: number;
  temperature: number;
  loadResistor: number;
  area_cm2: number;
}

export interface NepSummary {
  iShot: number;
  iThermal: number;
  /** √(i_shot² + i_th²), A rms. */
  totalNoiseCurrent: number;
  /** W in the bandwidth B. */
  nep: number;
  /** No noise current at all (T = 0 and I_d = 0): NEP is undefined. */
  noiseFree: boolean;
  /** W/√Hz. */
  nepSpectral: number;
  /** Jones. */
  detectivity: number;
}

export function nepSummary(p: NepParams): NepSummary {
  const iShot = shotNoiseCurrent(p.darkCurrent, p.bandwidth);
  const iThermal = johnsonNoise(p.loadResistor, p.temperature, p.bandwidth).i;
  const totalNoiseCurrent = Math.hypot(iShot, iThermal);
  const nep = noiseEquivalentPower(totalNoiseCurrent, p.responsivity);
  return {
    iShot,
    iThermal,
    totalNoiseCurrent,
    nep,
    noiseFree: !(totalNoiseCurrent > 0),
    nepSpectral: nep / Math.sqrt(p.bandwidth),
    detectivity: specificDetectivity(p.area_cm2, p.bandwidth, nep),
  };
}
