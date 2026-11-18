/**
 * Page summary of the optical-coherence (Fourier-domain OCT) calculator. SI in and out. A new module so that the page
 * and the API schema share one dispatch; the physics is in oct.ts (also used by the low-coherence page: not appended
 * to). Model tier: textbook, see oct.ts.
 *
 * The sample signal is P_s = κ R_s P with P the power on the sample and κ the interferometer efficiency (κ = 1 is a
 * lossless 50/50 interferometer); SNR = ρ P_s Δt/(2e) (M. A. Choma et al., Opt. Express 11, 2183 (2003),
 * doi:10.1364/OE.11.002183, eq. 10) with Δt = 1/(A-scan rate); the sensitivity is the SNR of a perfect mirror, 1/R_s,min.
 */
import {
  coherenceLength, coherenceTime, fdOctSnr, octAxialResolution, spectralWidthHz,
} from "./oct";

/** Δλ/λ₀ above this loses the Gaussian, Δλ ≪ λ₀ accuracy of the coherence formulas. */
export const OCT_NARROWBAND_LIMIT = 0.1;

/** True when the relative bandwidth Δλ/λ₀ exceeds OCT_NARROWBAND_LIMIT (same units for both). */
export function exceedsNarrowbandLimit(lambda0: number, dLambda: number): boolean {
  return dLambda / lambda0 > OCT_NARROWBAND_LIMIT;
}

export interface OpticalCoherenceSummary {
  axialResolutionAir: number;
  axialResolutionSample: number;
  coherenceLength: number;
  coherenceTime: number;
  spectralWidth: number;
  /** κ R_s P, W. */
  signalPower: number;
  /** Shot-noise SNR as a power ratio (not dB). */
  snr: number;
  /** SNR of a perfect mirror (R_s = 1), a power ratio. */
  sensitivity: number;
}

export function opticalCoherenceSummary(
  lambda0: number, dLambda: number, n: number, power: number, sampleReflectivity: number, kappa: number,
  responsivity: number, aScanRate: number,
): OpticalCoherenceSummary {
  const aScanTime = 1 / aScanRate;
  const signalPower = power * kappa * sampleReflectivity;
  return {
    axialResolutionAir: octAxialResolution(lambda0, dLambda),
    axialResolutionSample: octAxialResolution(lambda0, dLambda, n),
    coherenceLength: coherenceLength(lambda0, dLambda),
    coherenceTime: coherenceTime(lambda0, dLambda),
    spectralWidth: spectralWidthHz(lambda0, dLambda),
    signalPower,
    snr: fdOctSnr(responsivity, signalPower, aScanTime),
    sensitivity: fdOctSnr(responsivity, power * kappa, aScanTime),
  };
}
