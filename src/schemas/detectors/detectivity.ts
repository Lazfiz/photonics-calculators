import { detectivitySummary } from "../../physics/detectors/detectivity";
import { defineSchema } from "../types";

const DERENIAK = "Dereniak E. L., Boreman G. D. (1996). Infrared Detectors and Systems. Wiley, ch. 5: ℛ = η·q·λ/(h·c) up to λ_c = h·c/E_g, " +
  "NEP = i_n/(ℛ·M), D* = √(A·Δf)/NEP; i_n² = 2q·I_d·M²·F·Δf (Schottky W. (1918), Ann. Phys. 362, 541–567, doi:10.1002/andp.19183622304) + 4k_BT·Δf/R_L (Nyquist H. (1928), Phys. Rev. 32, 110, doi:10.1103/PhysRev.32.110); " +
  "detector D* = ℛ·M/√(2q·J_d·M²·F + 4k_BT/R₀A): Rogalski A. (2003). Infrared detectors: status and trends. Prog. Quantum Electron. 27, 59–210, doi:10.1016/S0079-6727(02)00024-1.";
const CUTOFF = "Responsivity is zero beyond the cutoff wavelength, so there is no response and no D* or NEP.";

export default defineSchema({
  href: "/detectors/detectivity",
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 850, min: 200, max: 20000 },
    { key: "cutoff", label: "Cutoff wavelength λ_c", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1100, min: 300, max: 20000 },
    { key: "qe", label: "Quantum efficiency", unit: "", toSI: 1, siUnit: "", default: 0.7, min: 0.01, max: 1 },
    { key: "darkCurrent", label: "Dark current (unmultiplied)", unit: "nA", toSI: 1e-9, siUnit: "A", default: 1, min: 0, max: 1e9 },
    { key: "area", label: "Area", unit: "mm²", toSI: 1e-6, siUnit: "m²", default: 1, min: 1e-4, max: 1e4 },
    { key: "bandwidth", label: "Bandwidth", unit: "MHz", toSI: 1e6, siUnit: "Hz", default: 1, min: 1e-6, max: 1e5 },
    { key: "temperature", label: "Temperature", unit: "K", toSI: 1, siUnit: "K", default: 293, min: 4, max: 500 },
    { key: "loadResistance", label: "Load resistance R_L (system D* only)", unit: "Ω", toSI: 1, siUnit: "Ω", default: 50, min: 1, max: 1e12 },
    { key: "r0a", label: "Detector R₀A (zero bias)", unit: "Ω·cm²", toSI: 1e-4, siUnit: "Ω·m²", default: 1e7, min: 1e-6, max: 1e15 },
    { key: "gain", label: "Avalanche gain M", unit: "", toSI: 1, siUnit: "", default: 1, min: 1, max: 1e4 },
    { key: "excessNoiseFactor", label: "Excess noise factor F (1 for a PIN)", unit: "", toSI: 1, siUnit: "", default: 1, min: 1, max: 1e4 },
  ],
  choices: [
    {
      key: "darkLaw", label: "Dark-current law vs T (temperature chart only)",
      options: [{ value: "generation", label: "Generation (∝ n_i)" }, { value: "diffusion", label: "Diffusion (∝ n_i²)" }], default: "generation",
    },
  ],
  outputs: [
    { key: "responsivity", label: "Responsivity (M = 1)", unit: "A/W", toSI: 1, siUnit: "A/W" },
    { key: "bandGap", label: "Band gap from the cutoff", unit: "eV", toSI: 1, siUnit: "eV" },
    { key: "detectorDStar", label: "Detector D*", unit: "cm·Hz^½/W", toSI: 0.01, siUnit: "m·Hz^½/W" },
    { key: "nepSpectral", label: "System NEP", unit: "W/√Hz", toSI: 1, siUnit: "W/√Hz" },
    { key: "shotNoise", label: "Multiplied dark-current shot noise", unit: "A", toSI: 1, siUnit: "A" },
    { key: "thermalNoise", label: "Load thermal noise", unit: "A", toSI: 1, siUnit: "A" },
    { key: "systemDStar", label: "System D* (incl. load R_L)", unit: "cm·Hz^½/W", toSI: 0.01, siUnit: "m·Hz^½/W" },
  ],
  compute({ wavelength, cutoff, qe, darkCurrent, area, bandwidth, temperature, loadResistance, r0a, gain, excessNoiseFactor }) {
    // Detector D* = ℛ·M/√(2q·J_d·M²·F + 4k_BT/R₀A): adding the 2q·J_d·M²·F shot noise to the 4k_BT/R₀A Johnson noise double-counts
    // diffusion noise at zero bias (Rogalski uses 4k_BT/R₀A plus background shot noise). The page's model is kept as is, so at zero
    // bias this is an upper bound on the noise, i.e. a lower bound on D*.
    const r = detectivitySummary({
      wavelength_nm: wavelength * 1e9, cutoff_nm: cutoff * 1e9, qe, darkCurrent, area_cm2: area * 1e4, bandwidth, temperature, loadResistance,
      r0a: r0a * 1e4, gain, excessNoiseFactor,
    });
    const positive = (x: number) => (x > 0 ? x : NaN); // the page shows "—" for D* ≤ 0
    const noResponse = !(r.responsivity > 0);
    return {
      values: {
        responsivity: r.responsivity,
        bandGap: r.bandGap_eV,
        detectorDStar: positive(r.detectorDStar) * 0.01,
        nepSpectral: r.nepSpectral,
        shotNoise: r.shotNoise,
        thermalNoise: r.thermalNoise,
        systemDStar: r.systemDStar * 0.01,
      },
      warnings: noResponse ? ["The wavelength is beyond the cutoff: the detector has no response."] : [],
      reasons: { detectorDStar: CUTOFF, nepSpectral: CUTOFF, systemDStar: CUTOFF },
    };
  },
  checks: [
    {
      // Defaults: 850 nm, λ_c 1100 nm, η = 0.7, I_d = 1 nA, A = 1 mm² = 0.01 cm², Δf = 1 MHz, T = 293 K, R_L = 50 Ω, R₀A = 1e7 Ω·cm², M = F = 1.
      // ℛ = 0.7·q·850e-9/(h·c) = 0.4798999 A/W; E_g = h·c/(q·λ_c) = 1.127129 eV; i_shot = √(2q·1e-9·1e6) = 1.790071e-11 A; i_th = √(4k_BT·1e6/50) = 1.798956e-8 A; total = hypot.
      // NEP = i_n/ℛ, spectral NEP = NEP/√Δf = 3.748608e-11 W/√Hz; system D* = √(A·Δf)/NEP = √(0.01·1e6)/NEP = 2.667657e9 Jones;
      // J_d = 1e-9/0.01 = 1e-7 A/cm², detector D* = ℛ/√(2q·J_d + 4k_BT/R₀A) = 2.615670e12 Jones.
      source: DERENIAK,
      basis: "computed",
      inputs: {},
      expect: {
        responsivity: 0.4798998642722781, bandGap: 1.127129076665457, detectorDStar: 2615669725299.011, nepSpectral: 3.748608045130104e-11,
        shotNoise: 1.790070743853438e-11, thermalNoise: 1.7989556014532433e-8, systemDStar: 2667656868.791927,
      },
      tolerance: 1e-8,
    },
    {
      // 1550 nm, λ_c 1700 nm, η = 0.8, I_d = 5 nA, A = 0.5 mm² = 0.005 cm², Δf = 10 MHz, T = 250 K, R_L = 1 kΩ, R₀A = 1e5 Ω·cm², M = 10, F = 5.
      // ℛ = 0.8·q·1550e-9/(h·c) = 1.000127 A/W; i_shot = √(2q·5e-9·1e7)·M·√F = 2.830350e-9 A; i_th = √(4k_B·250·1e7/1000) = 1.175010e-8 A;
      // NEP = i_n/(ℛ·M); D*_sys = √(A·Δf)/NEP = 1.850339e11 Jones; J_d = 5e-9/0.005 = 1e-6 A/cm²; D*_det = ℛ·M/√(2q·J_d·M²·F + 4k_BT/R₀A) = 7.897927e11 Jones.
      source: DERENIAK,
      basis: "computed",
      inputs: { wavelength: 1550, cutoff: 1700, qe: 0.8, darkCurrent: 5, area: 0.5, bandwidth: 10, temperature: 250, loadResistance: 1000, r0a: 1e5, gain: 10, excessNoiseFactor: 5 },
      expect: {
        responsivity: 1.0001274482313023, bandGap: 0.7293188143129428, detectorDStar: 789792685395.0676, nepSpectral: 3.821499131054956e-13,
        shotNoise: 2.8303503617043595e-9, thermalNoise: 1.1750102127215746e-8, systemDStar: 185033872032.1375,
      },
      tolerance: 1e-8,
    },
  ],
});
