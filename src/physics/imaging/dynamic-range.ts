/**
 * Dynamic range and noise budget of an image sensor whose ADC full scale is matched to the full well. Electrons (e⁻)
 * per pixel per frame; PRNU is a fraction of the signal. Model tier: textbook (EMVA Standard 1288 Release 3.1 (2016),
 * §2.4 Eq. (17)–(18) for the noise floor and Eq. (45)–(48) for the spatial-noise SNR; Janesick, Photon Transfer, SPIE 2007,
 * doi:10.1117/3.725073, for the dynamic range FW/σ_floor). The noise terms are in
 * `detectors/sensor-noise.ts`, the dB conversion in `detectors/camera-snr.ts`.
 */

import { dynamicRangeDb } from "../detectors/camera-snr";
import { sensorNoise, shotPrnuCrossover, shotReadCrossover } from "../detectors/sensor-noise";

/** Shown when 0 < FW − D < floor: the usable range is smaller than one noise floor. */
export const DARK_RANGE_WARNING = "Dark charge leaves less than one noise floor of range: the dynamic range is below 0 dB.";

/** Below this noise floor in DN the ADC step, not the sensor, sets the floor. */
export const NOISE_FLOOR_ADC_LIMIT_DN = 0.5;

export interface DynamicRangeInputs {
  /** Full well capacity, e⁻. */
  well: number;
  /** Read noise, e⁻ rms. */
  read: number;
  /** Dark current, e⁻/s. */
  darkRate: number;
  /** Exposure time, s. */
  exposure: number;
  /** ADC bit depth (an integer). */
  bits: number;
  /** PRNU as a fraction (0.01 = 1 %). */
  prnu: number;
  /** DSNU, e⁻ rms. */
  dsnu: number;
}

export interface DynamicRangeSummary {
  /** Dark charge D = rate·t, e⁻. */
  dark: number;
  /** One DN in electrons, K = FW/(2^bits − 1). */
  electronsPerDn: number;
  /** Temporal noise floor √(σ_read² + D + σ_q²), e⁻. */
  floor: number;
  /** 20·log₁₀((FW − D)/floor), dB; NaN when the dark charge fills the well. */
  dynamicRangeDb: number;
  /** log₂((FW − D)/floor); NaN when the dark charge fills the well. */
  stops: number;
  floorDn: number;
  /** Quantization noise K/√12, e⁻. */
  quantization: number;
  snrHalf: number;
  snrHalfFlat: number;
  /** Signal at which shot noise equals read noise, e⁻. */
  shotReadCrossover: number;
  /** Signal at which shot noise equals PRNU noise, e⁻ (Infinity at PRNU 0). */
  shotPrnuCrossover: number;
  /** Model-validity warnings (currently the dark-charge range warning). */
  warnings: string[];
}

export function dynamicRangeSummary(i: DynamicRangeInputs): DynamicRangeSummary {
  const electronsPerDn = i.well / (2 ** i.bits - 1);
  const dark = i.darkRate * i.exposure;
  const noiseAt = (signal: number) =>
    sensorNoise({ signal, read: i.read, dark, prnu: i.prnu, dsnu: i.dsnu, electronsPerDn });
  const floor = noiseAt(0).temporal;
  const dr = dynamicRangeDb(i.well, floor, dark);
  const half = noiseAt(i.well / 2);
  return {
    dark,
    electronsPerDn,
    floor,
    dynamicRangeDb: dr,
    stops: Number.isFinite(dr) ? Math.log2((i.well - dark) / floor) : NaN,
    floorDn: floor / electronsPerDn,
    quantization: half.quantization,
    snrHalf: i.well / 2 / half.total,
    snrHalfFlat: i.well / 2 / half.temporal,
    shotReadCrossover: shotReadCrossover(i.read),
    shotPrnuCrossover: shotPrnuCrossover(i.prnu),
    warnings: i.well - dark > 0 && i.well - dark < floor ? [DARK_RANGE_WARNING] : [],
  };
}
