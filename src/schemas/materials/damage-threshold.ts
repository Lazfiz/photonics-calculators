import { THERMAL_SCALING_MIN_TAU, energyAtFluence, gaussianPeakFluence, scaleDamageThreshold } from "../../physics/materials/laser-damage";
import { defineSchema } from "../types";

const STUART = "Stuart B. C., Feit M. D., Herman S., Rubenchik A. M., Shore B. W., Perry M. D. (1996). Nanosecond-to-femtosecond " +
  "laser-induced breakdown in dielectrics. Phys. Rev. B 53, 1749, doi:10.1103/PhysRevB.53.1749: F_th ∝ τ^½ above ≈ 20 ps; " +
  "ISO 21254-1:2011 effective area πw²/2 of a Gaussian beam, so F_peak = 2E/(πw²).";
const LONG_PULSE = 1e-6;

export default defineSchema({
  href: "/materials/damage-threshold",
  inputs: [
    { key: "fRef", label: "Rated LIDT", unit: "J/cm²", toSI: 1e4, siUnit: "J/m²", default: 10, min: 0.001, max: 1e5 },
    { key: "tauRef", label: "Rated at pulse duration", unit: "ns", toSI: 1e-9, siUnit: "s", default: 10, min: 1e-6, max: 1e9 },
    { key: "tau", label: "Your pulse duration", unit: "ns", toSI: 1e-9, siUnit: "s", default: 5, min: 1e-6, max: 1e9 },
    { key: "exponent", label: "Scaling exponent a", unit: "", toSI: 1, siUnit: "", default: 0.5, min: 0, max: 1 },
    { key: "energy", label: "Pulse energy", unit: "J", toSI: 1, siUnit: "J", default: 0.1, min: 0, max: 1e6 },
    { key: "diameter", label: "Beam diameter, 1/e²", unit: "mm", toSI: 1e-3, siUnit: "m", default: 5, min: 0.001, max: 10000 },
  ],
  outputs: [
    { key: "lidt", label: "LIDT at your pulse, F_ref (τ/τ_ref)^a", unit: "J/cm²", toSI: 1e4, siUnit: "J/m²" },
    { key: "peakFluence", label: "Peak fluence 2E/(πw²)", unit: "J/cm²", toSI: 1e4, siUnit: "J/m²" },
    { key: "margin", label: "Threshold / peak", unit: "", toSI: 1, siUnit: "" },
    { key: "energyAtThreshold", label: "Energy at threshold πw²F_th/2", unit: "J", toSI: 1, siUnit: "J" },
  ],
  compute({ fRef, tauRef, tau, exponent, energy, diameter }) {
    const w = diameter / 2;
    const fTh = scaleDamageThreshold(fRef, tauRef, tau, exponent);
    const fPeak = gaussianPeakFluence(energy, w);
    const warnings: string[] = [];
    if (tau < THERMAL_SCALING_MIN_TAU || tauRef < THERMAL_SCALING_MIN_TAU) {
      warnings.push("A pulse duration is below 20 ps, where damage is driven by multiphoton and avalanche ionisation: the scaled value is not reliable there.");
    }
    if (tau > LONG_PULSE || tauRef > LONG_PULSE) {
      warnings.push("Beyond about 1 µs heating approaches the long-pulse/CW regime; the √τ law is not validated there.");
    }
    if (!(fPeak > 0)) warnings.push("Zero pulse energy: no peak fluence and no threshold ratio (the page shows an infinite ratio).");
    return {
      values: { lidt: fTh, peakFluence: fPeak, margin: fTh / fPeak, energyAtThreshold: energyAtFluence(fTh, w) },
      warnings,
    };
  },
  checks: [
    {
      // Rated 10 J/cm² at 10 ns scaled to τ = 1 ns: 10 · (0.1)^½ = 3.1622777 J/cm².
      // Beam 5 mm (w = 2.5 mm), E = 0.1 J: F_peak = 2 · 0.1 / (π · 6.25e-6 m²) = 10185.916 J/m² = 1.0185916 J/cm²;
      // margin 3.1622777 / 1.0185916 = 3.1045588; E at threshold π w² F_th / 2 = 0.31045588 J.
      source: STUART,
      basis: "computed",
      inputs: { fRef: 10, tauRef: 10, tau: 1, exponent: 0.5, energy: 0.1, diameter: 5 },
      expect: { lidt: 3.1622776601683795, peakFluence: 1.01859163578813, margin: 3.1045588330612826, energyAtThreshold: 0.3104558833061282 },
      tolerance: 1e-9,
    },
  ],
});
