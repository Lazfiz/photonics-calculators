/**
 * Geiger-mode APD (SPAD) page summary: excess bias, trigger probability, PDE, dark count rate, afterpulsing and maximum
 * count rate at one temperature and supply. Volts, seconds, counts/s; temperatures in °C. The physics is in `spad.ts`
 * (Otte et al. 2017; Webster & Henderson 2013) and `dead-time.ts` (Cova et al. 1991); this module only combines it.
 */

import { afterpulseProbability } from "./dead-time";
import {
  darkCountRate, doublingInterval, overbiasAtTemperature, trapEfficiencyAtOverbias, triggerProbability,
} from "./spad";
import { T0_CELSIUS } from "../constants";

/** Temperature (°C) at which the reference excess bias and dark count rate are specified. */
export const GEIGER_REF_TEMPERATURE_C = 25;

export interface GeigerInput {
  /** Excess bias at 25 °C, V. */
  overbiasRef: number;
  /** Trigger-probability voltage scale V_c, V. */
  vc: number;
  /** PDE at full trigger probability. */
  pdeMax: number;
  /** Operating temperature, °C. */
  temperature: number;
  /** Breakdown-voltage temperature coefficient β, V/K. */
  beta: number;
  /** Dark count rate at 25 °C and the reference excess bias, counts/s. */
  dcrRef: number;
  /** Dark-rate activation energy, eV. */
  activationEnergy: number;
  /** Dark-rate field slope b, 1/V. */
  fieldSlope: number;
  /** Dead time, s. */
  deadTime: number;
  /** Trap efficiency at the 25 °C excess bias. */
  trapEfficiency: number;
  /** Trap lifetime, s. */
  trapLifetime: number;
}

/** Dark count rate at excess bias `dv` (V) and temperature `tC` (°C); NaN when the exponential overflows. */
export function geigerDarkCountRate(p: GeigerInput, dv: number, tC: number): number {
  return darkCountRate({
    dcrRef: p.dcrRef, temperature: tC + T0_CELSIUS, refTemperature: GEIGER_REF_TEMPERATURE_C + T0_CELSIUS,
    activationEnergy: p.activationEnergy, overbias: dv, overbiasRef: p.overbiasRef, voltageScale: p.vc, fieldSlope: p.fieldSlope,
  });
}

/** Excess bias at temperature `tC` (°C) at the fixed supply. */
export function geigerOverbias(p: GeigerInput, tC: number): number {
  return overbiasAtTemperature(p.overbiasRef, p.beta, tC, GEIGER_REF_TEMPERATURE_C);
}

export interface GeigerSummary {
  /** Breakdown-voltage shift β·(T − 25 °C), V. */
  bvShift: number;
  /** Excess bias at T, V. */
  overbias: number;
  /** Trigger probability P_t. */
  triggerProbability: number;
  /** PDE_max·P_t. */
  pde: number;
  /** Dark count rate, counts/s; NaN on overflow. */
  dcr: number;
  /** Afterpulse probability per avalanche. */
  afterpulseProbability: number;
  /** Afterpulse rate P_ap·DCR, counts/s. */
  afterpulseRate: number;
  /** Maximum count rate 1/t_d, counts/s. */
  maxRate: number;
  /** Temperature step that doubles the dark rate, K; NaN for E_a = 0. */
  doubling: number;
  /** True when the breakdown voltage has risen past the supply (excess bias ≤ 0). */
  belowBreakdown: boolean;
}

export function geigerSummary(p: GeigerInput): GeigerSummary {
  const overbias = geigerOverbias(p, p.temperature);
  const pt = triggerProbability(overbias, p.vc);
  const dcr = geigerDarkCountRate(p, overbias, p.temperature);
  const pap = afterpulseProbability(
    [{ eta: trapEfficiencyAtOverbias(p.trapEfficiency, overbias, p.overbiasRef, p.vc), tau: p.trapLifetime }], p.deadTime,
  );
  return {
    bvShift: p.beta * (p.temperature - GEIGER_REF_TEMPERATURE_C),
    overbias,
    triggerProbability: pt,
    pde: p.pdeMax * pt,
    dcr,
    afterpulseProbability: pap,
    afterpulseRate: pap * dcr,
    maxRate: 1 / p.deadTime,
    doubling: doublingInterval(p.activationEnergy, p.temperature + T0_CELSIUS),
    belowBreakdown: overbias <= 0,
  };
}
