import { CWDM_CHANNELS, ohContentPpm } from "../../physics/fiber-optics/silica-attenuation";
import { G652D_MAX, lowWaterPeakSummary } from "../../physics/fiber-optics/low-water-peak";
import { defineSchema } from "../types";

const MODEL = "Keiser G. (2010). Optical Fiber Communications, 4th ed., McGraw-Hill, §3.1: infrared tail " +
  "α_IR = 7.81×10¹¹ exp(−48.48/λ) dB/km and ultraviolet tail (λ in µm), after Osanai H., Shioda T., Moriyama T. et al. (1976). " +
  "Effect of dopants on transmission loss of low-OH-content optical fibres. Electron. Lett. 12(21), 549–550, " +
  "doi:10.1049/el:19760418; Rayleigh scattering α_R = A/λ⁴ (Agrawal G. P. (2010). Fiber-Optic Communication Systems, 4th ed., " +
  "Wiley, §2.5); OH band positions and strengths (Table 3: 1.6, 2.7, 62.7 and 201 dB/km per ppm at 943, 1246, 1383 and 2212 nm) and the four-Gaussian fit of the 1383 nm band (Table 2): Humbach O., Fabian H., Grzesik U. et al. (1996). " +
  "Analysis of OH absorption bands in synthetic silica. J. Non-Cryst. Solids 203, 19–26, doi:10.1016/0022-3093(96)00329-8; " +
  "E-band 1360–1460 nm and the CWDM grid, ITU-T G.694.2.";

export default defineSchema({
  href: "/fiber-optics/low-water-peak",
  inputs: [
    { key: "length", label: "Fibre length", unit: "km", toSI: 1e3, siUnit: "m", default: 40, min: 0.1, max: 500 },
    { key: "ohLwp", label: "OH excess at 1383 nm, low-water-peak fibre", unit: "dB/km", toSI: 1, siUnit: "dB/km", default: 0.05, min: 0, max: 5 },
    { key: "ohLegacy", label: "OH excess at 1383 nm, older fibre", unit: "dB/km", toSI: 1, siUnit: "dB/km", default: 1, min: 0, max: 5 },
    { key: "rayleighA", label: "Rayleigh coefficient A", unit: "dB·km⁻¹·µm⁴", toSI: 1, siUnit: "dB·km⁻¹·µm⁴", default: 0.85, min: 0.5, max: 1.5 },
    { key: "geO2", label: "Core GeO₂", unit: "mol %", toSI: 0.01, siUnit: "", default: 4, min: 0, max: 30 },
  ],
  outputs: [
    { key: "at1383", label: "Loss at 1383 nm, low-water-peak fibre", unit: "dB/km", toSI: 1, siUnit: "dB/km" },
    { key: "at1310", label: "Loss at 1310 nm", unit: "dB/km", toSI: 1, siUnit: "dB/km" },
    { key: "meetsG652D", label: "Water-peak check (G.652.D): 1 meets, 0 fails", unit: "", toSI: 1, siUnit: "" },
    { key: "meetsZwp", label: "α(1383) ≤ α(1310): 1 meets, 0 fails", unit: "", toSI: 1, siUnit: "" },
    { key: "worstChannelLoss", label: "Worst CWDM channel loss, low-water-peak fibre", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "worstChannelWavelength", label: "Worst CWDM channel wavelength, low-water-peak fibre", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "eBandMean", label: "E-band mean loss, low-water-peak fibre", unit: "dB/km", toSI: 1, siUnit: "dB/km" },
    { key: "ohContent", label: "OH content, low-water-peak fibre", unit: "ppb", toSI: 1e-9, siUnit: "" },
    { key: "legacyAt1383", label: "Loss at 1383 nm, older fibre", unit: "dB/km", toSI: 1, siUnit: "dB/km" },
    { key: "legacyWorstChannelLoss", label: "Worst CWDM channel loss, older fibre", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "legacyWorstChannelWavelength", label: "Worst CWDM channel wavelength, older fibre", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "legacyEBandMean", label: "E-band mean loss, older fibre", unit: "dB/km", toSI: 1, siUnit: "dB/km" },
    { key: "legacyOhContent", label: "OH content, older fibre", unit: "ppb", toSI: 1e-9, siUnit: "" },
  ],
  compute({ length, ohLwp, ohLegacy, rayleighA, geO2 }) {
    const lengthKm = length / 1e3;
    const lwp = lowWaterPeakSummary({ rayleighA, geO2Fraction: geO2, ohPeakDbPerKm: ohLwp }, lengthKm);
    const legacy = lowWaterPeakSummary({ rayleighA, geO2Fraction: geO2, ohPeakDbPerKm: ohLegacy }, lengthKm);
    const warnings: string[] = [];
    if (lwp.at1383 > G652D_MAX) {
      warnings.push(`The low-water-peak fibre's loss at 1383 nm exceeds the ${G652D_MAX} dB/km G.652.D cable limit.`);
    }
    return {
      values: {
        at1383: lwp.at1383,
        at1310: lwp.at1310,
        meetsG652D: lwp.at1383 <= G652D_MAX ? 1 : 0,
        meetsZwp: lwp.at1383 <= lwp.at1310 ? 1 : 0,
        worstChannelLoss: lwp.channels[lwp.worst],
        worstChannelWavelength: CWDM_CHANNELS[lwp.worst],
        eBandMean: lwp.eBandMean,
        ohContent: ohContentPpm(ohLwp) * 1e-6,
        legacyAt1383: legacy.at1383,
        legacyWorstChannelLoss: legacy.channels[legacy.worst],
        legacyWorstChannelWavelength: CWDM_CHANNELS[legacy.worst],
        legacyEBandMean: legacy.eBandMean,
        legacyOhContent: ohContentPpm(ohLegacy) * 1e-6,
      },
      warnings,
    };
  },
  checks: [
    {
      // Independent scratch model (A = 0.85, x = 0.04, OH bands at 943/1246/1383/2212/2722 nm with Humbach Table 3 strengths
      // 1.6/2.7/62.7/201/1.0e4 dB/km/ppm; 1383 nm band = Table 2 four-Gaussian fit ÷ 1.01357, others FWHM 24 nm (λ/1383 nm)²).
      // Low-water-peak, α_OH = 0.05: α(1310) = 0.3231848467, α(1383) = 0.3111651205, E-band trapezoid mean (200 intervals) 0.2591309732,
      // worst of the 18 CWDM channels over 40 km: 1271 nm, 14.5537521265 dB. Older (α_OH = 1): α(1383) = 1.2611651205,
      // E-band mean 0.5507169656, worst channel 1391 nm, 40.4526845867 dB. OH content 0.05/62.7 ppm = 7.9745e-4 ppm = 0.79745 ppb.
      source: MODEL,
      basis: "computed",
      inputs: {},
      expect: {
        ohContent: 0.7974481658692185, at1310: 0.3231848466946394, at1383: 0.3111651205402913, eBandMean: 0.25913097315081524,
        worstChannelLoss: 14.553752126463198, worstChannelWavelength: 1271,
        legacyAt1383: 1.2611651205402912, legacyEBandMean: 0.5507169656306147,
        legacyWorstChannelLoss: 40.452684586711314, legacyWorstChannelWavelength: 1391,
        meetsG652D: 1, meetsZwp: 1,
      },
      tolerance: 1e-8,
    },
    {
      // A = 0.8, x = 0.03, 10 km; low-water-peak α_OH = 0.5: α(1310) = 0.3007658268, α(1383) = 0.7405704360 (fails the G.652.D limit, meetsG652D = 0 and meetsZwp = 0, which a relative check cannot assert),
      // E-band mean 0.3780264145, worst channel 1391 nm, 6.1322241290 dB. Older α_OH = 2: α(1383) = 2.2405704360,
      // E-band mean 0.8384253500, worst channel 1391 nm, 17.4705392058 dB.
      source: MODEL,
      basis: "computed",
      inputs: { length: 10, rayleighA: 0.8, geO2: 3, ohLwp: 0.5, ohLegacy: 2 },
      expect: {
        at1310: 0.3007658268235795, at1383: 0.7405704359805835, eBandMean: 0.3780264145062935,
        worstChannelLoss: 6.132224128953029, worstChannelWavelength: 1391,
        legacyAt1383: 2.2405704359805836, legacyEBandMean: 0.8384253500007127,
        legacyWorstChannelLoss: 17.47053920584306, legacyWorstChannelWavelength: 1391,
      },
      tolerance: 1e-8,
    },
  ],
});
