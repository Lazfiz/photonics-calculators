import { temporalNoiseSummary } from "../../physics/detectors/temporal-noise";
import { defineSchema } from "../types";

const MODEL = "Motchenbacher C. D., Connelly J. A. (1993). Low-Noise Electronic System Design. Wiley: 1/f corner model, density (σ_read²/B)·(1 + f_c/f) over f_L…B, " +
  "so σ_1/f = σ_read·√((f_c/B)·ln(B/f_L)); Janesick J. R. (2007). Photon Transfer. SPIE Press, doi:10.1117/3.725073: Poisson dark charge σ_dark = √(I_dark·t); " +
  "total √(σ_read² + σ_dark² + σ_1/f²), times the conversion gain at the sense node.";
const BAND = "The read-out bandwidth must be above the lower band edge f_L: the 1/f term (and the total) has no value for an empty band.";

export default defineSchema({
  href: "/detectors/temporal-noise",
  inputs: [
    { key: "readNoise", label: "White read noise over B", unit: "e⁻ rms", toSI: 1, siUnit: "e⁻", default: 5, min: 0, max: 1e4 },
    { key: "darkCurrent", label: "Dark current", unit: "e⁻/pix/s", toSI: 1, siUnit: "e⁻/s", default: 0.1, min: 0, max: 1e9 },
    { key: "exposureTime", label: "Exposure time", unit: "s", toSI: 1, siUnit: "s", default: 0.01, min: 0, max: 1e6 },
    { key: "kneeFreq", label: "1/f corner frequency", unit: "Hz", toSI: 1, siUnit: "Hz", default: 1000, min: 0, max: 1e12 },
    { key: "bandwidth", label: "Read-out bandwidth B", unit: "Hz", toSI: 1, siUnit: "Hz", default: 1e6, min: 1e-3, max: 1e12 },
    { key: "fLow", label: "Lower band edge f_L", unit: "Hz", toSI: 1, siUnit: "Hz", default: 50, min: 1e-6, max: 1e12 },
    { key: "conversionGain", label: "Conversion gain", unit: "μV/e⁻", toSI: 1e-6, siUnit: "V/e⁻", default: 2, min: 0, max: 1e6 },
  ],
  outputs: [
    { key: "darkShotNoise", label: "Dark shot noise √(I_dark·t)", unit: "e⁻ rms", toSI: 1, siUnit: "e⁻" },
    { key: "flickerNoise", label: "1/f noise from f_L to B", unit: "e⁻ rms", toSI: 1, siUnit: "e⁻" },
    { key: "totalNoise", label: "Total noise (with 1/f)", unit: "e⁻ rms", toSI: 1, siUnit: "e⁻" },
    { key: "totalNoiseVoltage", label: "Total noise at the sense node", unit: "μV rms", toSI: 1e-6, siUnit: "V" },
  ],
  compute(si) {
    const r = temporalNoiseSummary(si);
    const empty = !(si.bandwidth > si.fLow);
    return {
      values: r,
      warnings: empty ? [BAND] : [],
      reasons: empty ? { flickerNoise: BAND, totalNoise: BAND, totalNoiseVoltage: BAND } : {},
    };
  },
  checks: [
    {
      // σ_read = 4 e⁻, 2 e⁻/s for 3 s (dark charge 6 e⁻), f_c = 1000 Hz, B = 1e5 Hz, f_L = 10 Hz, 3 μV/e⁻:
      // σ_dark = √6 = 2.4494897 e⁻; σ_1/f = 4·√(0.01·ln(1e4)) = 1.2139417 e⁻; total √(16 + 6 + 1.4736842) = 4.8449618 e⁻; × 3 μV/e⁻ = 14.534885 μV.
      source: MODEL,
      basis: "computed",
      inputs: { readNoise: 4, darkCurrent: 2, exposureTime: 3, kneeFreq: 1000, bandwidth: 1e5, fLow: 10, conversionGain: 3 },
      expect: { darkShotNoise: 2.449489742783178, flickerNoise: 1.213941703508117, totalNoise: 4.844961760377082, totalNoiseVoltage: 14.534885281131245 },
      tolerance: 1e-8,
    },
    {
      // Defaults: σ_read = 5 e⁻, 0.1 e⁻/s for 0.01 s (0.001 e⁻), f_c = 1000 Hz, B = 1e6 Hz, f_L = 50 Hz, 2 μV/e⁻:
      // σ_dark = √0.001 = 0.0316228 e⁻; σ_1/f = 5·√(1e-3·ln(2e4)) = 0.4975813 e⁻; total √(25 + 0.001 + 0.2476) = 5.0247972 e⁻; × 2 = 10.049594 μV.
      source: MODEL,
      basis: "computed",
      inputs: {},
      expect: { darkShotNoise: 0.03162277660168379, flickerNoise: 0.4975813388918471, totalNoise: 5.024797228626585, totalNoiseVoltage: 10.04959445725317 },
      tolerance: 1e-8,
    },
  ],
});
