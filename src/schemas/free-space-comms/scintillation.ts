import {
  fresnelZone, friedParameter, lognormalFadeProbability, rytovVariance, scintillationIndex,
} from "../../physics/free-space-comms/turbulence";
import { defineSchema } from "../types";

const ANDREWS_PHILLIPS = "Andrews L. C., Phillips R. L. (2005). Laser Beam Propagation through Random Media, 2nd ed. SPIE Press: " +
  "plane-wave Rytov variance σ_R² = 1.23 Cn² k^(7/6) L^(11/6), aperture parameter d² = kD²/(4L), and the all-regime scintillation " +
  "index σ_I²(D) = exp[0.49σ_R²/(1 + 0.65d² + 1.11σ_R^(12/5))^(7/6) + 0.51σ_R²(1 + 0.69σ_R^(12/5))^(−5/6)/(1 + 0.90d² + 0.62d²σ_R^(12/5))] − 1 (ch. 9–10).";
const LOGNORMAL = "Log-normal irradiance with σ_ln² = ln(1 + σ_I²) (Andrews L. C., Phillips R. L. (2005). Laser Beam Propagation through " +
  "Random Media, 2nd ed. SPIE Press, ch. 8): P(I < F⟨I⟩) = Φ((ln F + σ_ln²/2)/σ_ln).";

export default defineSchema({
  href: "/free-space-comms/scintillation",
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 200, max: 20000 },
    { key: "distance", label: "Link distance", unit: "km", toSI: 1e3, siUnit: "m", default: 1, min: 0.001, max: 1000 },
    { key: "cz", label: "Refractive-index structure constant Cn²", unit: "m^(−2/3)", toSI: 1, siUnit: "m^(−2/3)", default: 1.7e-14, min: 1e-18, max: 1e-11 },
    { key: "apertureDiameter", label: "Aperture diameter", unit: "m", toSI: 1, siUnit: "m", default: 0.1, min: 0, max: 10 },
  ],
  outputs: [
    { key: "rytovVariance", label: "Rytov variance σ_R²", unit: "", toSI: 1, siUnit: "" },
    { key: "scintillationPoint", label: "Scintillation index σ_I² (point receiver)", unit: "", toSI: 1, siUnit: "" },
    { key: "scintillationAperture", label: "Scintillation index σ_I² with the aperture", unit: "", toSI: 1, siUnit: "" },
    { key: "apertureFactor", label: "Aperture-averaging factor σ_I²(D)/σ_I²(0)", unit: "", toSI: 1, siUnit: "" },
    { key: "fresnelZone", label: "Fresnel zone √(L/k)", unit: "cm", toSI: 1e-2, siUnit: "m" },
    { key: "friedParameter", label: "Fried parameter r₀ (plane wave)", unit: "cm", toSI: 1e-2, siUnit: "m" },
    { key: "fade3dB", label: "Fade probability P(I < ⟨I⟩ − 3 dB)", unit: "", toSI: 1, siUnit: "" },
    { key: "fade10dB", label: "Fade probability P(I < ⟨I⟩ − 10 dB)", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ wavelength, distance, cz, apertureDiameter }) {
    const sigmaR2 = rytovVariance(cz, wavelength, distance);
    const point = scintillationIndex(sigmaR2, wavelength, distance);
    const sigmaI2 = scintillationIndex(sigmaR2, wavelength, distance, apertureDiameter);
    const warnings: string[] = [];
    if (sigmaR2 >= 0.3) {
      warnings.push("Moderate to strong fluctuations (σ_R² ≥ 0.3): the log-normal fade probabilities are optimistic, the gamma-gamma tails are heavier.");
    }
    return {
      values: {
        rytovVariance: sigmaR2,
        scintillationPoint: point,
        scintillationAperture: sigmaI2,
        apertureFactor: sigmaI2 / point,
        fresnelZone: fresnelZone(wavelength, distance),
        friedParameter: friedParameter(cz, wavelength, distance),
        fade3dB: lognormalFadeProbability(10 ** -0.3, sigmaI2),
        fade10dB: lognormalFadeProbability(0.1, sigmaI2),
      },
      warnings,
    };
  },
  checks: [
    {
      // Defaults, k = 2π/λ = 4.0537e6 m⁻¹: σ_R² = 1.23 · 1.7e-14 · k^(7/6) · 1000^(11/6) = 0.3384622; d² = kD²/4L = 10.13417;
      // σ_I²(0) = exp[0.49σ_R²/(1 + 1.11σ_R^(12/5))^(7/6) + 0.51σ_R²(1 + 0.69σ_R^(12/5))^(−5/6)] − 1 = 0.3117588 and with
      // d²: 0.02791714, factor 0.08954725. Fresnel √(L/k) = 1.570637 cm; r₀ = (0.423k²Cn²L)^(−3/5) = 5.708324 cm.
      source: ANDREWS_PHILLIPS,
      basis: "computed",
      inputs: {},
      expect: {
        rytovVariance: 0.33846224546915965, scintillationPoint: 0.3117587940020359, scintillationAperture: 0.027917143077332396,
        apertureFactor: 0.08954725131875539, fresnelZone: 1.5706373285785544, friedParameter: 5.708324094185651,
      },
      tolerance: 1e-8,
    },
    {
      // Strong turbulence, point receiver, 1064 nm, 5 km, Cn² = 1e-12: σ_R² = 590.3751; σ_I² = exp[0.49σ_R²/(1 + 1.11σ_R^(12/5))^(7/6)
      // + 0.51σ_R²(1 + 0.69σ_R^(12/5))^(−5/6)] − 1 = 1.071323 (saturation above 1).
      source: ANDREWS_PHILLIPS,
      basis: "computed",
      inputs: { wavelength: 1064, distance: 5, cz: 1e-12, apertureDiameter: 0 },
      expect: { rytovVariance: 590.3751467273696, scintillationPoint: 1.0713227784170414, scintillationAperture: 1.0713227784170414, apertureFactor: 1 },
      tolerance: 1e-8,
    },
    {
      // Defaults, σ_I² = 0.02791714: σ_ln² = ln(1.02791714) = 0.0275346; F = 10^(−0.3): (ln F + σ_ln²/2)/σ_ln = −4.07995,
      // P = Φ(−4.07995) = 2.252268e-5 (Φ from the erf Taylor series).
      source: LOGNORMAL,
      basis: "computed",
      inputs: {},
      expect: { fade3dB: 0.000022522677722291995 },
      tolerance: 1e-7,
    },
  ],
});
