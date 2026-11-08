import { sroModel, walkOffApertureLength } from "../../physics/wave-optics/optical-parametric-oscillator";
import { qpmPeriod } from "../../physics/wave-optics/three-wave";
import { defineSchema } from "../types";

export default defineSchema({
  href: "/wave-optics/optical-parametric-oscillator",
  inputs: [
    { key: "pumpWavelength", label: "Pump wavelength λ_p", unit: "nm", toSI: 1e-9, siUnit: "m", default: 532, min: 200, max: 5000 },
    { key: "signalWavelength", label: "Signal wavelength λ_s", unit: "nm", toSI: 1e-9, siUnit: "m", default: 800, min: 201, max: 20000 },
    { key: "crystalLength", label: "Crystal length L", unit: "mm", toSI: 1e-3, siUnit: "m", default: 20, min: 0.1, max: 200 },
    { key: "dEff", label: "Effective nonlinear coefficient d_eff", unit: "pm/V", toSI: 1e-12, siUnit: "m/V", default: 2.068, min: 0.01, max: 100 },
    { key: "nPump", label: "Refractive index at the pump n_p", unit: "", toSI: 1, siUnit: "", default: 1.6555, min: 1, max: 5 },
    { key: "nSignal", label: "Refractive index at the signal n_s", unit: "", toSI: 1, siUnit: "", default: 1.6604, min: 1, max: 5 },
    { key: "nIdler", label: "Refractive index at the idler n_i", unit: "", toSI: 1, siUnit: "", default: 1.64576, min: 1, max: 5 },
    { key: "pumpPower", label: "Pump power", unit: "W", toSI: 1, siUnit: "W", default: 5, min: 0, max: 1e6 },
    { key: "beamRadius", label: "Beam radius w (1/e², pump and signal)", unit: "µm", toSI: 1e-6, siUnit: "m", default: 50, min: 1, max: 10000 },
    { key: "walkOff", label: "Pump walk-off angle ρ", unit: "deg", toSI: Math.PI / 180, siUnit: "rad", default: 3.114, min: 0, max: 10 },
    { key: "cavityLoss", label: "Round-trip signal power loss α", unit: "%", toSI: 0.01, siUnit: "", default: 3, min: 0.01, max: 99 },
  ],
  outputs: [
    { key: "idlerWavelength", label: "Idler wavelength λ_i", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "pumpIntensity", label: "Pump intensity P/(πw²)", unit: "MW/cm²", toSI: 1e10, siUnit: "W/m²" },
    { key: "gainCoefficient", label: "Gain coefficient g", unit: "1/m", toSI: 1, siUnit: "1/m" },
    { key: "apertureLength", label: "Walk-off aperture length √π w/ρ", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "effectiveLength", label: "Effective length L_eff", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "gainLength", label: "g·L_eff", unit: "", toSI: 1, siUnit: "" },
    { key: "singlePassGain", label: "Single-pass signal gain cosh²(gL_eff) − 1", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "thresholdGainLength", label: "SRO threshold g·L_eff = arccosh(1/√(1 − α))", unit: "", toSI: 1, siUnit: "" },
    { key: "thresholdPower", label: "SRO threshold pump power", unit: "W", toSI: 1, siUnit: "W" },
    { key: "thresholdRatio", label: "Pump power over threshold", unit: "", toSI: 1, siUnit: "" },
    { key: "phaseMismatch", label: "Phase mismatch Δk for these indices", unit: "1/mm", toSI: 1e3, siUnit: "1/m" },
    { key: "qpmPeriod", label: "First-order QPM period 2π/|Δk|", unit: "µm", toSI: 1e-6, siUnit: "m" },
  ],
  compute({ pumpWavelength, signalWavelength, crystalLength, dEff, nPump, nSignal, nIdler, pumpPower, beamRadius, walkOff, cavityLoss }) {
    const process = { lambdaPump: pumpWavelength, lambdaSignal: signalWavelength, dEff, nPump, nSignal, nIdler };
    const r = sroModel(process, crystalLength, pumpPower, beamRadius, walkOff, cavityLoss);
    const warnings: string[] = [];
    if (!(Number.isFinite(r.g) && Number.isFinite(r.Pth))) warnings.push("No result: the signal wavelength must be longer than the pump wavelength.");
    return {
      values: {
        idlerWavelength: r.lambdaIdler,
        pumpIntensity: r.intensity,
        gainCoefficient: r.g,
        apertureLength: walkOffApertureLength(beamRadius, walkOff),
        effectiveLength: r.Leff,
        gainLength: r.gL,
        singlePassGain: r.singlePassGain,
        thresholdGainLength: r.gThL,
        thresholdPower: r.Pth,
        thresholdRatio: pumpPower / r.Pth,
        phaseMismatch: r.dk,
        qpmPeriod: qpmPeriod(r.dk),
      },
      warnings,
    };
  },
  checks: [
    {
      // Zero walk-off (ρ = 0) so L_eff = L = 20 mm; g² = 2ω_sω_i d² I_p/(n_p n_s n_i ε₀ c³), I_p = P/(πw²);
      // g_thL = arccosh(1/√(1 − α)); P_th = (g_thL/L)²/(2ω_sω_i d²/(n_p n_s n_i ε₀ c³)) · πw²; λ_i = λ_pλ_s/(λ_s − λ_p).
      source: "Boyd R. W. (2008). Nonlinear Optics, 3rd ed. Academic Press, §2.8–2.9 (parametric gain, singly resonant oscillator threshold).",
      basis: "computed",
      inputs: { walkOff: 0 },
      expect: { idlerWavelength: 1588.059701492538, gainCoefficient: 3.753774097618583, effectiveLength: 20, gainLength: 0.07507548195237167, thresholdGainLength: 0.17496899253678838, thresholdPower: 27.157883999640973 },
      tolerance: 1e-8,
    },
  ],
});
