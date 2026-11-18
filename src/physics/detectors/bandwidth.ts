/**
 * Bandwidth page: Johnson and shot noise voltage of a photodiode on a load resistor R_L, low-passed by R_L ∥ C_j and
 * integrated to the measurement bandwidth. SI units: Hz, F, Ω, A, K, V rms. Invalid inputs give NaN.
 *
 * v²_J = 4k_B·T·R_L·f_c·atan(Δf/f_c) (H. Nyquist, Phys. Rev. 32, 110 (1928), doi:10.1103/PhysRev.32.110), v²_S =
 * 2q·I·R_L²·f_c·atan(Δf/f_c) (Saleh & Teich, Fundamentals of Photonics, §17.5), f_c = 1/(2π·R_L·C_j). The primitives are in
 * `noise.ts` and `photodiode-rc.ts`.
 */

import { h, k_B } from "../constants";
import { johnsonNoise, ktcNoise, shotNoiseCurrent } from "./noise";
import { rcBandwidth, rcFilteredNoise } from "./photodiode-rc";

/** Signal voltage I·R_L above which the unbiased photovoltaic model no longer holds, V. */
export const SIGNAL_VOLTAGE_LIMIT = 0.3;

/** The classical Johnson density is used up to this fraction of k_B·T/h. */
export const CLASSICAL_LIMIT_FRACTION = 0.1;

export interface BandwidthNoiseInputs {
  /** Measurement bandwidth Δf, Hz. */
  bandwidth: number;
  /** Junction capacitance C_j, F. */
  capacitance: number;
  /** Load resistance R_L, Ω. */
  loadR: number;
  /** Photocurrent, A. */
  photoCurrent: number;
  /** Temperature, K. */
  temperature: number;
}

export interface NoiseVoltages {
  vJohnson: number;
  vShot: number;
  vTotal: number;
}

export interface BandwidthNoiseModel {
  /** RC −3 dB frequency, Hz. */
  fc: number;
  /** Johnson noise density 4k_B·T·R_L, V²/Hz. */
  johnsonDensity: number;
  /** Noise voltages for a measurement bandwidth B (Hz). */
  noiseAt(B: number): NoiseVoltages;
}

export function bandwidthNoiseModel({ capacitance, loadR, photoCurrent, temperature }: Omit<BandwidthNoiseInputs, "bandwidth">): BandwidthNoiseModel {
  // Both noise currents see the impedance R_L ∥ C_j, a first-order low-pass at f_c.
  const fc = rcBandwidth(loadR, capacitance);
  const johnsonDensity = johnsonNoise(loadR, temperature, 1).v ** 2; // 4k_B·T·R, V²/Hz at f ≪ f_c
  const shotDensity = (shotNoiseCurrent(photoCurrent, 1) * loadR) ** 2; // 2q·I·R², V²/Hz at f ≪ f_c
  const noiseAt = (B: number): NoiseVoltages => {
    const vJohnson = Math.sqrt(rcFilteredNoise(johnsonDensity, fc, B));
    const vShot = Math.sqrt(rcFilteredNoise(shotDensity, fc, B));
    return { vJohnson, vShot, vTotal: Math.hypot(vJohnson, vShot) };
  };
  return { fc, johnsonDensity, noiseAt };
}

export interface BandwidthSummary extends NoiseVoltages {
  fc: number;
  /** √(k_B·T/C_j), the Δf → ∞ limit of the Johnson noise, V. */
  kTC: number;
}

export function bandwidthSummary(p: BandwidthNoiseInputs): BandwidthSummary {
  const m = bandwidthNoiseModel(p);
  return { fc: m.fc, ...m.noiseAt(p.bandwidth), kTC: ktcNoise(p.capacitance, p.temperature).v };
}

/** Beyond the unbiased photovoltaic range: I·R_L above 0.3 V. */
export function signalVoltageTooHigh(photoCurrent: number, loadR: number): boolean {
  return photoCurrent * loadR > SIGNAL_VOLTAGE_LIMIT;
}

/** The noise band reaches the quantum regime (0.1·k_B·T/h), where the classical Johnson density fails. */
export function quantumCorrectionNeeded(bandwidth: number, fc: number, temperature: number): boolean {
  return Math.min(bandwidth, fc) > (CLASSICAL_LIMIT_FRACTION * k_B * temperature) / h;
}
