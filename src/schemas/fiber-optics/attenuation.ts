import { minimumLossWavelength, silicaLossDbPerKm } from "../../physics/fiber-optics/silica-attenuation";
import { defineSchema } from "../types";

const KEISER = "Keiser G. (2010). Optical Fiber Communications, 4th ed., McGraw-Hill, §3.1: infrared tail " +
  "α_IR = 7.81×10¹¹ exp(−48.48/λ) dB/km (λ in µm), after Osanai H., Shioda T., Moriyama T. et al. (1976). Effect of dopants on " +
  "transmission loss of low-OH-content optical fibres. Electron. Lett. 12(21), 549–550, doi:10.1049/el:19760418; " +
  "Rayleigh scattering α_R = A/λ⁴ (Agrawal G. P. (2010). Fiber-Optic Communication Systems, 4th ed., Wiley, §2.5).";

export default defineSchema({
  href: "/fiber-optics/attenuation",
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 600, max: 2000 },
    { key: "length", label: "Fibre length", unit: "km", toSI: 1e3, siUnit: "m", default: 50, min: 0.001, max: 20000 },
    { key: "rayleighA", label: "Rayleigh coefficient A", unit: "dB·km⁻¹·µm⁴", toSI: 1, siUnit: "dB·km⁻¹·µm⁴", default: 0.85, min: 0.5, max: 1.5 },
    { key: "geO2", label: "Core GeO₂", unit: "mol %", toSI: 0.01, siUnit: "", default: 4, min: 0, max: 30 },
    { key: "ohPeak", label: "OH excess loss at 1383 nm", unit: "dB/km", toSI: 1, siUnit: "dB/km", default: 0.05, min: 0, max: 5 },
  ],
  outputs: [
    { key: "attenuation", label: "Attenuation at the wavelength", unit: "dB/km", toSI: 1, siUnit: "dB/km" },
    { key: "totalLoss", label: "Loss over the fibre length", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "rayleigh", label: "Rayleigh scattering", unit: "dB/km", toSI: 1, siUnit: "dB/km" },
    { key: "infrared", label: "Infrared absorption", unit: "dB/km", toSI: 1, siUnit: "dB/km" },
    { key: "ultraviolet", label: "Ultraviolet absorption tail", unit: "dB/km", toSI: 1, siUnit: "dB/km" },
    { key: "oh", label: "OH absorption bands", unit: "dB/km", toSI: 1, siUnit: "dB/km" },
    { key: "minLossWavelength", label: "Wavelength of minimum loss", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "minLoss", label: "Minimum loss", unit: "dB/km", toSI: 1, siUnit: "dB/km" },
    { key: "at1310", label: "Attenuation at 1310 nm", unit: "dB/km", toSI: 1, siUnit: "dB/km" },
    { key: "at1383", label: "Attenuation at 1383 nm", unit: "dB/km", toSI: 1, siUnit: "dB/km" },
    { key: "at1550", label: "Attenuation at 1550 nm", unit: "dB/km", toSI: 1, siUnit: "dB/km" },
  ],
  compute({ wavelength, length, rayleighA, geO2, ohPeak }) {
    const params = { rayleighA, geO2Fraction: geO2, ohPeakDbPerKm: ohPeak };
    const at = silicaLossDbPerKm(params, wavelength);
    const lambdaMin = minimumLossWavelength(params);
    const warnings: string[] = [];
    if (wavelength < 800e-9 || wavelength > 1700e-9) {
      warnings.push("The fits are made for the 0.8–1.7 µm range; at this wavelength the result is an extrapolation.");
    }
    return {
      values: {
        attenuation: at.total,
        totalLoss: (at.total * length) / 1e3,
        rayleigh: at.rayleigh,
        infrared: at.infrared,
        ultraviolet: at.ultraviolet,
        oh: at.oh,
        minLossWavelength: lambdaMin,
        minLoss: silicaLossDbPerKm(params, lambdaMin).total,
        at1310: silicaLossDbPerKm(params, 1310e-9).total,
        at1383: silicaLossDbPerKm(params, 1383e-9).total,
        at1550: silicaLossDbPerKm(params, 1550e-9).total,
      },
      warnings,
    };
  },
  checks: [
    {
      // GeO₂ 0 and no OH: only the two terms remain. At 1.55 µm, λ⁴ = 5.77200625 so A/λ⁴ = 0.85/5.77200625 = 0.147262;
      // α_IR = 7.81e11 · exp(−48.48/1.55) = 7.81e11 · exp(−31.2774194) = 7.81e11 · 2.6086e-14 = 0.0203723 dB/km;
      // total 0.1676348 dB/km, i.e. 8.381740 dB over 50 km.
      source: KEISER,
      basis: "computed",
      inputs: { wavelength: 1550, geO2: 0, ohPeak: 0, rayleighA: 0.85, length: 50 },
      expect: { rayleigh: 0.1472624878048252, infrared: 0.020372315807300666, attenuation: 0.16763480361212588, totalLoss: 8.381740180606294 },
      tolerance: 1e-8,
    },
    {
      // Same at 1.31 µm: λ⁴ = 2.94499921, A/λ⁴ = 0.288625; α_IR = 7.81e11 · exp(−37.0076336) = 6.6136e-5 dB/km; total 0.288691.
      source: KEISER,
      basis: "computed",
      inputs: { wavelength: 1310, geO2: 0, ohPeak: 0 },
      expect: { rayleigh: 0.2886248651998789, infrared: 0.00006613631275879208, attenuation: 0.2886910015126377 },
      tolerance: 1e-8,
    },
  ],
});
