import { threePhotonSummary } from "../../physics/imaging/three-photon-microscopy";
import { defineSchema } from "../types";

const ZIPFEL = "Zipfel W. R., Williams R. M., Webb W. W. (2003). Nonlinear magic: multiphoton microscopy in the biosciences. " +
  "Nature Biotechnology 21, 1369–1377. https://doi.org/10.1038/nbt899 (1/e radii of the squared PSF: ω_xy = 0.320 λ/(√2 NA) for NA ≤ 0.7 and " +
  "0.325 λ/(√2 NA^0.91) for NA > 0.7, ω_z = 0.532 λ/(√2 (n − √(n² − NA²))); FWHM of I^k = 2√(2 ln 2/k) ω extends the Gaussian fit " +
  "from k = 2 to k = 3; volume ∫I^k dV/I₀^k = (π/(2k))^(3/2) w² w_z with w = 2ω_xy, w_z = 2ω_z).";
const DEPTH = "Gaussian pulse: Diels J.-C., Rudolph W. (2006). Ultrashort Laser Pulse Phenomena, 2nd ed., Academic Press, ch. 1, " +
  "https://doi.org/10.1016/b978-012215493-5/50002-1 (E = P_peak·τ_FWHM·√(π/(4 ln 2))); peak intensity I = P_peak/(2π ω_xy²) from the " +
  "Zipfel et al. (2003) Gaussian focus, https://doi.org/10.1038/nbt899; ballistic excitation at depth z: exp(−µz) (Beer–Lambert), a " +
  "k-photon signal at constant surface power scales as its k-th power.";

export default defineSchema({
  href: "/imaging/three-photon-microscopy",
  inputs: [
    { key: "wavelength", label: "Excitation wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1300, min: 1000, max: 1800 },
    { key: "na", label: "Objective NA", unit: "", toSI: 1, siUnit: "", default: 0.8, min: 0.1, max: 1.7 },
    { key: "pulseWidth", label: "Pulse width, FWHM", unit: "fs", toSI: 1e-15, siUnit: "s", default: 100, min: 10, max: 1000 },
    { key: "repRate", label: "Repetition rate", unit: "MHz", toSI: 1e6, siUnit: "Hz", default: 1, min: 0.01, max: 250 },
    { key: "avgPower", label: "Average power at the surface", unit: "mW", toSI: 1e-3, siUnit: "W", default: 100, min: 0.1, max: 500 },
    { key: "refractiveIndex", label: "Refractive index of the sample", unit: "", toSI: 1, siUnit: "", default: 1.33, min: 1, max: 1.8 },
    { key: "scatteringCoeff", label: "Scattering coefficient", unit: "cm⁻¹", toSI: 100, siUnit: "1/m", default: 60, min: 0, max: 500 },
    { key: "depth", label: "Focus depth", unit: "µm", toSI: 1e-6, siUnit: "m", default: 500, min: 0, max: 3000 },
  ],
  outputs: [
    { key: "lateral3", label: "3P lateral FWHM (I³)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "axial3", label: "3P axial FWHM (I³)", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "lateral2", label: "2P lateral FWHM at the same wavelength (I²)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "axial2", label: "2P axial FWHM at the same wavelength (I²)", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "volume", label: "3P excitation volume (I³)", unit: "fL", toSI: 1e-18, siUnit: "m³" },
    { key: "pulseEnergy", label: "Pulse energy", unit: "nJ", toSI: 1e-9, siUnit: "J" },
    { key: "peakPower", label: "Peak power", unit: "kW", toSI: 1e3, siUnit: "W" },
    { key: "peakIntensity", label: "Peak intensity at the focus, surface value", unit: "TW/cm²", toSI: 1e16, siUnit: "W/m²" },
    { key: "intensityAtDepth", label: "Peak intensity at the focus depth (ballistic)", unit: "TW/cm²", toSI: 1e16, siUnit: "W/m²" },
    { key: "ballisticPower", label: "Ballistic power at depth", unit: "mW", toSI: 1e-3, siUnit: "W" },
    { key: "relativeSignal", label: "Relative 3P signal at depth, exp(−3µz)", unit: "", toSI: 1, siUnit: "" },
    { key: "equivalent1p", label: "One-photon equivalent wavelength λ/3", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "equivalent2p", label: "Two-photon equivalent wavelength λ/2", unit: "nm", toSI: 1e-9, siUnit: "m" },
  ],
  validate({ na, refractiveIndex }) {
    if (!(na < refractiveIndex)) return `The NA (${na}) must be smaller than the refractive index (${refractiveIndex}).`;
    return undefined;
  },
  compute({ wavelength, na, pulseWidth, repRate, avgPower, refractiveIndex, scatteringCoeff, depth }) {
    const r = threePhotonSummary({
      lambda: wavelength, n: refractiveIndex, na, pulseWidth, repRate, avgPower, scattering: scatteringCoeff, depth,
    });
    return {
      values: {
        lateral3: r.lateral3,
        axial3: r.axial3,
        lateral2: r.lateral2,
        axial2: r.axial2,
        volume: r.volume,
        pulseEnergy: r.pulseEnergy,
        peakPower: r.peakPower,
        peakIntensity: r.peakIntensity,
        intensityAtDepth: r.intensityAtDepth,
        ballisticPower: r.ballisticPower,
        relativeSignal: r.relativeSignal,
        equivalent1p: r.equivalent1p,
        equivalent2p: r.equivalent2p,
      },
      warnings: [],
    };
  },
  checks: [
    {
      // 1300 nm, NA 0.5 (≤ 0.7), n 1.33: ω_xy = 0.320 λ/(√2 NA); FWHM of I^k = 2√(2 ln 2/k) ω (k = 3: 1.3595, k = 2: 1.6651);
      // ω_xy = 588.3128 nm, ω_z = 5.012485 µm; w = 2ω_xy, w_z = 2ω_z, V = (π/6)^(3/2) w² w_z. Independent scratch script: 3P lateral 799.84424643 nm, axial 6.81475434889 µm;
      // 2P lateral 979.60513873 nm, axial 8.34633543860 µm; V = 5.25844924197 fL; λ/3 = 433.33333333 nm, λ/2 = 650 nm.
      source: ZIPFEL,
      basis: "computed",
      inputs: { wavelength: 1300, na: 0.5, refractiveIndex: 1.33 },
      expect: {
        lateral3: 799.8442464346232, axial3: 6.81475434889425, lateral2: 979.6051387328748, axial2: 8.346335438601761,
        volume: 5.258449241973011, equivalent1p: 433.3333333333333, equivalent2p: 650,
      },
      tolerance: 1e-8,
    },
    {
      // 1300 nm, NA 0.8 (> 0.7 branch), 100 fs, 1 MHz, 100 mW, µ = 60 cm⁻¹ = 6000 m⁻¹, z = 500 µm.
      // E = 0.1 W/1 MHz = 100 nJ; P_peak = 2√(ln 2/π)·E/τ = 0.9394373·100 nJ/100 fs = 939.43728 kW; I₀ = P_peak/(2π ω_xy²) = 111.606186 TW/cm²;
      // exp(−µz) = exp(−3) = 0.04978707: I(z) = 5.5565448 TW/cm², P(z) = 4.9787068 mW, exp(−3µz) = exp(−9) = 1.2340980e-4.
      source: DEPTH,
      basis: "computed",
      inputs: { wavelength: 1300, na: 0.8, refractiveIndex: 1.33, pulseWidth: 100, repRate: 1, avgPower: 100, scatteringCoeff: 60, depth: 500 },
      expect: {
        pulseEnergy: 100.00000000000001, peakPower: 939.4372786996515, peakIntensity: 111.60618599358422,
        intensityAtDepth: 5.556544812339117, ballisticPower: 4.978706836786395, relativeSignal: 0.00012340980408667956,
      },
      tolerance: 1e-8,
    },
  ],
});
