import { thgSummary } from "../../physics/imaging/third-harmonic-microscopy";
import { defineSchema } from "../types";

const ZIPFEL = "Zipfel W. R., Williams R. M., Webb W. W. (2003). Nonlinear magic: multiphoton microscopy in the biosciences. " +
  "Nature Biotechnology 21, 1369–1377. https://doi.org/10.1038/nbt899 (1/e radii of the squared PSF: ω_xy = 0.320 λ/(√2 NA) for NA ≤ 0.7 and " +
  "0.325 λ/(√2 NA^0.91) for NA > 0.7, ω_z = 0.532 λ/(√2 (n − √(n² − NA²))); the profile I^k has FWHM 2√(2 ln 2/k) ω, extending the " +
  "Gaussian fit from k = 2 to k = 1 and 3).";
const PULSE = "Gaussian pulse: Diels J.-C., Rudolph W. (2006). Ultrashort Laser Pulse Phenomena, 2nd ed., Academic Press, ch. 1, " +
  "https://doi.org/10.1016/b978-012215493-5/50002-1 (E = P_peak·τ_FWHM·√(π/(4 ln 2))); peak intensity I = P_peak/(2π ω_xy²) from the " +
  "Zipfel et al. (2003) Gaussian focus, https://doi.org/10.1038/nbt899.";

export default defineSchema({
  href: "/imaging/third-harmonic-microscopy",
  inputs: [
    { key: "wavelength", label: "Excitation wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1200, min: 1000, max: 1800 },
    { key: "na", label: "Objective NA", unit: "", toSI: 1, siUnit: "", default: 0.8, min: 0.1, max: 1.7 },
    { key: "power", label: "Average power", unit: "mW", toSI: 1e-3, siUnit: "W", default: 100, min: 1, max: 500 },
    { key: "pulseWidth", label: "Pulse width, FWHM", unit: "fs", toSI: 1e-15, siUnit: "s", default: 100, min: 10, max: 1000 },
    { key: "repRate", label: "Repetition rate", unit: "MHz", toSI: 1e6, siUnit: "Hz", default: 80, min: 0.1, max: 250 },
    { key: "refractiveIndex", label: "Refractive index of the sample", unit: "", toSI: 1, siUnit: "", default: 1.33, min: 1, max: 1.8 },
    { key: "scatteringCoeff", label: "Scattering coefficient (chart only)", unit: "cm⁻¹", toSI: 100, siUnit: "1/m", default: 40, min: 0, max: 500 },
  ],
  outputs: [
    { key: "thgWavelength", label: "THG wavelength", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "peakIntensity", label: "Peak intensity at the focus", unit: "TW/cm²", toSI: 1e16, siUnit: "W/m²" },
    { key: "pulseEnergy", label: "Pulse energy", unit: "nJ", toSI: 1e-9, siUnit: "J" },
    { key: "peakPower", label: "Peak power", unit: "kW", toSI: 1e3, siUnit: "W" },
    { key: "w", label: "Focal 1/e² radius w of the fundamental", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "thgLateral", label: "THG source, lateral FWHM (I³)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "thgAxial", label: "THG source, axial FWHM (I³)", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "fundamentalLateral", label: "Fundamental, lateral FWHM (I)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "fundamentalAxial", label: "Fundamental, axial FWHM (I)", unit: "µm", toSI: 1e-6, siUnit: "m" },
  ],
  validate({ na, refractiveIndex }) {
    if (!(na < refractiveIndex)) return `The NA (${na}) must be smaller than the refractive index (${refractiveIndex}).`;
    return undefined;
  },
  compute({ wavelength, na, power, pulseWidth, repRate, refractiveIndex }) {
    const r = thgSummary({ lambda: wavelength, n: refractiveIndex, na, avgPower: power, pulseWidth, repRate });
    return {
      values: {
        thgWavelength: r.thgWavelength,
        peakIntensity: r.peakIntensity,
        pulseEnergy: r.pulseEnergy,
        peakPower: r.peakPower,
        w: r.w,
        thgLateral: r.thgLateral,
        thgAxial: r.thgAxial,
        fundamentalLateral: r.fundamentalLateral,
        fundamentalAxial: r.fundamentalAxial,
      },
      warnings: [],
    };
  },
  checks: [
    {
      // 1200 nm, NA 0.5 (≤ 0.7), n 1.33: ω_xy = 0.320 λ/(√2 NA); FWHM = 2√(2 ln 2/k) ω with 2√(2 ln 2/3) = 1.3595 (k = 3), 2√(2 ln 2) = 2.3548 (k = 1).
      // ω_z = 0.532 λ/(√2 (n − √(n² − NA²))), ω_xy = 543.0580 nm, ω_z = 4.626909 µm; the scratch script gives
      // THG lateral 738.3177659 nm, axial 6.2905424759 µm; fundamental lateral 1278.8038827 nm, axial 10.8955391754 µm.
      source: ZIPFEL,
      basis: "computed",
      inputs: { wavelength: 1200, na: 0.5, refractiveIndex: 1.33 },
      expect: { thgLateral: 738.3177659396521, thgAxial: 6.290542475902385, fundamentalLateral: 1278.8038827382236, fundamentalAxial: 10.89553917543305 },
      tolerance: 1e-8,
    },
    {
      // 1200 nm, NA 0.8 (> 0.7 branch, ω_xy = 0.325 λ/(√2 NA^0.91)), 100 mW, 80 MHz, 100 fs.
      // E = 0.1 W/80 MHz = 1.25 nJ; P_peak = 2√(ln 2/π)·E/τ = 0.9394373·1.25 nJ/100 fs = 11.742966 kW;
      // I = P_peak/(2π ω_xy²) = 1.6372782 TW/cm²; w = 2ω_xy = 0.67572147 µm; THG wavelength 1200/3 = 400 nm.
      source: PULSE,
      basis: "computed",
      inputs: { wavelength: 1200, na: 0.8, refractiveIndex: 1.33, power: 100, repRate: 80, pulseWidth: 100 },
      expect: { thgWavelength: 400, pulseEnergy: 1.25, peakPower: 11.742965983745641, peakIntensity: 1.6372782493850462, w: 0.6757214676958874 },
      tolerance: 1e-8,
    },
  ],
});
