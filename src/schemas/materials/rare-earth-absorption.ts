import { DOPANT_LINES, SIGMA_UNIT, dopantLineAbsorption } from "../../physics/materials/dopant-absorption";
import { defineSchema } from "../types";

const GILES = "Giles C. R., Desurvire E. (1991). Modeling erbium-doped fiber amplifiers. J. Lightwave Technol. 9, 271, " +
  "doi:10.1109/50.65886, absorption with no population in the upper level: α = Γσ_aN (unpumped sample), absorption in dB/m = " +
  "10·log₁₀(e)·α, transmission e^(−αL); ion density N = ppm·10⁻⁶·ρ·N_A/M with the silica density ρ = 2201 kg/m³.";
const lineLabel = (l: (typeof DOPANT_LINES)[number]) => `${l.ion} ${Math.round(l.lambda * 1e9)} nm (${l.role})`;

export default defineSchema({
  href: "/materials/rare-earth-absorption",
  choices: [
    { key: "line", label: "Dopant and wavelength", options: DOPANT_LINES.map((l) => ({ value: l.id, label: lineLabel(l) })), default: "Yb976" },
  ],
  inputs: [
    { key: "sigmaA", label: "Absorption cross-section σ_a (0 = the line's preset)", unit: "×10⁻²⁵ m²", toSI: SIGMA_UNIT, siUnit: "m²", default: 0, min: 0, max: 1000 },
    { key: "dopantConcentration", label: "Ion concentration in silica", unit: "wt-ppm", toSI: 1e-6, siUnit: "", default: 1000, min: 0, max: 50000 },
    { key: "overlap", label: "Overlap Γ (1 = bulk sample)", unit: "", toSI: 1, siUnit: "", default: 1, min: 0, max: 1 },
    { key: "length", label: "Path length", unit: "m", toSI: 1, siUnit: "m", default: 0.1, min: 1e-4, max: 1000 },
  ],
  outputs: [
    { key: "ionDensity", label: "Ion density N", unit: "m⁻³", toSI: 1, siUnit: "m⁻³" },
    { key: "alpha", label: "Absorption coefficient α = Γσ_aN", unit: "m⁻¹", toSI: 1, siUnit: "m⁻¹" },
    { key: "absorption", label: "Absorption 10·log₁₀(e)·α", unit: "dB/m", toSI: 1, siUnit: "dB/m" },
    { key: "absorptionLength", label: "Absorption length 1/α", unit: "m", toSI: 1, siUnit: "m" },
    { key: "loss", label: "Loss over the path", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "transmission", label: "Transmitted e^(−αL), unpumped", unit: "%", toSI: 0.01, siUnit: "" },
  ],
  compute({ line, sigmaA, dopantConcentration, overlap, length }) {
    // sigmaA arrives in m² (0 = preset); the physics function takes the page's 1e-25 m² unit.
    const r = dopantLineAbsorption(line, sigmaA / SIGMA_UNIT, dopantConcentration / 1e-6, overlap, length);
    const warnings: string[] = [];
    if (r.alpha === 0) warnings.push("No absorption at zero concentration or overlap: the absorption length is unbounded.");
    return {
      values: {
        ionDensity: r.N, alpha: r.alpha, absorption: r.dbPerM, absorptionLength: r.absorptionLength, loss: r.lossDb, transmission: r.transmission,
      },
      warnings,
    };
  },
  checks: [
    {
      // Yb 976 nm preset σ_a = 2.69e-24 m² (DOPANT_PRESETS, Melkumov 2004; not re-verified here), 1000 wt-ppm, Γ = 1, 0.1 m:
      // N = 1000e-6 · 2201 · 6.02214076e23/0.173045 = 7.6597023e24 m⁻³; α = σN = 20.604599 m⁻¹; 10·log₁₀(e)·α = 89.484637 dB/m;
      // 1/α = 0.048532854 m; loss 8.9484637 dB; T = e^(−2.0604599) = 12.739537 %.
      source: GILES,
      basis: "computed",
      inputs: { line: "Yb976", dopantConcentration: 1000, overlap: 1, length: 0.1 },
      expect: {
        ionDensity: 7.659702281348782e24, alpha: 20.604599136828224, absorption: 89.48463706953004,
        absorptionLength: 0.04853285392059005, loss: 8.948463706953005, transmission: 12.739536554763964,
      },
      tolerance: 1e-8,
    },
    {
      // Er (M = 0.167259 kg/mol), entered σ_a = 2.0e-25 m², 100 wt-ppm, Γ = 0.5, 1 m: N = 100e-6 · 2201 · N_A/0.167259 = 7.9246748e23 m⁻³;
      // α = 0.5 · 2.0e-25 · N = 0.079246748 m⁻¹; 0.34416425 dB/m (= loss over 1 m); 1/α = 12.618814 m; T = e^(−0.079246748) = 92.381195 %.
      source: GILES,
      basis: "computed",
      inputs: { line: "Er1550", sigmaA: 2, dopantConcentration: 100, overlap: 0.5, length: 1 },
      expect: {
        ionDensity: 7.924674793440114e23, alpha: 0.07924674793440115, absorption: 0.3441642533668834,
        absorptionLength: 12.6188143496788, loss: 0.3441642533668834, transmission: 92.38119476299866,
      },
      tolerance: 1e-8,
    },
  ],
});
