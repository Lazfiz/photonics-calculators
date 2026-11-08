import { ABSORBER_MODELS, absorptionSummary } from "../../physics/spectroscopy/absorption-depth";
import { defineSchema } from "../types";

const BEER = "Beer–Lambert law, I(z) = I₀ exp(−αz): absorption depth δ = 1/α, depth for a fraction f absorbed −ln(1 − f)/α " +
  "and absorbed fraction 1 − exp(−αd) (e.g. M. Born, E. Wolf, Principles of Optics, 7th ed., Cambridge 1999, ch. 14, " +
  "with α = 4πk/λ₀); surface reflection not included.";

export default defineSchema({
  href: "/spectroscopy/absorption-depth",
  choices: [
    {
      key: "material", label: "Material", default: "silicon",
      options: [
        { value: "silicon", label: "Silicon (crystalline, 300 K)" },
        { value: "water", label: "Water (pure liquid)" },
        { value: "custom", label: "Custom α" },
      ],
    },
  ],
  inputs: [
    { key: "wavelength", label: "Wavelength (silicon 250–1450 nm, water 200–2500 nm; ignored for custom α)", unit: "nm", toSI: 1e-9, siUnit: "m", default: 550, min: 200, max: 2500 },
    { key: "absorptionCoeff", label: "Absorption coefficient α (custom material only)", unit: "cm⁻¹", toSI: 100, siUnit: "1/m", default: 1000, min: 0, max: 1e8 },
    { key: "thickness", label: "Layer thickness d", unit: "µm", toSI: 1e-6, siUnit: "m", default: 10, min: 0, max: 1e9 },
    { key: "wlMin", label: "Plot λ min (page chart only)", unit: "nm", toSI: 1e-9, siUnit: "m", default: 300, min: 200, max: 2500 },
    { key: "wlMax", label: "Plot λ max (page chart only)", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1200, min: 200, max: 2500 },
  ],
  outputs: [
    { key: "alpha", label: "Absorption coefficient α", unit: "cm⁻¹", toSI: 100, siUnit: "1/m" },
    { key: "delta", label: "Absorption depth δ = 1/α", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "d90", label: "Depth for 90 % absorbed", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "absorbed", label: "Absorbed within d", unit: "%", toSI: 0.01, siUnit: "" },
  ],
  validate({ material, wavelength }) {
    if (material === "custom") return undefined;
    const { min, max } = ABSORBER_MODELS[material === "water" ? "water" : "silicon"];
    if (wavelength < min || wavelength > max) {
      return `wavelength must lie within ${Math.round(min * 1e9)}–${Math.round(max * 1e9)} nm for ${material}`;
    }
    return undefined;
  },
  compute({ material, wavelength, absorptionCoeff, thickness }) {
    const m = material === "water" || material === "custom" ? material : "silicon";
    const s = absorptionSummary(m, wavelength, absorptionCoeff, thickness);
    const warnings: string[] = [];
    if (s.alpha === 0) warnings.push("α = 0: no absorption, so the depth is infinite and no depth reaches 90 % absorbed.");
    return { values: { alpha: s.alpha, delta: s.delta, d90: s.d90, absorbed: s.absorbed }, warnings };
  },
  checks: [
    {
      // α = 1000 cm⁻¹ = 1e5 1/m, d = 10 µm: δ = 1e-5 m = 10 µm; d90 = ln 10 · 10 µm = 23.02585093 µm;
      // absorbed = 1 − e^(−1) = 63.21205588 %.
      source: BEER,
      basis: "computed",
      inputs: { material: "custom", absorptionCoeff: 1000, thickness: 10 },
      expect: { alpha: 1000, delta: 10, d90: 23.02585092994046, absorbed: 63.21205588285577 },
      tolerance: 1e-8,
    },
    {
      // α = 100 cm⁻¹ = 1e4 1/m, d = 100 µm: δ = 100 µm; d90 = 230.2585093 µm; absorbed = 1 − e^(−1) = 63.21205588 %.
      source: BEER,
      basis: "computed",
      inputs: { material: "custom", absorptionCoeff: 100, thickness: 100 },
      expect: { delta: 100, d90: 230.2585092994046, absorbed: 63.21205588285577 },
      tolerance: 1e-8,
    },
  ],
});
