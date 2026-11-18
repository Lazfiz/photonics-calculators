import { tiaNoiseSummary } from "../../physics/detectors/photodiode-tia-noise";
import { defineSchema } from "../types";

const RAMUS = "Ramus X. (2009). Transimpedance Considerations for High-Speed Amplifiers. Texas Instruments application report SBOA122: Butterworth TIA bandwidth " +
  "f = √(GBW/(2π·R_f·C_S)) and the noise sources i_n, 4k_BT/R_f, e_n/R_f and e_n·2πf·C_S; Graeme J. G. (1996). Photodiode Amplifiers: Op Amp Solutions. McGraw-Hill. " +
  "The input-referred density i²(f) = i_n² + 4k_BT/R_f + (e_n/R_f)² + (e_n·2πf·C_S)² is integrated through |H|² = 1/(1 + (f/f₀)⁴) up to the post-filter B " +
  "(closed-form antiderivatives of 1/(1 + x⁴) and x²/(1 + x⁴)); NEP = i_rms/ℛ with ℛ = η·q·λ/(h·c) (Dereniak E. L., Boreman G. D. (1996). Infrared Detectors and Systems. Wiley, ch. 5).";
const NO_CF = "With C_f = 0 the response already has Q ≤ 1/√2 (ω₀·R_f·C_S ≤ 1/√2), so no feedback capacitance is needed for a Butterworth response.";

export default defineSchema({
  href: "/detectors/photodiode-tia-noise",
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 530, min: 200, max: 20000 },
    { key: "qe", label: "Quantum efficiency", unit: "", toSI: 1, siUnit: "", default: 0.9, min: 0.01, max: 1 },
    { key: "inputNoiseCurrent", label: "Amplifier input current noise i_n", unit: "fA/√Hz", toSI: 1e-15, siUnit: "A/√Hz", default: 5, min: 0, max: 1e6 },
    { key: "inputNoiseVoltage", label: "Amplifier input voltage noise e_n", unit: "nV/√Hz", toSI: 1e-9, siUnit: "V/√Hz", default: 5, min: 0, max: 1e4 },
    { key: "inputCapacitance", label: "Input capacitance C_S = C_d + C_amp", unit: "pF", toSI: 1e-12, siUnit: "F", default: 10, min: 0.01, max: 1e5 },
    { key: "gbw", label: "Op-amp GBW", unit: "MHz", toSI: 1e6, siUnit: "Hz", default: 1000, min: 1e-3, max: 1e5 },
    { key: "bandwidth", label: "Post-filter bandwidth B", unit: "MHz", toSI: 1e6, siUnit: "Hz", default: 100, min: 1e-6, max: 1e5 },
    { key: "feedbackResistance", label: "Feedback resistance R_f", unit: "MΩ", toSI: 1e6, siUnit: "Ω", default: 1, min: 1e-6, max: 1e6 },
    { key: "temperature", label: "R_f temperature", unit: "K", toSI: 1, siUnit: "K", default: 300, min: 0, max: 1000 },
  ],
  outputs: [
    { key: "responsivity", label: "Responsivity", unit: "mA/W", toSI: 1e-3, siUnit: "A/W" },
    { key: "tiaBandwidth", label: "TIA bandwidth", unit: "Hz", toSI: 1, siUnit: "Hz" },
    { key: "enbw", label: "Noise-equivalent bandwidth", unit: "Hz", toSI: 1, siUnit: "Hz" },
    { key: "inputNoise", label: "Input noise current (rms)", unit: "A", toSI: 1, siUnit: "A" },
    { key: "noiseDensity", label: "Band-average input noise density", unit: "fA/√Hz", toSI: 1e-15, siUnit: "A/√Hz" },
    { key: "nep", label: "NEP in the noise band", unit: "W", toSI: 1, siUnit: "W" },
    { key: "outputNoise", label: "Output noise (rms)", unit: "mV", toSI: 1e-3, siUnit: "V" },
    { key: "butterworthCf", label: "Butterworth feedback capacitance C_f", unit: "pF", toSI: 1e-12, siUnit: "F" },
  ],
  compute({ wavelength, qe, inputNoiseCurrent, inputNoiseVoltage, inputCapacitance, gbw, bandwidth, feedbackResistance, temperature }) {
    const r = tiaNoiseSummary({
      wavelength_nm: wavelength * 1e9, qe, currentNoise: inputNoiseCurrent, voltageNoise: inputNoiseVoltage, inputC: inputCapacitance, gbw,
      band: bandwidth, feedbackR: feedbackResistance, temperature,
    });
    return {
      values: {
        responsivity: r.responsivity,
        tiaBandwidth: r.fTia,
        enbw: r.F,
        inputNoise: r.iRms,
        noiseDensity: Math.sqrt(r.terms.total),
        nep: r.nep,
        outputNoise: r.outputNoise,
        butterworthCf: r.cf,
      },
      reasons: { butterworthCf: NO_CF },
    };
  },
  checks: [
    {
      // Defaults: 530 nm, η = 0.9, i_n = 5 fA/√Hz, e_n = 5 nV/√Hz, C_S = 10 pF, GBW = 1 GHz, B = 100 MHz, R_f = 1 MΩ, T = 300 K.
      // ℛ = 0.9·q·530e-9/(hc) = 0.384726 A/W; f₀ = √(GBW/(2π·R_f·C_S)) = 3.989423 MHz; u = B/f₀ = 25.07, M₀ = ∫₀^u dx/(1+x⁴) = 1.110, ENBW = f₀·M₀ = 4.431050 MHz;
      // i²_rms = (i_n² + 4k_BT/R_f + (e_n/R_f)²)·f₀·M₀ + (e_n·2π·C_S)²·f₀³·M₂, M₂ = ∫₀^u x²/(1+x⁴)dx, via the closed-form antiderivatives (checked against Simpson integration) = (2.604620e-9 A)²;
      // NEP = i_rms/ℛ = 6.770057e-9 W; density = √(i²_rms/ENBW) = 1.237346e-12 A/√Hz; output = i_rms·R_f = 2.604620 mV;
      // C_f = (√2·2π·f₀·C_S − 1/R_f)/(2π·GBW) = 5.625980e-14 F.
      source: RAMUS,
      basis: "computed",
      inputs: {},
      expect: {
        responsivity: 384.72644581155746, tiaBandwidth: 3989422.804014327, enbw: 4431050.193035749, inputNoise: 2.6046198139874777e-9,
        noiseDensity: 1237.3455627581196, nep: 6.770056600848397e-9, outputNoise: 2.6046198139874775, butterworthCf: 0.05625980341168374,
      },
      tolerance: 1e-8,
    },
    {
      // 850 nm, η = 0.7, i_n = 2 fA/√Hz, e_n = 3 nV/√Hz, C_S = 5 pF, GBW = 500 MHz, B = 2 MHz (below f₀), R_f = 100 kΩ, T = 290 K.
      // ℛ = 0.7·q·850e-9/(hc) = 0.479900 A/W; f₀ = 12.615663 MHz, u = 0.158536 (post-filter well below f₀), ENBW = f₀·M₀ = 1.999747 MHz;
      // i_rms from the same two integrals = 5.880124e-10 A; NEP = 1.225281e-9 W; density 4.158138e-13 A/√Hz; output = i_rms·R_f = 0.0588012 mV; C_f = 1.752293e-13 F.
      source: RAMUS,
      basis: "computed",
      inputs: { wavelength: 850, qe: 0.7, inputNoiseCurrent: 2, inputNoiseVoltage: 3, inputCapacitance: 5, gbw: 500, bandwidth: 2, feedbackResistance: 0.1, temperature: 290 },
      expect: {
        responsivity: 479.8998642722781, tiaBandwidth: 12615662.6101008, enbw: 1999747.4267524988, inputNoise: 5.880123549477652e-10,
        noiseDensity: 415.8137802932403, nep: 1.2252813528910438e-9, outputNoise: 0.05880123549477651, butterworthCf: 0.1752293127534392,
      },
      tolerance: 1e-8,
    },
  ],
});
