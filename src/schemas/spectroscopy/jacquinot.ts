import {
  fieldStopDiameter, ftsMaxHalfAngle, ftsMaxSolidAngle, jacquinotRatio, slitResolvingPower,
} from "../../physics/spectroscopy/throughput";
import { defineSchema } from "../types";

const REF = "Jacquinot P. (1954). The luminosity of spectrometers with prisms, gratings, or Fabry-Perot etalons. J. Opt. Soc. Am. 44, 761, " +
  "doi:10.1364/JOSA.44.000761: Ω_max = 2πΔν̃/ν̃ = 2π/R; Griffiths P. R., de Haseth J. A. (2007). Fourier Transform Infrared " +
  "Spectrometry, 2nd ed., Wiley, ch. 7: Δν̃ = 1/L, field stop 2f tan α; slit étendue Ω_G = (h/f)(sin α + sin β)/(R cos α).";
const DEG = Math.PI / 180;

export default defineSchema({
  href: "/spectroscopy/jacquinot",
  inputs: [
    { key: "maxOPD", label: "Max optical path difference L", unit: "cm", toSI: 0.01, siUnit: "m", default: 1, min: 0.001, max: 100 },
    { key: "wavenumber", label: "Highest wavenumber ν̃", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹", default: 1000, min: 10, max: 50000 },
    { key: "focalLength", label: "FTS collimator focal length", unit: "mm", toSI: 1e-3, siUnit: "m", default: 100, min: 5, max: 5000 },
    { key: "beamDiameter", label: "Beam diameter", unit: "mm", toSI: 1e-3, siUnit: "m", default: 25, min: 1, max: 500 },
    { key: "gratingFocal", label: "Grating collimator focal length", unit: "mm", toSI: 1e-3, siUnit: "m", default: 250, min: 10, max: 5000 },
    { key: "slitHeight", label: "Slit height h", unit: "mm", toSI: 1e-3, siUnit: "m", default: 10, min: 0.01, max: 100 },
    { key: "littrowAngle", label: "Littrow angle θ", unit: "°", toSI: DEG, siUnit: "rad", default: 30, min: 1, max: 85 },
  ],
  outputs: [
    { key: "resolution", label: "Resolution Δν̃ = 1/L", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹" },
    { key: "resolvingPower", label: "Resolving power R = ν̃L", unit: "", toSI: 1, siUnit: "" },
    { key: "solidAngle", label: "Max solid angle Ω = 2πΔν̃/ν̃", unit: "sr", toSI: 1, siUnit: "sr" },
    { key: "halfAngle", label: "Field half-angle α", unit: "mrad", toSI: 1e-3, siUnit: "rad" },
    { key: "fieldStop", label: "Field (J-) stop diameter 2f tan α", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "etendue", label: "FTS étendue A·Ω", unit: "cm²·sr", toSI: 1e-4, siUnit: "m²·sr" },
    { key: "jacquinotAdvantage", label: "Jacquinot advantage Ω_FTS/Ω_slit", unit: "×", toSI: 1, siUnit: "" },
    { key: "slitWidth", label: "Slit width needed for R", unit: "µm", toSI: 1e-6, siUnit: "m" },
  ],
  compute({ maxOPD, wavenumber, focalLength, beamDiameter, gratingFocal, slitHeight, littrowAngle }) {
    const res = 1 / maxOPD; // m⁻¹
    const R = wavenumber / res;
    const omega = ftsMaxSolidAngle(wavenumber, res);
    const alpha = ftsMaxHalfAngle(wavenumber, res);
    const warnings: string[] = [];
    if (res > wavenumber) warnings.push("The resolution 1/L is coarser than ν̃: increase the maximum path difference L.");
    return {
      values: {
        resolution: res,
        resolvingPower: R,
        solidAngle: omega,
        halfAngle: alpha,
        fieldStop: fieldStopDiameter(alpha, focalLength),
        etendue: (Math.PI * beamDiameter ** 2 / 4) * omega,
        jacquinotAdvantage: jacquinotRatio(gratingFocal, slitHeight, littrowAngle, littrowAngle),
        // R ∝ 1/w: a 1 m slit gives slitResolvingPower(f, 1, …), so the width for R is that value / R, in m.
        slitWidth: slitResolvingPower(gratingFocal, 1, littrowAngle, littrowAngle) / R,
      },
      warnings,
    };
  },
  checks: [
    {
      // L = 1 cm, ν̃ = 1000 cm⁻¹: Δν̃ = 1 cm⁻¹, R = 1000, Ω = 2π/R = 6.283185307e-3 sr.
      source: REF,
      basis: "computed",
      inputs: {},
      expect: { resolution: 1, resolvingPower: 1000, solidAngle: (2 * Math.PI) / 1000 },
      tolerance: 1e-8,
    },
    {
      // f = 250 mm, h = 10 mm, θ = 30°: πf/(h tan θ) = π·25/0.577350 = 136.0350; w = 2f tan θ/R = 500 mm · 0.577350/1000 = 288.675 µm.
      source: REF,
      basis: "computed",
      inputs: {},
      expect: { jacquinotAdvantage: 136.03495231756634, slitWidth: 288.67513459481285 },
      tolerance: 1e-8,
    },
  ],
});
