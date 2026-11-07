import { airyFirstZeroRadius, airyFwhm } from "../../physics/imaging/diffraction-psf";
import { abbeLateralFwhm } from "../../physics/imaging/super-resolution";
import { defineSchema } from "../types";

export default defineSchema({
  href: "/imaging/airy-disk",
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 550, min: 300, max: 2000 },
    { key: "na", label: "Numerical aperture", unit: "", toSI: 1, siUnit: "", default: 0.95, min: 0.1, max: 1.5 },
  ],
  outputs: [
    { key: "airyRadius", label: "Airy radius (first dark ring)", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "airyDiameter", label: "Airy disk diameter (1 AU)", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "fwhm", label: "Intensity FWHM", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "abbeLimit", label: "Abbe limit λ/2NA", unit: "nm", toSI: 1e-9, siUnit: "m" },
  ],
  compute({ wavelength, na }) {
    const r0 = airyFirstZeroRadius(wavelength, na);
    return {
      values: {
        airyRadius: r0,
        airyDiameter: 2 * r0,
        fwhm: airyFwhm(wavelength, na),
        abbeLimit: abbeLateralFwhm(wavelength, na),
      },
    };
  },
  checks: [
    {
      // The first dark ring at r = 0.610 λ/NA: with λ = 1 µm and NA = 1 the radius is the printed coefficient.
      source: "Born M., Wolf E. (2019). Principles of Optics, 7th ed., §8.5.2. Cambridge University Press.",
      basis: "printed",
      inputs: { wavelength: 1000, na: 1 },
      expect: { airyRadius: 0.610 },
      tolerance: 1e-3,
    },
    {
      // r = j₁,₁ λ/(2π NA) with j₁,₁ = 3.8317060; half maximum of [2J₁(v)/v]² at v = 1.6163399, FWHM = 2v λ/(2π NA).
      source: "Born M., Wolf E. (2019). Principles of Optics, 7th ed., §8.5.2; Abramowitz M., Stegun I. A. (1964). " +
        "Handbook of Mathematical Functions, Table 9.5 (zeros of J₁).",
      basis: "computed",
      inputs: { wavelength: 550, na: 0.95 },
      expect: { airyRadius: 0.3530623369, fwhm: 297.8666755, abbeLimit: 289.4736842 },
      tolerance: 1e-8,
    },
  ],
});
