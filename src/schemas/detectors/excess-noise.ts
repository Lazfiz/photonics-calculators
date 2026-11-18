import { excessNoiseSummary } from "../../physics/detectors/excess-noise";
import { defineSchema } from "../types";

const MCINTYRE = "McIntyre R. J. (1966). Multiplication noise in uniform avalanche diodes. IEEE Trans. Electron Devices ED-13, 164–168, " +
  "doi:10.1109/T-ED.1966.15651: F = kM + (1 − k)(2 − 1/M) for injection of the more ionizing carrier; datasheet form F = M^x, x = ln F/ln M. " +
  "The shot-limited amplitude SNR of an APD is that of a p-i-n diode divided by √F.";

export default defineSchema({
  href: "/detectors/excess-noise",
  inputs: [
    { key: "gain", label: "Multiplication gain M", unit: "", toSI: 1, siUnit: "", default: 100, min: 1, max: 1e4 },
    { key: "kFactor", label: "Ionization ratio k", unit: "", toSI: 1, siUnit: "", default: 0.02, min: 0, max: 1 },
    { key: "quantumEff", label: "Quantum efficiency (SNR chart only)", unit: "", toSI: 1, siUnit: "", default: 0.8, min: 0.01, max: 1 },
  ],
  outputs: [
    { key: "excessNoise", label: "Excess noise factor F", unit: "", toSI: 1, siUnit: "" },
    { key: "noiseFigure", label: "Noise figure 10·log₁₀F", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "snrRatio", label: "Shot-limited SNR relative to a p-i-n diode, 1/√F", unit: "", toSI: 1, siUnit: "" },
    { key: "excessNoiseIndex", label: "Excess noise index x (F = M^x)", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ gain, kFactor }) {
    const r = excessNoiseSummary(gain, kFactor);
    const reasons: Record<string, string> = {};
    if (!Number.isFinite(r.index)) reasons.excessNoiseIndex = "The gain is 1 (no multiplication), where F = M^x does not define x.";
    return {
      values: { excessNoise: r.factor, noiseFigure: r.noiseFigureDb, snrRatio: r.snrRatio, excessNoiseIndex: r.index },
      warnings: [],
      reasons,
    };
  },
  checks: [
    {
      // M = 100, k = 0.02: F = 0.02·100 + 0.98·(2 − 0.01) = 2 + 1.9502 = 3.9502; 10·log10 F = 5.96619085 dB;
      // 1/√F = 0.50314187; x = ln 3.9502/ln 100 = 1.37393/4.60517 = 0.29830954.
      source: MCINTYRE,
      basis: "computed",
      inputs: {},
      expect: { excessNoise: 3.9501999999999997, noiseFigure: 5.966190846638009, snrRatio: 0.5031418678190556, excessNoiseIndex: 0.2983095423319004 },
      tolerance: 1e-8,
    },
    {
      // M = 10, k = 0.5: F = 0.5·10 + 0.5·(2 − 0.1) = 5 + 0.95 = 5.95; 10·log10 F = 7.74516966 dB; 1/√F = 0.40996003;
      // x = ln 5.95/ln 10 = 1.78339/2.302585 = 0.77451697.
      source: MCINTYRE,
      basis: "computed",
      inputs: { gain: 10, kFactor: 0.5 },
      expect: { excessNoise: 5.95, noiseFigure: 7.745169657285496, snrRatio: 0.4099600308453939, excessNoiseIndex: 0.7745169657285494 },
      tolerance: 1e-8,
    },
  ],
});
