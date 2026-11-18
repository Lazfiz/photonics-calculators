import { SATURATION_BIT_DEPTHS, saturationSummary } from "../../physics/detectors/saturation";
import { defineSchema } from "../types";

const JANESICK = "Janesick J. R. (2007). Photon Transfer. SPIE Press, doi:10.1117/3.725073: dynamic range 20·log₁₀(FWC/σ_floor), ADC step Δ = FWC/(2^bits − 1) e⁻/DN " +
  "with quantisation noise Δ/√12 in quadrature with the read noise, and SNR at full well FWC/√(FWC + σ_floor²); the compressive response is illustrative.";

export default defineSchema({
  href: "/detectors/saturation",
  inputs: [
    { key: "fullWellCapacity", label: "Full well capacity", unit: "e⁻", toSI: 1, siUnit: "e⁻", default: 20000, min: 100, max: 1e7 },
    { key: "readNoise", label: "Read noise", unit: "e⁻ rms", toSI: 1, siUnit: "e⁻", default: 5, min: 0.01, max: 1000 },
    { key: "bitDepth", label: "ADC bit depth (8, 10, 12, 14 or 16)", unit: "bit", toSI: 1, siUnit: "bit", default: 12, min: 8, max: 16 },
    { key: "nonlinearityPercent", label: "Nonlinearity at full well", unit: "% FS", toSI: 0.01, siUnit: "", default: 0.5, min: 0, max: 50 },
  ],
  outputs: [
    { key: "dynamicRange", label: "Dynamic range (read noise only)", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "dynamicRangeAdc", label: "Dynamic range with ADC noise", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "noiseFloor", label: "Noise floor √(σ_read² + Δ²/12)", unit: "e⁻ rms", toSI: 1, siUnit: "e⁻" },
    { key: "snrSatDb", label: "SNR at full well", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "dnMax", label: "Maximum DN", unit: "DN", toSI: 1, siUnit: "DN" },
    { key: "electronsPerDn", label: "Conversion gain Δ", unit: "e⁻/DN", toSI: 1, siUnit: "e⁻/DN" },
    { key: "responseAtFullWell", label: "Recorded signal at full well FWC·(1 − n) (illustrative quadratic compression)", unit: "e⁻", toSI: 1, siUnit: "e⁻" },
  ],
  validate({ bitDepth }) {
    if (!SATURATION_BIT_DEPTHS.includes(bitDepth)) return `The bit depth must be one of ${SATURATION_BIT_DEPTHS.join(", ")} (got ${bitDepth}).`;
    return undefined;
  },
  compute({ fullWellCapacity, readNoise, nonlinearityPercent, bitDepth }) {
    const r = saturationSummary({ fullWell: fullWellCapacity, readNoise, bitDepth, nonlinearity: nonlinearityPercent });
    const warnings = r.quantNoise > readNoise
      ? [`ADC-limited: the quantisation noise Δ/√12 = ${r.quantNoise.toFixed(2)} e⁻ exceeds the read noise.`]
      : [];
    return {
      values: {
        dynamicRange: r.dynamicRange, dynamicRangeAdc: r.dynamicRangeAdc, noiseFloor: r.noiseFloor, snrSatDb: r.snrSatDb,
        dnMax: r.dnMax, electronsPerDn: r.electronsPerDn, responseAtFullWell: r.responseAtFullWell,
      },
      warnings,
    };
  },
  checks: [
    {
      // FWC = 50000 e⁻, σ_read = 5 e⁻, 14 bit, n = 2 %: DN_max = 16383; Δ = 50000/16383 = 3.0519441 e⁻/DN; Δ/√12 = 0.88102037 e⁻ (< 5, no warning);
      // floor √(25 + 0.77626) = 5.0770264 e⁻; DR = 20·log₁₀(50000/5) = 80 dB; DR_ADC = 20·log₁₀(50000/5.0770264) = 79.867212 dB;
      // SNR = 20·log₁₀(50000/√(50000 + 5.0770264²)) = 46.987462 dB; response W(1 − n) = 50000·0.98 = 49000 e⁻.
      source: JANESICK,
      basis: "computed",
      inputs: { fullWellCapacity: 50000, readNoise: 5, bitDepth: 14, nonlinearityPercent: 2 },
      expect: {
        dnMax: 16383, electronsPerDn: 3.051944088384301, noiseFloor: 5.077026382954757, dynamicRange: 80,
        dynamicRangeAdc: 79.8672116819653, snrSatDb: 46.98746172824811, responseAtFullWell: 49000,
      },
      tolerance: 1e-8,
    },
    {
      // FWC = 1e5 e⁻, σ_read = 2 e⁻, 14 bit, n = 0.5 %: DN_max = 16383; Δ = 6.1038882 e⁻/DN; Δ/√12 = 1.7620407 e⁻ (< σ_read); floor √(4 + 3.1047876) = 2.6654807 e⁻;
      // DR = 20·log₁₀(5e4) = 93.979400 dB; DR_ADC = 20·log₁₀(1e5/2.6654807) = 91.484489 dB; SNR = 1e5/√(1e5 + 7.1047876) → 49.999691 dB; response 1e5·0.995 = 99500 e⁻.
      source: JANESICK,
      basis: "computed",
      inputs: { fullWellCapacity: 1e5, readNoise: 2, bitDepth: 14, nonlinearityPercent: 0.5 },
      expect: {
        dnMax: 16383, electronsPerDn: 6.103888176768602, noiseFloor: 2.665480739542987, dynamicRange: 93.97940008672037,
        dynamicRangeAdc: 91.48448902579231, snrSatDb: 49.99969145395684, responseAtFullWell: 99500,
      },
      tolerance: 1e-8,
    },
  ],
});
