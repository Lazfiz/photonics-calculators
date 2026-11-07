import {
  amplitudeWeightedLifetime, fractionalIntensities, intensityWeightedLifetime, quantumYield, type DecayComponent,
} from "../../physics/spectroscopy/fluorescence-lifetime";
import { defineSchema } from "../types";

const LAKOWICZ = "Lakowicz J. R. (2006). Principles of Fluorescence Spectroscopy, 3rd ed., ch. 4 (multi-exponential " +
  "decays); Sillen A., Engelborghs Y. (1998). The correct use of \"average\" fluorescence parameters. " +
  "Photochem. Photobiol. 67, 475–486.";

export default defineSchema({
  href: "/spectroscopy/fluorescence-lifetime",
  choices: [
    {
      key: "model",
      label: "Decay model",
      options: [
        { value: "single", label: "Single exponential" },
        { value: "bi", label: "Bi-exponential" },
      ],
      default: "single",
    },
  ],
  // The page has no upper limit on the amplitude (a.u.); 1e12 is the API's.
  inputs: [
    { key: "tau", label: "Lifetime τ (τ₁ in the bi-exponential model)", unit: "ns", toSI: 1e-9, siUnit: "s", default: 5, min: 0.001, max: 1e6 },
    { key: "amplitude", label: "Amplitude I₀", unit: "", toSI: 1, siUnit: "", default: 1, min: 0.01, max: 1e12 },
    { key: "tau2", label: "τ₂ (bi-exponential only)", unit: "ns", toSI: 1e-9, siUnit: "s", default: 1, min: 0.001, max: 1e6 },
    { key: "frac1", label: "Amplitude fraction α₁ (bi-exponential only)", unit: "", toSI: 1, siUnit: "", default: 0.7, min: 0, max: 1 },
    { key: "tMax", label: "Time range of the chart", unit: "ns", toSI: 1e-9, siUnit: "s", default: 30, min: 0.01, max: 1e6 },
    { key: "tauRad", label: "Radiative lifetime τ_rad", unit: "ns", toSI: 1e-9, siUnit: "s", default: 10, min: 0.001, max: 1e9 },
  ],
  outputs: [
    { key: "tauIntensity", label: "Intensity-weighted lifetime ⟨τ⟩ (single: τ)", unit: "ns", toSI: 1e-9, siUnit: "s" },
    { key: "tauAmplitude", label: "Amplitude-weighted lifetime ⟨τ⟩", unit: "ns", toSI: 1e-9, siUnit: "s" },
    { key: "f1", label: "Fractional intensity f₁", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "f2", label: "Fractional intensity f₂", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "decayRate", label: "Decay rate 1/τ", unit: "s⁻¹", toSI: 1, siUnit: "s⁻¹" },
    { key: "quantumYield", label: "Quantum yield Φ = ⟨τ⟩_amp/τ_rad", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ model, tau, amplitude, tau2, frac1, tauRad }) {
    const bi = model === "bi";
    const components: DecayComponent[] = bi
      ? [{ amplitude: amplitude * frac1, lifetime: tau }, { amplitude: amplitude * (1 - frac1), lifetime: tau2 }]
      : [{ amplitude, lifetime: tau }];
    const f = fractionalIntensities(components);
    const phi = quantumYield(components, tauRad);
    const warnings: string[] = [];
    if (bi) warnings.push("The decay rate 1/τ is shown for a single exponential only.");
    if (!Number.isFinite(phi)) warnings.push("Quantum yield is undefined: τ_rad must be at least ⟨τ⟩_amp.");
    return {
      values: {
        tauIntensity: intensityWeightedLifetime(components),
        tauAmplitude: amplitudeWeightedLifetime(components),
        f1: f[0],
        f2: bi ? f[1] : 0, // a single exponential has no second component
        decayRate: bi ? NaN : 1 / tau,
        quantumYield: phi,
      },
      warnings,
    };
  },
  checks: [
    {
      // Page defaults as bi-exponential: α₁ = 0.7 at 5 ns, α₂ = 0.3 at 1 ns: Σατ = 3.8 ns, Σατ² = 17.8 ns², f₁ = 3.5/3.8.
      source: LAKOWICZ,
      basis: "computed",
      inputs: { model: "bi" },
      expect: { tauAmplitude: 3.8, tauIntensity: 17.8 / 3.8, f1: 92.105263 },
      tolerance: 1e-6,
    },
    {
      // Fluorescein-like single exponential, τ = 4 ns and τ_rad = 4.3 ns: both averages equal τ and Φ = 4/4.3 = 0.930.
      source: LAKOWICZ,
      basis: "computed",
      inputs: { model: "single", tau: 4, tauRad: 4.3 },
      expect: { tauAmplitude: 4, tauIntensity: 4, quantumYield: 0.930233 },
      tolerance: 1e-6,
    },
  ],
});
