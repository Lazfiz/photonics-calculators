import { thermalNoiseSummary, THERMAL_QUANTUM_FRACTION } from "../../physics/detectors/thermal-noise";
import { defineSchema } from "../types";

const NYQUIST = "Nyquist H. (1928). Thermal Agitation of Electric Charge in Conductors. Phys. Rev. 32, 110, doi:10.1103/PhysRev.32.110; " +
  "Johnson J. B. (1928). Thermal Agitation of Electricity in Conductors. Phys. Rev. 32, 97, doi:10.1103/PhysRev.32.97: " +
  "v = √(4k_B·T·R·B), i = √(4k_B·T·B/R), available power k_B·T·B for h·f ≪ k_B·T.";
const ZERO_T = "The temperature is 0 K: the available noise power is zero, which has no value in dBm.";

export default defineSchema({
  href: "/detectors/thermal-noise",
  inputs: [
    { key: "resistance", label: "Resistance", unit: "Ω", toSI: 1, siUnit: "Ω", default: 1000, min: 1e-3, max: 1e15 },
    { key: "temperature", label: "Temperature", unit: "K", toSI: 1, siUnit: "K", default: 300, min: 0, max: 1e4 },
    { key: "bandwidth", label: "Bandwidth", unit: "Hz", toSI: 1, siUnit: "Hz", default: 1e6, min: 1e-3, max: 1e12 },
  ],
  outputs: [
    { key: "voltage", label: "RMS noise voltage √(4k_B·T·R·B)", unit: "V", toSI: 1, siUnit: "V" },
    { key: "current", label: "RMS noise current √(4k_B·T·B/R)", unit: "A", toSI: 1, siUnit: "A" },
    { key: "power", label: "Available noise power k_B·T·B (matched load)", unit: "W", toSI: 1, siUnit: "W" },
    { key: "powerDbm", label: "Available noise power", unit: "dBm", toSI: 1, siUnit: "dBm" },
  ],
  compute({ resistance, temperature, bandwidth }) {
    const r = thermalNoiseSummary({ resistance, temperature, bandwidth });
    const warnings = r.quantumRegime
      ? [`The bandwidth exceeds ${THERMAL_QUANTUM_FRACTION}·k_B·T/h${temperature > 0 ? ` = ${(THERMAL_QUANTUM_FRACTION * r.quantumFrequency).toExponential(2)} Hz` : " (zero at T = 0)"}: the classical k_B·T·B overstates the noise (Planck regime); ` +
        `the Planck-integrated available power saturates at (π²/6)(k_B·T)²/h = ${r.planckSaturationPower.toExponential(2)} W.`]
      : [];
    return {
      values: { voltage: r.voltage, current: r.current, power: r.power, powerDbm: r.powerDbm },
      warnings,
      reasons: { powerDbm: ZERO_T },
    };
  },
  checks: [
    {
      // R = 1e4 Ω, T = 300 K, B = 1e5 Hz: k_B·T·B = 1.380649e-23·300·1e5 = 4.141947e-16 W = −123.827955 dBm;
      // v = √(4·4.141947e-16·1e4) = 4.0703548e-6 V; i = √(4·4.141947e-16/1e4) = 4.0703548e-10 A.
      source: NYQUIST,
      basis: "computed",
      inputs: { resistance: 1e4, temperature: 300, bandwidth: 1e5 },
      expect: { voltage: 4.070354775692163e-6, current: 4.0703547756921634e-10, power: 4.141947e-16, powerDbm: -123.82795462602104 },
      tolerance: 1e-8,
    },
    {
      // R = 50 Ω, T = 290 K, B = 1e6 Hz: k_B·T·B = 1.380649e-23·290·1e6 = 4.0038821e-15 W = −113.975187 dBm;
      // v = √(4·4.0038821e-15·50) = 8.9486112e-7 V; i = √(4·4.0038821e-15/50) = 1.7897222e-8 A.
      source: NYQUIST,
      basis: "computed",
      inputs: { resistance: 50, temperature: 290, bandwidth: 1e6 },
      expect: { voltage: 8.948611177160397e-7, current: 1.7897222354320796e-8, power: 4.0038821e-15, powerDbm: -113.97518719422811 },
      tolerance: 1e-8,
    },
  ],
});
