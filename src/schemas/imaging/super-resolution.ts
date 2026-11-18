import { superResolutionSummary } from "../../physics/imaging/super-resolution-summary";
import { defineSchema } from "../types";

const HARKE = "Harke B., Keller J., Ullal C. K., Westphal V., Schönle A., Hell S. W. (2008). Resolution scaling in STED " +
  "microscopy. Opt. Express 16, 4154–4162, eqs. 3, 4, 7 and 8 with d_c = λ/(2NA) and a = 2NA/λ_STED " +
  "(a = 2NA/λ_STED is chosen here so the ζ ≫ 1 limit is λ_STED/(2NA√ζ); Harke's computed doughnut gives ≈0.94×). https://doi.org/10.1364/OE.16.004154";
const ZHANG = "Zhang B., Zerubia J., Olivo-Marin J.-C. (2007). Gaussian approximations of fluorescence microscope point-spread " +
  "function models. Appl. Opt. 46, 1819–1829 (Gaussian fit of the Airy pattern, σ = 0.21 λ/NA), https://doi.org/10.1364/AO.46.001819; " +
  "the shot-noise localisation limit σ/√N is from Thompson R. E., Larson D. R., Webb W. W. (2002). Precise nanometer localization analysis " +
  "for individual fluorescent probes. Biophys. J. 82, 2775–2783, https://doi.org/10.1016/S0006-3495(02)75618-X.";
const WILHELM = "Born M., Wolf E. (1999). Principles of Optics, 7th ed., §8.8 (axial sinc² PSF); Wilhelm S., Gröbler B., Gluch M., " +
  "Heinz H. (2003). Confocal Laser Scanning Microscopy: Principles (Carl Zeiss), axial FWHM 0.886 λ/(n − √(n² − NA²)). " +
  "Wilhelm prints 0.88; 0.886 = 2·1.39156/π is the sinc² half width (Born & Wolf §8.8).";

const noAxial = "The axial FWHM needs NA below the refractive index n; at NA ≥ n the objective is not possible with that medium.";

export default defineSchema({
  href: "/imaging/super-resolution",
  inputs: [
    { key: "na", label: "NA", unit: "", toSI: 1, siUnit: "", default: 1.4, min: 0.1, max: 1.7 },
    { key: "wavelength", label: "Wavelength λ (emission for PALM, excitation for STED)", unit: "nm", toSI: 1e-9, siUnit: "m", default: 580, min: 300, max: 1000 },
    { key: "n", label: "Refractive index (n)", unit: "", toSI: 1, siUnit: "", default: 1.52, min: 1, max: 1.8 },
    { key: "stedDepletion", label: "STED I_STED / I_sat", unit: "", toSI: 1, siUnit: "", default: 30, min: 0, max: 200 },
    { key: "stedWavelength", label: "STED depletion wavelength λ_STED", unit: "nm", toSI: 1e-9, siUnit: "m", default: 660, min: 300, max: 1200 },
    { key: "palmPhotons", label: "PALM photons detected", unit: "", toSI: 1, siUnit: "", default: 5000, min: 1, max: 1000000 },
  ],
  outputs: [
    { key: "abbe", label: "Diffraction limit, lateral FWHM λ/2NA", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "rayleigh", label: "Rayleigh distance 0.61λ/NA", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "axial", label: "Diffraction limit, axial FWHM", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "sted", label: "STED lateral FWHM (2D)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "palm", label: "PALM/STORM precision σ", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "palmFwhm", label: "PALM/STORM FWHM (2.35σ)", unit: "nm", toSI: 1e-9, siUnit: "m" },
  ],
  compute({ na, wavelength, n, stedDepletion, stedWavelength, palmPhotons }) {
    const r = superResolutionSummary(wavelength, na, n, stedDepletion, stedWavelength, palmPhotons);
    return {
      values: { abbe: r.abbe, rayleigh: r.rayleigh, axial: r.axial, sted: r.sted, palm: r.palm, palmFwhm: r.palmFwhm },
      warnings: na < n ? [] : [noAxial],
      reasons: { axial: noAxial },
    };
  },
  checks: [
    {
      // λ = 580 nm, NA 1.4, I/I_sat = 30, λ_STED = 660 nm: d_c = 580/2.8 = 207.1428571 nm, a = 2.8/660 nm = 0.004242424 nm⁻¹,
      // d = d_c/√(1 + d_c² a² ζ) = 207.1428571/√(1 + 30 · (207.1428571 · 0.004242424)²) = 42.13560267 nm (eq. 7).
      source: HARKE,
      basis: "computed",
      inputs: { na: 1.4, wavelength: 580, stedDepletion: 30, stedWavelength: 660 },
      expect: { abbe: 207.1428571, sted: 42.13560267 },
      tolerance: 1e-8,
    },
    {
      // σ = 0.21 · 580 nm/(1.4 · √5000) = 1.230365799 nm; FWHM = 2√(2 ln 2) σ = 2.897290047 nm.
      source: ZHANG,
      basis: "computed",
      inputs: { na: 1.4, wavelength: 580, palmPhotons: 5000 },
      expect: { palm: 1.230365799, palmFwhm: 2.897290047 },
      tolerance: 1e-8,
    },
    {
      // λ = 488 nm, NA 1.2, n = 1.33: n − √(n² − NA²) = 1.33 − √(1.7689 − 1.44) = 0.7565; 0.886 · 488 nm/0.7565 = 571.5358610 nm.
      source: WILHELM,
      basis: "computed",
      inputs: { na: 1.2, wavelength: 488, n: 1.33 },
      expect: { axial: 571.535861 },
      tolerance: 1e-8,
    },
  ],
});
