import { wellCapacitySummary } from "../../physics/detectors/well-capacity";
import { defineSchema } from "../types";

const JANESICK = "Janesick J. R. (2007). Photon Transfer. SPIE Press, doi:10.1117/3.725073: dynamic range 20·log₁₀(N_well/σ_read), sense-node capacitance C = N_well·q/V_swing, " +
  "conversion gain q/C = V_swing/N_well; minimum detectable signal S from S/√(S + σ_read²) = 3, S = (9 + √(81 + 36σ_read²))/2 (Poisson shot noise over a read-noise floor).";

export default defineSchema({
  href: "/detectors/well-capacity",
  inputs: [
    { key: "wellCapacity", label: "Well capacity", unit: "e⁻", toSI: 1, siUnit: "e⁻", default: 50000, min: 100, max: 1e7 },
    { key: "readNoise", label: "Read noise", unit: "e⁻ rms", toSI: 1, siUnit: "e⁻", default: 5, min: 0.01, max: 1000 },
    { key: "pixelSize", label: "Pixel size", unit: "μm", toSI: 1e-6, siUnit: "m", default: 5, min: 0.1, max: 100 },
    { key: "voltageSwing", label: "Voltage swing", unit: "V", toSI: 1, siUnit: "V", default: 1.5, min: 0.01, max: 10 },
  ],
  outputs: [
    { key: "dynamicRange", label: "Dynamic range 20·log₁₀(N_well/σ_read)", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "usableBits", label: "Usable bits log₂(N_well/σ_read)", unit: "bit", toSI: 1, siUnit: "bit" },
    { key: "capacitance", label: "Pixel capacitance N_well·q/V_swing", unit: "fF", toSI: 1e-15, siUnit: "F" },
    { key: "conversionGain", label: "Conversion gain V_swing/N_well", unit: "μV/e⁻", toSI: 1e-6, siUnit: "V/e⁻" },
    { key: "senseNodeNoise", label: "Read noise at the sense node σ_read·q/C", unit: "μV", toSI: 1e-6, siUnit: "V" },
    { key: "wellDensity", label: "Full well density N_well/(pixel size)²", unit: "e⁻/μm²", toSI: 1e12, siUnit: "e⁻/m²" },
    { key: "minDetectable", label: "Minimum detectable signal (SNR = 3, read + shot noise)", unit: "e⁻", toSI: 1, siUnit: "e⁻" },
  ],
  compute(si) {
    return { values: wellCapacitySummary({ wellCapacity: si.wellCapacity, readNoise: si.readNoise, pixelSize: si.pixelSize, voltageSwing: si.voltageSwing }) };
  },
  checks: [
    {
      // N_well = 30000 e⁻, σ_read = 3 e⁻, 6 μm pixel, 2 V: DR = 20·log₁₀(1e4) = 80 dB; log₂(1e4) = 13.287712 bit; C = 30000·1.602176634e-19/2 = 2.4032650 fF;
      // gain = 2/30000 = 66.666667 μV/e⁻; node noise 3·66.666667 = 200 μV; density 30000/36 = 833.33333 e⁻/μm²; S = (9 + √(81 + 324))/2 = 14.562306 e⁻.
      source: JANESICK,
      basis: "computed",
      inputs: { wellCapacity: 30000, readNoise: 3, pixelSize: 6, voltageSwing: 2 },
      expect: {
        dynamicRange: 80, usableBits: 13.287712379549449, capacitance: 2.4032649509999997, conversionGain: 66.66666666666667, senseNodeNoise: 200,
        wellDensity: 833.3333333333334, minDetectable: 14.562305898749054,
      },
      tolerance: 1e-8,
    },
    {
      // Defaults: N_well = 50000 e⁻, σ_read = 5 e⁻, 5 μm, 1.5 V: DR = 80 dB; log₂(1e4) = 13.287712 bit; C = 50000·1.602176634e-19/1.5 = 5.3405888 fF;
      // gain = 1.5/50000 = 30 μV/e⁻; node noise 150 μV; density 50000/25 = 2000 e⁻/μm²; S = (9 + √(81 + 900))/2 = 20.160460 e⁻.
      source: JANESICK,
      basis: "computed",
      inputs: {},
      expect: {
        dynamicRange: 80, usableBits: 13.287712379549449, capacitance: 5.34058878, conversionGain: 30, senseNodeNoise: 150,
        wellDensity: 2000, minDetectable: 20.160459763365825,
      },
      tolerance: 1e-8,
    },
  ],
});
