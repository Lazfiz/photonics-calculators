import {
  andrewsApertureFactor, apertureParameter, fresnelZone, hardApertureFactor, rytovVariance, scintillationIndex,
  sphericalRytovVariance, weakApertureFactor,
} from "../../physics/free-space-comms/turbulence";
import { defineSchema } from "../types";

const ANDREWS_1992 = "Andrews L. C. (1992). Aperture-averaging factor for optical scintillations of plane and spherical " +
  "waves in the atmosphere. J. Opt. Soc. Am. A 9(4), 597: A ≈ (1 + 1.062 d²)^(−7/6) (plane), (1 + 0.333 d²)^(−7/6) (spherical).";
const ANDREWS_PHILLIPS = "Andrews L. C., Phillips R. L. (2005). Laser Beam Propagation through Random Media, 2nd ed. SPIE: " +
  "Rytov variances 1.23 Cn² k^(7/6) L^(11/6) (plane) and 0.496 Cn² k^(7/6) L^(11/6) (spherical), Gaussian-aperture weak-fluctuation " +
  "integral, all-regime scintillation index.";

export default defineSchema({
  href: "/free-space-comms/aperture-averaging",
  choices: [
    {
      key: "aperture",
      label: "Aperture model",
      options: [
        { value: "hard", label: "Hard circular (a lens or telescope)" },
        { value: "gaussian", label: "Gaussian (exp(−κ²D²/16) model)" },
      ],
      default: "hard",
    },
  ],
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 200, max: 20000 },
    { key: "rxDiameter", label: "Receiver diameter", unit: "cm", toSI: 1e-2, siUnit: "m", default: 10, min: 0, max: 100 },
    { key: "cn2", label: "Cn²", unit: "m^(−2/3)", toSI: 1, siUnit: "m^(−2/3)", default: 1e-15, min: 1e-18, max: 1e-11 },
    { key: "distance", label: "Link distance", unit: "km", toSI: 1e3, siUnit: "m", default: 1, min: 0.001, max: 1000 },
  ],
  outputs: [
    { key: "fresnelZone", label: "Fresnel zone √(L/k)", unit: "cm", toSI: 1e-2, siUnit: "m" },
    { key: "apertureParameter", label: "Aperture parameter d² = kD²/4L", unit: "", toSI: 1, siUnit: "" },
    { key: "factorHardPlane", label: "A, plane wave, hard aperture", unit: "", toSI: 1, siUnit: "" },
    { key: "factorGaussianPlane", label: "A, plane wave, Gaussian aperture", unit: "", toSI: 1, siUnit: "" },
    { key: "factorGaussianSpherical", label: "A, spherical wave, Gaussian aperture", unit: "", toSI: 1, siUnit: "" },
    { key: "factorAndrewsPlane", label: "A, plane wave, Andrews 1992 fit", unit: "", toSI: 1, siUnit: "" },
    { key: "factorAndrewsSpherical", label: "A, spherical wave, Andrews 1992 fit", unit: "", toSI: 1, siUnit: "" },
    { key: "rytovVariance", label: "Rytov variance σ_R² (plane)", unit: "", toSI: 1, siUnit: "" },
    { key: "rytovVarianceSpherical", label: "Rytov variance β₀² (spherical)", unit: "", toSI: 1, siUnit: "" },
    { key: "weakScintillationIndex", label: "Weak σ_I²(D) = A·σ_R² (selected aperture)", unit: "", toSI: 1, siUnit: "" },
    { key: "scintillationIndex", label: "All-regime σ_I²(D), plane wave", unit: "", toSI: 1, siUnit: "" },
    { key: "reductionDb", label: "Scintillation reduction 10·log10(1/A) (selected aperture)", unit: "dB", toSI: 1, siUnit: "dB" },
  ],
  compute({ wavelength, rxDiameter, cn2, distance, aperture }) {
    const hard = aperture !== "gaussian";
    const sigmaR2 = rytovVariance(cn2, wavelength, distance);
    const d2 = apertureParameter(wavelength, distance, rxDiameter);
    const aPlane = weakApertureFactor(d2, "plane");
    const aHard = hardApertureFactor(d2);
    const aRx = hard ? aHard : aPlane;
    const warnings: string[] = [];
    if (sigmaR2 >= 1) {
      warnings.push("σ_R² ≥ 1: the weak-fluctuation aperture factor A no longer applies; use the all-regime scintillation index.");
    }
    return {
      values: {
        fresnelZone: fresnelZone(wavelength, distance),
        apertureParameter: d2,
        factorHardPlane: aHard,
        factorGaussianPlane: aPlane,
        factorGaussianSpherical: weakApertureFactor(d2, "spherical"),
        factorAndrewsPlane: andrewsApertureFactor(d2, "plane"),
        factorAndrewsSpherical: andrewsApertureFactor(d2, "spherical"),
        rytovVariance: sigmaR2,
        rytovVarianceSpherical: sphericalRytovVariance(cn2, wavelength, distance),
        weakScintillationIndex: aRx * sigmaR2,
        scintillationIndex: scintillationIndex(sigmaR2, wavelength, distance, rxDiameter),
        reductionDb: 10 * Math.log10(1 / aRx),
      },
      warnings,
    };
  },
  checks: [
    {
      // k = 2π/λ, λ = 1550 nm, L = 1 km, Cn² = 1e-15: σ_R² = 0.01990954, β₀² = 0.008028564, √(L/k) = 1.570637 cm,
      // d² = kD²/4L = 10.13417 (D = 10 cm); Andrews fits (1 + 1.062 d²)^(−7/6) = 0.05637470, (1 + 0.333 d²)^(−7/6) = 0.1787432.
      source: ANDREWS_1992 + " " + ANDREWS_PHILLIPS,
      basis: "computed",
      inputs: { wavelength: 1550, rxDiameter: 10, cn2: 1e-15, distance: 1 },
      expect: {
        rytovVariance: 0.01990954385, rytovVarianceSpherical: 0.008028564025, fresnelZone: 1.570637329,
        apertureParameter: 10.13416985, factorAndrewsPlane: 0.05637470185, factorAndrewsSpherical: 0.1787431858,
      },
      tolerance: 1e-8,
    },
    {
      // Gaussian aperture, plane wave: A = ∫₀¹[a^(5/6) − Re(a + iξ)^(5/6)]dξ / ∫₀¹[−Re(iξ)^(5/6)]dξ with a = d²/4, here d² = 10.13417:
      // A = 0.05438863 (Simpson quadrature on ξ = t⁶); σ_I² = A σ_R² = 0.00108285; reduction 10 log₁₀(1/A) = 12.64492 dB;
      // all-regime exp[0.49σ²/(1 + 0.65d² + 1.11σ^(12/5))^(7/6) + 0.51σ²(1 + 0.69σ^(12/5))^(−5/6)/(1 + 0.9d² + 0.62d²σ^(12/5))] − 1 = 0.001910115.
      source: ANDREWS_PHILLIPS,
      basis: "computed",
      inputs: { aperture: "gaussian", wavelength: 1550, rxDiameter: 10, cn2: 1e-15, distance: 1 },
      expect: {
        factorGaussianPlane: 0.05438862553, weakScintillationIndex: 0.001082852725, reductionDb: 12.64491916,
        scintillationIndex: 0.001910114732,
      },
      tolerance: 1e-6,
    },
    {
      // Point receiver: D = 0 gives d² = 0 and A = 1 for every aperture model, so σ_I²(0) = σ_R² (weak) and no reduction.
      source: ANDREWS_PHILLIPS,
      basis: "computed",
      inputs: { rxDiameter: 0, cn2: 1e-15, wavelength: 1550, distance: 1 },
      expect: { factorHardPlane: 1, factorGaussianPlane: 1, weakScintillationIndex: 0.01990954385 },
      tolerance: 1e-8,
    },
  ],
});
