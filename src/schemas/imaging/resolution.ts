import { CUSTOM_MEDIUM_INDEX, IMMERSION_MEDIA, immersionIndex, resolutionSummary } from "../../physics/imaging/resolution";
import { defineSchema } from "../types";

const BORN_WOLF = "Born M., Wolf E. (2019). Principles of Optics, 7th ed., Cambridge University Press, §8.5.2 (Airy FWHM 0.514 λ/NA), " +
  "§8.6.2 (Rayleigh resolving power 0.61 λ/NA) and §8.8 (on-axis sinc²); Abbe E. (1873), Arch. Mikrosk. Anat. 9, 413–468, https://doi.org/10.1007/BF02956173 (grating period λ/(2NA)); " +
  "axial form λ/(n − √(n² − NA²)) as in Wilhelm S., Gröbler B., Gluch M., Heinz H. (2003), Confocal Laser Scanning Microscopy: Principles (Carl Zeiss), " +
  "coefficient 0.88 there; 0.886 = 2·1.391557/π (Born & Wolf §8.8). https://doi.org/10.1017/9781108769914";

export default defineSchema({
  href: "/imaging/resolution",
  inputs: [
    { key: "na", label: "Numerical aperture (NA)", unit: "", toSI: 1, siUnit: "", default: 1.4, min: 0.01, max: 1.8 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 550, min: 200, max: 2000 },
    {
      key: "mediumIdx",
      label: `Immersion medium (0 ${IMMERSION_MEDIA[0].label}, 1 ${IMMERSION_MEDIA[1].label}, 2 ${IMMERSION_MEDIA[2].label}, 3 ${IMMERSION_MEDIA[3].label})`,
      unit: "", toSI: 1, siUnit: "", default: 2, min: 0, max: CUSTOM_MEDIUM_INDEX,
    },
    { key: "customN", label: "Custom refractive index (medium 3 only)", unit: "", toSI: 1, siUnit: "", default: 1.5, min: 1, max: 2 },
  ],
  outputs: [
    { key: "n", label: "Refractive index n", unit: "", toSI: 1, siUnit: "" },
    { key: "abbe", label: "Abbe limit λ/(2NA)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "rayleigh", label: "Rayleigh criterion 0.61λ/NA", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "fwhm", label: "Airy FWHM 0.514λ/NA", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "axial", label: "Axial FWHM 0.886λ/(n − √(n² − NA²))", unit: "nm", toSI: 1e-9, siUnit: "m" },
  ],
  validate({ na, mediumIdx, customN }) {
    const n = immersionIndex(mediumIdx, customN);
    return na < n ? undefined : `NA ${na} is not possible in a medium of n = ${n}: NA = n sin α < n.`;
  },
  compute({ na, wavelength, mediumIdx, customN }) {
    const n = immersionIndex(mediumIdx, customN);
    return { values: { n, ...resolutionSummary(wavelength, n, na) } };
  },
  checks: [
    {
      // Air (n = 1), λ = 500 nm, NA = 0.8: Abbe 500/1.6 = 312.5 nm; Rayleigh 0.61·500/0.8 = 381.25 nm;
      // Airy FWHM 1.616340/π · 625 nm = 321.5606 nm (v½ re-solved by bisection); axial 0.88589·500/(1 − √(1 − 0.64)) = 442.945/0.4 = 1107.37 nm.
      source: BORN_WOLF,
      basis: "computed",
      inputs: { na: 0.8, wavelength: 500, mediumIdx: 0 },
      expect: { n: 1, abbe: 312.5, rayleigh: 381.25, fwhm: 321.5606156, axial: 1107.3661767 },
      tolerance: 1e-8,
    },
    {
      // Oil (n = 1.518), λ = 550 nm, NA = 1.4: Abbe 550/2.8 = 196.428571 nm; Rayleigh 0.61·550/1.4 = 239.642857 nm;
      // axial 0.88589·550/(1.518 − √0.344324) = 487.2395/(1.518 − 0.5867913) = 487.2395/0.9312087 = 523.2351 nm.
      source: BORN_WOLF,
      basis: "computed",
      inputs: { na: 1.4, wavelength: 550, mediumIdx: 2 },
      expect: { n: 1.518, abbe: 196.42857143, rayleigh: 239.64285714, axial: 523.23512924 },
      tolerance: 1e-8,
    },
    {
      // Custom n = 1.6, λ = 600 nm, NA = 1.2: Abbe 250 nm; Rayleigh 0.61·600/1.2 = 305 nm;
      // axial 0.88589·600/(1.6 − √(2.56 − 1.44)) = 531.534/0.541699... = 981.2374 nm.
      source: BORN_WOLF,
      basis: "computed",
      inputs: { na: 1.2, wavelength: 600, mediumIdx: 3, customN: 1.6 },
      expect: { n: 1.6, abbe: 250, rayleigh: 305, axial: 981.23736277 },
      tolerance: 1e-8,
    },
  ],
});
