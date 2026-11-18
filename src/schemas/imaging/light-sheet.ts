import { airyFwhm } from "../../physics/imaging/diffraction-psf";
import {
  effectiveAxialFwhm, gaussianSheetDivergence, gaussianSheetFwhm, gaussianSheetRayleighRange, gaussianSheetWaist,
} from "../../physics/imaging/light-sheet";
import { axialPsfFwhm } from "../../physics/imaging/optical-sectioning-thickness";
import { defineSchema } from "../types";

const ENGELBRECHT = "Engelbrecht C. J., Stelzer E. H. K. (2006). Resolution enhancement in a light-sheet-based microscope (SPIM). " +
  "Optics Letters 31, 1477–1479. https://doi.org/10.1364/OL.31.001477 (axial profile = sheet × detection PSF, approximated here as a product of Gaussians of the FWHMs).";
const SIEGMAN = "Siegman A. E. (1986). Lasers. University Science Books, Gaussian beam waist w₀ = λ/(π NA) and Rayleigh range z_R = π n w₀²/λ (ch. 17). ISBN 0-935702-11-3.";
const BORN_WOLF = "Born M., Wolf E. (2019). Principles of Optics, 7th ed., Cambridge University Press, https://doi.org/10.1017/9781108769914, " +
  "§8.5.2 (Airy pattern, half maximum at v = 1.61634) and §8.8 paraxial sinc²(u/4); the high-NA scale n − √(n² − NA²) is as in Wilhelm et al. (FWHM 0.886 λ/(n − √(n² − NA²))).";

export default defineSchema({
  href: "/imaging/light-sheet",
  inputs: [
    { key: "naIll", label: "Illumination NA (sheet)", unit: "", toSI: 1, siUnit: "", default: 0.1, min: 0.01, max: 0.3 },
    { key: "naDet", label: "Detection NA", unit: "", toSI: 1, siUnit: "", default: 0.8, min: 0.1, max: 1.7 },
    { key: "wavelength", label: "Excitation wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 488, min: 300, max: 1500 },
    { key: "emission", label: "Emission wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 510, min: 300, max: 1500 },
    { key: "n", label: "Sample medium index (n)", unit: "", toSI: 1, siUnit: "", default: 1.33, min: 1, max: 1.6 },
  ],
  outputs: [
    { key: "thickness", label: "Sheet thickness 2w₀ (1/e²)", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "sheetFwhm", label: "Sheet FWHM at the waist", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "rayleighRange", label: "Rayleigh range z_R", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "fieldOfView", label: "Field of view 2z_R", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "divergence", label: "Divergence half-angle NA/n", unit: "mrad", toSI: 1e-3, siUnit: "rad" },
    { key: "lateralFwhm", label: "Lateral FWHM (detection)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "detectionAxialFwhm", label: "Detection axial FWHM", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "effectiveAxialFwhm", label: "Effective axial FWHM (waist)", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "effectiveAxialFwhmEdge", label: "Effective axial FWHM (at ±z_R)", unit: "µm", toSI: 1e-6, siUnit: "m" },
  ],
  validate({ naIll, naDet, n }) {
    const na = Math.max(naDet, naIll);
    if (!(naDet < n && naIll < n)) return `NA ${na} is not possible in a medium of n = ${n}: NA = n sin α must stay below n.`;
    return undefined;
  },
  compute({ naIll, naDet, wavelength, emission, n }) {
    const w0 = gaussianSheetWaist(wavelength, naIll);
    const sheetFwhm = gaussianSheetFwhm(wavelength, naIll);
    const zR = gaussianSheetRayleighRange(wavelength, naIll, n);
    const detAxial = axialPsfFwhm(emission, n, naDet);
    return {
      values: {
        thickness: 2 * w0,
        sheetFwhm,
        rayleighRange: zR,
        fieldOfView: 2 * zR,
        divergence: gaussianSheetDivergence(naIll, n),
        lateralFwhm: airyFwhm(emission, naDet),
        detectionAxialFwhm: detAxial,
        effectiveAxialFwhm: effectiveAxialFwhm(sheetFwhm, detAxial),
        effectiveAxialFwhmEdge: effectiveAxialFwhm(Math.SQRT2 * sheetFwhm, detAxial),
      },
    };
  },
  checks: [
    {
      // λ = 561 nm, NA_ill 0.05, n 1.45: w₀ = λ/(π NA) = 0.561/0.15707963 = 3.571437 µm, 2w₀ = 7.142874 µm,
      // FWHM = √(2 ln 2) w₀ = 1.177410 · 3.571437 = 4.205046 µm, z_R = π n w₀²/λ = π · 1.45 · 12.755 / 0.561 = 103.571671 µm,
      // 2z_R = 207.143342 µm, divergence NA/n = 0.05/1.45 = 34.482759 mrad.
      source: SIEGMAN,
      basis: "computed",
      inputs: { naIll: 0.05, naDet: 0.8, wavelength: 561, emission: 510, n: 1.45 },
      expect: { thickness: 7.142873845964263, sheetFwhm: 4.205045627900989, rayleighRange: 103.5716707664818, fieldOfView: 207.1433415329636, divergence: 34.48275862068965 },
      tolerance: 1e-8,
    },
    {
      // λ_em = 510 nm, NA_det 0.8, n 1.33: n − √(n² − NA²) = 0.2675; FWHM_det = 0.886 λ/(n − √(n² − NA²)) = 1.689178 µm;
      // 1/FWHM_eff² = 1/1.828933² + 1/1.689178² → 1.240898 µm; at ±z_R the sheet is √2 thicker → 1.414290 µm;
      // lateral Airy FWHM = (1.6163399483/π) λ/NA = 327.9918 nm (v½ root of [2J₁(v)/v]² = ½ by bisection).
      source: BORN_WOLF,
      basis: "computed",
      inputs: { naIll: 0.1, naDet: 0.8, wavelength: 488, emission: 510, n: 1.33 },
      expect: { detectionAxialFwhm: 1.689177689059626, lateralFwhm: 327.99182792544735 },
      tolerance: 1e-8,
    },
    {
      // Product of the two Gaussian profiles: 1/FWHM_eff² = 1/FWHM_sheet² + 1/FWHM_det² (sheet 1.828933 µm, detection 1.689178 µm).
      source: ENGELBRECHT,
      basis: "computed",
      inputs: { naIll: 0.1, naDet: 0.8, wavelength: 488, emission: 510, n: 1.33 },
      expect: { effectiveAxialFwhm: 1.2408982723627726, effectiveAxialFwhmEdge: 1.4142901241792818 },
      tolerance: 1e-8,
    },
  ],
});
