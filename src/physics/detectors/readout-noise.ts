/**
 * Readout-noise page: the noise floor of a pixel with read noise σ_read and accumulated dark charge, and the signal at
 * which shot noise equals read noise. Electrons (e⁻), seconds. Invalid inputs give NaN.
 *
 * Total noise √(S + σ_read² + N_dark) with Poisson signal and dark charge (J. R. Janesick, Photon Transfer, SPIE Press
 * 2007, doi:10.1117/3.725073); the primitive is `sensorNoiseElectrons` in `noise.ts`.
 */

import { sensorNoiseElectrons } from "./noise";

export interface ReadoutNoiseSummary {
  /** Dark electrons accumulated in the exposure, e⁻. */
  darkElectrons: number;
  /** Noise at zero signal √(σ_read² + N_dark), e⁻ rms. */
  noiseFloor: number;
  /** Signal whose shot noise √S equals the read noise, S = σ_read², e⁻. */
  readNoiseLimitedSignal: number;
}

/** readNoise e⁻ rms, darkCurrent e⁻/s, exposureTime s. */
export function readoutNoiseSummary({ readNoise, darkCurrent, exposureTime }: { readNoise: number; darkCurrent: number; exposureTime: number }): ReadoutNoiseSummary {
  const darkElectrons = darkCurrent * exposureTime;
  return {
    darkElectrons,
    noiseFloor: sensorNoiseElectrons({ signal: 0, read: readNoise, dark: darkElectrons }),
    readNoiseLimitedSignal: readNoise ** 2,
  };
}
