/**
 * Gain-temperature page summary: gain of an APD at fixed bias (Miller gain, V_br(T) = V_br,ref + γ·ΔT) or of a PMT
 * (M = M_ref·exp(β·ΔT)) over a temperature span. Volts, kelvin-sized temperature steps, temperatures in °C. The APD
 * physics is in `apd.ts` (Miller 1955; Crowell & Sze 1966); this module only dispatches and combines it.
 */

import { driftExponent, gainAtTemperature, gainTemperatureCoefficient } from "./apd";

export type GainTemperatureDetector = "apd" | "pmt";

export interface GainTemperatureInput {
  detector: GainTemperatureDetector;
  /** Gain at the reference temperature, > 1. */
  gainRef: number;
  /** Reference temperature, °C. */
  tempRef: number;
  /** APD breakdown voltage at the reference temperature, V. */
  breakdown: number;
  /** APD bias below breakdown at the reference temperature, V_br − V, V. */
  margin: number;
  /** APD breakdown-voltage coefficient γ, V/K. */
  vbrCoeff: number;
  /** PMT relative gain coefficient β, %/K. */
  pmtCoeff: number;
}

export interface GainTemperatureModel {
  /** Gain at temperature T (°C); Infinity once an APD's V_br(T) falls to its bias. */
  gainAt(T: number): number;
  /** Relative gain coefficient (1/M)·dM/dT at the reference temperature, %/K. */
  coeffPercent: number;
  /** Fitted Miller exponent (APD); NaN for a PMT. */
  exponent: number;
  /** Fixed APD bias V_br,ref − margin, V; NaN for a PMT. */
  bias: number;
  /** Temperature (°C) at which V_br(T) falls to the bias (APD with γ > 0); NaN otherwise. */
  breakdownTemp: number;
}

export function gainTemperatureModel(p: GainTemperatureInput): GainTemperatureModel {
  const apd = { gainRef: p.gainRef, breakdownRef: p.breakdown, marginRef: p.margin, breakdownCoeff: p.vbrCoeff };
  const isApd = p.detector === "apd";
  return {
    // PMT: constant relative coefficient β (1/K), M = M_ref·exp(β·ΔT).
    gainAt: (T) => (isApd ? gainAtTemperature(apd, T - p.tempRef) : p.gainRef * Math.exp((p.pmtCoeff / 100) * (T - p.tempRef))),
    coeffPercent: isApd ? 100 * gainTemperatureCoefficient(apd) : p.pmtCoeff,
    exponent: isApd ? driftExponent(apd) : NaN,
    bias: isApd ? p.breakdown - p.margin : NaN,
    // V_br(T) reaches the bias V_br,ref − margin at ΔT = −margin/γ.
    breakdownTemp: isApd && p.vbrCoeff > 0 ? p.tempRef - p.margin / p.vbrCoeff : NaN,
  };
}

export interface GainTemperatureSummary extends GainTemperatureModel {
  gainAtMin: number;
  gainAtMax: number;
  /** gain(T_min)/gain(T_max). */
  ratio: number;
}

export function gainTemperatureSummary(p: GainTemperatureInput, tempMin: number, tempMax: number): GainTemperatureSummary {
  const model = gainTemperatureModel(p);
  const gainAtMin = model.gainAt(tempMin);
  const gainAtMax = model.gainAt(tempMax);
  return { ...model, gainAtMin, gainAtMax, ratio: gainAtMin / gainAtMax };
}
