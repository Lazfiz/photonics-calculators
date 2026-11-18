/**
 * SPAD page summary: photon rate, dark counts at the operating temperature, recorded rate with a non-paralyzable dead
 * time, afterpulse rate and counting SNR. Watts, metres, seconds, counts/s; temperatures in °C. The physics is in
 * `spad.ts` (Arrhenius dark counts, counting SNR; Webster & Henderson 2013) and `dead-time.ts` (Knoll 2010; Cova et al.
 * 1991); this module only combines it.
 */

import { countLoss, measuredRate } from "./dead-time";
import { arrheniusFactor, countingSnr, dbmToWatts, doublingInterval, photonRate } from "./spad";

/** Celsius-to-kelvin offset. */
const KELVIN_OFFSET = 273.15;

/** Fewer recorded counts than this in the gate make the SNR formula (asymptotic Fano factor) only indicative. */
export const SPAD_MIN_GATE_COUNTS = 10;

/** Count loss above which the page warns that the recorded rate saturates. */
export const SPAD_LOSS_WARNING = 0.1;

export interface SpadInput {
  /** Photon detection efficiency, 0–1. */
  pde: number;
  /** Dark count rate at the reference temperature, counts/s. */
  dcrRef: number;
  /** Reference and operating temperature, °C. */
  refTemperatureC: number;
  temperatureC: number;
  /** DCR activation energy, eV. */
  activationEnergy: number;
  /** Non-paralyzable dead time, s. */
  deadTime: number;
  /** Afterpulse probability per recorded avalanche. */
  afterpulseProb: number;
  /** Optical power, dBm. */
  powerDbm: number;
  /** Wavelength, m. */
  wavelength: number;
  /** Counting gate, s. */
  gate: number;
}

export interface SpadSummary {
  /** Photon rate, 1/s. */
  photons: number;
  /** Photon-triggered avalanche rate PDE·photons, 1/s. */
  signal: number;
  /** Dark count rate at the operating temperature, 1/s. */
  dcr: number;
  /** True avalanche rate R = signal + dcr, 1/s. */
  rate: number;
  /** Recorded rate m = R/(1 + Rτ), 1/s. */
  measured: number;
  /** Fraction of avalanches lost to the dead time. */
  loss: number;
  /** Afterpulse rate m·P_ap, 1/s. */
  afterpulseRate: number;
  /** Counting SNR in the gate. */
  snr: number;
  /** Temperature step (K) that doubles the DCR. */
  doubling: number;
}

/** Dark count rate at `temperatureC` from the rate at `refTemperatureC`. */
export function spadDarkRate(dcrRef: number, activationEnergy: number, temperatureC: number, refTemperatureC: number): number {
  return dcrRef * arrheniusFactor(activationEnergy, temperatureC + KELVIN_OFFSET, refTemperatureC + KELVIN_OFFSET);
}

/** Counting SNR at `powerDbm` for the operating point `p` (the page's SNR-versus-power chart varies only the power). */
export function spadSnrAtPower(p: SpadInput, powerDbm: number, idealCounter = false): number {
  const dcr = spadDarkRate(p.dcrRef, p.activationEnergy, p.temperatureC, p.refTemperatureC);
  return countingSnr({
    signalRate: photonRate(dbmToWatts(powerDbm), p.wavelength) * p.pde,
    darkRate: dcr,
    afterpulseProb: idealCounter ? 0 : p.afterpulseProb,
    deadTime: idealCounter ? 0 : p.deadTime,
    gateTime: p.gate,
  });
}

export function spadSummary(p: SpadInput): SpadSummary {
  const photons = photonRate(dbmToWatts(p.powerDbm), p.wavelength);
  const signal = photons * p.pde;
  const dcr = spadDarkRate(p.dcrRef, p.activationEnergy, p.temperatureC, p.refTemperatureC);
  const rate = signal + dcr;
  const measured = measuredRate(rate, p.deadTime, "nonparalyzable");
  const loss = countLoss(rate, p.deadTime, "nonparalyzable");
  const snr = countingSnr({ signalRate: signal, darkRate: dcr, afterpulseProb: p.afterpulseProb, deadTime: p.deadTime, gateTime: p.gate });
  return {
    photons, signal, dcr, rate, measured, loss, afterpulseRate: measured * p.afterpulseProb, snr,
    doubling: doublingInterval(p.activationEnergy, p.temperatureC + KELVIN_OFFSET),
  };
}
