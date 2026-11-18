import { avalancheGainSummary } from "../../physics/detectors/avalanche-gain";
import { defineSchema } from "../types";

const MILLER_MCINTYRE = "Miller S. L. (1955). Avalanche breakdown in germanium. Phys. Rev. 99, 1234–1241, doi:10.1103/PhysRev.99.1234: " +
  "M = 1/[1 − (V/V_br)^n] (empirical). McIntyre R. J. (1966). Multiplication noise in uniform avalanche diodes. IEEE Trans. Electron " +
  "Devices ED-13, 164–168, doi:10.1109/T-ED.1966.15651: F = kM + (1 − k)(2 − 1/M); with F = M^x the excess noise index is x = ln F/ln M.";

export default defineSchema({
  href: "/detectors/avalanche-gain",
  inputs: [
    { key: "breakdownVoltage", label: "Breakdown voltage V_br", unit: "V", toSI: 1, siUnit: "V", default: 150, min: 1, max: 5000 },
    { key: "biasVoltage", label: "Bias voltage V", unit: "V", toSI: 1, siUnit: "V", default: 140, min: 0, max: 5000 },
    { key: "n", label: "Miller exponent n (device fit)", unit: "", toSI: 1, siUnit: "", default: 3, min: 0.1, max: 10 },
    { key: "ionizationRatio", label: "Ionization ratio k", unit: "", toSI: 1, siUnit: "", default: 0.02, min: 0, max: 1 },
  ],
  outputs: [
    { key: "biasRatio", label: "V/V_br", unit: "", toSI: 1, siUnit: "" },
    { key: "gain", label: "Gain M", unit: "", toSI: 1, siUnit: "" },
    { key: "excessNoise", label: "Excess noise factor F", unit: "", toSI: 1, siUnit: "" },
    { key: "excessNoiseIndex", label: "Excess noise index x (F = M^x)", unit: "", toSI: 1, siUnit: "" },
    { key: "noiseCurrentGain", label: "Noise current gain √F·M", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ breakdownVoltage, biasVoltage, n, ionizationRatio }) {
    const r = avalancheGainSummary(biasVoltage, breakdownVoltage, n, ionizationRatio);
    const warnings: string[] = [];
    const reasons: Record<string, string> = {};
    if (r.aboveBreakdown) {
      const above = "The bias is at or above the breakdown voltage: the Miller gain diverges (Geiger mode, outside this model).";
      warnings.push(above);
      for (const k of ["gain", "excessNoise", "excessNoiseIndex", "noiseCurrentGain"]) reasons[k] = above;
    } else if (!Number.isFinite(r.noiseIndex)) {
      reasons.excessNoiseIndex = "The gain is 1 (no multiplication), where F = M^x does not define x.";
    }
    return {
      values: {
        biasRatio: r.ratio, gain: r.gain, excessNoise: r.noiseFactor, excessNoiseIndex: r.noiseIndex, noiseCurrentGain: r.noiseGain,
      },
      warnings,
      reasons,
    };
  },
  checks: [
    {
      // V/V_br = 140/150 = 0.9333333; (V/V_br)^3 = 0.8130370; M = 1/(1 − 0.8130370) = 5.3486529.
      // k = 0.02: F = 0.02·5.3486529 + 0.98·(2 − 1/5.3486529) = 0.1069731 + 0.98·1.8130370 = 1.8837494; x = ln F/ln M = 0.6335/1.6773 = 0.37765; √F·M = 1.3724·5.3486529 = 7.34101.
      source: MILLER_MCINTYRE,
      basis: "computed",
      inputs: {},
      expect: {
        biasRatio: 0.9333333333333333, gain: 5.348652931854202, excessNoise: 1.8837493549333804,
        excessNoiseIndex: 0.3776522137833459, noiseCurrentGain: 7.3410127138689685,
      },
      tolerance: 1e-8,
    },
    {
      // V = 120 V, V_br = 150 V, n = 3, k = 0.5: V/V_br = 0.8; 0.8³ = 0.512; M = 1/0.488 = 2.0491803;
      // F = 0.5·2.0491803 + 0.5·(2 − 0.488) = 1.0245902 + 0.756 = 1.7805902; x = ln 1.7805902/ln 2.0491803 = 0.57702/0.71740 = 0.80417; √F·M = 1.334388·2.0491803 = 2.73440.
      source: MILLER_MCINTYRE,
      basis: "computed",
      inputs: { biasVoltage: 120, ionizationRatio: 0.5 },
      expect: {
        biasRatio: 0.8, gain: 2.049180327868853, excessNoise: 1.7805901639344266,
        excessNoiseIndex: 0.8041717274625727, noiseCurrentGain: 2.734400740508803,
      },
      tolerance: 1e-8,
    },
  ],
});
