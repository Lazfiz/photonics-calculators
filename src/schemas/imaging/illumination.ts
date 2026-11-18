import { CONDENSER_NA_FRACTION_LOW, illuminationSummary } from "../../physics/imaging/illumination";
import { defineSchema } from "../types";

const NIKON_RES = "Nikon MicroscopyU. Microscope Resolution: Concepts, Factors and Calculation. " +
  "https://www.microscopyu.com/microscopy-basics/resolution (r = 1.22λ/(NA_obj + NA_cond)).";
const NIKON_FOV = "Nikon MicroscopyU. Field of View. https://www.microscopyu.com/microscopy-basics/field-of-view " +
  "(field of view = field number / objective magnification).";
const MERTZ = "Mertz J. (2019). Introduction to Optical Microscopy, 2nd ed., Cambridge University Press. " +
  "https://doi.org/10.1017/9781108552660 (sine condition: pupil diameter 2·f·NA for the objective back aperture and the condenser iris).";

export default defineSchema({
  href: "/imaging/illumination",
  inputs: [
    { key: "objMag", label: "Objective magnification", unit: "×", toSI: 1, siUnit: "", default: 40, min: 1, max: 200 },
    { key: "objNa", label: "Objective NA", unit: "", toSI: 1, siUnit: "", default: 0.95, min: 0.01, max: 1.7 },
    { key: "tubeFocal", label: "Tube lens focal length", unit: "mm", toSI: 1e-3, siUnit: "m", default: 200, min: 50, max: 400 },
    { key: "condenserNa", label: "Condenser NA (aperture diaphragm setting)", unit: "", toSI: 1, siUnit: "", default: 0.9, min: 0, max: 1.4 },
    { key: "condenserFocal", label: "Condenser focal length", unit: "mm", toSI: 1e-3, siUnit: "m", default: 12, min: 2, max: 100 },
    { key: "fieldNumber", label: "Eyepiece field number", unit: "mm", toSI: 1e-3, siUnit: "m", default: 20, min: 1, max: 30 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 550, min: 200, max: 2000 },
  ],
  outputs: [
    { key: "fieldOfView", label: "Field of view FN/M (field diaphragm to open to)", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "objectiveFocal", label: "Objective focal length f_TL/M", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "backAperture", label: "Objective back aperture 2·f_obj·NA", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "irisImage", label: "Condenser iris image in the back aperture", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "irisFill", label: "Share of the back aperture the iris image fills", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "irisDiameter", label: "Condenser iris diameter 2·f_c·NA_c", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "abbePeriod", label: "Abbe period limit λ/(NA_obj + min(NA_c, NA_obj))", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "rayleighResolution", label: "Rayleigh rule of thumb 1.22λ/(NA_obj + min(NA_c, NA_obj))", unit: "nm", toSI: 1e-9, siUnit: "m" },
  ],
  compute({ objMag, objNa, tubeFocal, condenserNa, condenserFocal, fieldNumber, wavelength }) {
    const s = illuminationSummary({
      objectiveMag: objMag, objectiveNa: objNa, tubeFocal, condenserNa, condenserFocal, fieldNumber, wavelength,
    });
    const warnings: string[] = [];
    // The page's advice text; only the settings that depart from the usual range are warnings.
    if (s.ratio > 1 || s.ratio < CONDENSER_NA_FRACTION_LOW) warnings.push(s.advice);
    return {
      values: {
        fieldOfView: s.fieldOfView,
        objectiveFocal: s.objectiveFocal,
        backAperture: s.backAperture,
        irisImage: s.irisImage,
        irisFill: s.irisFill,
        irisDiameter: s.irisDiameter,
        abbePeriod: s.abbePeriod,
        rayleighResolution: s.rayleigh,
      },
      warnings,
    };
  },
  checks: [
    {
      // Defaults: FN/M = 20 mm/40 = 0.5 mm = 500 µm; f_obj = 200 mm/40 = 5 mm.
      source: NIKON_FOV,
      basis: "computed",
      inputs: {},
      expect: { fieldOfView: 500, objectiveFocal: 5 },
      tolerance: 1e-8,
    },
    {
      // Defaults: λ/(NA_obj + NA_c) = 550/(0.95 + 0.9) = 297.2972973 nm; × 1.22 = 362.7027027 nm.
      source: NIKON_RES,
      basis: "computed",
      inputs: {},
      expect: { abbePeriod: 297.2972972973, rayleighResolution: 362.7027027027 },
      tolerance: 1e-8,
    },
    {
      // Condenser NA 0.7: ratio 0.7/0.95 = 0.736842 (inside 0.7–0.8). Back aperture 2·5·0.95 = 9.5 mm, iris image 9.5·0.7/0.95 = 7 mm,
      // iris 2·12·0.7 = 16.8 mm, fill 100·0.7/0.95 = 73.684210526316 %.
      source: MERTZ,
      basis: "computed",
      inputs: { condenserNa: 0.7 },
      expect: { backAperture: 9.5, irisImage: 7, irisDiameter: 16.8, irisFill: 73.684210526316 },
      tolerance: 1e-8,
    },
  ],
});
