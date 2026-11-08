import { opaModel } from "../../physics/wave-optics/optical-parametric-amplifier";
import { defineSchema } from "../types";

export default defineSchema({
  href: "/wave-optics/optical-parametric-amplifier",
  inputs: [
    { key: "pumpWavelength", label: "Pump wavelength λ_p", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1064, min: 200, max: 20000 },
    { key: "signalWavelength", label: "Signal wavelength λ_s", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 200, max: 20000 },
    { key: "crystalLength", label: "Crystal length L", unit: "mm", toSI: 1e-3, siUnit: "m", default: 20, min: 0.01, max: 1000 },
    { key: "dEff", label: "Effective nonlinear coefficient d_eff", unit: "pm/V", toSI: 1e-12, siUnit: "m/V", default: 12.4, min: 0.001, max: 1000 },
    { key: "nPump", label: "Refractive index at the pump n_p", unit: "", toSI: 1, siUnit: "", default: 2.1555, min: 1, max: 5 },
    { key: "nSignal", label: "Refractive index at the signal n_s", unit: "", toSI: 1, siUnit: "", default: 2.1376, min: 1, max: 5 },
    { key: "nIdler", label: "Refractive index at the idler n_i", unit: "", toSI: 1, siUnit: "", default: 2.0814, min: 1, max: 5 },
    { key: "peakPower", label: "Pump peak power", unit: "kW", toSI: 1e3, siUnit: "W", default: 50, min: 0, max: 1e9 },
    { key: "beamRadius", label: "Pump radius w (1/e²)", unit: "µm", toSI: 1e-6, siUnit: "m", default: 300, min: 1, max: 1e5 },
    { key: "seedPower", label: "Signal seed peak power", unit: "W", toSI: 1, siUnit: "W", default: 1, min: 0, max: 1e9 },
    { key: "deltaK", label: "Residual phase mismatch Δk at λ_s", unit: "rad/mm", toSI: 1e3, siUnit: "rad/m", default: 0, min: -1e4, max: 1e4 },
    { key: "gvm", label: "Group-velocity mismatch δ_si = 1/v_gs − 1/v_gi", unit: "fs/mm", toSI: 1e-12, siUnit: "s/m", default: -97.7, min: -1e4, max: 1e4 },
  ],
  outputs: [
    { key: "gain", label: "Signal gain G = 1 + (Γ/g)² sinh²(gL)", unit: "", toSI: 1, siUnit: "" },
    { key: "gainCoefficient", label: "Gain coefficient Γ", unit: "1/m", toSI: 1, siUnit: "1/m" },
    { key: "gainLength", label: "ΓL", unit: "", toSI: 1, siUnit: "" },
    { key: "signalOut", label: "Output signal power G·P_s", unit: "W", toSI: 1, siUnit: "W" },
    { key: "idlerOut", label: "Output idler power (λ_s/λ_i)(G − 1)P_s", unit: "W", toSI: 1, siUnit: "W" },
    { key: "idlerWavelength", label: "Idler wavelength λ_i", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "bandwidth", label: "Gain bandwidth (FWHM, frequency)", unit: "GHz", toSI: 1e9, siUnit: "Hz" },
    { key: "bandwidthWavelength", label: "Gain bandwidth (FWHM) in signal wavelength", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "qpmPeriod", label: "First-order QPM period 2π/|Δk| for the entered indices", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "pumpFractionDrawn", label: "Pump power drawn by signal and idler, over the pump power", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ pumpWavelength, signalWavelength, crystalLength, dEff, nPump, nSignal, nIdler, peakPower, beamRadius, seedPower, deltaK, gvm }) {
    const r = opaModel({
      lambdaPump: pumpWavelength, lambdaSignal: signalWavelength, dEff, nPump, nSignal, nIdler,
      pumpPower: peakPower, radius: beamRadius, seedPower, deltaK, gvm, length: crystalLength,
    });
    const valid = Number.isFinite(r.lambdaIdler);
    const fraction = peakPower > 0 ? r.pumpDrawn / peakPower : NaN;
    const warnings: string[] = [];
    if (!valid) warnings.push("The signal wavelength must be longer than the pump wavelength: the idler is at 1/λ_i = 1/λ_p − 1/λ_s.");
    if (valid && r.pumpDrawn > 0.1 * peakPower) {
      warnings.push(`The amplified signal and idler take ${(100 * fraction).toPrecision(3)} % of the pump power (more than 10 %): the pump depletes and the gain saturates below this value.`);
    }
    if (valid && !Number.isFinite(r.gain)) warnings.push("The gain overflows: the pump would be depleted long before this.");
    if (valid && gvm === 0) warnings.push("With zero group-velocity mismatch the bandwidth is set by group-velocity dispersion, which this model omits.");
    return {
      values: {
        gain: r.gain,
        gainCoefficient: r.gamma,
        gainLength: r.gamma * crystalLength,
        signalOut: r.signalOut,
        idlerOut: r.idlerOut,
        idlerWavelength: r.lambdaIdler,
        bandwidth: r.bandwidth,
        bandwidthWavelength: r.bandwidthWavelength,
        qpmPeriod: r.qpmPeriod,
        pumpFractionDrawn: fraction,
      },
      warnings,
    };
  },
  checks: [
    {
      // Γ² = 2ω_sω_i d² I_p/(n_p n_s n_i ε₀ c³), I_p = 2P/(πw²); at Δk = 0, G = 1 + sinh²(ΓL) = cosh²(ΓL);
      // P_i = (λ_s/λ_i)(G − 1)P_s, λ_i = 1/(1/1064 − 1/1550 nm), Λ = 2π/|Δk| with Δk = 2π(n_p/λ_p − n_s/λ_s − n_i/λ_i).
      source: "Boyd R. W. (2008). Nonlinear Optics, 3rd ed. Academic Press, §2.8 (parametric amplification, undepleted pump).",
      basis: "computed",
      inputs: {},
      expect: { gain: 323.20146395058833, gainCoefficient: 179.07553491399827, gainLength: 3.5815106982799656, idlerOut: 147.17096943607694, idlerWavelength: 3393.4156378600833, qpmPeriod: 29.95375802332797 },
      tolerance: 1e-8,
    },
    {
      // Δk = 0.1 rad/mm = 100 rad/m: g = √(Γ² − (Δk/2)²), G = 1 + (Γ/g)² sinh²(gL).
      source: "Boyd R. W. (2008). Nonlinear Optics, 3rd ed. Academic Press, §2.8 (gain with phase mismatch).",
      basis: "computed",
      inputs: { deltaK: 0.1 },
      expect: { gain: 263.68486257734173 },
      tolerance: 1e-8,
    },
  ],
});
