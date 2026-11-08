import {
  coneSolidAngle, jacquinotRatio, mirrorRimHalfAngle, projectedSolidAngle, slitResolvingPower,
} from "../../physics/spectroscopy/throughput";
import { defineSchema } from "../types";

const REF = "Smith W. J. (2008). Modern Optical Engineering, 4th ed., McGraw-Hill, ch. 12 (étendue A·π sin²α of a Lambertian area; " +
  "sphere sag s = R − √(R² − (D/2)²)); cone solid angle Ω = 2π(1 − cos α) = 4π sin²(α/2); Jacquinot P. (1954). The luminosity of " +
  "spectrometers with prisms, gratings, or Fabry-Perot etalons. J. Opt. Soc. Am. 44, 761, doi:10.1364/JOSA.44.000761 " +
  "(FTS over slit étendue 2πf cos α/(h (sin α + sin β)), Littrow α = β = θ: πf/(h tan θ); slit-limited R = 2f tan θ/w).";
const DEG = Math.PI / 180;

export default defineSchema({
  href: "/spectroscopy/conc-mirror",
  inputs: [
    { key: "radius", label: "Radius of curvature", unit: "mm", toSI: 1e-3, siUnit: "m", default: 50, min: 5, max: 5000 },
    { key: "mirrorDiam", label: "Mirror diameter", unit: "mm", toSI: 1e-3, siUnit: "m", default: 25, min: 1, max: 1000 },
    { key: "slitWidth", label: "Slit width", unit: "µm", toSI: 1e-6, siUnit: "m", default: 50, min: 1, max: 5000 },
    { key: "slitHeight", label: "Slit height", unit: "mm", toSI: 1e-3, siUnit: "m", default: 1, min: 0.01, max: 100 },
    { key: "littrowAngle", label: "Grating Littrow angle θ", unit: "°", toSI: DEG, siUnit: "rad", default: 30, min: 1, max: 85 },
  ],
  outputs: [
    { key: "focalLength", label: "Focal length f = R/2", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "halfAngle", label: "Rim half-angle α (includes the sag)", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "solidAngle", label: "Solid angle Ω = 2π(1 − cos α)", unit: "sr", toSI: 1, siUnit: "sr" },
    { key: "paraxialSolidAngle", label: "Paraxial estimate π(D/2f)²", unit: "sr", toSI: 1, siUnit: "sr" },
    { key: "etendue", label: "Slit étendue w·h·π sin²α", unit: "mm²·sr", toSI: 1e-6, siUnit: "m²·sr" },
    { key: "resolvingPower", label: "Slit-limited resolving power 2f tan θ/w", unit: "", toSI: 1, siUnit: "" },
    { key: "jacquinotAdvantage", label: "Jacquinot advantage πf/(h tan θ)", unit: "×", toSI: 1, siUnit: "" },
  ],
  compute({ radius, mirrorDiam, slitWidth, slitHeight, littrowAngle }) {
    const f = radius / 2;
    const alpha = mirrorRimHalfAngle(radius, mirrorDiam);
    const warnings: string[] = [];
    if (!Number.isFinite(alpha)) warnings.push("The rim reaches the focal plane: the diameter must be below √3 R.");
    return {
      values: {
        focalLength: f,
        halfAngle: alpha,
        solidAngle: coneSolidAngle(alpha),
        paraxialSolidAngle: (Math.PI * (mirrorDiam / 2) ** 2) / f ** 2,
        etendue: slitWidth * slitHeight * projectedSolidAngle(alpha),
        resolvingPower: slitResolvingPower(f, slitWidth, littrowAngle, littrowAngle),
        jacquinotAdvantage: jacquinotRatio(f, slitHeight, littrowAngle, littrowAngle),
      },
      warnings,
    };
  },
  checks: [
    {
      // R = 50 mm, D = 25 mm: f = 25 mm, sag = 50 − √(2500 − 156.25) = 1.5877 mm, axial 23.4123 mm, α = atan(12.5/23.4123) = 28.0981°,
      // Ω = 2π(1 − cos α) = 0.740520 sr, paraxial π(12.5/25)² = π/4, étendue = 0.05 mm · 1 mm · π sin²α = 0.0348441 mm²·sr,
      // R_res = 2 f tan 30°/w = 50 mm · 0.577350/0.05 mm = 577.350, πf/(h tan θ) = π·25/0.577350 = 136.035.
      source: REF,
      basis: "computed",
      inputs: {},
      expect: {
        focalLength: 25,
        halfAngle: 28.098096364978524,
        solidAngle: 0.7405204196092308,
        paraxialSolidAngle: Math.PI / 4,
        etendue: 0.034844124119837255,
        resolvingPower: 577.3502691896257,
        jacquinotAdvantage: 136.03495231756634,
      },
      tolerance: 1e-8,
    },
  ],
});
