import { T_MAX } from "../../physics/laser-safety/eye-exposure-limits";
import { rangeToDiameter, roundBeam } from "../../physics/laser-safety/hazard-distance";
import { pulseTrainLimits, pulseTrainSafeDiameter } from "../../physics/laser-safety/pulse-train";
import { defineSchema } from "../types";
import { ICNIRP_2013, WAVELENGTH } from "./common";

const RULES = `${ICNIRP_2013}. Table 5 (single-pulse limits) and Table 6 / p. 287 (the three rules for repetitive pulses, ` +
  "C_P, T_i, T_2 of Table 4). https://doi.org/10.1097/HP.0b013e3182983fd4";

export default defineSchema({
  href: "/laser-safety/ultrafast-laser-safety",
  inputs: [
    { key: "pulseEnergy", label: "Pulse energy", unit: "µJ", toSI: 1e-6, siUnit: "J", default: 0.0125, min: 0, max: 1e12 },
    { key: "repRate", label: "Repetition rate (0 = one pulse)", unit: "MHz", toSI: 1e6, siUnit: "Hz", default: 80, min: 0, max: 1e9 },
    { key: "pulseWidth", label: "Pulse duration", unit: "fs", toSI: 1e-15, siUnit: "s", default: 100, min: 1, max: 1e15 },
    { ...WAVELENGTH, default: 800 },
    { key: "beamDia", label: "Beam diameter, 1/e²", unit: "mm", toSI: 1e-3, siUnit: "m", default: 2, min: 0.001, max: 1e4 },
    { key: "divergence", label: "Full-angle divergence, 1/e²", unit: "mrad", toSI: 1e-3, siUnit: "rad", default: 1, min: 0, max: 1000 },
    { key: "exposureTime", label: "Exposure time", unit: "s", toSI: 1, siUnit: "s", default: 10, min: 1e-15, max: T_MAX },
  ],
  outputs: [
    { key: "averagePower", label: "Average power", unit: "mW", toSI: 1e-3, siUnit: "W" },
    { key: "peakPower", label: "Peak power E/τ", unit: "W", toSI: 1, siUnit: "W" },
    { key: "maxPulseEnergy", label: "Max energy per pulse", unit: "µJ", toSI: 1e-6, siUnit: "J" },
    { key: "bindingRule", label: "Rule that binds (1 single pulse, 2 average power, 3 C_P × single pulse)", unit: "", toSI: 1, siUnit: "" },
    { key: "pulseOverMax", label: "Your pulse / max", unit: "", toSI: 1, siUnit: "" },
    { key: "od", label: "Eyewear optical density needed (0 = within the limits)", unit: "", toSI: 1, siUnit: "" },
    { key: "odSingleRule", label: "OD if only the single-pulse rule were applied", unit: "", toSI: 1, siUnit: "" },
    { key: "nohd", label: "Nominal ocular hazard distance (0: within at the output)", unit: "m", toSI: 1, siUnit: "m" },
  ],
  validate({ pulseWidth, repRate }) {
    return repRate * pulseWidth > 1 ? "The pulses overlap: the repetition rate times the pulse duration is above 1." : undefined;
  },
  compute({ pulseEnergy, repRate, pulseWidth, wavelength, beamDia, divergence, exposureTime }) {
    // As the page: an exposure shorter than one pulse is stretched to it.
    const T = Math.min(Math.max(exposureTime, pulseWidth), T_MAX);
    const train = { duration: pulseWidth, prf: repRate, exposure: T };
    const result = pulseTrainLimits(wavelength, beamDia, train);
    const covered = result.limits.length > 0 && Number.isFinite(result.qMax);
    if (!covered) {
      return {
        values: {
          averagePower: pulseEnergy * repRate, peakPower: pulseEnergy / pulseWidth, maxPulseEnergy: NaN, bindingRule: NaN,
          pulseOverMax: NaN, od: NaN, odSingleRule: NaN, nohd: NaN,
        },
        warnings: ["The eye limits cover 180 nm to 1 mm."],
      };
    }
    const ratio = pulseEnergy / result.qMax;
    // The single-pulse rule on its own, as an ultrafast safety check often stops there.
    const singleOnly = Math.min(...result.limits.map((l) => l.singlePulse));
    const dSafe = pulseTrainSafeDiameter(wavelength, pulseEnergy, train);
    return {
      values: {
        averagePower: pulseEnergy * repRate,
        peakPower: pulseEnergy / pulseWidth,
        maxPulseEnergy: result.qMax,
        bindingRule: result.rule ?? NaN,
        pulseOverMax: ratio,
        od: ratio > 1 ? Math.log10(ratio) : 0,
        odSingleRule: pulseEnergy > singleOnly ? Math.log10(pulseEnergy / singleOnly) : 0,
        nohd: rangeToDiameter(roundBeam(beamDia, divergence), dSafe),
      },
    };
  },
  checks: [
    {
      // Defaults: 800 nm, 100 fs pulses at 80 MHz for 10 s, 2 mm beam, point source. N = 8e8 pulses; rule 2 shares the
      // 18 C_A t^0.75 J/m² limit of the whole exposure (C_A = 10^(0.002(800 − 700)) = 1.584893, t = 10 s: 10^0.75 =
      // 5.623413) over N: 18·1.584893·5.623413/8e8 = 2.005348e-7 J/m², × the 7 mm aperture (3.848451e-5 m²) =
      // 7.717355e-12 J = 7.717355e-6 µJ. Average power 0.0125 µJ · 80 MHz = 1 W; peak power 0.0125 µJ / 100 fs = 125 kW.
      source: RULES,
      basis: "computed",
      inputs: {},
      expect: { maxPulseEnergy: 7.7173550205e-6, bindingRule: 2, averagePower: 1000, peakPower: 125000 },
      tolerance: 1e-8,
    },
    {
      // 532 nm, one 10 ns pulse, point source: 2e-3 J/m² (1 ns–5 µs, C_A = 1) over the 7 mm aperture:
      // 2e-3·3.848451e-5 = 7.696902e-8 J = 0.07696902 µJ.
      source: RULES,
      basis: "computed",
      inputs: { wavelength: 532, pulseWidth: 1e7, repRate: 0, exposureTime: 1e-8 },
      expect: { maxPulseEnergy: 0.07696902001, bindingRule: 1 },
      tolerance: 1e-8,
    },
  ],
});
