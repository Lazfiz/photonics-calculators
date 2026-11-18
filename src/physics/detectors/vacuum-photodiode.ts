/**
 * Vacuum-photodiode calculator summary: responsivity below the photoemission threshold, photocurrent, thermionic dark
 * current, Child's-law limit, transit time, capacitance, bandwidth and SNR of a planar cathode–anode diode read across a
 * load. SI (m, m², V, K, A, Ω, F) except the dark emission, which is given in A/m². Composition of `photoemission.ts`
 * (Richardson–Dushman, Ramo, Child), `photodiode-rc.ts`, `noise.ts` (shot and Johnson), `responsivity.ts` and the
 * gap capacitance ε₀A/d. Kept apart so the pages that import those modules do not ship it. Invalid inputs give NaN.
 */

import { epsilon_0 } from "../constants";
import { johnsonNoise, shotNoiseCurrent } from "./noise";
import { combinedBandwidth, rcBandwidth } from "./photodiode-rc";
import {
  childLangmuirCurrentDensity, effectiveThermionicBarrier, planarTransitTime, thermionicCurrentDensity, thresholdWavelength,
  vacuumTransitBandwidth,
} from "./photoemission";
import { responsivity } from "./responsivity";

/** A/m² per fA/cm². */
export const FA_PER_CM2 = 1e-11;
/** The load stays at room temperature whatever the cathode does, K. */
export const LOAD_TEMPERATURE = 298.15;
/** The dark-emission table (Burle Table I) is at 25 °C, K. */
export const DARK_EMISSION_REFERENCE_TEMPERATURE = 298.15;
/** The DC drop I_ph·R_L is called a load collapse above this fraction of the bias. */
export const LOAD_COLLAPSE_FRACTION = 0.1;

export interface VacuumPhotodiodeParams {
  /** Quantum efficiency η, 0–1. */
  qe: number;
  /** Wavelength, m. */
  wavelength: number;
  /** Incident power, W. */
  power: number;
  /** Photoemission threshold φ, eV. */
  phi: number;
  /** Anode voltage, V. */
  voltage: number;
  /** Cathode–anode gap, m. */
  gap: number;
  /** Cathode area, m². */
  area: number;
  /** Load resistance, Ω. */
  load: number;
  /** Cathode temperature, K. */
  temperature: number;
  /** Dark emission at 25 °C, A/m². */
  darkEmission25: number;
  /** Stray capacitance, F. */
  strayCapacitance: number;
}

export interface VacuumPhotodiodeSummary {
  /** Threshold wavelength hc/φ, m. */
  cutoff: number;
  /** Responsivity (0 beyond the threshold), A/W. */
  responsivity: number;
  photocurrent: number;
  /** Effective thermionic barrier ψ, eV. */
  barrier: number;
  darkCurrent: number;
  transitTime: number;
  transitBandwidth: number;
  gapCapacitance: number;
  capacitance: number;
  rcBandwidth: number;
  bandwidth: number;
  shotNoise: number;
  johnsonNoise: number;
  /** Shot and Johnson in quadrature, A rms. */
  noiseCurrent: number;
  /** 20·log₁₀(I_ph/σ_I) in the combined bandwidth, dB (−Infinity without photocurrent). */
  snrDb: number;
  /** Child's space-charge limit for the whole cathode, A. */
  childLimit: number;
  overChild: boolean;
  /** DC voltage dropped across the load by the photocurrent, V. */
  loadDrop: number;
  loadCollapse: boolean;
}

export function vacuumPhotodiodeSummary(p: VacuumPhotodiodeParams): VacuumPhotodiodeSummary {
  const cutoff = thresholdWavelength(p.phi);
  const resp = p.wavelength <= cutoff ? responsivity(p.qe, p.wavelength) : 0;
  const photocurrent = p.power * resp;
  const barrier = effectiveThermionicBarrier(p.darkEmission25, DARK_EMISSION_REFERENCE_TEMPERATURE);
  const darkCurrent = thermionicCurrentDensity(p.temperature, barrier) * p.area;
  const transitTime = planarTransitTime(p.gap, p.voltage);
  const transitBandwidth = vacuumTransitBandwidth(transitTime);
  const gapCapacitance = (epsilon_0 * p.area) / p.gap;
  const capacitance = gapCapacitance + p.strayCapacitance;
  const fRC = rcBandwidth(p.load, capacitance);
  const bandwidth = combinedBandwidth(fRC, transitBandwidth);
  const shotNoise = shotNoiseCurrent(photocurrent + darkCurrent, bandwidth);
  const johnson = johnsonNoise(p.load, LOAD_TEMPERATURE, bandwidth).i;
  const noiseCurrent = Math.hypot(shotNoise, johnson);
  const childLimit = childLangmuirCurrentDensity(p.voltage, p.gap) * p.area;
  const loadDrop = photocurrent * p.load;
  return {
    cutoff,
    responsivity: resp,
    photocurrent,
    barrier,
    darkCurrent,
    transitTime,
    transitBandwidth,
    gapCapacitance,
    capacitance,
    rcBandwidth: fRC,
    bandwidth,
    shotNoise,
    johnsonNoise: johnson,
    noiseCurrent,
    snrDb: 20 * Math.log10(photocurrent / noiseCurrent),
    childLimit,
    overChild: photocurrent + darkCurrent > childLimit,
    loadDrop,
    loadCollapse: loadDrop > LOAD_COLLAPSE_FRACTION * p.voltage,
  };
}
