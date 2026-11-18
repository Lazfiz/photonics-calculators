/**
 * Saturation page: dynamic range, SNR at full well and ADC step of a camera pixel. Electrons (e⁻), DN. Invalid inputs
 * give NaN.
 *
 * Floor σ_floor = √(σ_read² + Δ²/12) with Δ = FWC/(2^bits − 1) e⁻/DN, DR = 20·log₁₀(FWC/σ_floor), SNR at full well
 * FWC/√(FWC + σ_floor²) (J. R. Janesick, Photon Transfer, SPIE Press 2007, doi:10.1117/3.725073). The primitives are
 * in `camera-snr.ts`; the compressive response is illustrative.
 */

import { cameraSnr, compressiveResponse, dynamicRangeDb, quantizationNoise } from "./camera-snr";

/** ADC bit depths the page offers. */
export const SATURATION_BIT_DEPTHS = [8, 10, 12, 14, 16];

export interface SaturationSummary {
  /** Largest DN, 2^bits − 1. */
  dnMax: number;
  /** ADC step Δ, e⁻/DN. */
  electronsPerDn: number;
  /** Quantization noise Δ/√12, e⁻ rms. */
  quantNoise: number;
  /** Noise floor √(σ_read² + Δ²/12), e⁻ rms. */
  noiseFloor: number;
  /** Dynamic range FWC/σ_read, dB. */
  dynamicRange: number;
  /** Dynamic range FWC/σ_floor, dB. */
  dynamicRangeAdc: number;
  /** SNR at full well, dB. */
  snrSatDb: number;
  /** Illustrative response at full well, e⁻. */
  responseAtFullWell: number;
}

/** fullWell e⁻, readNoise e⁻ rms, bitDepth bits, nonlinearity as a fraction of full scale. */
export function saturationSummary({ fullWell, readNoise, bitDepth, nonlinearity }: { fullWell: number; readNoise: number; bitDepth: number; nonlinearity: number }): SaturationSummary {
  const dnMax = 2 ** bitDepth - 1;
  const electronsPerDn = fullWell / dnMax;
  const quantNoise = quantizationNoise(electronsPerDn);
  const noiseFloor = Math.hypot(readNoise, quantNoise);
  return {
    dnMax,
    electronsPerDn,
    quantNoise,
    noiseFloor,
    dynamicRange: dynamicRangeDb(fullWell, readNoise),
    dynamicRangeAdc: dynamicRangeDb(fullWell, noiseFloor),
    snrSatDb: 20 * Math.log10(cameraSnr({ signal: fullWell, read: noiseFloor })),
    responseAtFullWell: compressiveResponse(fullWell, fullWell, nonlinearity),
  };
}
