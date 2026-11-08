import {
  d1e2From, gaussianDiameters, powerInsideDiameter, relativeIntensity, type DiameterKind,
} from "../../physics/laser-safety/beam-diameter";
import { defineSchema } from "../types";

const SOURCE = "Saleh & Teich (2019). Fundamentals of Photonics, 3rd ed., Wiley, ch. 3.1 (Gaussian beam, I(ρ) ∝ exp(−2ρ²/W²)); " +
  "diameters at I₀/e², I₀/e and I₀/2, power inside a circle 1 − exp(−2r²/w²).";

export default defineSchema({
  href: "/laser-safety/beam-diameter-conversion",
  inputs: [
    { key: "inputValue", label: "Diameter", unit: "mm", toSI: 1e-3, siUnit: "m", default: 1, min: 0.001, max: 10000 },
  ],
  choices: [
    {
      key: "inputType",
      label: "Diameter type",
      options: [
        { value: "1e2", label: "1/e² diameter" },
        { value: "1e", label: "1/e diameter" },
        { value: "fwhm", label: "FWHM" },
      ],
      default: "1e2",
    },
  ],
  outputs: [
    { key: "d1e2", label: "1/e² diameter", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "d1e", label: "1/e diameter", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "fwhm", label: "FWHM", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "w", label: "Beam radius w (1/e²)", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "i1e2", label: "Relative intensity at the 1/e² diameter edge", unit: "", toSI: 1, siUnit: "" },
    { key: "i1e", label: "Relative intensity at the 1/e diameter edge", unit: "", toSI: 1, siUnit: "" },
    { key: "iFwhm", label: "Relative intensity at the FWHM edge", unit: "", toSI: 1, siUnit: "" },
    { key: "p1e2", label: "Power inside the 1/e² diameter", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "p1e", label: "Power inside the 1/e diameter", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "pFwhm", label: "Power inside the FWHM", unit: "%", toSI: 0.01, siUnit: "" },
  ],
  compute({ inputValue, inputType }) {
    // As the page: unknown types fall back to 1/e².
    const kind: DiameterKind = inputType === "1e" || inputType === "fwhm" ? inputType : "1e2";
    const d = gaussianDiameters(d1e2From(kind, inputValue));
    return {
      values: {
        d1e2: d.d1e2, d1e: d.d1e, fwhm: d.fwhm, w: d.w,
        i1e2: relativeIntensity(d.d1e2 / 2, d.w),
        i1e: relativeIntensity(d.d1e / 2, d.w),
        iFwhm: relativeIntensity(d.fwhm / 2, d.w),
        p1e2: powerInsideDiameter(d.d1e2, d.w),
        p1e: powerInsideDiameter(d.d1e, d.w),
        pFwhm: powerInsideDiameter(d.fwhm, d.w),
      },
    };
  },
  checks: [
    {
      // d₂ = 1 mm, w = 0.5 mm: d₁ = 1/√2 = 0.7071067812; FWHM = √(ln2/2) = 0.5887050113 mm. Intensity at r = d/2 = w is
      // e⁻² = 0.1353352832, at r = w/√2 it is e⁻¹ = 0.3678794412, at the FWHM edge ½. Power 1 − exp(−d²/(2w²)):
      // 1 − e⁻² = 86.46647168 %, 1 − e⁻¹ = 63.21205588 %, 50 %.
      source: SOURCE,
      basis: "computed",
      inputs: { inputValue: 1, inputType: "1e2" },
      expect: {
        d1e: 0.7071067812, fwhm: 0.5887050113, w: 0.5, i1e2: 0.1353352832, i1e: 0.3678794412, iFwhm: 0.5,
        p1e2: 86.46647168, p1e: 63.21205588, pFwhm: 50,
      },
      tolerance: 1e-8,
    },
    {
      // FWHM input of 1 mm: d₂ = 1/√(ln2/2) = 1.698643601 mm, w = 0.8493218003 mm, d₁ = d₂/√2 = 1.201122409 mm.
      source: SOURCE,
      basis: "computed",
      inputs: { inputValue: 1, inputType: "fwhm" },
      expect: { d1e2: 1.698643601, w: 0.8493218003, d1e: 1.201122409, iFwhm: 0.5, p1e: 63.21205588 },
      tolerance: 1e-8,
    },
  ],
});
