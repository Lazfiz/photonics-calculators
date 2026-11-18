import { multiphotonDepthSummary } from "../../physics/imaging/multiphoton-depth";
import { defineSchema } from "../types";

const ZIPFEL = "Zipfel W. R., Williams R. M., Webb W. W. (2003). Nonlinear magic: multiphoton microscopy in the biosciences. " +
  "Nature Biotechnology 21, 1369–1377. https://doi.org/10.1038/nbt899 (1/e radii of the squared PSF: ω_xy = 0.320 λ/(√2 NA) for NA ≤ 0.7 and 0.325 λ/(√2 NA^0.91) for NA > 0.7, " +
  "ω_z = 0.532 λ/(√2 (n − √(n² − NA²))); FWHM = 2√(ln 2) ω).";
const DIELS = "Diels J.-C., Rudolph W. (2006). Ultrashort Laser Pulse Phenomena, 2nd ed., Academic Press, ch. 1 " +
  "https://doi.org/10.1016/B978-012215493-5/50002-1 (Gaussian pulse: peak power 2√(ln 2/π) E/τ_FWHM ≈ 0.94 E/τ; E = P_avg/f_rep).";
const THEER_DENK = "Theer P., Denk W. (2006). On the fundamental imaging-depth limit in two-photon microscopy. " +
  "J. Opt. Soc. Am. A 23, 3139–3149. https://doi.org/10.1364/JOSAA.23.003139 (ballistic excitation exp(−z/l), so the two-photon signal at constant surface power falls as exp(−2z/l)).";

const NO_ATTENUATION = "The extinction coefficient µ_a + µ_s is 0, so the beam is not attenuated and there is no finite depth.";

export default defineSchema({
  href: "/imaging/multiphoton-depth",
  inputs: [
    { key: "na", label: "Objective NA", unit: "", toSI: 1, siUnit: "", default: 0.8, min: 0.2, max: 1.5 },
    { key: "wavelength", label: "Excitation wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 800, min: 680, max: 1300 },
    { key: "n", label: "Refractive index (n)", unit: "", toSI: 1, siUnit: "", default: 1.33, min: 1, max: 1.8 },
    { key: "pulseWidth", label: "Pulse width, FWHM", unit: "fs", toSI: 1e-15, siUnit: "s", default: 100, min: 10, max: 1000 },
    { key: "repRate", label: "Rep rate", unit: "MHz", toSI: 1e6, siUnit: "Hz", default: 80, min: 0.01, max: 250 },
    { key: "avgPower", label: "Average power", unit: "mW", toSI: 1e-3, siUnit: "W", default: 20, min: 0, max: 500 },
    { key: "absorption", label: "Absorption coeff µ_a", unit: "mm⁻¹", toSI: 1000, siUnit: "m⁻¹", default: 0.02, min: 0, max: 10 },
    { key: "scattering", label: "Scattering coeff µ_s", unit: "mm⁻¹", toSI: 1000, siUnit: "m⁻¹", default: 6, min: 0, max: 50 },
  ],
  outputs: [
    { key: "lateral", label: "Lateral FWHM (2P)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "axial", label: "Axial FWHM (2P)", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "pulseEnergy", label: "Pulse energy", unit: "nJ", toSI: 1e-9, siUnit: "J" },
    { key: "peakPower", label: "Peak power (Gaussian pulse, 0.939 E/τ; sech² would be 0.881 E/τ)", unit: "kW", toSI: 1e3, siUnit: "W" },
    { key: "attenuationLength", label: "Attenuation length 1/µ", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "depth1e2", label: "Depth at 1 % 2P signal (constant surface power)", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "depth1e3", label: "Depth at 0.1 % 2P signal (constant surface power)", unit: "µm", toSI: 1e-6, siUnit: "m" },
  ],
  validate({ na, n }) {
    if (!(na < n)) return `The NA (${na}) must be smaller than the refractive index (${n}).`;
    return undefined;
  },
  compute({ na, wavelength, n, pulseWidth, repRate, avgPower, absorption, scattering }) {
    const r = multiphotonDepthSummary({ na, lambda: wavelength, n, pulseWidth, repRate, avgPower, absorption, scattering });
    const noMu = !(absorption + scattering > 0);
    return {
      values: r,
      warnings: noMu ? [NO_ATTENUATION] : [],
      reasons: noMu ? { attenuationLength: NO_ATTENUATION, depth1e2: NO_ATTENUATION, depth1e3: NO_ATTENUATION } : {},
    };
  },
  checks: [
    {
      // 800 nm, NA 0.8, n 1.33: lateral = 2√(ln 2)·0.325 λ/(√2 NA^0.91) = 375.0500 nm;
      // axial = 2√(ln 2)·0.532 λ/(√2 (n − √(n² − NA²))) = 1.873272 µm.
      source: ZIPFEL,
      basis: "computed",
      inputs: { na: 0.8, wavelength: 800, n: 1.33 },
      expect: { lateral: 375.05001585897213, axial: 1.8732717605687288 },
      tolerance: 1e-8,
    },
    {
      // E = 20 mW/80 MHz = 0.25 nJ; peak = 2√(ln 2/π) · 0.25 nJ/100 fs = 0.9394372 · 2.5 kW = 2.348593 kW.
      source: DIELS,
      basis: "computed",
      inputs: { avgPower: 20, repRate: 80, pulseWidth: 100 },
      expect: { pulseEnergy: 0.25, peakPower: 2.3485931967491283 },
      tolerance: 1e-8,
    },
    {
      // µ = 0.02 + 6 = 6.02 mm⁻¹: 1/µ = 166.1130 µm; 1 % of the 2P signal at ln(100)/(2µ) = 4.60517/12.04 mm = 382.4892 µm;
      // 0.1 % at ln(1000)/(2µ) = 573.7338 µm.
      source: THEER_DENK,
      basis: "computed",
      inputs: { absorption: 0.02, scattering: 6 },
      expect: { attenuationLength: 166.11295681063123, depth1e2: 382.4892181053233, depth1e3: 573.7338271579848 },
      tolerance: 1e-8,
    },
  ],
});
