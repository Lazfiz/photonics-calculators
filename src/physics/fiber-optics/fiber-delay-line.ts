/**
 * Page summary for the fiber-delay-line page and its API schema, built on chromatic-dispersion.ts (sources there).
 * Kept apart from that module because the bundler doesn't drop unused exports: code here would ship on every page
 * that imports chromatic-dispersion. SI units.
 */
import { c } from "../constants";
import { rmsBroadening } from "./dispersion-comp";
import { G652_LAMBDA0, G652_S0, groupDelay, loopFsr, sellmeierDispersion, sellmeierSlope } from "./chromatic-dispersion";

/** SMF_THERMAL_DELAY_COEFF in the page's unit, ps/(km·K). */
export const SMF_THERMAL_DELAY_PS_PER_KM_K = 37.4;
/** Reference temperature of the delay-line page's thermal drift, °C. */
export const THERMAL_REFERENCE_TEMPERATURE = 25;
/** The broad-source spread needs σ_λ above this multiple of the modulation bandwidth λ²B/c. */
export const NARROW_SOURCE_FACTOR = 3;

/** True when σ_λ < 3λ²B/c: the broad-source rms spread underestimates the broadening. */
export function isNarrowSource(sigmaLambda: number, lambda: number, bitRate: number): boolean {
  return sigmaLambda < (NARROW_SOURCE_FACTOR * lambda ** 2 * bitRate) / c;
}

export interface DelayLineInput {
  fiberLength: number;
  groupIndex: number;
  lambda: number;
  bitRate: number;
  sigmaLambda: number;
  temperature: number;
  /** s/(m·K). */
  thermalCoeff: number;
}

/** Delay-line page figures for G.652 fibre: τ, v_g, bit slots, D, rms dispersive spread, thermal delay change, FSR (SI). */
export function delayLineSummary({ fiberLength, groupIndex, lambda, bitRate, sigmaLambda, temperature, thermalCoeff }: DelayLineInput) {
  const tau = groupDelay(fiberLength, groupIndex);
  const D = sellmeierDispersion(lambda, G652_LAMBDA0, G652_S0);
  const S = sellmeierSlope(lambda, G652_LAMBDA0, G652_S0);
  return {
    tau,
    vg: c / groupIndex,
    groupPath: groupIndex * fiberLength,
    bitSlots: tau * bitRate,
    D,
    broadening: rmsBroadening(D * fiberLength, S * fiberLength, sigmaLambda),
    thermal: thermalCoeff * fiberLength * (temperature - THERMAL_REFERENCE_TEMPERATURE),
    fsr: loopFsr(fiberLength, groupIndex),
  };
}
