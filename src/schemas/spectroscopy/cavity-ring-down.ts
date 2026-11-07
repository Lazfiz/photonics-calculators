import { c } from "../../physics/constants";
import {
  absorptionFromRingDown, cavityFinesse, minDetectableAbsorption, noiseEquivalentAbsorption, ringDownTime, roundTripLoss,
} from "../../physics/spectroscopy/cavity-ring-down";
import { defineSchema } from "../types";

const BERDEN = "Berden G., Peeters R., Meijer G. (2000). Cavity ring-down spectroscopy: Experimental schemes and " +
  "applications. Int. Rev. Phys. Chem. 19, 565–607 (α = (1/c)(1/τ − 1/τ₀), α_min = (Δτ/τ)/(cτ₀)). " +
  "https://doi.org/10.1080/014423500750040627";

export default defineSchema({
  href: "/spectroscopy/cavity-ring-down",
  inputs: [
    { key: "mirrorReflectivity", label: "Mirror reflectivity R", unit: "%", toSI: 0.01, siUnit: "", default: 99.99, min: 50, max: 99.99999 },
    { key: "cavityLength", label: "Cavity length", unit: "cm", toSI: 1e-2, siUnit: "m", default: 100, min: 1, max: 1000 },
    { key: "baseLoss", label: "Other round-trip loss", unit: "%", toSI: 0.01, siUnit: "", default: 0, min: 0, max: 50 },
    { key: "sampleAbsorbance", label: "Sample absorbance per pass (base 10)", unit: "", toSI: 1, siUnit: "", default: 0.001, min: 0, max: 1 },
    { key: "tauNoise", label: "Ring-down time noise Δτ/τ per decay", unit: "%", toSI: 0.01, siUnit: "", default: 1, min: 0.001, max: 50 },
    { key: "repRate", label: "Decays averaged per second", unit: "Hz", toSI: 1, siUnit: "Hz", default: 10, min: 0.01, max: 1e6 },
  ],
  outputs: [
    { key: "tau0", label: "Empty-cavity ring-down time τ₀", unit: "µs", toSI: 1e-6, siUnit: "s" },
    { key: "effectivePath", label: "Effective path cτ₀", unit: "km", toSI: 1e3, siUnit: "m" },
    { key: "tau", label: "Ring-down time with sample τ", unit: "µs", toSI: 1e-6, siUnit: "s" },
    { key: "roundTripLoss", label: "Round-trip loss Λ with sample", unit: "", toSI: 1, siUnit: "" },
    { key: "alpha", label: "Sample absorption coefficient α", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹" },
    { key: "alphaMin", label: "Minimum detectable α", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹" },
    { key: "nea", label: "Noise-equivalent absorption, averaged", unit: "cm⁻¹ Hz⁻¹ᐟ²", toSI: 100, siUnit: "m⁻¹ Hz⁻¹ᐟ²" },
    { key: "finesse", label: "Finesse ℱ", unit: "", toSI: 1, siUnit: "" },
    { key: "modeSpacing", label: "Mode spacing c/2L", unit: "MHz", toSI: 1e6, siUnit: "Hz" },
    { key: "modeFwhm", label: "Mode FWHM 1/(2πτ)", unit: "kHz", toSI: 1e3, siUnit: "Hz" },
  ],
  compute({ mirrorReflectivity: R, cavityLength: L, baseLoss, sampleAbsorbance: A, tauNoise, repRate }) {
    const loss0 = roundTripLoss(R, R, baseLoss, 0);
    const loss = roundTripLoss(R, R, baseLoss, A);
    const tau0 = ringDownTime(L, loss0);
    const tau = ringDownTime(L, loss);
    const alphaMin = minDetectableAbsorption(tau0, tauNoise);
    const warnings: string[] = [];
    if (!Number.isFinite(tau0)) warnings.push("The empty cavity has no round-trip loss, so it has no ring-down time.");
    return {
      values: {
        tau0,
        effectivePath: c * tau0,
        tau,
        roundTripLoss: loss,
        alpha: absorptionFromRingDown(tau, tau0),
        alphaMin,
        nea: noiseEquivalentAbsorption(alphaMin, repRate),
        finesse: cavityFinesse(loss),
        modeSpacing: c / (2 * L),
        modeFwhm: 1 / (2 * Math.PI * tau),
      },
      warnings,
    };
  },
  checks: [
    {
      // R = 99.99 %, L = 1 m: τ₀ = 2L/(cΛ), Λ = −2 ln R; 0.001 absorbance per pass shortens it to 1.3884 µs.
      source: BERDEN,
      basis: "computed",
      inputs: { mirrorReflectivity: 99.99, cavityLength: 100, baseLoss: 0, sampleAbsorbance: 0.001 },
      expect: { tau0: 33.3547, tau: 1.38835 },
      tolerance: 1e-5,
    },
    {
      // α recovered from the two ring-down times is the filled-cavity A ln 10/L = 2.3026e-5 cm⁻¹.
      source: BERDEN,
      basis: "computed",
      inputs: { mirrorReflectivity: 99.99, cavityLength: 100, baseLoss: 0, sampleAbsorbance: 0.001 },
      expect: { alpha: 0.001 * Math.LN10 * 1e-2 },
      tolerance: 1e-8,
    },
    {
      // Lossless symmetric mirrors R = 0.8: ρ = R, so ℱ = π√R/(1 − R) = 14.0496 as for an etalon.
      source: "Siegman A. E. (1986). Lasers, §11.3 (finesse ℱ = π√ρ/(1 − ρ)). University Science Books.",
      basis: "computed",
      inputs: { mirrorReflectivity: 80, baseLoss: 0, sampleAbsorbance: 0 },
      expect: { finesse: 14.0496 },
      tolerance: 1e-5,
    },
  ],
});
