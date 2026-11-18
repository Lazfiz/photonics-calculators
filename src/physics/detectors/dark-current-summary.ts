/**
 * Dark current vs temperature by the doubling law, and where its shot noise meets the read noise. Temperatures in °C
 * (differences only; K for the n_i scaling). The doubling law I ∝ 2^(ΔT/T_d) is the local form of n_i(T) (Sze & Ng,
 * Physics of Semiconductor Devices, 3rd ed., Wiley 2007, ch. 1–2); the crossover is T* = T_ref + T_d·log₂(σ_r²/(D_ref·t)).
 * Kept apart from dark-current.ts so the pages that import that module do not ship this summary.
 */

import { darkReadCrossoverTemperature, doublingLawRatio, localDoublingTemperature } from "./dark-current";
import { VARSHNI } from "../materials/bandgap";

export const KELVIN = 273.15;
export const REFERENCE_TEMPERATURE_C = 25;

/** The plotted range [min, max] in °C: ordered, and one degree wide when both ends are equal. */
export function orderTemperatureRange(a: number, b: number): { tempMin: number; tempMax: number } {
  return { tempMin: Math.min(a, b), tempMax: a === b ? a + 1 : Math.max(a, b) };
}

/** Dark current D₂₅·2^((T − 25 °C)/T_d) at T in °C (D₂₅ in any unit; same unit out). */
export function darkCurrentAtTemperature(darkCurrent25: number, doublingT: number, tempC: number): number {
  return darkCurrent25 * doublingLawRatio(tempC + KELVIN, REFERENCE_TEMPERATURE_C + KELVIN, doublingT);
}

export interface DarkCurrentParams {
  /** e⁻/pixel/s at 25 °C. */
  darkCurrent25: number;
  /** Doubling temperature T_d, K. */
  doublingT: number;
  /** e⁻ rms. */
  readNoise: number;
  /** s. */
  exposureTime: number;
  /** Range ends in °C, in any order. */
  tempA: number;
  tempB: number;
}

export interface DarkCurrentSummary {
  tempMin: number;
  tempMax: number;
  dcAtMin: number;
  dcAtMax: number;
  /** D(T_max)/D(T_min). */
  ratio: number;
  /** °C where √(D·t) = read noise (any value, also outside the range); NaN without read noise. */
  crossoverTemp: number;
  /** Local doubling temperature of silicon at 25 °C (Varshni E_g), K: depletion generation / diffusion current. */
  siGenTd: number;
  siDiffTd: number;
}

export function darkCurrentSummary(p: DarkCurrentParams): DarkCurrentSummary {
  const { tempMin, tempMax } = orderTemperatureRange(p.tempA, p.tempB);
  const dcAtMin = darkCurrentAtTemperature(p.darkCurrent25, p.doublingT, tempMin);
  const dcAtMax = darkCurrentAtTemperature(p.darkCurrent25, p.doublingT, tempMax);
  return {
    tempMin,
    tempMax,
    dcAtMin,
    dcAtMax,
    ratio: dcAtMax / dcAtMin,
    crossoverTemp: darkReadCrossoverTemperature(p.readNoise, p.darkCurrent25 * p.exposureTime, REFERENCE_TEMPERATURE_C, p.doublingT),
    siGenTd: localDoublingTemperature(REFERENCE_TEMPERATURE_C + KELVIN, VARSHNI.si, "generation"),
    siDiffTd: localDoublingTemperature(REFERENCE_TEMPERATURE_C + KELVIN, VARSHNI.si, "diffusion"),
  };
}
