import { confocalPinholeSummary, WILHELM_MIN_PINHOLE_AU } from "../../physics/imaging/confocal-pin-hole";
import { defineSchema } from "../types";

const WILHELM = "Wilhelm R., Gröbler B., Gluch M., Heinz H. (2003). Confocal Laser Scanning Microscopy: Principles. " +
  "Carl Zeiss (geometric optical-section formula for pinholes of at least 1 Airy unit; its Airy unit 1.22 λ/NA, the diameter of the first dark ring, is the convention used for the pinhole size here).";
const BORN_WOLF = "Born M., Wolf E. (2019). Principles of Optics, 7th ed., Cambridge University Press, https://doi.org/10.1017/9781108769914, §8.5.2 (Airy pattern " +
  "and its encircled energy 1 − J₀²(v) − J₁²(v)); first zero of J₁ j₁,₁ = 3.8317 from Abramowitz M., Stegun I. A. (1964), " +
  "Handbook of Mathematical Functions, Table 9.5.";
const NOT_GEOMETRIC = `Wilhelm's geometric formula holds only for pinholes of ${WILHELM_MIN_PINHOLE_AU} Airy unit or more.`;

export default defineSchema({
  href: "/imaging/confocal-pin-hole",
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 488, min: 300, max: 2000 },
    { key: "na", label: "NA", unit: "", toSI: 1, siUnit: "", default: 1.4, min: 0.1, max: 1.7 },
    { key: "magnification", label: "Magnification to the pinhole", unit: "", toSI: 1, siUnit: "", default: 60, min: 1, max: 500 },
    { key: "nImmersion", label: "Immersion RI (n)", unit: "", toSI: 1, siUnit: "", default: 1.515, min: 1, max: 1.8 },
    { key: "pinholeAU", label: "Pinhole", unit: "AU", toSI: 1, siUnit: "", default: 1, min: 0, max: 5 },
  ],
  outputs: [
    { key: "airyObject", label: "1 Airy unit at the sample, 1.22 λ/NA", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "airyPinhole", label: "1 Airy unit at the pinhole", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "pinholeDiameter", label: "Pinhole diameter", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "throughput", label: "Throughput of an in-focus point", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "lateral", label: "Lateral FWHM", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "section", label: "Optical section FWHM", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "wilhelm", label: "Wilhelm's geometric section FWHM", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "wilhelmExcess", label: "Wilhelm's value above the section FWHM", unit: "%", toSI: 0.01, siUnit: "" },
  ],
  validate({ na, nImmersion }) {
    if (!(na < nImmersion)) return `NA ${na} is not possible in a medium of n = ${nImmersion}: NA = n sin α must stay below n.`;
    return undefined;
  },
  compute({ wavelength, na, magnification, nImmersion, pinholeAU }) {
    const s = confocalPinholeSummary(wavelength, na, magnification, nImmersion, pinholeAU);
    const geometric = pinholeAU >= WILHELM_MIN_PINHOLE_AU;
    return {
      values: {
        airyObject: s.airyObject,
        airyPinhole: s.airyPinhole,
        pinholeDiameter: s.pinholeDiameter,
        throughput: s.throughput,
        lateral: s.lateral,
        section: s.section,
        wilhelm: s.wilhelm,
        wilhelmExcess: s.wilhelmExcess,
      },
      warnings: geometric ? [] : [NOT_GEOMETRIC],
      reasons: { wilhelm: NOT_GEOMETRIC, wilhelmExcess: NOT_GEOMETRIC },
    };
  },
  checks: [
    {
      // 488 nm, NA 1.4: 1 AU = 1.22 · 488/1.4 = 425.257142857 nm; × M 60 = 25.5154285714 µm at the pinhole; 2 AU = 51.0308571429 µm.
      source: WILHELM,
      basis: "computed",
      inputs: { wavelength: 488, na: 1.4, magnification: 60, pinholeAU: 2 },
      expect: { airyObject: 425.25714285714287, airyPinhole: 25.515428571428576, pinholeDiameter: 51.03085714285715 },
      tolerance: 1e-8,
    },
    {
      // v = j₁,₁ · 2 AU = 7.66341194; 1 − J₀²(v) − J₁²(v) = 0.91180785559 (J₀, J₁ from their power series).
      source: BORN_WOLF,
      basis: "computed",
      inputs: { pinholeAU: 2 },
      expect: { throughput: 91.180785559358 },
      tolerance: 1e-8,
    },
    {
      // 488 nm, NA 1.4, n 1.515, 2 AU: Δ = n − √(n² − NA²); diffraction term 0.886 λ/Δ (0.886 = 2·1.39156/π, in place of Wilhelm's printed 0.88),
      // geometric term √2 n PH/NA with PH = 2 · 425.257 nm; FWHM = hypot of the two = 1381.1465168616 nm.
      source: WILHELM,
      basis: "computed",
      inputs: { wavelength: 488, na: 1.4, nImmersion: 1.515, pinholeAU: 2 },
      expect: { wilhelm: 1381.1465168615516 },
      tolerance: 1e-8,
    },
  ],
});
