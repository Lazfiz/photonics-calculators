/**
 * Dark current and its shot noise vs temperature. n_i ∝ T^(3/2)·exp(−E_g(T)/2k_BT); dark current ∝ n_i (depletion
 * generation) or n_i² (diffusion): S. M. Sze, K. K. Ng, Physics of Semiconductor Devices, 3rd ed. (Wiley 2007), ch. 1–2.
 * E_g fixed or Varshni's law (`materials/bandgap.ts`). Shot noise √(2q·I·Δf) (Schottky 1918). Temperatures in °C.
 */

import { darkCurrentRatio, type DarkCurrentMechanism } from "./dark-current";
import { shotNoiseCurrent } from "./noise";
import { VARSHNI, varshniBandGap } from "../materials/bandgap";

export const KELVIN = 273.15;
export const REFERENCE_TEMPERATURE_C = 25;
/** Temperatures of the cold and hot result cards, °C. */
export const COLD_TEMPERATURE_C = -40;
export const HOT_TEMPERATURE_C = 80;
export const GAP_MODELS = ["fixed", "si", "ge"] as const;
export type GapModel = (typeof GAP_MODELS)[number];

export interface DarkNoiseParams {
  /** Dark current at 25 °C, A. */
  darkCurrent25: number;
  /** Fixed gap, eV (used when gapModel is "fixed"). */
  eg: number;
  /** Noise bandwidth, Hz. */
  bandwidth: number;
  gapModel: GapModel;
  mechanism: DarkCurrentMechanism;
}

/** E_g at T in K, eV. */
export function gapAt(p: DarkNoiseParams, T: number): number {
  return p.gapModel === "fixed" ? p.eg : varshniBandGap(T, VARSHNI[p.gapModel]);
}

/** Dark current at tempC in °C, A. */
export function darkCurrentAtTemperature(p: DarkNoiseParams, tempC: number): number {
  const Tref = REFERENCE_TEMPERATURE_C + KELVIN;
  return p.darkCurrent25 * darkCurrentRatio(tempC + KELVIN, Tref, gapAt(p, tempC + KELVIN), p.mechanism, gapAt(p, Tref));
}

/** RMS shot noise of the dark current at tempC, A. */
export function darkNoiseAtTemperature(p: DarkNoiseParams, tempC: number): number {
  return shotNoiseCurrent(darkCurrentAtTemperature(p, tempC), p.bandwidth);
}

export interface DarkNoiseSummary {
  dark25: number;
  noise25: number;
  darkCold: number;
  darkHot: number;
  /** I_dark(80 °C)/I_dark(−40 °C). */
  ratio: number;
  gap25: number;
  gapCold: number;
}

export function darkNoiseSummary(p: DarkNoiseParams): DarkNoiseSummary {
  const darkCold = darkCurrentAtTemperature(p, COLD_TEMPERATURE_C);
  const darkHot = darkCurrentAtTemperature(p, HOT_TEMPERATURE_C);
  return {
    dark25: darkCurrentAtTemperature(p, REFERENCE_TEMPERATURE_C),
    noise25: darkNoiseAtTemperature(p, REFERENCE_TEMPERATURE_C),
    darkCold,
    darkHot,
    ratio: darkHot / darkCold,
    gap25: gapAt(p, REFERENCE_TEMPERATURE_C + KELVIN),
    gapCold: gapAt(p, COLD_TEMPERATURE_C + KELVIN),
  };
}
