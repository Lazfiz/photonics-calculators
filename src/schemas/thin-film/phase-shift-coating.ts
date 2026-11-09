import { phaseShiftAtDesign } from "../../physics/thin-film/phase-shift-coating";
import { defineSchema } from "../types";

const pure = { unit: "", toSI: 1, siUnit: "" } as const;
const percent = { unit: "%", toSI: 0.01, siUnit: "" } as const;
const degrees = { unit: "°", toSI: Math.PI / 180, siUnit: "rad" } as const;

const BORN_WOLF = "Born M., Wolf E. (1999). Principles of Optics, 7th ed., Cambridge University Press, §1.6.4 (homogeneous dielectric film), " +
  "e^(−iωt) convention: r = (r₁₂ + r₂₃e^(2iβ))/(1 + r₁₂r₂₃e^(2iβ)), t = t₁₂t₂₃e^(iβ)/(1 + r₁₂r₂₃e^(2iβ)).";

export default defineSchema({
  href: "/thin-film/phase-shift-coating",
  inputs: [
    { key: "n1", label: "Incident medium index", ...pure, default: 1.0, min: 1, max: 5 },
    { key: "nFilm", label: "Film index", ...pure, default: 1.38, min: 1, max: 5 },
    { key: "nSubstrate", label: "Substrate index", ...pure, default: 1.52, min: 1, max: 5 },
    { key: "designWl", label: "Design wavelength λ₀", unit: "nm", toSI: 1e-9, siUnit: "m", default: 550, min: 100, max: 20000 },
    { key: "fractionalThickness", label: "Film thickness in quarter waves at λ₀", ...pure, default: 0.5, min: 0, max: 3 },
  ],
  outputs: [
    { key: "thickness", label: "Film thickness", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "argR", label: "Reflected phase arg r at λ₀", ...degrees },
    { key: "argT", label: "Transmitted phase arg t at λ₀", ...degrees },
    { key: "R", label: "Reflectance at λ₀", ...percent },
    { key: "T", label: "Transmittance at λ₀", ...percent },
    { key: "r01", label: "Incident–film interface coefficient r₀₁", ...pure },
    { key: "r12", label: "Film–substrate interface coefficient r₁₂", ...pure },
  ],
  compute({ n1, nFilm, nSubstrate, designWl, fractionalThickness }) {
    const p = phaseShiftAtDesign(n1, nFilm, nSubstrate, designWl, fractionalThickness);
    return {
      values: { thickness: p.thickness, argR: p.argR, argT: p.argT, R: p.R, T: p.T, r01: p.r01, r12: p.r12 },
      warnings: [
        "Phases use e^(−iωt) (Born & Wolf); with e^(+iωt), as in Macleod and Hecht, every phase changes sign.",
      ],
    };
  },
  checks: [
    {
      // Defaults, f = 1/2 so 2β = π/2 and e^(2iβ) = i. r₀₁ = −0.38/2.38 = −0.15966387, r₁₂ = −0.14/2.90 = −0.04827586.
      // r = [r₀₁(1 + r₁₂²) + i r₁₂(1 − r₀₁²)]/(1 + r₀₁²r₁₂²): arg r = atan2(−0.047045, −0.160036) = −163.618440°,
      // R = |r|² = 0.027821456, T = 1 − R (lossless); arg t = β − arg(1 + i r₀₁r₁₂) = 45° − atan(0.0077079) = 44.558378°.
      // d = f λ₀/(4n) = 0.5 · 550/(4 · 1.38) = 49.8188406 nm.
      source: BORN_WOLF,
      basis: "computed",
      inputs: {},
      expect: {
        thickness: 49.81884057971014,
        argR: -163.61843954560052,
        argT: 44.558377990859675,
        R: 2.782145589443728,
        T: 97.21785441055627,
        r01: -0.15966386554621845,
        r12: -0.04827586206896556,
      },
      tolerance: 1e-8,
    },
  ],
});
