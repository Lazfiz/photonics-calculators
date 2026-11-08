import { divergenceHalfAngle } from "../../physics/wave-optics/gaussian-beam";
import {
  airyDiskDiameter, focusedSpotRadius, pinholeRadiusForTransmission, pinholeTransmission,
} from "../../physics/wave-optics/spatial-filter";
import { defineSchema } from "../types";

export default defineSchema({
  href: "/wave-optics/spatial-filter",
  inputs: [
    { key: "wavelength", label: "Wavelength λ", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1064, min: 200, max: 11000 },
    { key: "inputBeamDiam", label: "Input beam 1/e² diameter at the lens", unit: "µm", toSI: 1e-6, siUnit: "m", default: 1000, min: 10, max: 1e5 },
    { key: "focalLength", label: "Focusing lens focal length f", unit: "mm", toSI: 1e-3, siUnit: "m", default: 50, min: 1, max: 1e4 },
    { key: "m2", label: "Beam quality M²", unit: "", toSI: 1, siUnit: "", default: 1, min: 1, max: 50 },
    // The page caps the pinhole at max(1, 10 w_f) µm; compute does the same and warns.
    { key: "pinhole", label: "Pinhole diameter", unit: "µm", toSI: 1e-6, siUnit: "m", default: 100, min: 0.5, max: 1e6 },
    { key: "f2", label: "Collimating lens focal length", unit: "mm", toSI: 1e-3, siUnit: "m", default: 100, min: 1, max: 1e4 },
  ],
  outputs: [
    { key: "focalSpotDiameter", label: "Focal spot 1/e² diameter 2w_f", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "recommendedPinhole", label: "Recommended pinhole 3w_f", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "pinhole99", label: "Smallest pinhole for 99 %", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "transmission", label: "Power through your pinhole", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "cutoffPeriod", label: "Finest input structure passed (period λf/a)", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "outputDiameter", label: "Output beam 1/e² diameter", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "airyDiameter", label: "Airy diameter 2.44λf/D (flat-top input)", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "collimatorBeamRadius", label: "Uncut beam radius at the collimating lens", unit: "mm", toSI: 1e-3, siUnit: "m" },
  ],
  compute({ wavelength, inputBeamDiam, focalLength, m2, pinhole, f2 }) {
    const w = focusedSpotRadius(wavelength, inputBeamDiam / 2, focalLength, m2);
    const maxPinhole = Math.max(1e-6, 10 * w);
    const dPin = Math.min(Math.max(pinhole, 0.5e-6), maxPinhole);
    const a = dPin / 2;
    const T = pinholeTransmission(a, w);
    const warnings: string[] = [];
    if (dPin < pinhole) warnings.push("The pinhole is capped at 10 spot radii, where it clips nothing.");
    if (T < 0.9) warnings.push("The pinhole clips the Gaussian itself and adds diffraction rings to the output beam.");
    if (m2 > 1) {
      warnings.push("For M² > 1 the spot and the throughput use a Gaussian M² times wider: an estimate. A spatial filter passes the TEM₀₀ part and strips the rest, so the real throughput of a poor beam is lower.");
    }
    return {
      values: {
        focalSpotDiameter: 2 * w,
        recommendedPinhole: 3 * w,
        pinhole99: 2 * pinholeRadiusForTransmission(0.99, w),
        transmission: T,
        cutoffPeriod: (wavelength * focalLength) / a,
        outputDiameter: (inputBeamDiam * f2) / focalLength,
        airyDiameter: airyDiskDiameter(wavelength, focalLength, inputBeamDiam),
        collimatorBeamRadius: divergenceHalfAngle({ lambda: wavelength, w0: w }) * f2,
      },
      warnings,
    };
  },
  checks: [
    {
      // w_f = M²λf/(πw_in) = 1064 nm × 50 mm/(π × 0.5 mm) = 33.868172 µm; T = 1 − exp(−2a²/w_f²) at a = 50 µm;
      // 3w_f = 101.604516 µm; d_99 = 2w_f√(−ln(0.01)/2); period λf/a = 1064 µm; output 1000 µm × 100/50 = 2 mm.
      source: "Uehara K., Kikuchi H. (1986). Transmission and diffraction of a Gaussian beam by a circular aperture. Appl. Opt. 25, 4514–4517, doi:10.1364/AO.25.004514 (T = 1 − exp(−2a²/w²)); Kogelnik H., Li T. (1966). Appl. Opt. 5, 1550–1567, doi:10.1364/AO.5.001550 (waist w₀ = λf/(πw_in)).",
      basis: "computed",
      inputs: { wavelength: 1064, inputBeamDiam: 1000, focalLength: 50, m2: 1, pinhole: 100, f2: 100 },
      expect: { focalSpotDiameter: 67.73634378, recommendedPinhole: 101.6045157, pinhole99: 102.7849657, transmission: 98.72087794, cutoffPeriod: 1064, outputDiameter: 2 },
      tolerance: 1e-8,
    },
    {
      // Airy first-zero diameter 2.44 λ f/D = 2.44 × 1064 nm × 50 mm/1 mm = 129.808 µm.
      source: "Born M., Wolf E. (1999). Principles of Optics, 7th ed., Cambridge University Press, sec. 8.5.2 (Airy pattern; first dark ring at 1.22 λf/D radius).",
      basis: "computed",
      inputs: { wavelength: 1064, inputBeamDiam: 1000, focalLength: 50 },
      expect: { airyDiameter: 129.808 },
      tolerance: 1e-8,
    },
  ],
});
