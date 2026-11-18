/**
 * Thermal-noise page: Johnson–Nyquist noise of a resistor. SI units (Ω, K, Hz, V, A, W); available power also in dBm.
 * Invalid inputs give NaN; at T = 0 the noise is zero and the dBm value is −Infinity (no result).
 *
 * v = √(4k_B·T·R·B), i = √(4k_B·T·B/R), available power k_B·T·B, valid for h·f ≪ k_B·T (J. B. Johnson, Phys. Rev. 32,
 * 97 (1928), doi:10.1103/PhysRev.32.97; H. Nyquist, Phys. Rev. 32, 110 (1928), doi:10.1103/PhysRev.32.110). With the Planck
 * factor h·f/(e^(h·f/k_B·T) − 1) the available power saturates at (π²/6)(k_B·T)²/h (Nyquist 1928).
 */

import { h, k_B } from "../constants";
import { johnsonNoise } from "./noise";

/** The classical k_B·T·B is flagged as overstating the noise above this fraction of k_B·T/h. */
export const THERMAL_QUANTUM_FRACTION = 0.1;
/** One milliwatt, the dBm reference, W. */
export const DBM_REFERENCE_POWER = 1e-3;

export interface ThermalNoiseSummary {
  /** Open-circuit rms voltage, V. */
  voltage: number;
  /** Short-circuit rms current, A. */
  current: number;
  /** Available power into a matched load k_B·T·B, W. */
  power: number;
  /** The same power in dBm. */
  powerDbm: number;
  /** k_B·T/h, where h·f = k_B·T, Hz. */
  quantumFrequency: number;
  /** True when B exceeds THERMAL_QUANTUM_FRACTION·k_B·T/h. */
  quantumRegime: boolean;
  /** Planck-integrated available power for B → ∞, (π²/6)(k_B·T)²/h, W. */
  planckSaturationPower: number;
}

export function thermalNoiseSummary({ resistance, temperature, bandwidth }: { resistance: number; temperature: number; bandwidth: number }): ThermalNoiseSummary {
  const { v, i, p } = johnsonNoise(resistance, temperature, bandwidth);
  const quantumFrequency = (k_B * temperature) / h;
  return {
    voltage: v,
    current: i,
    power: p,
    powerDbm: 10 * Math.log10(p / DBM_REFERENCE_POWER),
    quantumFrequency,
    quantumRegime: bandwidth > THERMAL_QUANTUM_FRACTION * quantumFrequency,
    planckSaturationPower: ((Math.PI ** 2 / 6) * (k_B * temperature) ** 2) / h,
  };
}
