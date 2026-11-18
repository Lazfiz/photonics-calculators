import { fovCalculatorSummary } from "../../physics/imaging/fov-calculator";
import { defineSchema } from "../types";

const NIKON_FOV = "Nikon MicroscopyU. Field of View. https://www.microscopyu.com/microscopy-basics/field-of-view " +
  "(field number divided by objective magnification; the sensor size divided by the magnification gives the camera field).";
const PAWLEY = "Pawley J. B. (2006). Points, Pixels, and Gray Levels: Digitizing Image Data. In: Handbook of Biological " +
  "Confocal Microscopy, 3rd ed., ch. 4, pp. 59–79. Springer. https://doi.org/10.1007/978-0-387-45524-2_4 (Nyquist sampling of the optical cutoff 2NA/λ), and " +
  "Goodman J. W. (2005). Introduction to Fourier Optics, 3rd ed., Roberts & Company (incoherent cutoff frequency 2NA/λ).";

export default defineSchema({
  href: "/imaging/fov-calculator",
  inputs: [
    { key: "sensorW", label: "Sensor width", unit: "mm", toSI: 1e-3, siUnit: "m", default: 13.336, min: 0.5, max: 100 },
    { key: "sensorH", label: "Sensor height", unit: "mm", toSI: 1e-3, siUnit: "m", default: 10.016, min: 0.5, max: 100 },
    { key: "mag", label: "Magnification at the sensor", unit: "×", toSI: 1, siUnit: "", default: 20, min: 0.01, max: 200 },
    { key: "pixelSize", label: "Pixel size", unit: "µm", toSI: 1e-6, siUnit: "m", default: 6.5, min: 0.5, max: 50 },
    { key: "na", label: "Objective NA", unit: "", toSI: 1, siUnit: "", default: 0.75, min: 0.01, max: 1.7 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 550, min: 200, max: 2000 },
    { key: "fieldNumber", label: "Eyepiece field number", unit: "mm", toSI: 1e-3, siUnit: "m", default: 22, min: 1, max: 30 },
  ],
  outputs: [
    { key: "fovWidth", label: "FOV width, sensor/M", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "fovHeight", label: "FOV height", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "fovDiagonal", label: "FOV diagonal", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "pixelFootprint", label: "Pixel footprint p/M", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "nyquistPixel", label: "Nyquist pixel λ/(4NA)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "samplingRatio", label: "Pixel footprint over Nyquist pixel (above 1 is undersampled)", unit: "", toSI: 1, siUnit: "" },
    { key: "nyquistMag", label: "Magnification for Nyquist", unit: "×", toSI: 1, siUnit: "" },
    { key: "eyepieceField", label: "Eyepiece field FN/M (assumes the sensor magnification equals the objective magnification, a 1× camera adapter)", unit: "mm", toSI: 1e-3, siUnit: "m" },
  ],
  compute({ sensorW, sensorH, mag, pixelSize, na, wavelength, fieldNumber }) {
    const s = fovCalculatorSummary({
      sensorWidth: sensorW, sensorHeight: sensorH, magnification: mag, pixelSize, na, wavelength, fieldNumber,
    });
    return {
      values: {
        fovWidth: s.fovWidth,
        fovHeight: s.fovHeight,
        fovDiagonal: s.fovDiagonal,
        pixelFootprint: s.footprint,
        nyquistPixel: s.nyquist,
        samplingRatio: s.ratio,
        nyquistMag: s.nyquistMag,
        eyepieceField: s.eyepieceField,
      },
    };
  },
  checks: [
    {
      // Defaults: width 13.336/20 = 0.6668 mm, height 10.016/20 = 0.5008 mm, diagonal √(0.6668² + 0.5008²) = 0.83392019 mm, eyepiece field 22/20 = 1.1 mm.
      source: NIKON_FOV,
      basis: "computed",
      inputs: {},
      expect: { fovWidth: 0.6668, fovHeight: 0.5008, fovDiagonal: 0.83392018802761, eyepieceField: 1.1 },
      tolerance: 1e-8,
    },
    {
      // Defaults: footprint 6.5 µm/20 = 325 nm, Nyquist pixel 550/(4·0.75) = 183.3333 nm, ratio 1.7727273, M for Nyquist 6500/183.3333 = 35.454545.
      source: PAWLEY,
      basis: "computed",
      inputs: {},
      expect: { pixelFootprint: 325, nyquistPixel: 183.33333333333, samplingRatio: 1.7727272727273, nyquistMag: 35.454545454545 },
      tolerance: 1e-8,
    },
    {
      // M 40, pixel 4.54 µm, NA 1.2, 520 nm: footprint 4540/40 = 113.5 nm, Nyquist pixel 520/4.8 = 108.3333 nm, ratio 1.0476923, M for Nyquist 4540/108.3333 = 41.907692.
      source: PAWLEY,
      basis: "computed",
      inputs: { mag: 40, pixelSize: 4.54, na: 1.2, wavelength: 520 },
      expect: { pixelFootprint: 113.5, nyquistPixel: 108.33333333333, samplingRatio: 1.0476923076923, nyquistMag: 41.907692307692 },
      tolerance: 1e-8,
    },
  ],
});
