import { wdmPlanSummary } from "../../physics/fiber-optics/wdm-channel-plan";
import { defineSchema } from "../types";

const ITU = "ITU-T G.694.1 (10/2020), Spectral grids for WDM applications: DWDM frequency grid (spacing recognised as a G.694.1 value, " +
  "Δν = 12.5, 25, 50, 100 or 200 GHz; channels at equal frequency steps cΔλ/λc² about λc, not snapped to the grid); Gaussian passband of full width at half maximum FWHM: " +
  "σ = FWHM/(2√(2 ln 2)), the leak at a neighbour Δλ away exp(−Δλ²/2σ²), i.e. 40·log10(2)·(Δλ/FWHM)² dB.";

export default defineSchema({
  href: "/fiber-optics/wdm-coupler",
  inputs: [
    { key: "channelCount", label: "Number of channels", unit: "", toSI: 1, siUnit: "", default: 8, min: 1, max: 96 },
    { key: "channelSpacing", label: "Channel spacing", unit: "nm", toSI: 1e-9, siUnit: "m", default: 0.8, min: 0.05, max: 20 },
    { key: "centerWavelength", label: "Centre wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 800, max: 1700 },
    { key: "passbandWidth", label: "Passband width (FWHM)", unit: "nm", toSI: 1e-9, siUnit: "m", default: 0.4, min: 0.01, max: 20 },
    { key: "insertionLoss", label: "Insertion loss", unit: "dB", toSI: 1, siUnit: "dB", default: 0.5, min: 0, max: 30 },
  ],
  outputs: [
    { key: "frequencySpacing", label: "Frequency spacing", unit: "GHz", toSI: 1e9, siUnit: "Hz" },
    { key: "firstChannel", label: "First channel", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "lastChannel", label: "Last channel", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "totalBandwidth", label: "Total bandwidth (first to last channel)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "insertionLossOut", label: "Insertion loss", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "isolation", label: "Adjacent-channel isolation (Gaussian passbands)", unit: "dB", toSI: 1, siUnit: "dB" },
  ],
  compute({ channelCount, channelSpacing, centerWavelength, passbandWidth, insertionLoss }) {
    const r = wdmPlanSummary(Math.round(channelCount), centerWavelength, channelSpacing, passbandWidth);
    const warnings: string[] = [];
    const reasons: Record<string, string> = {};
    if (r.planInvalid) {
      const why = "The plan runs below zero wavelength: reduce the channel count or spacing.";
      warnings.push(why);
      reasons.firstChannel = why;
      reasons.lastChannel = why;
      reasons.totalBandwidth = why;
    }
    if (r.outOfRange) warnings.push("Some channels fall outside 800–1700 nm, beyond the range of the centre-wavelength input and of typical WDM components.");
    return {
      values: {
        frequencySpacing: r.frequencySpacing, firstChannel: r.first, lastChannel: r.last,
        totalBandwidth: r.totalBandwidth, insertionLossOut: insertionLoss, isolation: r.isolationDb,
      },
      warnings,
      reasons,
    };
  },
  checks: [
    {
      // Defaults: 0.8 nm at 1550 nm is 99.83 GHz, on the 100 GHz grid (±2 GHz), so the spacing is recognised as a G.694.1 value and channels sit at equal frequency steps cΔλ/λc² about λc (not snapped to the grid, not anchored at 193.1 THz).
      // ν_c = c/1.55e-6, Δν = c·0.8e-9/(1.55e-6)² = 99.826833 GHz; 8 channels, k = ±0.5 … ±3.5: first λ = c/(ν_c + 3.5Δν) = 1547.20505 nm,
      // last λ = c/(ν_c − 3.5Δν) = 1552.80507 nm, span 5.600018 nm. Isolation 40·log10(2)·(0.8/0.4)² = 12.041200·4 = 48.164799 dB.
      source: ITU,
      basis: "computed",
      inputs: {},
      expect: {
        frequencySpacing: 99.82683304890739, firstChannel: 1547.2050489438434, lastChannel: 1552.8050672182007,
        totalBandwidth: 5.6000182743574225, isolation: 48.16479930623699,
      },
      tolerance: 1e-8,
    },
    {
      // 1.0 nm at 1550 nm is 124.78 GHz, on no ITU grid (not 100 or 200 GHz, not 20 nm), so the channels are equally spaced in wavelength:
      // 8 channels at 1550 + k·1.0 nm, k = ±0.5 … ±3.5: 1546.5 … 1553.5 nm, span 7 nm. Δν = c·1e-9/(1.55e-6)² = 124.783541 GHz.
      // Isolation with FWHM 0.5 nm: 12.041200·(1.0/0.5)² = 48.164799 dB.
      source: ITU,
      basis: "computed",
      inputs: { channelSpacing: 1, passbandWidth: 0.5 },
      expect: { frequencySpacing: 124.78354131113426, firstChannel: 1546.5, lastChannel: 1553.5, totalBandwidth: 7, isolation: 48.16479930623699 },
      tolerance: 1e-8,
    },
  ],
});
