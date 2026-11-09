import { amplifierSummary } from "../../physics/fiber-optics/doped-fiber-gain";
import { defineSchema } from "../types";

const SIGMA = 1e-25;
const GILES = "Giles C. R., Desurvire E. (1991). Modeling erbium-doped fiber amplifiers. J. Lightwave Technol. 9(2), 271–283, " +
  "doi:10.1109/50.65886, eqs. (6)–(9): dP/dz = Γ(σ_e n₂ − σ_a n₁)P, so an unpumped fibre absorbs Γσ_aN per metre " +
  "(×10/ln 10 in dB) and a fully inverted one gains Γσ_eN; intrinsic saturation power hνA/(Γ(σ_a + σ_e)τ). " +
  "Cross-sections: Barnes W. L., Laming R. I., Tarbox E. J., Morkel P. R. (1991). Absorption and emission cross section of " +
  "Er³⁺ doped silica fibers. IEEE J. Quantum Electron. 27(4), 1004–1010, doi:10.1109/3.83335.";

export default defineSchema({
  href: "/fiber-optics/fiber-amplifier",
  inputs: [
    { key: "fiberLength", label: "Fibre length", unit: "m", toSI: 1, siUnit: "m", default: 10, min: 0.01, max: 200 },
    { key: "pumpPower", label: "Pump power", unit: "mW", toSI: 1e-3, siUnit: "W", default: 200, min: 0, max: 5000 },
    { key: "inputPower", label: "Input signal power", unit: "dBm", toSI: 1, siUnit: "dBm", default: -10, min: -60, max: 20 },
    { key: "dopantConc", label: "Dopant density N", unit: "ions/m³", toSI: 1, siUnit: "m⁻³", default: 1e24, min: 1e22, max: 1e27 },
    { key: "coreRadius", label: "Doped core radius", unit: "µm", toSI: 1e-6, siUnit: "m", default: 2.2, min: 0.5, max: 20 },
    { key: "overlapPump", label: "Pump overlap Γ_p", unit: "", toSI: 1, siUnit: "", default: 0.8, min: 0.01, max: 1 },
    { key: "overlapSignal", label: "Signal overlap Γ_s", unit: "", toSI: 1, siUnit: "", default: 0.8, min: 0.01, max: 1 },
    { key: "pumpWavelength", label: "Pump wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 980, min: 400, max: 2200 },
    { key: "signalWavelength", label: "Signal wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 400, max: 2200 },
    { key: "sigmaAPump", label: "Pump σ_a", unit: "10⁻²⁵ m²", toSI: SIGMA, siUnit: "m²", default: 1.7, min: 0, max: 1000 },
    { key: "sigmaEPump", label: "Pump σ_e", unit: "10⁻²⁵ m²", toSI: SIGMA, siUnit: "m²", default: 0, min: 0, max: 1000 },
    { key: "sigmaASignal", label: "Signal σ_a", unit: "10⁻²⁵ m²", toSI: SIGMA, siUnit: "m²", default: 2.2, min: 0, max: 1000 },
    { key: "sigmaESignal", label: "Signal σ_e", unit: "10⁻²⁵ m²", toSI: SIGMA, siUnit: "m²", default: 3.0, min: 0, max: 1000 },
    { key: "tau", label: "Upper-state lifetime τ", unit: "ms", toSI: 1e-3, siUnit: "s", default: 10.2, min: 0.01, max: 100 },
  ],
  outputs: [
    { key: "gain", label: "Signal gain", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "outputPower", label: "Output signal power", unit: "dBm", toSI: 1, siUnit: "dBm" },
    { key: "noiseFigure", label: "Noise figure", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "residualPump", label: "Residual pump power", unit: "mW", toSI: 1e-3, siUnit: "W" },
    { key: "fullInversionGain", label: "Full-inversion gain bound", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "pumpAbsorption", label: "Small-signal absorption at the pump", unit: "dB/m", toSI: 1, siUnit: "dB/m" },
    { key: "signalAbsorption", label: "Small-signal absorption at the signal", unit: "dB/m", toSI: 1, siUnit: "dB/m" },
    { key: "saturationPower", label: "Signal saturation power", unit: "mW", toSI: 1e-3, siUnit: "W" },
    { key: "n2In", label: "Upper-state fraction at the input", unit: "", toSI: 1, siUnit: "" },
    { key: "n2Out", label: "Upper-state fraction at the output", unit: "", toSI: 1, siUnit: "" },
  ],
  compute(si) {
    const r = amplifierSummary({
      length: si.fiberLength, pumpPower: si.pumpPower, signalDbm: si.inputPower, N: si.dopantConc, coreRadius: si.coreRadius,
      overlapPump: si.overlapPump, overlapSignal: si.overlapSignal, pumpLambda: si.pumpWavelength, signalLambda: si.signalWavelength,
      sigmaAPump: si.sigmaAPump, sigmaEPump: si.sigmaEPump, sigmaASignal: si.sigmaASignal, sigmaESignal: si.sigmaESignal, tau: si.tau,
    });
    const warnings: string[] = [];
    if (!Number.isFinite(r.gainDb)) warnings.push("The signal is fully absorbed: no finite gain or noise figure.");
    if (r.gainDb > 25) warnings.push("ASE self-saturation is not modelled; the real gain is lower above about 20–25 dB.");
    return {
      values: {
        gain: r.gainDb,
        outputPower: r.outputDbm,
        noiseFigure: r.noiseFigureDb,
        residualPump: r.pumpOut,
        fullInversionGain: r.fullInversionDb,
        pumpAbsorption: r.alphaPumpDbPerM,
        signalAbsorption: r.alphaSignalDbPerM,
        saturationPower: r.signalSaturationPower,
        n2In: r.n2In,
        n2Out: r.n2Out,
      },
      warnings,
    };
  },
  checks: [
    {
      // Γσ_aN at the signal = 0.8 · 2.2e-25 · 1e24 = 0.176 m⁻¹, in dB/m: (10/ln 10) · 0.176 = 4.342945 · 0.176 = 0.764358 dB/m.
      // Pump: 4.342945 · 0.8 · 1.7e-25 · 1e24 = 0.590640 dB/m. Full inversion over 10 m: 4.342945 · 0.8 · 3.0e-25 · 1e24 · 10 = 10.423068 dB.
      source: GILES,
      basis: "computed",
      inputs: {},
      expect: { signalAbsorption: 0.7643582881497232, pumpAbsorption: 0.5906404953884223, fullInversionGain: 10.423067565678041 },
      tolerance: 1e-8,
    },
    {
      // Saturation power: hν = hc/λ = 6.62607015e-34 · 299792458/1550e-9 = 1.28156e-19 J; A = π (2.2e-6)² = 1.52053e-11 m²;
      // P_sat = hνA/(Γ(σ_a + σ_e)τ) = 1.94870e-30/(0.8 · 5.2e-25 · 0.0102) = 0.459247 mW.
      source: GILES,
      basis: "computed",
      inputs: {},
      expect: { saturationPower: 0.45924746332672084 },
      tolerance: 1e-8,
    },
    {
      // Unpumped fibre, −60 dBm signal (far below P_sat = 0.46 mW, so the ions stay in the ground state to 1e-5 or better):
      // G = exp(−Γσ_aN L) = exp(−1.76) = −7.643583 dB.
      source: GILES,
      basis: "computed",
      inputs: { pumpPower: 0, inputPower: -60 },
      expect: { gain: -7.643582881497232 },
      tolerance: 1e-4,
    },
  ],
});
