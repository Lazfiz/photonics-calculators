import { capacitanceSummary, type DopingProfile } from "../../physics/detectors/capacitance";
import { defineSchema } from "../types";

const SZE = "Sze S. M., Ng K. K. (2007). Physics of Semiconductor Devices, 3rd ed. Wiley, doi:10.1002/0470068329, ch. 2: p–n junction depletion capacitance " +
  "C_j = C_j0/(1 + V_R/V_bi)^m with m = 1/2 (abrupt) or 1/3 (linearly graded); the photodiode with R_L + R_s has the single-pole bandwidth f_3dB = 1/(2π·(R_L + R_s)·C_j) " +
  "and time constant (R_L + R_s)·C_j.";

export default defineSchema({
  href: "/detectors/capacitance",
  inputs: [
    { key: "zeroBiasCap", label: "Zero-bias capacitance", unit: "pF", toSI: 1e-12, siUnit: "F", default: 10, min: 0.01, max: 1e6 },
    { key: "builtInVoltage", label: "Built-in voltage", unit: "V", toSI: 1, siUnit: "V", default: 0.6, min: 0.05, max: 5 },
    { key: "reverseBias", label: "Reverse bias", unit: "V", toSI: 1, siUnit: "V", default: 5, min: 0, max: 1000 },
    { key: "m", label: "Grading exponent m (custom profile only)", unit: "", toSI: 1, siUnit: "", default: 0.75, min: 0.05, max: 3 },
    { key: "loadResistance", label: "Load resistance", unit: "Ω", toSI: 1, siUnit: "Ω", default: 50, min: 1, max: 1e9 },
    { key: "seriesResistance", label: "Series resistance", unit: "Ω", toSI: 1, siUnit: "Ω", default: 10, min: 0, max: 1e6 },
  ],
  choices: [
    {
      key: "grading",
      label: "Doping profile",
      options: [
        { value: "abrupt", label: "Abrupt (m = 1/2)" },
        { value: "graded", label: "Linearly graded (m = 1/3)" },
        { value: "custom", label: "Custom m" },
      ],
      default: "abrupt",
    },
  ],
  outputs: [
    { key: "capacitance", label: "Junction capacitance", unit: "pF", toSI: 1e-12, siUnit: "F" },
    { key: "rcBw", label: "RC bandwidth", unit: "MHz", toSI: 1e6, siUnit: "Hz" },
    { key: "rcTime", label: "RC time constant", unit: "ns", toSI: 1e-9, siUnit: "s" },
  ],
  compute({ zeroBiasCap, builtInVoltage, reverseBias, m, loadResistance, seriesResistance, grading }) {
    const r = capacitanceSummary({
      zeroBiasCap, builtInVoltage, reverseBias, profile: grading as DopingProfile, customM: m, loadResistance, seriesResistance,
    });
    return { values: r };
  },
  checks: [
    {
      // C_j0 = 10 pF, V_bi = 0.6 V, V_R = 5.4 V (1 + V_R/V_bi = 10), abrupt m = 1/2, R = 50 + 10 = 60 Ω: C_j = 10/√10 = 3.1622777 pF;
      // f_3dB = 1/(2π·60·3.1622777e-12) = 838.8202 MHz; τ = 60 · 3.1622777e-12 = 0.18973666 ns.
      source: SZE,
      basis: "computed",
      inputs: { zeroBiasCap: 10, builtInVoltage: 0.6, reverseBias: 5.4, grading: "abrupt", loadResistance: 50, seriesResistance: 10 },
      expect: { capacitance: 3.162277660168379, rcBw: 838.8202017414508, rcTime: 0.18973665961010275 },
      tolerance: 1e-8,
    },
    {
      // Linearly graded m = 1/3, V_R = 4.2 V (1 + 4.2/0.6 = 8, 8^(1/3) = 2): C_j = 10/2 = 5 pF; f_3dB = 1/(2π·60·5e-12) = 530.5165 MHz; τ = 60·5e-12 = 0.3 ns.
      source: SZE,
      basis: "computed",
      inputs: { zeroBiasCap: 10, builtInVoltage: 0.6, reverseBias: 4.2, grading: "graded", loadResistance: 50, seriesResistance: 10 },
      expect: { capacitance: 5, rcBw: 530.5164769729846, rcTime: 0.3 },
      tolerance: 1e-8,
    },
    {
      // Custom m = 0.75, V_R = 1.8 V (1 + 1.8/0.6 = 4): C_j = 10 · 4^(−0.75) = 3.5355339 pF; f_3dB = 1/(2π·60·3.5355339e-12) = 750.2636 MHz.
      source: SZE,
      basis: "computed",
      inputs: { zeroBiasCap: 10, builtInVoltage: 0.6, reverseBias: 1.8, grading: "custom", m: 0.75, loadResistance: 50, seriesResistance: 10 },
      expect: { capacitance: 3.5355339059327373, rcBw: 750.2635967975885 },
      tolerance: 1e-8,
    },
  ],
});
