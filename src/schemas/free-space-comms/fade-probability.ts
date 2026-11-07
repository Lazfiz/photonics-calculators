import {
  apertureParameter, gammaGammaCdf, gammaGammaParameters, lognormalFadeProbability, rytovVariance, scintillationIndex,
} from "../../physics/free-space-comms/turbulence";
import { defineSchema } from "../types";

const AL_HABASH = "Al-Habash M. A., Andrews L. C., Phillips R. L. (2001). Mathematical model for the irradiance " +
  "probability density function of a laser beam propagating through turbulent media. Opt. Eng. 40(8), 1554–1562: " +
  "gamma-gamma density with α = 1/(exp σ²lnX − 1), β = 1/(exp σ²lnY − 1).";

export default defineSchema({
  href: "/free-space-comms/fade-probability",
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 200, max: 20000 },
    { key: "cn2", label: "Refractive-index structure constant Cn²", unit: "m⁻²ᐟ³", toSI: 1, siUnit: "m^(-2/3)", default: 1e-15, min: 1e-18, max: 1e-11 },
    { key: "distance", label: "Link distance", unit: "km", toSI: 1e3, siUnit: "m", default: 1, min: 0.001, max: 1000 },
    { key: "fadeThreshold", label: "Fade threshold below the mean", unit: "dB", toSI: 1, siUnit: "dB", default: 10, min: 0, max: 40 },
    { key: "rxDiameter", label: "Receiver diameter (0 = point receiver)", unit: "cm", toSI: 1e-2, siUnit: "m", default: 0, min: 0, max: 50 },
    { key: "numChannels", label: "Independent receivers N (selection combining)", unit: "", toSI: 1, siUnit: "", default: 1, min: 1, max: 8 },
  ],
  outputs: [
    { key: "rytovVariance", label: "Rytov variance σ_R²", unit: "", toSI: 1, siUnit: "" },
    { key: "scintillationIndex", label: "Scintillation index σ_I²(D)", unit: "", toSI: 1, siUnit: "" },
    { key: "alpha", label: "Gamma-gamma α", unit: "", toSI: 1, siUnit: "" },
    { key: "beta", label: "Gamma-gamma β", unit: "", toSI: 1, siUnit: "" },
    { key: "fadeProbabilityGammaGamma", label: "P(fade deeper than the threshold), gamma-gamma", unit: "", toSI: 1, siUnit: "" },
    { key: "fadeProbabilityLognormal", label: "P(fade deeper than the threshold), log-normal", unit: "", toSI: 1, siUnit: "" },
    { key: "fadeProbabilityDiversity", label: "P^N for N uncorrelated receivers, selection combining", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ wavelength, cn2, distance, fadeThreshold, rxDiameter, numChannels }) {
    const n = Math.min(8, Math.max(1, Math.round(numChannels)));
    const D = Math.max(0, rxDiameter);
    const sigmaR2 = rytovVariance(cn2, wavelength, distance);
    const d2 = apertureParameter(wavelength, distance, D);
    const sigmaI2 = scintillationIndex(sigmaR2, wavelength, distance, D);
    const { alpha, beta } = gammaGammaParameters(sigmaR2, d2);
    const t = 10 ** (-fadeThreshold / 10);
    const pGg = gammaGammaCdf(t, alpha, beta);
    const warnings: string[] = [];
    if (sigmaR2 > 1) warnings.push("σ_R² > 1: strong turbulence; the log-normal comparison underestimates deep fades.");
    if (!Number.isFinite(pGg)) warnings.push("The gamma-gamma probability is not defined for these inputs.");
    return {
      values: {
        rytovVariance: sigmaR2,
        scintillationIndex: sigmaI2,
        alpha,
        beta,
        fadeProbabilityGammaGamma: pGg,
        fadeProbabilityLognormal: lognormalFadeProbability(t, sigmaI2),
        fadeProbabilityDiversity: pGg ** n,
      },
      warnings,
    };
  },
  checks: [
    {
      // Cn² = 1e-14, 1550 nm, 2 km, point receiver: σ_R² = 1.23 Cn² k^(7/6) L^(11/6) = 0.709495; σ²lnX = 0.49σ_R²/(1 + 1.11σ_R^(12/5))^(7/6),
      // σ²lnY = 0.51σ_R²/(1 + 0.69σ_R^(12/5))^(5/6) give α = 4.986938, β = 3.303956, σ_I² = 0.563883. P(I < 0.1⟨I⟩) is the
      // integral of the gamma-gamma density 2(αβ)^((α+β)/2) I^((α+β)/2−1) K_(α−β)(2√(αβI))/(Γ(α)Γ(β)) (K by its integral
      // representation, Simpson rule in ln I with Richardson extrapolation): 8.789867e-3; the log-normal Φ((ln t + s²/2)/s), s² = ln(1 + σ_I²): 9.38694e-4.
      source: AL_HABASH,
      basis: "computed",
      inputs: { wavelength: 1550, cn2: 1e-14, distance: 2, fadeThreshold: 10, rxDiameter: 0, numChannels: 1 },
      expect: {
        rytovVariance: 0.7094954838291181, scintillationIndex: 0.5638833854198434, alpha: 4.98693816285847, beta: 3.303955719726169,
        fadeProbabilityGammaGamma: 0.00878986724816, fadeProbabilityLognormal: 0.0009386943090509692,
      },
      tolerance: 1e-6,
    },
    {
      // Cn² = 3e-15, 1064 nm, 3 km, 5 cm aperture (d² = kD²/(4L)), 6 dB fade, N = 2: α = 8.135208, β = 9.487708 from the
      // aperture-averaged variances (Andrews & Phillips 2005, with 0.65d², 0.9d², 0.62d²σ_R^(12/5)); σ_I² = 0.241278;
      // gamma-gamma 8.751634e-3, log-normal 3.07948e-3, P² = 7.65911e-5, by the same density integral.
      source: AL_HABASH + " Aperture averaging: Andrews L. C., Phillips R. L. (2005). Laser Beam Propagation through Random Media, 2nd ed. SPIE.",
      basis: "computed",
      inputs: { wavelength: 1064, cn2: 3e-15, distance: 3, fadeThreshold: 6, rxDiameter: 5, numChannels: 2 },
      expect: {
        rytovVariance: 0.6942671451729374, scintillationIndex: 0.24127799296408106, alpha: 8.135208347446135, beta: 9.48770759146948,
        fadeProbabilityGammaGamma: 0.00875163410614, fadeProbabilityLognormal: 0.003079478809047409,
        fadeProbabilityDiversity: 7.65911e-5,
      },
      tolerance: 1e-6,
    },
  ],
});
