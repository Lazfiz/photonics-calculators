import { psfSummary } from "../../physics/imaging/psf-calculator";
import { defineSchema } from "../types";

const BORN_WOLF = "Born M., Wolf E. (2019). Principles of Optics, 7th ed., Cambridge University Press, §8.5.2 (Airy pattern: " +
  "first zero at v = j₁,₁ = 3.8317, v = 2π NA r/λ) and §8.8 (paraxial intensity on the axis near focus, [sin(u/4)/(u/4)]²); " +
  "v½ = 1.6163 and x½ = 1.3916 computed from the Airy and paraxial axial intensity (§8.5.2, §8.8); high-angle axial form " +
  "λ/(n − √(n² − NA²)) as in Wilhelm S., Gröbler B., Gluch M., Heinz H. (2003), Confocal Laser Scanning Microscopy: Principles, Carl Zeiss. " +
  "https://doi.org/10.1017/9781108769914";

export default defineSchema({
  href: "/imaging/psf-calculator",
  inputs: [
    { key: "wavelength", label: "Wavelength (vacuum)", unit: "nm", toSI: 1e-9, siUnit: "m", default: 550, min: 300, max: 2000 },
    { key: "na", label: "Numerical aperture", unit: "", toSI: 1, siUnit: "", default: 1.4, min: 0.1, max: 1.7 },
    { key: "refractiveIndex", label: "Refractive index of the medium", unit: "", toSI: 1, siUnit: "", default: 1.518, min: 1, max: 1.8 },
    { key: "oversampling", label: "2D plot half-width (chart only)", unit: "Airy radii", toSI: 1, siUnit: "", default: 4, min: 1, max: 10 },
  ],
  outputs: [
    { key: "airyRadius", label: "Airy radius (first zero)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "lateralFwhm", label: "Lateral FWHM", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "axialFwhm", label: "Axial FWHM", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "axialZero", label: "First axial zero", unit: "nm", toSI: 1e-9, siUnit: "m" },
  ],
  validate({ na, refractiveIndex }) {
    return na < refractiveIndex
      ? undefined
      : `NA ${na} is not possible in a medium of n = ${refractiveIndex}: NA = n sin α must stay below n.`;
  },
  compute({ wavelength, na, refractiveIndex }) {
    const s = psfSummary(wavelength, refractiveIndex, na);
    return {
      values: { airyRadius: s.airyRadius, lateralFwhm: s.lateralFwhm, axialFwhm: s.axialFwhm, axialZero: s.axialZero },
    };
  },
  checks: [
    {
      // λ = 500 nm, NA = 0.4 (air): r = j₁,₁/(2π) · λ/NA = 0.609835·1250 nm = 762.2937 nm; FWHM = 1.616340/π · 1250 nm = 643.1212 nm.
      // j₁,₁ and v½ re-solved by bisection of J₁(v) = 0 and [2J₁(v)/v]² = ½ with a series J₁.
      source: BORN_WOLF,
      basis: "computed",
      inputs: { wavelength: 500, na: 0.4 },
      expect: { airyRadius: 762.29368, lateralFwhm: 643.12123 },
      tolerance: 1e-8,
    },
    {
      // λ = 550 nm, n = 1.518, NA = 1.4: n − √(n² − NA²) = 1.518 − √0.344324 = 1.518 − 0.5867913 = 0.9312087; first zero λ/that = 590.6302 nm,
      // FWHM = 2·1.391557/π · 590.6302 nm = 523.2351 nm (sinc²(x½) = ½ re-solved by bisection).
      source: BORN_WOLF,
      basis: "computed",
      inputs: { wavelength: 550, na: 1.4, refractiveIndex: 1.518 },
      expect: { axialZero: 590.63020462, axialFwhm: 523.23513 },
      tolerance: 1e-8,
    },
  ],
});
