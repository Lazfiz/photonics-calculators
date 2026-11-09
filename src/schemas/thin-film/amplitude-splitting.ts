import { filmFaceSummary } from "../../physics/thin-film/interference";
import { defineSchema } from "../types";

const pure = { unit: "", toSI: 1, siUnit: "" } as const;

export default defineSchema({
  href: "/thin-film/amplitude-splitting",
  inputs: [
    { key: "n1", label: "Incident medium index n₁", ...pure, default: 1.0, min: 0.1, max: 5 },
    { key: "nFilm", label: "Film index n", ...pure, default: 1.38, min: 0.1, max: 5 },
    { key: "n2", label: "Substrate index n₂", ...pure, default: 1.52, min: 0.1, max: 5 },
    // The thickness only shapes the page's R(λ), T(λ) chart; it is kept so the API takes the page's query.
    { key: "thickness", label: "Film thickness", unit: "nm", toSI: 1e-9, siUnit: "m", default: 200, min: 1, max: 10000 },
  ],
  outputs: [
    { key: "r01", label: "Amplitude reflection coefficient r₀₁ (incident/film)", ...pure },
    { key: "r12", label: "Amplitude reflection coefficient r₁₂ (film/substrate)", ...pure },
    { key: "coefficientOfFinesse", label: "Airy coefficient of finesse F", ...pure },
    { key: "finesse", label: "Finesse FSR/FWHM", ...pure },
  ],
  compute({ n1, nFilm, n2 }) {
    const { r01, r12, F, finesse } = filmFaceSummary(n1, nFilm, n2);
    return {
      values: { r01, r12, coefficientOfFinesse: F, finesse },
      warnings: Number.isFinite(finesse) ? [] : ["F < 1: the transmittance never falls to half its peak, so the finesse is undefined."],
    };
  },
  checks: [
    {
      // n₁ = n₂ = 1, n = 4: r₀₁ = (1 − 4)/(1 + 4) = −0.6, r₁₂ = +0.6, R₁ = R₂ = 0.36,
      // F = 4·0.36/(1 − 0.36)² = 1.44/0.4096 = 3.515625, finesse = 2π/(4 asin(1/√F)) = 2.79234688.
      source: "Born M., Wolf E. (1999). Principles of Optics, 7th ed., Cambridge University Press, §7.6.1 (Airy formulae: F = 4ρ/(1 − ρ)², half-intensity width 4 asin(1/√F)).",
      basis: "computed",
      inputs: { n1: 1, nFilm: 4, n2: 1 },
      expect: { r01: -0.6, r12: 0.6, coefficientOfFinesse: 3.515625, finesse: 2.79234688 },
      tolerance: 1e-8,
    },
  ],
});
