import { T_MAX } from "../../physics/laser-safety/eye-exposure-limits";
import { pulseTrainLimits, trainFromInputs } from "../../physics/laser-safety/pulse-train";
import { defineSchema } from "../types";
import { ICNIRP_2013, WAVELENGTH } from "./common";

const RULES = `${ICNIRP_2013}. Table 5 (single-pulse limits) and Table 6 / p. 287 (the three rules for repetitive pulses, ` +
  "C_P, T_i, T_2 of Table 4). https://doi.org/10.1097/HP.0b013e3182983fd4";

export default defineSchema({
  href: "/laser-safety/pulsed-mpe",
  inputs: [
    { ...WAVELENGTH, default: 1064 },
    { key: "pulseEnergy", label: "Pulse energy", unit: "µJ", toSI: 1e-6, siUnit: "J", default: 1, min: 0, max: 1e12 },
    { key: "pulseDuration", label: "Pulse duration", unit: "ns", toSI: 1e-9, siUnit: "s", default: 10, min: 1e-6, max: 3e13 },
    { key: "prf", label: "Repetition rate (0 = one pulse)", unit: "Hz", toSI: 1, siUnit: "Hz", default: 1000, min: 0, max: 1e15 },
    { key: "exposureTime", label: "Exposure time", unit: "s", toSI: 1, siUnit: "s", default: 10, min: 1e-15, max: T_MAX },
    { key: "beamDiam", label: "Beam diameter at the eye, 1/e²", unit: "mm", toSI: 1e-3, siUnit: "m", default: 2, min: 0.01, max: 1e4 },
    { key: "alpha", label: "Source subtense α", unit: "mrad", toSI: 1e-3, siUnit: "rad", default: 1.5, min: 0, max: 1e3 },
  ],
  outputs: [
    { key: "maxPulseEnergy", label: "Max energy per pulse", unit: "µJ", toSI: 1e-6, siUnit: "J" },
    { key: "pulseOverMax", label: "Your pulse / max", unit: "", toSI: 1, siUnit: "" },
    { key: "pulses", label: "Pulses in the exposure", unit: "", toSI: 1, siUnit: "" },
    { key: "bindingRule", label: "Rule that binds (1 single pulse, 2 group average, 3 C_P × single pulse)", unit: "", toSI: 1, siUnit: "" },
    { key: "maxAveragePower", label: "Max average power", unit: "mW", toSI: 1e-3, siUnit: "W" },
  ],
  validate({ pulseDuration, prf }) {
    return prf * pulseDuration > 1 ? "The pulses overlap: the repetition rate times the pulse duration is above 1." : undefined;
  },
  compute({ wavelength, pulseEnergy, pulseDuration, prf, exposureTime, beamDiam, alpha }) {
    const train = trainFromInputs(pulseDuration, prf, exposureTime);
    const result = pulseTrainLimits(wavelength, beamDiam, train, alpha);
    const covered = result.limits.length > 0 && Number.isFinite(result.qMax);
    if (!covered) {
      return {
        values: { maxPulseEnergy: NaN, pulseOverMax: NaN, pulses: result.pulses, bindingRule: NaN, maxAveragePower: NaN },
        warnings: ["The eye limits cover 180 nm to 1 mm."],
      };
    }
    return {
      values: {
        maxPulseEnergy: result.qMax,
        pulseOverMax: pulseEnergy / result.qMax,
        pulses: result.pulses,
        bindingRule: result.rule ?? NaN,
        maxAveragePower: prf > 0 && result.pulses > 1 ? result.qMax * prf : NaN,
      },
    };
  },
  checks: [
    {
      // 532 nm, point source, one 10 ns pulse: 400–1050 nm, 1 ns–5 µs, 2×10⁻³ C_A J/m² (C_A = 1) over the 7 mm aperture
      // (A = π(3.5 mm)² = 3.848451e-5 m²): 2e-3·3.848451e-5 = 7.696902e-8 J = 0.07696902 µJ (the 2 mm beam puts
      // 1 − e^(−2(7/2)²) = 1 − 2.3e-11 of its power in the aperture).
      source: RULES,
      basis: "computed",
      inputs: { wavelength: 532, pulseDuration: 10, prf: 0, exposureTime: 1e-8, alpha: 0 },
      expect: { maxPulseEnergy: 0.07696902001, pulses: 1, bindingRule: 1 },
      tolerance: 1e-8,
    },
    {
      // 532 nm, one 1 ms pulse: 18 C_A t^0.75 J/m² with t = 1 ms: 18·5.62341e-3 = 0.101221 J/m²; × 3.848451e-5 m² =
      // 3.895457e-6 J.
      source: RULES,
      basis: "computed",
      inputs: { wavelength: 532, pulseDuration: 1e6, prf: 0, exposureTime: 1e-3, alpha: 0 },
      expect: { maxPulseEnergy: 3.895457464, pulseOverMax: 0.2567092592, pulses: 1, bindingRule: 1 },
      tolerance: 1e-8,
    },
    {
      // 532 nm, 10 µs pulses at 10 kHz for 1 s: N = 10000 pulses (τ + 9999/f = 0.99991 s). Rule 1 gives 18 C_A t^0.75 for 10 µs:
      // 18·(1e-5)^0.75 = 3.2009e-3 J/m²; rule 2 (all pulses, within the 18 t^0.75 limit for t = 0.99991 s, shared by
      // N): 18·0.99991^0.75/10000 = 1.79988e-3 J/m² → ×3.848451e-5 m² = 6.92674e-8 J = 0.0692674 µJ per pulse; the
      // average power is that × 10 kHz = 0.692674 mW.
      source: RULES,
      basis: "computed",
      inputs: { wavelength: 532, pulseDuration: 10000, prf: 10000, exposureTime: 1, alpha: 0 },
      expect: { maxPulseEnergy: 0.06926744209, pulses: 10000, bindingRule: 2, maxAveragePower: 0.6926744209 },
      tolerance: 1e-8,
    },
  ],
});
