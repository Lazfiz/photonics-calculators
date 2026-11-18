/**
 * Intensified CCD page summary: photoelectrons, phosphor and CCD gain, noise factor, SNR with and without the
 * intensifier and the full-well checks. Gate in s, screen voltage in V; the electron and photon counts are pure
 * numbers. The physics is in `photoemission.ts` (phosphor, spot statistics, intensified SNR) and `electron-multiplier.ts`
 * (stacked MCP gain); this module only combines it.
 */

import { stackedGain } from "./electron-multiplier";
import { gaussianSpotShares, intensifiedSnr, intensifierNoiseFactor, PHOSPHOR_SCREENS, phosphorEfficiency, phosphorGain, type SpotStatistics } from "./photoemission";

export type Phosphor = keyof typeof PHOSPHOR_SCREENS;
export const PHOSPHOR_IDS = Object.keys(PHOSPHOR_SCREENS) as Phosphor[];

/** The phosphor data (photons per electron) are quoted at this screen voltage (V). */
const PHOSPHOR_REFERENCE_VOLTAGE = 5e3;

/** Chevron MCP stack gain above which the output saturates (Wiza 1979); the model does not saturate. */
export const ICCD_MCP_SATURATION_GAIN = 1e7;

export interface IntensifiedCcdInput {
  /** Signal photons per pixel per gate. */
  signal: number;
  /** Photocathode QE. */
  qe: number;
  /** Gain of one MCP plate. */
  mcpGain: number;
  plates: number;
  /** Intensifier noise factor K_f (amplitude, SNR_in/SNR_out). */
  kf: number;
  /** Phosphor screen voltage, V. */
  screenVoltage: number;
  phosphor: Phosphor;
  /** Fiber or lens coupling efficiency. */
  coupling: number;
  ccdQe: number;
  /** e⁻ rms */
  readNoise: number;
  /** e⁻ */
  fullWell: number;
  /** Event spot FWHM on the CCD, pixels. */
  spotFwhm: number;
  /** Bare CCD QE at the signal wavelength. */
  bareQe: number;
  /** Background photons per pixel per second. */
  backgroundRate: number;
  /** Gate width, s. */
  gate: number;
}

export interface IntensifiedCcdSummary {
  photoelectrons: number;
  /** Background photoelectrons per pixel in the gate. */
  background: number;
  /** Phosphor energy efficiency η. */
  efficiency: number;
  photonsPerElectron: number;
  /** CCD e⁻ per MCP output electron. */
  transfer: number;
  /** Unsaturated MCP stack gain. */
  gain: number;
  /** CCD e⁻ per photoelectron. */
  ge: number;
  spot: SpotStatistics;
  /** N_eff = 1/Σh². */
  noisePixels: number;
  /** MCP variance factor K_f². */
  mcpNoise: number;
  noiseFactor: number;
  snr: number;
  /** Output signal per pixel, e⁻. */
  output: number;
  evenFieldFull: boolean;
  /** Mean centre-pixel charge of one photoelectron, e⁻. */
  eventPeak: number;
  eventFull: boolean;
  highGainLimit: number;
  bareSnr: number;
  gainSaturated: boolean;
}

export function intensifiedCcdSummary(p: IntensifiedCcdInput): IntensifiedCcdSummary {
  const ph = PHOSPHOR_SCREENS[p.phosphor];
  const mcpNoise = p.kf ** 2;
  const photoelectrons = p.signal * p.qe;
  const background = p.backgroundRate * p.gate * p.qe;
  const efficiency = phosphorEfficiency(ph.photonsAt5kV, PHOSPHOR_REFERENCE_VOLTAGE, ph.peak);
  const photonsPerElectron = phosphorGain(efficiency, p.screenVoltage, ph.peak);
  const transfer = photonsPerElectron * p.coupling * p.ccdQe;
  const gain = stackedGain(p.mcpGain, Math.round(p.plates));
  const ge = gain * transfer;
  const spot = gaussianSpotShares(p.spotFwhm);
  const noisePixels = 1 / spot.sumSquares;
  const noiseFactor = intensifierNoiseFactor(mcpNoise, ge);
  const snr = intensifiedSnr(photoelectrons, background, ge, mcpNoise, p.readNoise, spot);
  const output = photoelectrons * ge;
  const evenFieldFull = !(output + background * ge <= p.fullWell);
  const eventPeak = ge * spot.peak; // mean centre-pixel charge of one photoelectron
  const eventFull = !(eventPeak <= p.fullWell);
  const highGainLimit = photoelectrons / Math.sqrt((photoelectrons + spot.footprint * background) * mcpNoise);
  const bareSignal = p.signal * p.bareQe;
  const bareSnr = bareSignal / Math.sqrt(bareSignal + p.readNoise ** 2);
  return {
    photoelectrons, background, efficiency, photonsPerElectron, transfer, gain, ge, spot, noisePixels, mcpNoise, noiseFactor, snr,
    output, evenFieldFull, eventPeak, eventFull, highGainLimit, bareSnr, gainSaturated: gain > ICCD_MCP_SATURATION_GAIN,
  };
}
