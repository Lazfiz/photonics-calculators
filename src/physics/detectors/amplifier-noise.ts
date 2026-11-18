/**
 * Amplifier-noise page: the read floor of an input-referred amplifier noise plus ADC quantisation, and the signal
 * statistics on top of it. Units: electrons (e⁻) and e⁻/DN. Invalid inputs give NaN.
 *
 * σ_read² = e_n² + g²/12 (amplifier and ADC quantisation in quadrature), σ_total² = S + σ_read², S_min from SNR = 3:
 * J. R. Janesick, Photon Transfer (SPIE Press 2007), doi:10.1117/3.725073. The primitives are in `noise.ts`.
 */

import { minDetectableSignal, quantizationNoiseElectrons, sensorNoiseElectrons } from "./noise";

/** SNR at which the minimum detectable signal is defined. */
export const AMPLIFIER_DETECTION_SNR = 3;

/** Read floor √(e_n² + g²/12), e⁻ rms: input noise and ADC quantisation in quadrature. */
export function readFloorElectrons(inputNoise: number, conversionGain: number): number {
  return Math.hypot(inputNoise, quantizationNoiseElectrons(conversionGain));
}

export interface AmplifierNoiseInputs {
  /** Input-referred amplifier noise e_n, e⁻ rms. */
  inputNoise: number;
  /** Conversion gain g, e⁻/DN. */
  conversionGain: number;
  /** Mean signal S, e⁻. */
  signal: number;
}

export interface AmplifierNoiseSummary {
  /** Quantisation noise g/√12, e⁻ rms. */
  quantNoise: number;
  /** Read floor, e⁻ rms. */
  readFloor: number;
  /** Read floor in DN. */
  noiseDn: number;
  /** Shot noise √S, e⁻ rms. */
  shotNoise: number;
  /** Total noise √(S + σ_read²), e⁻ rms. */
  totalNoise: number;
  snrTotal: number;
  /** Signal at which the total SNR equals 3, e⁻. */
  minDetectable: number;
}

export function amplifierNoiseSummary({ inputNoise, conversionGain, signal }: AmplifierNoiseInputs): AmplifierNoiseSummary {
  const quantNoise = quantizationNoiseElectrons(conversionGain);
  const readFloor = readFloorElectrons(inputNoise, conversionGain);
  const totalNoise = sensorNoiseElectrons({ signal, read: readFloor });
  return {
    quantNoise,
    readFloor,
    noiseDn: readFloor / conversionGain,
    shotNoise: Math.sqrt(signal),
    totalNoise,
    snrTotal: signal / totalNoise,
    minDetectable: minDetectableSignal(readFloor, AMPLIFIER_DETECTION_SNR),
  };
}
