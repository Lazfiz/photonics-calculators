import { reconstructionSummary, type ReconstructionMethod } from "../../physics/imaging/3d-reconstruction";
import { defineSchema } from "../types";

const BORN_WOLF = "Born M., Wolf E. (2019). Principles of Optics, 7th ed., Cambridge University Press, https://doi.org/10.1017/9781108769914, " +
  "§8.5.2 (Airy FWHM 0.5145 λ/NA from [2J₁(v)/v]² = ½) and §8.8 (axial PSF); axial FWHM 0.886 λ/(n − √(n² − NA²)), where 0.886 = 2·1.39156/π from the sinc² half maximum (Born & Wolf §8.8; Wilhelm et al. print 0.88).";
const ENGELBRECHT = "Engelbrecht C. J., Stelzer E. H. K. (2006). Resolution enhancement in a light-sheet-based microscope (SPIM). " +
  "Optics Letters 31, 1477–1479. https://doi.org/10.1364/OL.31.001477 (sheet × detection PSF); Gaussian sheet w₀ = λ/(π NA), " +
  "z_R = π n w₀²/λ, Siegman A. E. (1986), Lasers, University Science Books, ch. 17.";
const NOT_LS = "The sheet length 2z_R belongs to the light-sheet method; the other methods have no sheet.";

export default defineSchema({
  href: "/imaging/3d-reconstruction",
  inputs: [
    { key: "numSlices", label: "Number of Z-Slices", unit: "", toSI: 1, siUnit: "", default: 100, min: 1, max: 2000 },
    { key: "sliceSpacing", label: "Z-Step", unit: "µm", toSI: 1e-6, siUnit: "m", default: 0.5, min: 0.01, max: 10 },
    { key: "xyResolution", label: "XY pixel size at the sample", unit: "µm", toSI: 1e-6, siUnit: "m", default: 0.1, min: 0.01, max: 5 },
    { key: "na", label: "Numerical Aperture", unit: "", toSI: 1, siUnit: "", default: 1, min: 0.1, max: 1.7 },
    { key: "wavelengthNm", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 550, min: 300, max: 2000 },
    { key: "refractiveIndex", label: "Refractive Index", unit: "", toSI: 1, siUnit: "", default: 1.33, min: 1, max: 1.8 },
    { key: "pinholeAU", label: "Confocal pinhole (confocal method only)", unit: "AU", toSI: 1, siUnit: "", default: 1, min: 0, max: 5 },
    { key: "excitationNA", label: "Light-sheet NA (light-sheet method only)", unit: "", toSI: 1, siUnit: "", default: 0.1, min: 0.01, max: 0.3 },
    { key: "fovUm", label: "FOV", unit: "µm", toSI: 1e-6, siUnit: "m", default: 100, min: 1, max: 5000 },
  ],
  choices: [
    {
      key: "method",
      label: "Method",
      options: [
        { value: "widefield", label: "Widefield (deconvolution)" },
        { value: "confocal", label: "Confocal" },
        { value: "lightsheet", label: "Light Sheet" },
      ],
      default: "confocal",
    },
  ],
  outputs: [
    { key: "lateral", label: "Lateral FWHM", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "axial", label: "Axial FWHM", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "pixelsPerSide", label: "Pixels per side of the FOV", unit: "px", toSI: 1, siUnit: "px" },
    { key: "totalVoxels", label: "Total voxels", unit: "voxels", toSI: 1, siUnit: "voxels" },
    { key: "volumeSize", label: "Volume size (16-bit)", unit: "MB", toSI: 1e6, siUnit: "B" },
    { key: "sheetLength", label: "Light-sheet length 2z_R", unit: "µm", toSI: 1e-6, siUnit: "m" },
  ],
  validate({ na, refractiveIndex }) {
    if (!(na < refractiveIndex)) return `NA ${na} is not possible in a medium of n = ${refractiveIndex}: NA = n sin α must stay below n.`;
    return undefined;
  },
  compute({ numSlices, sliceSpacing, xyResolution, na, wavelengthNm, refractiveIndex, pinholeAU, excitationNA, fovUm, method }) {
    const m = method as ReconstructionMethod;
    const s = reconstructionSummary(m, numSlices, sliceSpacing, xyResolution, na, wavelengthNm, refractiveIndex, pinholeAU, excitationNA, fovUm);
    const warnings: string[] = [];
    if (!s.xyOk) warnings.push("The XY pixel is larger than half the lateral FWHM (under-sampled; rule of thumb: pixel ≤ FWHM/2).");
    if (!s.zOk) warnings.push("The Z-step is larger than half the axial FWHM (under-sampled; rule of thumb: step ≤ FWHM/2).");
    const lightsheet = m === "lightsheet";
    if (lightsheet && fovUm > s.sheetLength) {
      warnings.push("The FOV exceeds the sheet length 2z_R: the axial FWHM holds at the waist only, and the sheet is thicker toward the edge of the FOV.");
    }
    return {
      values: {
        lateral: s.lateral,
        axial: s.axial,
        pixelsPerSide: s.pixelsPerSide,
        totalVoxels: s.totalVoxels,
        volumeSize: s.volumeBytes,
        sheetLength: lightsheet ? s.sheetLength : NaN,
      },
      warnings,
      reasons: lightsheet ? {} : { sheetLength: NOT_LS },
    };
  },
  checks: [
    {
      // Widefield, 600 nm, NA 0.8, n 1.33: lateral (v½/π) λ/NA = 385.8727387 nm; axial (2·1.391557/π = 0.88589) λ/(n − √(n² − NA²)) = 1987.0277406 nm.
      // Stack: FOV 100 µm / 0.1 µm = 1000 px per side; 50 slices → 50e6 voxels, 2 bytes each = 100 MB.
      source: BORN_WOLF,
      basis: "computed",
      inputs: { method: "widefield", wavelengthNm: 600, na: 0.8, refractiveIndex: 1.33, numSlices: 50, sliceSpacing: 0.5, xyResolution: 0.1, fovUm: 100 },
      expect: { lateral: 385.8727387358205, axial: 1987.027740635577, pixelsPerSide: 1000, totalVoxels: 50e6, volumeSize: 100 },
      tolerance: 1e-8,
    },
    {
      // Light sheet, 600 nm, sheet NA 0.1, same detection (axial 1987.0277406 nm): w₀ = λ/(π NA) = 1909.859 nm, sheet FWHM
      // √(2 ln 2) w₀ = 2248.6875016 nm; (1/2248.69² + 1/1987.03²)^(−1/2) = 1488.9982891 nm; 2 z_R = 2π n w₀²/λ = 50.8022578 µm.
      source: ENGELBRECHT,
      basis: "computed",
      inputs: { method: "lightsheet", wavelengthNm: 600, na: 0.8, refractiveIndex: 1.33, excitationNA: 0.1, sliceSpacing: 0.5, xyResolution: 0.1, fovUm: 40 },
      expect: { axial: 1488.998289108732, sheetLength: 50.802257834933 },
      tolerance: 1e-8,
    },
  ],
});
