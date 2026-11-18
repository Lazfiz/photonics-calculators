/**
 * Temporal-noise page: read, dark-shot and 1/f noise of a pixel in electrons (e⁻ rms), seconds, hertz, and the total as a
 * voltage at the sense node (V). The 1/f and total results are NaN (no result) when the read-out bandwidth is not above the
 * lower band edge.
 *
 * The read-noise density is (σ_read²/B)·(1 + f_c/f) over f_L…B, so the 1/f part is σ_read·√((f_c/B)·ln(B/f_L)) (primitive
 * `cornerFlickerRms` in `noise.ts`; C. D. Motchenbacher, J. A. Connelly, Low-Noise Electronic System Design, Wiley 1993).
 * Dark charge is Poisson: σ_dark = √(I_dark·t) (J. R. Janesick, Photon Transfer, SPIE Press 2007, doi:10.1117/3.725073).
 */

import { cornerFlickerRms, sensorNoiseElectrons } from "./noise";

export interface TemporalNoiseInputs {
  /** White read noise integrated over 0…B, e⁻ rms. */
  readNoise: number;
  /** Dark current, e⁻/s. */
  darkCurrent: number;
  /** Exposure time, s. */
  exposureTime: number;
  /** 1/f corner frequency f_c, Hz. */
  kneeFreq: number;
  /** Read-out bandwidth B, Hz. */
  bandwidth: number;
  /** Lower band edge f_L, Hz. */
  fLow: number;
  /** Conversion gain at the sense node, V/e⁻. */
  conversionGain: number;
}

export interface TemporalNoiseSummary {
  /** Dark shot noise √(I_dark·t), e⁻ rms. */
  darkShotNoise: number;
  /** 1/f noise from f_L to B, e⁻ rms. */
  flickerNoise: number;
  /** √(σ_read² + σ_dark² + σ_1/f²), e⁻ rms. */
  totalNoise: number;
  /** The total at the sense node, V rms. */
  totalNoiseVoltage: number;
}

export function temporalNoiseSummary({ readNoise, darkCurrent, exposureTime, kneeFreq, bandwidth, fLow, conversionGain }: TemporalNoiseInputs): TemporalNoiseSummary {
  const flickerNoise = cornerFlickerRms(readNoise, kneeFreq, bandwidth, fLow);
  const darkShotNoise = Math.sqrt(darkCurrent * exposureTime);
  const whiteTotal = sensorNoiseElectrons({ signal: 0, read: readNoise, dark: darkCurrent * exposureTime });
  const totalNoise = Math.hypot(whiteTotal, flickerNoise);
  return { darkShotNoise, flickerNoise, totalNoise, totalNoiseVoltage: totalNoise * conversionGain };
}
