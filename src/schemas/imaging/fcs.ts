import { fcsSummary } from "../../physics/imaging/fluorescence-dynamics";
import { defineSchema } from "../types";

const HESS_WEBB = "Hess S. T., Webb W. W. (2002). Focal volume optics and experimental artifacts in confocal fluorescence " +
  "correlation spectroscopy. Biophys. J. 83, 2300–2317. https://doi.org/10.1016/S0006-3495(02)73990-8 " +
  "(3D Gaussian detection volume, V_eff = π^(3/2) w₀² z₀, G(0) = 1/N, τ_D = w₀²/(4D)).";
const KOPPEL = "Koppel D. E. (1974). Statistical accuracy in fluorescence correlation spectroscopy. Phys. Rev. A 10, 1938–1945. " +
  "https://doi.org/10.1103/PhysRevA.10.1938 (the SNR is derived from Koppel's shot-noise variance σ²(G) = (1 + G)/(M⟨n⟩²), M the number of channel samples and ⟨n⟩ the mean counts per channel, at the shortest lag channel).";
const WIDENGREN = "Widengren J., Mets Ü., Rigler R. (1995). Fluorescence correlation spectroscopy of triplet states in solution: " +
  "a theoretical and experimental study. J. Phys. Chem. 99, 13368–13379. https://doi.org/10.1021/j100036a009 " +
  "(triplet factor 1 + T/(1 − T)·e^(−τ/τ_T)).";

export default defineSchema({
  href: "/imaging/fcs",
  inputs: [
    { key: "w0", label: "Lateral 1/e² radius w₀", unit: "µm", toSI: 1e-6, siUnit: "m", default: 0.3, min: 0.1, max: 2 },
    { key: "z0", label: "Axial 1/e² radius z₀", unit: "µm", toSI: 1e-6, siUnit: "m", default: 1.5, min: 0.1, max: 10 },
    { key: "tauD", label: "Diffusion time τ_D", unit: "ms", toSI: 1e-3, siUnit: "s", default: 0.05, min: 0.001, max: 1000 },
    { key: "concentration", label: "Concentration", unit: "nM", toSI: 1e-6, siUnit: "mol/m³", default: 50, min: 0.01, max: 10000 },
    { key: "brightnessKHz", label: "Molecular brightness ε", unit: "kHz per molecule", toSI: 1e3, siUnit: "1/s", default: 30, min: 0.1, max: 1000 },
    { key: "tripletFrac", label: "Triplet fraction T", unit: "", toSI: 1, siUnit: "", default: 0.1, min: 0, max: 0.9 },
    { key: "tripletTauUs", label: "Triplet relaxation time τ_T", unit: "µs", toSI: 1e-6, siUnit: "s", default: 5, min: 0.1, max: 1000 },
    { key: "binUs", label: "Lag channel width Δτ", unit: "µs", toSI: 1e-6, siUnit: "s", default: 1, min: 0.01, max: 1000 },
    { key: "time", label: "Measurement time", unit: "s", toSI: 1, siUnit: "s", default: 10, min: 0.1, max: 10000 },
  ],
  outputs: [
    { key: "kappa", label: "Structure parameter κ = z₀/w₀", unit: "", toSI: 1, siUnit: "" },
    { key: "volume", label: "Effective volume V_eff", unit: "fL", toSI: 1e-18, siUnit: "m³" },
    { key: "meanNumber", label: "Molecules in V_eff, N", unit: "", toSI: 1, siUnit: "" },
    { key: "g0", label: "G(0) = 1/N (diffusion)", unit: "", toSI: 1, siUnit: "" },
    { key: "g0Triplet", label: "G(0⁺) with triplet", unit: "", toSI: 1, siUnit: "" },
    { key: "diffusionCoefficient", label: "Diffusion coefficient D", unit: "µm²/s", toSI: 1e-12, siUnit: "m²/s" },
    { key: "countRate", label: "Mean count rate N·ε", unit: "kHz", toSI: 1e3, siUnit: "1/s" },
    { key: "snr", label: "SNR of G at the shortest lag", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ w0, z0, tauD, concentration, brightnessKHz, tripletFrac, tripletTauUs, binUs, time }) {
    const r = fcsSummary({
      w0, z0, tauD, brightness: brightnessKHz, concentration, T: tripletFrac, tauT: tripletTauUs, binWidth: binUs, time,
    });
    return {
      values: {
        kappa: r.kappa, volume: r.volume, meanNumber: r.N, g0: r.g0, g0Triplet: r.g0Triplet,
        diffusionCoefficient: r.D, countRate: r.countRate, snr: r.snr,
      },
      warnings: r.warnings,
    };
  },
  checks: [
    {
      // Defaults: w₀ 0.3 µm, z₀ 1.5 µm: V = π^1.5 · 0.09 · 1.5 µm³ = 0.7517242796 fL; N = 50e-6 mol/m³ · N_A · V = 22.63494712;
      // G(0) = 1/N = 0.04417947144; D = w₀²/(4τ_D) = 0.09 µm² / (4 · 5e-5 s) = 450 µm²/s; κ = 5.
      source: HESS_WEBB,
      basis: "computed",
      inputs: {},
      expect: { volume: 0.7517242795723, meanNumber: 22.63494712147, g0: 0.04417947144447, diffusionCoefficient: 450, kappa: 5 },
      tolerance: 1e-8,
    },
    {
      // Defaults: G(0⁺) = 1/(N(1 − T)) = 0.04417947144/0.9 = 0.04908830160.
      source: WIDENGREN,
      basis: "computed",
      inputs: {},
      expect: { g0Triplet: 0.04908830160496 },
      tolerance: 1e-8,
    },
    {
      // w₀ 0.25 µm, z₀ 1 µm, 20 nM, τ_D 0.2 ms, ε 10 kHz, Δτ 2 µs, 60 s: N = 4.191656874 (V = 0.3480204998 fL);
      // SNR = ε √(Δτ T)/√(1 + 1/N) = 1e4 · √(1.2e-4)/√1.238566 = 98.43068206; count rate N·ε = 41.9166 kHz; D = 78.125 µm²/s.
      // Shot-noise conditions hold: ε Δτ = 0.02, ε² Δτ τ_D = 0.04.
      source: KOPPEL,
      basis: "computed",
      inputs: { w0: 0.25, z0: 1, concentration: 20, tauD: 0.2, brightnessKHz: 10, tripletFrac: 0.2, binUs: 2, time: 60 },
      expect: { meanNumber: 4.191656874346, snr: 98.43068206421, diffusionCoefficient: 78.125, countRate: 41.91656874346 },
      tolerance: 1e-8,
    },
  ],
});
