import { dynamicRangeSummary, NOISE_FLOOR_ADC_LIMIT_DN } from "../../physics/imaging/dynamic-range";
import { defineSchema } from "../types";

const EMVA = "EMVA Standard 1288, Release 3.1 (30 December 2016; the PDF file is named 3.1a). Standard for Characterization of Image Sensors and Cameras, " +
  "European Machine Vision Association, Eq. (17) (the dark-noise term σ_d² + σ_q²/K² of the absolute sensitivity threshold) and Eq. (45)–(48) (DSNU, PRNU, total SNR). " +
  "https://www.emva.org/wp-content/uploads/EMVA1288-3.1a.pdf";
const JANESICK = "Janesick J. R. (2007). Photon Transfer: DN → λ. SPIE Press. Dynamic range as full well over the temporal noise floor, " +
  "and the read, shot and fixed-pattern noise regimes of the photon transfer curve. https://doi.org/10.1117/3.725073";

const noWell = "The dark charge fills the full well: no usable signal range is left, so there is no dynamic range.";
const noPrnu = "PRNU is 0 (a perfectly uniform sensor), so shot noise never reaches the PRNU noise.";

export default defineSchema({
  href: "/imaging/dynamic-range",
  inputs: [
    { key: "fullWellCapacity", label: "Full well capacity", unit: "e⁻", toSI: 1, siUnit: "e⁻", default: 30000, min: 100, max: 1000000 },
    { key: "readNoise", label: "Read noise", unit: "e⁻ rms", toSI: 1, siUnit: "e⁻", default: 2, min: 0.1, max: 100 },
    { key: "darkCurrent", label: "Dark current", unit: "e⁻/s/pixel", toSI: 1, siUnit: "e⁻/s", default: 0.05, min: 0, max: 10000 },
    { key: "exposureTime", label: "Exposure time", unit: "ms", toSI: 1e-3, siUnit: "s", default: 100, min: 0.01, max: 3600000 },
    { key: "bitDepth", label: "ADC bit depth (rounded to an integer)", unit: "", toSI: 1, siUnit: "", default: 14, min: 8, max: 24 },
    { key: "prnu", label: "PRNU (% of signal)", unit: "%", toSI: 0.01, siUnit: "", default: 1, min: 0, max: 10 },
    { key: "dsnuE", label: "DSNU", unit: "e⁻ rms", toSI: 1, siUnit: "e⁻", default: 0.5, min: 0, max: 100 },
  ],
  outputs: [
    { key: "dynamicRange", label: "Dynamic range", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "stops", label: "Dynamic range in stops", unit: "stops", toSI: 1, siUnit: "" },
    { key: "noiseFloor", label: "Temporal noise floor", unit: "e⁻ rms", toSI: 1, siUnit: "e⁻" },
    { key: "darkCharge", label: "Dark charge per exposure", unit: "e⁻", toSI: 1, siUnit: "e⁻" },
    { key: "electronsPerDn", label: "ADC step", unit: "e⁻/DN", toSI: 1, siUnit: "e⁻/DN" },
    { key: "quantizationNoise", label: "Quantization noise", unit: "e⁻ rms", toSI: 1, siUnit: "e⁻" },
    { key: "noiseFloorDn", label: "Noise floor in DN", unit: "DN", toSI: 1, siUnit: "DN" },
    { key: "snrHalfWell", label: "SNR at half full well", unit: "", toSI: 1, siUnit: "" },
    { key: "snrHalfWellFlatField", label: "SNR at half full well after flat-field correction", unit: "", toSI: 1, siUnit: "" },
    { key: "shotReadCrossover", label: "Signal where shot noise equals read noise", unit: "e⁻", toSI: 1, siUnit: "e⁻" },
    { key: "shotPrnuCrossover", label: "Signal where shot noise equals PRNU noise", unit: "e⁻", toSI: 1, siUnit: "e⁻" },
  ],
  compute({ fullWellCapacity, readNoise, darkCurrent, exposureTime, bitDepth, prnu, dsnuE }) {
    const s = dynamicRangeSummary({
      well: fullWellCapacity, read: readNoise, darkRate: darkCurrent, exposure: exposureTime,
      bits: Math.round(bitDepth), prnu, dsnu: dsnuE,
    });
    const warnings: string[] = [];
    if (!Number.isFinite(s.dynamicRangeDb)) warnings.push(noWell);
    if (s.floorDn < NOISE_FLOOR_ADC_LIMIT_DN) {
      warnings.push("The noise floor is below 0.5 DN: the ADC step sets the floor, so add bits.");
    }
    if (!(prnu > 0)) warnings.push(noPrnu);
    warnings.push(...s.warnings);
    return {
      values: {
        dynamicRange: s.dynamicRangeDb,
        stops: s.stops,
        noiseFloor: s.floor,
        darkCharge: s.dark,
        electronsPerDn: s.electronsPerDn,
        quantizationNoise: s.quantization,
        noiseFloorDn: s.floorDn,
        snrHalfWell: s.snrHalf,
        snrHalfWellFlatField: s.snrHalfFlat,
        shotReadCrossover: s.shotReadCrossover,
        shotPrnuCrossover: s.shotPrnuCrossover,
      },
      warnings,
      reasons: { dynamicRange: noWell, stops: noWell, shotPrnuCrossover: noPrnu },
    };
  },
  checks: [
    {
      // Defaults: K = 30000/16383 = 1.8311665 e⁻/DN, σ_q² = K²/12, D = 0.05 e⁻/s × 0.1 s = 0.005 e⁻,
      // floor = √(2² + 0.005 + σ_q²) = 2.0698867 e⁻ (the EMVA dark-noise term σ_d² + σ_q²/K²), in DN: 2.0698867/1.8311665 = 1.1303651.
      source: EMVA,
      basis: "computed",
      inputs: {},
      expect: { noiseFloor: 2.0698866832652, noiseFloorDn: 1.1303651177311 },
      tolerance: 1e-8,
    },
    {
      // FW 50000 e⁻, read 1.5 e⁻, dark 2 e⁻/s × 0.5 s = 1 e⁻, 14 bit, PRNU 0.5 %, DSNU 2 e⁻, S = 25000 e⁻:
      // K = 50000/16383 = 3.0519441, σ_q² = K²/12; total² = S + D + σ_r² + σ_q² + DSNU² + (PRNU·S)² (Eq. 48), temporal² without the DSNU and PRNU terms.
      source: EMVA,
      basis: "computed",
      inputs: { fullWellCapacity: 50000, readNoise: 1.5, darkCurrent: 2, exposureTime: 500, bitDepth: 14, prnu: 0.5, dsnuE: 2 },
      expect: { snrHalfWell: 124.02248376198, snrHalfWellFlatField: 158.10115259356 },
      tolerance: 1e-8,
    },
    {
      // Defaults: DR = 20·log₁₀((FW − D)/floor) = 20·log₁₀((30000 − 0.005)/2.0698867) = 83.223492 dB = log₂(14493.5446) = 13.823123 stops.
      // Shot noise √S equals the read noise σ_r at S = σ_r² = 2² = 4 e⁻ and the PRNU noise P·S at S = 1/P² = 1/0.01² = 10000 e⁻.
      source: JANESICK,
      basis: "computed",
      inputs: {},
      expect: { dynamicRange: 83.223492236927, stops: 13.823122850824, shotReadCrossover: 4, shotPrnuCrossover: 10000 },
      tolerance: 1e-8,
    },
  ],
});
