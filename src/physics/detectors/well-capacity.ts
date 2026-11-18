/**
 * Well-capacity page: what a pixel's full-well capacity implies for dynamic range, sense-node capacitance and conversion
 * gain. Electrons (e⁻), volts, farads, metres; densities per m². Invalid inputs give NaN.
 *
 * DR = 20·log₁₀(N_well/σ_read), C = N_well·q/V_swing, conversion gain q/C = V_swing/N_well (J. R. Janesick, Photon Transfer,
 * SPIE Press 2007, doi:10.1117/3.725073); minimum detectable signal from S/√(S + σ²) = k (`minDetectableSignal`).
 */

import { dynamicRangeDb, pixelCapacitance } from "./camera-snr";
import { minDetectableSignal } from "./noise";

/** SNR at which a signal counts as detectable on the page. */
export const WELL_DETECTION_SNR = 3;

export interface WellCapacitySummary {
  /** 20·log₁₀(N_well/σ_read), dB. */
  dynamicRange: number;
  /** log₂(N_well/σ_read), bits. */
  usableBits: number;
  /** Sense-node capacitance N_well·q/V_swing, F. */
  capacitance: number;
  /** V_swing/N_well, V/e⁻. */
  conversionGain: number;
  /** Read noise at the sense node σ_read·V_swing/N_well, V rms. */
  senseNodeNoise: number;
  /** N_well per pixel area (pixel size squared), e⁻/m². */
  wellDensity: number;
  /** Smallest mean signal with SNR = WELL_DETECTION_SNR over read and shot noise, e⁻. */
  minDetectable: number;
}

/** wellCapacity e⁻, readNoise e⁻ rms, pixelSize m, voltageSwing V. */
export function wellCapacitySummary({ wellCapacity, readNoise, pixelSize, voltageSwing }: { wellCapacity: number; readNoise: number; pixelSize: number; voltageSwing: number }): WellCapacitySummary {
  const conversionGain = voltageSwing / wellCapacity;
  return {
    dynamicRange: dynamicRangeDb(wellCapacity, readNoise),
    usableBits: Math.log2(wellCapacity / readNoise),
    capacitance: pixelCapacitance(wellCapacity, voltageSwing),
    conversionGain,
    senseNodeNoise: readNoise * conversionGain,
    wellDensity: wellCapacity / (pixelSize * pixelSize),
    minDetectable: minDetectableSignal(readNoise, WELL_DETECTION_SNR),
  };
}
