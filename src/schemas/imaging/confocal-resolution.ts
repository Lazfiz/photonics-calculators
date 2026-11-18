import { confocalResolutionSummary } from "../../physics/imaging/confocal-resolution";
import { defineSchema } from "../types";

const BORN_WOLF = "Born M., Wolf E. (2019). Principles of Optics, 7th ed., Cambridge University Press, https://doi.org/10.1017/9781108769914, §8.5.2 (Airy pattern) " +
  "and §8.8 (axial intensity sinc²(u/4) of the defocused PSF); the half maxima follow from solving them (v½ = 1.61634, x½ = 1.39156).";

const WILHELM = "Wilhelm R., Gröbler B., Gluch M., Heinz H. (2003). Confocal Laser Scanning Microscopy: Principles. " +
  "Carl Zeiss (geometric optical-section formula for pinholes of at least 1 Airy unit; its Airy unit 1.22 λ/NA, the diameter of the first dark ring, is the convention used for the pinhole size here).";

export default defineSchema({
  href: "/imaging/confocal-resolution",
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 550, min: 300, max: 2000 },
    { key: "na", label: "Numerical Aperture", unit: "", toSI: 1, siUnit: "", default: 1.4, min: 0.1, max: 1.7 },
    { key: "pinholeAU", label: "Pinhole", unit: "AU", toSI: 1, siUnit: "", default: 1, min: 0, max: 5 },
    { key: "refractiveIndex", label: "Refractive Index", unit: "", toSI: 1, siUnit: "", default: 1.518, min: 1, max: 1.8 },
    { key: "magnification", label: "Magnification", unit: "", toSI: 1, siUnit: "", default: 60, min: 1, max: 500 },
  ],
  outputs: [
    { key: "confocalLateral", label: "Confocal lateral FWHM", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "widefieldLateral", label: "Widefield lateral FWHM", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "confocalAxial", label: "Confocal axial FWHM (point)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "widefieldAxial", label: "Widefield axial FWHM", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "section", label: "Optical section FWHM (plane)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "pinholeDiameter", label: "Pinhole diameter", unit: "µm", toSI: 1e-6, siUnit: "m" },
  ],
  validate({ na, refractiveIndex }) {
    if (!(na < refractiveIndex)) return `NA ${na} is not possible in a medium of n = ${refractiveIndex}: NA = n sin α must stay below n.`;
    return undefined;
  },
  compute({ wavelength, na, pinholeAU, refractiveIndex, magnification }) {
    const s = confocalResolutionSummary(wavelength, na, pinholeAU, refractiveIndex, magnification);
    return { values: { ...s } };
  },
  checks: [
    {
      // 600 nm, NA 1.2: widefield lateral = (v½/π) λ/NA with v½ = 1.6163399483 (root of [2J₁(v)/v]² = ½, bisection) = 257.2484925 nm.
      source: BORN_WOLF,
      basis: "computed",
      inputs: { wavelength: 600, na: 1.2, pinholeAU: 1.5, refractiveIndex: 1.33, magnification: 100 },
      expect: { widefieldLateral: 257.24849249054705 },
      tolerance: 1e-8,
    },
    {
      // Same case: widefield axial = (2 x½/π) λ/(n − √(n² − NA²)), x½ = 1.3915573783 (root of sin²x/x² = ½) = 702.6231150 nm.
      source: BORN_WOLF,
      basis: "computed",
      inputs: { wavelength: 600, na: 1.2, pinholeAU: 1.5, refractiveIndex: 1.33, magnification: 100 },
      expect: { widefieldAxial: 702.6231150456575 },
      tolerance: 1e-8,
    },
    {
      // Pinhole 1.5 AU · 1.22 · 600/1.2 nm · M 100 = 91.5 µm.
      source: WILHELM,
      basis: "computed",
      inputs: { wavelength: 600, na: 1.2, pinholeAU: 1.5, refractiveIndex: 1.33, magnification: 100 },
      expect: { pinholeDiameter: 91.5 },
      tolerance: 1e-8,
    },
  ],
});
