import { pixelFovSummary } from "../../physics/imaging/pixel-fov";
import { defineSchema } from "../types";

const HOLST = "Holst G. C. (2017). Electro-Optical Imaging System Performance, 6th ed., SPIE Press, detector angular subtense " +
  "(IFOV = 2·atan(b·p/(2f)) ≈ b·p/f for a lens focused at infinity) and the Nyquist frequency 1/(2p). https://doi.org/10.1117/3.2588947";
const ARCSEC = Math.PI / (180 * 3600);

export default defineSchema({
  href: "/imaging/pixel-fov",
  inputs: [
    { key: "pixelSizeUm", label: "Pixel size", unit: "µm", toSI: 1e-6, siUnit: "m", default: 6.5, min: 1, max: 50 },
    { key: "focalLengthMm", label: "Focal length", unit: "mm", toSI: 1e-3, siUnit: "m", default: 50, min: 1, max: 10000 },
    { key: "binning", label: "Binning (b × b)", unit: "", toSI: 1, siUnit: "", default: 1, min: 1, max: 4 },
    { key: "pixels", label: "Pixels across the sensor", unit: "", toSI: 1, siUnit: "", default: 2048, min: 1, max: 20000 },
  ],
  outputs: [
    { key: "ifovArcsec", label: "Pixel IFOV", unit: "″", toSI: ARCSEC, siUnit: "rad" },
    { key: "ifovMicrorad", label: "Pixel IFOV", unit: "µrad", toSI: 1e-6, siUnit: "rad" },
    { key: "effectivePixel", label: "Effective pixel", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "sensorNyquist", label: "Sensor Nyquist 1/(2bp)", unit: "lp/mm", toSI: 1e3, siUnit: "cycles/m" },
    { key: "angularNyquist", label: "Angular Nyquist 1/(2·IFOV)", unit: "cycles/mrad", toSI: 1e3, siUnit: "cycles/rad" },
    { key: "fullField", label: "Full field across the sensor", unit: "°", toSI: Math.PI / 180, siUnit: "rad" },
  ],
  compute({ pixelSizeUm, focalLengthMm, binning, pixels }) {
    const s = pixelFovSummary(pixelSizeUm, focalLengthMm, Math.round(binning), Math.round(pixels));
    return {
      values: {
        ifovArcsec: s.ifov,
        ifovMicrorad: s.ifov,
        effectivePixel: s.effectivePixel,
        sensorNyquist: s.sensorNyquist,
        angularNyquist: s.angularNyquist,
        fullField: s.fullField,
      },
    };
  },
  checks: [
    {
      // p = 6.5 µm, f = 50 mm, 1×1, 2048 px: IFOV = 2·atan(6.5e-6/0.1) = 129.99999982 µrad = 26.814425″;
      // Nyquist 1/(2·6.5 µm) = 76.923077 lp/mm, 1/(2·IFOV) = 3.846154 cycles/mrad; field 2·atan(13.312/100) = 15.165267°.
      source: HOLST,
      basis: "computed",
      inputs: { pixelSizeUm: 6.5, focalLengthMm: 50, binning: 1, pixels: 2048 },
      expect: {
        ifovMicrorad: 129.99999981692, ifovArcsec: 26.814424774, sensorNyquist: 76.923076923,
        angularNyquist: 3.8461538516, fullField: 15.165266875,
      },
      tolerance: 1e-8,
    },
    {
      // p = 5 µm, f = 25 mm, 2×2, 1000 px: b·p = 10 µm, IFOV = 2·atan(10e-6/0.05) = 399.99999467 µrad = 82.505921″;
      // Nyquist 1/(20 µm) = 50 lp/mm, 1/(2·IFOV) = 1.250000017 cycles/mrad; field: 1000·5 µm = 5 mm, 2·atan(5/50) = 11.421186°.
      source: HOLST,
      basis: "computed",
      inputs: { pixelSizeUm: 5, focalLengthMm: 25, binning: 2, pixels: 1000 },
      expect: {
        ifovMicrorad: 399.99999467, ifovArcsec: 82.505921399, effectivePixel: 10, sensorNyquist: 50,
        angularNyquist: 1.2500000167, fullField: 11.421186275,
      },
      tolerance: 1e-8,
    },
  ],
});
