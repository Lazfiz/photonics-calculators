/**
 * Sensor design page (CMOS / CCD): one camera pixel's signal, noise, dark charge and dynamic range. Electrons (e⁻) per
 * pixel per frame; the exposure is in s, the pitch in m, the sensor temperature in °C. Model tier: textbook. The
 * noise terms are in `detectors/sensor-noise.ts` (EMVA Standard 1288 Release 3.1, 2016, Eq. 45–48; Janesick, Photon
 * Transfer, SPIE 2007, doi:10.1117/3.725073), the dark-current doubling law in `detectors/dark-current.ts` and the dB
 * conversion in `detectors/camera-snr.ts`. This module holds what the page adds: the usable maximum signal
 * min(FW, K·(2^bits − 1)), where the dark charge occupies the well and the ADC range, and the unit handling. A
 * separate module because those three modules are also imported by other pages.
 */

import { dynamicRangeDb } from "../detectors/camera-snr";
import { darkCurrentDensity, darkReadCrossoverTemperature, doublingLawRatio } from "../detectors/dark-current";
import { sensorNoise } from "../detectors/sensor-noise";
import { NOISE_FLOOR_ADC_LIMIT_DN } from "./dynamic-range";

/** Range of the sensor-temperature input, °C. */
export const SENSOR_TEMP_MIN = -120;
export const SENSOR_TEMP_MAX = 60;
/** Temperature at which the dark-current input is quoted, °C. */
export const DARK_REF_TEMP = 25;

export interface SensorPreset {
  pixelPitch: number; // µm
  wellCapacity: number; // e⁻
  readNoise: number; // e⁻ rms
  darkCurrent: number; // e⁻/s per pixel at 25 °C
  sensorTemp: number; // °C
  quantumEfficiency: number;
  conversionGain: number; // e⁻/DN
  bitDepth: number;
  exposureTime: number; // ms
}

/** Representative values, not a specific camera: an air-cooled sCMOS and a deep-cooled back-thinned MPP CCD. */
export const SENSOR_PRESETS: Record<"cmos" | "ccd", SensorPreset> = {
  cmos: { pixelPitch: 6.5, wellCapacity: 25000, readNoise: 1.5, darkCurrent: 2, sensorTemp: 0, quantumEfficiency: 0.7, conversionGain: 0.5, bitDepth: 16, exposureTime: 100 },
  ccd: { pixelPitch: 16, wellCapacity: 80000, readNoise: 8, darkCurrent: 200, sensorTemp: -70, quantumEfficiency: 0.92, conversionGain: 1.2, bitDepth: 16, exposureTime: 1000 },
};

export interface SensorCmosInputs {
  /** Photons per pixel per exposure. */
  photons: number;
  quantumEfficiency: number;
  /** Pixel pitch, m. */
  pitch: number;
  /** Full well, e⁻. */
  well: number;
  /** Read noise, e⁻ rms. */
  read: number;
  /** Dark current at DARK_REF_TEMP, e⁻/s. */
  darkRef: number;
  /** Sensor temperature, °C. */
  temp: number;
  /** Dark doubling temperature T_d, K. */
  doubling: number;
  /** Exposure time, s. */
  exposure: number;
  /** Conversion gain K, e⁻/DN. */
  electronsPerDn: number;
  /** ADC bit depth (an integer). */
  bits: number;
}

export interface SensorCmosSummary {
  /** Photoelectrons QE·N, e⁻. */
  signal: number;
  /** Dark rate at the sensor temperature, e⁻/s, and dark charge over the exposure, e⁻. */
  darkRate: number;
  dark: number;
  /** ADC full scale K·(2^bits − 1), e⁻, and the usable maximum min(FW, ADC full scale), e⁻. */
  adcFullScale: number;
  maxSignal: number;
  /** Temporal noise at zero signal √(σ_read² + D + σ_q²) and at the signal, e⁻ rms. */
  floor: number;
  noise: number;
  /** True when signal + D exceeds the usable maximum. */
  saturated: boolean;
  /** S/noise; NaN when saturated. */
  snr: number;
  /** √(max signal), the shot-noise-limited peak SNR. */
  peakSnr: number;
  /** Datasheet dynamic range 20·log₁₀(FW/σ_read), dB, and in stops. */
  drDatasheetDb: number;
  drDatasheetStops: number;
  /** 20·log₁₀((S_max − D)/floor), dB, and in stops; NaN when the dark charge fills the well. */
  drExposureDb: number;
  drExposureStops: number;
  /** Quantization noise K/√12, e⁻ rms. */
  quantization: number;
  /** Noise floor in DN. */
  floorDn: number;
  /** Temperature at which dark shot noise equals read noise, °C, if within the input range; NaN otherwise. */
  crossoverTemp: number;
  crossoverInRange: boolean;
  /** q·R₂₅/p², A/m². */
  darkDensity: number;
  /** FW/p², e⁻/m². */
  wellDensity: number;
  /** The noise floor is below NOISE_FLOOR_ADC_LIMIT_DN: the ADC step limits it. */
  adcLimitsFloor: boolean;
}

export function sensorCmosSummary(i: SensorCmosInputs): SensorCmosSummary {
  const darkRate = i.darkRef * doublingLawRatio(i.temp, DARK_REF_TEMP, i.doubling); // e⁻/s at the sensor temperature
  const dark = darkRate * i.exposure;
  const adcFullScale = i.electronsPerDn * (2 ** i.bits - 1);
  const maxSignal = Math.min(i.well, adcFullScale);
  const noiseAt = (signal: number) => sensorNoise({ signal, read: i.read, dark, electronsPerDn: i.electronsPerDn });
  const floor = noiseAt(0).temporal;
  const signal = i.quantumEfficiency * i.photons;
  const saturated = signal + dark > maxSignal;
  const noise = noiseAt(signal).temporal;
  const drExposureDb = dynamicRangeDb(maxSignal, floor, dark); // the dark charge occupies the well and the ADC range
  const crossoverRaw = darkReadCrossoverTemperature(i.read, i.darkRef * i.exposure, DARK_REF_TEMP, i.doubling);
  const crossoverInRange = Number.isFinite(crossoverRaw) && crossoverRaw >= SENSOR_TEMP_MIN && crossoverRaw <= SENSOR_TEMP_MAX;
  return {
    signal,
    darkRate,
    dark,
    adcFullScale,
    maxSignal,
    floor,
    noise,
    saturated,
    snr: saturated ? NaN : signal / noise,
    peakSnr: Math.sqrt(maxSignal),
    drDatasheetDb: dynamicRangeDb(i.well, i.read),
    drDatasheetStops: Math.log2(i.well / i.read),
    drExposureDb,
    drExposureStops: Number.isFinite(drExposureDb) ? Math.log2((maxSignal - dark) / floor) : NaN,
    quantization: i.electronsPerDn / Math.sqrt(12),
    floorDn: floor / i.electronsPerDn,
    crossoverTemp: crossoverInRange ? crossoverRaw : NaN,
    crossoverInRange,
    darkDensity: darkCurrentDensity(i.darkRef, i.pitch),
    wellDensity: i.well / i.pitch ** 2,
    adcLimitsFloor: floor / i.electronsPerDn < NOISE_FLOOR_ADC_LIMIT_DN,
  };
}
