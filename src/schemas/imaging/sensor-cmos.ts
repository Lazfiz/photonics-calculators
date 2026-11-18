import { SENSOR_PRESETS, sensorCmosSummary } from "../../physics/imaging/sensor-cmos";
import { defineSchema } from "../types";

const JANESICK = "Janesick J. R. (2007). Photon Transfer: DN → λ. SPIE Press, doi:10.1117/3.725073: SNR = S/√(S + D + σ_read² + σ_q²) " +
  "with Poisson signal S and dark charge D, and dynamic range as the usable full well over the temporal noise floor.";
const EMVA = "EMVA Standard 1288, Release 3.1 (30 December 2016; the PDF file is named 3.1a). Standard for Characterization of Image Sensors and Cameras, " +
  "European Machine Vision Association, Eq. (11) (temporal SNR, σ_d² = σ_read² + μ_d, σ_q²/K² = K_e²/12). " +
  "https://www.emva.org/wp-content/uploads/EMVA1288-3.1a.pdf";
const JANESICK_CCD = "Janesick J. R. (2001). Scientific Charge-Coupled Devices, SPIE Press, https://doi.org/10.1117/3.374903: dark current doubles every few kelvin " +
  "(the empirical doubling law I ∝ 2^((T − T_ref)/T_d), T_d a measured input); dark charge q·R/p² per pixel area.";

const saturatedWarning = "Saturated: the signal plus the dark charge is above the full well or the ADC full scale, so there is no SNR.";
const noDark = "The dark current is 0, so the dark shot noise is 0 at every temperature and never crosses the read noise.";
const outside = "The temperature at which the dark shot noise equals the read noise lies outside the −120…60 °C input range.";
const noRange = "The dark charge fills the full well or the ADC range: no usable signal range is left, so there is no dynamic range.";

export default defineSchema({
  href: "/imaging/sensor-cmos",
  inputs: [
    { key: "photons", label: "Signal (photons/pixel)", unit: "photons", toSI: 1, siUnit: "photons", default: 1000, min: 0, max: 10000000 },
    { key: "quantumEfficiency", label: "Quantum efficiency", unit: "", toSI: 1, siUnit: "", default: SENSOR_PRESETS.cmos.quantumEfficiency, min: 0.01, max: 1 },
    { key: "pixelPitch", label: "Pixel pitch", unit: "µm", toSI: 1e-6, siUnit: "m", default: SENSOR_PRESETS.cmos.pixelPitch, min: 0.5, max: 50 },
    { key: "wellCapacity", label: "Full well capacity", unit: "e⁻", toSI: 1, siUnit: "e⁻", default: SENSOR_PRESETS.cmos.wellCapacity, min: 100, max: 1000000 },
    { key: "readNoise", label: "Read noise", unit: "e⁻ rms", toSI: 1, siUnit: "e⁻", default: SENSOR_PRESETS.cmos.readNoise, min: 0.1, max: 100 },
    { key: "darkCurrent", label: "Dark current at 25 °C", unit: "e⁻/s/pixel", toSI: 1, siUnit: "e⁻/s", default: SENSOR_PRESETS.cmos.darkCurrent, min: 0, max: 100000 },
    { key: "sensorTemp", label: "Sensor temperature", unit: "°C", toSI: 1, siUnit: "°C", default: SENSOR_PRESETS.cmos.sensorTemp, min: -120, max: 60 },
    { key: "doublingTemp", label: "Dark doubling temperature", unit: "K", toSI: 1, siUnit: "K", default: 6, min: 3, max: 12 },
    { key: "exposureTime", label: "Exposure time", unit: "ms", toSI: 1e-3, siUnit: "s", default: SENSOR_PRESETS.cmos.exposureTime, min: 0.01, max: 3600000 },
    { key: "conversionGain", label: "Conversion gain K", unit: "e⁻/DN", toSI: 1, siUnit: "e⁻/DN", default: SENSOR_PRESETS.cmos.conversionGain, min: 0.01, max: 1000 },
    { key: "bitDepth", label: "ADC bit depth", unit: "bit", toSI: 1, siUnit: "bit", default: SENSOR_PRESETS.cmos.bitDepth, min: 8, max: 24 },
  ],
  outputs: [
    { key: "signal", label: "Signal QE·N", unit: "e⁻", toSI: 1, siUnit: "e⁻" },
    { key: "snr", label: "SNR (temporal noise)", unit: "", toSI: 1, siUnit: "" },
    { key: "noise", label: "Total temporal noise at the signal", unit: "e⁻ rms", toSI: 1, siUnit: "e⁻" },
    { key: "darkCharge", label: "Dark charge per exposure", unit: "e⁻", toSI: 1, siUnit: "e⁻" },
    { key: "darkRate", label: "Dark current at the sensor temperature", unit: "e⁻/s", toSI: 1, siUnit: "e⁻/s" },
    { key: "noiseFloor", label: "Noise floor", unit: "e⁻ rms", toSI: 1, siUnit: "e⁻" },
    { key: "noiseFloorDn", label: "Noise floor in DN", unit: "DN", toSI: 1, siUnit: "DN" },
    { key: "dynamicRangeDatasheet", label: "Dynamic range FW/σ_read", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "dynamicRangeDatasheetStops", label: "Dynamic range FW/σ_read, in stops", unit: "stops", toSI: 1, siUnit: "stops" },
    { key: "dynamicRangeExposure", label: "Dynamic range at this exposure", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "dynamicRangeExposureStops", label: "Dynamic range at this exposure, in stops", unit: "stops", toSI: 1, siUnit: "stops" },
    { key: "adcFullScale", label: "ADC full scale", unit: "e⁻", toSI: 1, siUnit: "e⁻" },
    { key: "quantizationNoise", label: "Quantization noise K/√12", unit: "e⁻ rms", toSI: 1, siUnit: "e⁻" },
    { key: "peakSnr", label: "Peak SNR √(largest signal)", unit: "", toSI: 1, siUnit: "" },
    { key: "crossoverTemp", label: "Dark noise ≤ read noise below", unit: "°C", toSI: 1, siUnit: "°C" },
    { key: "darkDensity", label: "Dark current density at 25 °C", unit: "pA/cm²", toSI: 1e-8, siUnit: "A/m²" },
    { key: "wellDensity", label: "Full-well density", unit: "e⁻/µm²", toSI: 1e12, siUnit: "e⁻/m²" },
  ],
  compute(i) {
    const s = sensorCmosSummary({
      photons: i.photons, quantumEfficiency: i.quantumEfficiency, pitch: i.pixelPitch, well: i.wellCapacity, read: i.readNoise,
      darkRef: i.darkCurrent, temp: i.sensorTemp, doubling: i.doublingTemp, exposure: i.exposureTime,
      electronsPerDn: i.conversionGain, bits: Math.round(i.bitDepth),
    });
    const warnings: string[] = [];
    if (s.saturated) warnings.push(saturatedWarning);
    if (s.adcFullScale < i.wellCapacity) warnings.push("The ADC full scale is below the full well: the ADC clips first.");
    if (s.adcLimitsFloor) warnings.push("The noise floor is below 0.5 DN: the ADC step limits it.");
    const crossoverReason = !(i.darkCurrent * i.exposureTime > 0) ? noDark : outside;
    return {
      values: {
        signal: s.signal,
        snr: s.snr,
        noise: s.noise,
        darkCharge: s.dark,
        darkRate: s.darkRate,
        noiseFloor: s.floor,
        noiseFloorDn: s.floorDn,
        dynamicRangeDatasheet: s.drDatasheetDb,
        dynamicRangeDatasheetStops: s.drDatasheetStops,
        dynamicRangeExposure: s.drExposureDb,
        dynamicRangeExposureStops: s.drExposureStops,
        adcFullScale: s.adcFullScale,
        quantizationNoise: s.quantization,
        peakSnr: s.peakSnr,
        crossoverTemp: s.crossoverTemp,
        darkDensity: s.darkDensity,
        wellDensity: s.wellDensity,
      },
      warnings,
      reasons: {
        snr: saturatedWarning,
        dynamicRangeExposure: noRange,
        dynamicRangeExposureStops: noRange,
        crossoverTemp: crossoverReason,
      },
    };
  },
  checks: [
    {
      // Defaults (air-cooled sCMOS): S = 0.7·1000 = 700 e⁻; D = 2·2^((0 − 25)/6)·0.1 s = 0.011136234 e⁻;
      // σ_q² = K²/12 = 0.25/12; floor = √(1.5² + D + σ_q²) = 1.510618935 e⁻; noise = √(700 + 2.25 + D + σ_q²) = 26.50060319 e⁻; SNR = 700/noise = 26.41449309.
      source: EMVA,
      basis: "computed",
      inputs: {},
      expect: { snr: 26.41449309341101, darkCharge: 0.01113623397675424, noiseFloor: 1.510618935175277, noiseFloorDn: 3.021237870350554 },
      tolerance: 1e-8,
    },
    {
      // Deep-cooled CCD preset, 20000 photons: QE 0.92 → S = 18400 e⁻; D = 200·2^((−70 − 25)/6)·1 s = 0.0034254823 e⁻;
      // ADC full scale K·(2¹⁶ − 1) = 1.25·65535 = 81918.75 e⁻ > FW 80000, so S_max = 80000; floor = √(8² + D + 1.25²/12) = 8.00834776 e⁻;
      // SNR = 18400/√(18400 + 8² + D + 1.25²/12) = 135.41081614; DR = 20·log₁₀((80000 − D)/floor) = 79.99094089 dB = 13.28620769 stops;
      // peak SNR √80000 = 282.84271247; FW/σ_read = 10000 → 80 dB. Janesick's definition (usable well / noise floor), not EMVA's μ_sat/μ_min.
      source: JANESICK,
      basis: "computed",
      inputs: {
        photons: 20000, quantumEfficiency: 0.92, pixelPitch: 16, wellCapacity: 80000, readNoise: 8, darkCurrent: 200,
        sensorTemp: -70, exposureTime: 1000, conversionGain: 1.25, bitDepth: 16,
      },
      expect: {
        snr: 135.4108161449148, adcFullScale: 81918.75, dynamicRangeExposure: 79.99094089025593,
        dynamicRangeExposureStops: 13.286207693990775, dynamicRangeDatasheet: 80, peakSnr: 282.842712474619,
      },
      tolerance: 1e-8,
    },
    {
      // Defaults: dark shot noise = read noise when R₂₅·t·2^((T − 25)/T_d) = σ_read², so T* = 25 + 6·log₂(2.25/(2·0.1)) = 45.95111858 °C;
      // dark current density q·R/p² = 1.602176634e-19·2/(6.5e-6)² = 7.58426809e-9 A/m² = 0.758426809 pA/cm²; FW/p² = 25000/6.5² = 591.715976 e⁻/µm².
      source: JANESICK_CCD,
      basis: "computed",
      inputs: {},
      expect: { crossoverTemp: 45.95111857797805, darkDensity: 0.7584268089940829, wellDensity: 591.7159763313609 },
      tolerance: 1e-8,
    },
  ],
});
