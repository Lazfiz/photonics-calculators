import { amplifierNoiseSummary } from "../../physics/detectors/amplifier-noise";
import { defineSchema } from "../types";

const JANESICK = "Janesick J. R. (2007). Photon Transfer. SPIE Press, doi:10.1117/3.725073: total noise as the quadrature sum of shot noise √S, " +
  "input-referred read noise e_n and ADC quantisation noise g/√12 (g in e⁻/DN); the minimum detectable signal is the root of S² − k²S − k²σ² = 0 at SNR k = 3.";

export default defineSchema({
  href: "/detectors/amplifier-noise",
  inputs: [
    { key: "en", label: "Input noise eₙ", unit: "e⁻ rms", toSI: 1, siUnit: "e⁻", default: 5, min: 0.1, max: 1e4 },
    { key: "gain", label: "Conversion gain", unit: "e⁻/DN", toSI: 1, siUnit: "e⁻/DN", default: 2, min: 0.1, max: 1e5 },
    { key: "signal", label: "Signal level", unit: "e⁻", toSI: 1, siUnit: "e⁻", default: 1000, min: 1, max: 1e9 },
  ],
  outputs: [
    { key: "noiseDn", label: "Read floor", unit: "DN", toSI: 1, siUnit: "DN" },
    { key: "shotNoise", label: "Shot noise", unit: "e⁻", toSI: 1, siUnit: "e⁻" },
    { key: "totalNoise", label: "Total noise", unit: "e⁻", toSI: 1, siUnit: "e⁻" },
    { key: "snrTotal", label: "Total SNR", unit: "", toSI: 1, siUnit: "" },
    { key: "minDetectable", label: "Minimum detectable signal (SNR = 3)", unit: "e⁻", toSI: 1, siUnit: "e⁻" },
  ],
  compute({ en, gain, signal }) {
    const r = amplifierNoiseSummary({ inputNoise: en, conversionGain: gain, signal });
    return { values: { noiseDn: r.noiseDn, shotNoise: r.shotNoise, totalNoise: r.totalNoise, snrTotal: r.snrTotal, minDetectable: r.minDetectable } };
  },
  checks: [
    {
      // e_n = 3 e⁻, g = 6 e⁻/DN, S = 100 e⁻: σ_read² = 9 + 36/12 = 12 e⁻²; read floor √12/6 = 0.5773503 DN; shot √100 = 10 e⁻;
      // total √(100 + 12) = √112 = 10.583005 e⁻; SNR = 100/10.583005 = 9.449112; S_min = (9 + √(81 + 36·12))/2 = (9 + √513)/2 = 15.824752 e⁻.
      source: JANESICK,
      basis: "computed",
      inputs: { en: 3, gain: 6, signal: 100 },
      expect: {
        noiseDn: 0.5773502691896257,
        shotNoise: 10,
        totalNoise: 10.583005244258363,
        snrTotal: 9.44911182523068,
        minDetectable: 15.824751652906125,
      },
      tolerance: 1e-8,
    },
  ],
});
