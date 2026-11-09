import { fabryPerotSummary } from "../../physics/thin-film/interference";
import { defineSchema } from "../types";

const NM = 1e-9;

/** The nearest transmission peak of an ideal etalon (lossless mirrors of reflectance R, no mirror phase), normal incidence. */
export default defineSchema({
  href: "/thin-film/fabry-perot-filter",
  inputs: [
    { key: "nCavity", label: "Cavity index n", unit: "", toSI: 1, siUnit: "", default: 1.5, min: 1, max: 10 },
    { key: "spacing", label: "Cavity spacing d", unit: "nm", toSI: NM, siUnit: "m", default: 500, min: 1, max: 1e6 },
    { key: "reflectance", label: "Mirror reflectance R", unit: "", toSI: 1, siUnit: "", default: 0.8, min: 0, max: 0.999 },
    { key: "wlCenter", label: "Wavelength of interest", unit: "nm", toSI: NM, siUnit: "m", default: 550, min: 1, max: 1e6 },
  ],
  outputs: [
    { key: "peakWavelength", label: "Nearest transmission peak λ_m = 2nd/m", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "order", label: "Interference order m", unit: "", toSI: 1, siUnit: "" },
    { key: "fsrFrequency", label: "Free spectral range c/(2nd)", unit: "THz", toSI: 1e12, siUnit: "Hz" },
    { key: "fsrWavelength", label: "Free spectral range λ²/(2nd) (first order)", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "upperPeak", label: "Next peak up, λ_(m+1)", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "lowerPeak", label: "Next peak down, λ_(m−1)", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "fwhm", label: "FWHM at the peak", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "finesse", label: "Reflecting finesse π√F/2", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ nCavity, spacing, reflectance, wlCenter }) {
    const s = fabryPerotSummary(nCavity, spacing, reflectance, wlCenter);
    const warnings: string[] = [];
    if (!Number.isFinite(s.peak.fwhm)) warnings.push("F < 1: the transmittance never falls to half its peak, so there is no FWHM.");
    if (s.peak.order === 1) warnings.push("First order: there is no lower neighbouring peak.");
    return {
      values: {
        peakWavelength: s.peak.wavelength,
        order: s.peak.order,
        fsrFrequency: s.fsrHz,
        fsrWavelength: s.peak.fsr,
        upperPeak: s.upper,
        lowerPeak: s.lower,
        fwhm: s.peak.fwhm,
        finesse: s.finesse,
      },
      warnings,
    };
  },
  checks: [
    {
      // Defaults: nd = 1.5 × 500 nm = 750 nm; 2nd/λ = 1500/550 = 2.727, so m = 3 and λ_3 = 1500/3 = 500 nm, the
      // neighbours 1500/4 = 375 nm and 1500/2 = 750 nm, FSR = λ_3/3 = 166.6667 nm and c/(2nd) = 299792458/1.5e-6 Hz
      // = 199.861639 THz. F = 4R/(1 − R)² = 3.2/0.04 = 80 and ℱ = π√80/2 = 14.049629462; w = 4 asin(1/√80) and FWHM = 4πnd[1/(2π·3 − w/2) − 1/(2π·3 + w/2)] = 11.889243212 nm.
      source: "Born M., Wolf E. (1999). Principles of Optics, 7th ed., Cambridge University Press, §7.6.1 (Airy formulae: F = 4ρ/(1 − ρ)², finesse π√F/2).",
      basis: "computed",
      inputs: {},
      expect: { peakWavelength: 500, order: 3, upperPeak: 375, lowerPeak: 750, fsrWavelength: 500 / 3, fsrFrequency: 199.861638667, finesse: 14.049629462, fwhm: 11.889243212 },
      tolerance: 1e-8,
    },
  ],
});
