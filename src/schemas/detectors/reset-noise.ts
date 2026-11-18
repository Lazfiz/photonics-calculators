import { resetNoiseSummary } from "../../physics/detectors/reset-noise";
import { defineSchema } from "../types";

const KTC = "Janesick J. R. (2007). Photon Transfer. SPIE Press, doi:10.1117/3.725073: reset (kTC) noise of a sense node, voltage √(k_B·T/C), " +
  "charge √(k_B·T·C) = q·N_e (independent of the reset switch resistance), conversion gain q/C; k_B and q exact in the 2019 SI.";

export default defineSchema({
  href: "/detectors/reset-noise",
  inputs: [
    { key: "capacitance", label: "Sense-node capacitance", unit: "F", toSI: 1, siUnit: "F", default: 10e-15, min: 1e-18, max: 1e-6 },
    { key: "temperature", label: "Temperature", unit: "K", toSI: 1, siUnit: "K", default: 300, min: 0, max: 1e4 },
  ],
  outputs: [
    { key: "noiseV", label: "kTC noise voltage √(k_B·T/C)", unit: "mV", toSI: 1e-3, siUnit: "V" },
    { key: "noiseElectrons", label: "kTC noise charge √(k_B·T·C)/q", unit: "e⁻", toSI: 1, siUnit: "e⁻" },
    { key: "conversionGain", label: "Conversion gain q/C", unit: "µV/e⁻", toSI: 1e-6, siUnit: "V/e⁻" },
  ],
  compute({ capacitance, temperature }) {
    return { values: resetNoiseSummary(capacitance, temperature) };
  },
  checks: [
    {
      // C = 1 pF, T = 300 K, k_B = 1.380649e-23 J/K, q = 1.602176634e-19 C: v = √(1.380649e-23·300/1e-12) = 64.35796 µV = 0.06435796 mV;
      // N_e = √(1.380649e-23·300·1e-12)/q = 401.69079 e⁻; q/C = 0.1602176634 µV/e⁻.
      source: KTC,
      basis: "computed",
      inputs: { capacitance: 1e-12, temperature: 300 },
      expect: { noiseV: 0.06435795988065501, noiseElectrons: 401.6907906088899, conversionGain: 0.1602176634 },
      tolerance: 1e-8,
    },
    {
      // C = 10 fF, T = 77 K: v = √(1.380649e-23·77/1e-14) = 0.32605210 mV; N_e = √(1.380649e-23·77·1e-14)/q = 20.350572 e⁻; q/C = 16.02176634 µV/e⁻.
      source: KTC,
      basis: "computed",
      inputs: { capacitance: 10e-15, temperature: 77 },
      expect: { noiseV: 0.3260521016647493, noiseElectrons: 20.35057151287536, conversionGain: 16.02176634 },
      tolerance: 1e-8,
    },
  ],
});
