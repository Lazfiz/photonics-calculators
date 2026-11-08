import { N_A } from "../../physics/constants";
import {
  absorbance, crossSectionFromEpsilon, napierianAbsorptionCoefficient,
} from "../../physics/spectroscopy/lambert-beer-law";
import { defineSchema } from "../types";

const REF = "IUPAC Gold Book (Compendium of Chemical Terminology), entries \"absorption cross section\" (σ = κ/C), \"molar (decadic) " +
  "absorption coefficient\" and \"absorbance\": σ = ln 10 · ε/N_A, α = σ N_A c = ln 10 · ε c, A = ε c l; " +
  "1 L mol⁻¹ cm⁻¹ = 0.1 m²/mol, 1 mol/L = 1000 mol/m³.";
// Lab units → SI (as on the page): ε in L mol⁻¹ cm⁻¹ → m²/mol, c in mol/L → mol/m³, σ in cm² → m².
const EPS_SI = 0.1, CONC_SI = 1000, CM2 = 1e-4, CM = 0.01;
const EPS_MAX = 1e6;
const SIGMA_PER_EPS = crossSectionFromEpsilon(EPS_SI) / CM2; // cm² per L mol⁻¹ cm⁻¹
const SIGMA_MAX = EPS_MAX * SIGMA_PER_EPS; // cm², as on the page

export default defineSchema({
  href: "/spectroscopy/absorption-cross-section",
  choices: [
    {
      key: "from",
      label: "Convert from (ε → σ uses the ε input, σ → ε uses the σ input)",
      options: [{ value: "eps", label: "ε → σ" }, { value: "sigma", label: "σ → ε" }],
      default: "eps",
    },
  ],
  inputs: [
    { key: "extinctionCoeff", label: "Molar absorption coefficient ε (used when from = eps)", unit: "L·mol⁻¹·cm⁻¹", toSI: EPS_SI, siUnit: "m²/mol", default: 50000, min: 0, max: EPS_MAX },
    { key: "sigma", label: "Cross-section σ (used when from = sigma)", unit: "cm²", toSI: CM2, siUnit: "m²", default: 1.912e-16, min: 0, max: SIGMA_MAX },
    { key: "concentration", label: "Concentration", unit: "mol/L", toSI: CONC_SI, siUnit: "mol/m³", default: 1e-5, min: 0, max: 10 },
  ],
  outputs: [
    { key: "epsilon", label: "Molar absorption coefficient ε", unit: "L·mol⁻¹·cm⁻¹", toSI: EPS_SI, siUnit: "m²/mol" },
    { key: "crossSection", label: "Cross-section σ = ln 10 · ε/N_A", unit: "cm²", toSI: CM2, siUnit: "m²" },
    { key: "numberDensity", label: "Number density n = N_A c", unit: "cm⁻³", toSI: 1e6, siUnit: "m⁻³" },
    { key: "napierianCoefficient", label: "Napierian coefficient α = σ n", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹" },
    { key: "absorbance1cm", label: "Absorbance over 1 cm", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ from, extinctionCoeff, sigma, concentration }) {
    // SI in. σ → ε goes through the same cm²-per-ε factor as the page; ε → σ through crossSectionFromEpsilon.
    const eps = from === "sigma" ? (sigma / CM2 / SIGMA_PER_EPS) * EPS_SI : extinctionCoeff; // m²/mol
    const sigmaSI = crossSectionFromEpsilon(eps);
    const a1 = absorbance(eps, concentration, CM);
    const warnings: string[] = [];
    if (a1 > 2) warnings.push("Absorbance over 1 cm is above about 2: a spectrometer can't measure it; dilute.");
    return {
      values: {
        epsilon: eps,
        crossSection: sigmaSI,
        numberDensity: N_A * concentration,
        napierianCoefficient: napierianAbsorptionCoefficient(sigmaSI, concentration),
        absorbance1cm: a1,
      },
      warnings,
    };
  },
  checks: [
    {
      // ε = 50 000 L mol⁻¹ cm⁻¹ = 5000 m²/mol: σ = ln 10 · 5000/6.02214076e23 = 1.9117663e-20 m² = 1.9117663e-16 cm²;
      // c = 1e-5 mol/L: n = 6.02214076e15 cm⁻³; A(1 cm) = 50 000 · 1e-5 · 1 = 0.5; α = ln 10 · 0.5 = 1.1512925 cm⁻¹.
      source: REF,
      basis: "computed",
      inputs: {},
      expect: {
        epsilon: 50000,
        crossSection: 1.9117662512043688e-16,
        numberDensity: 6.02214076e15,
        napierianCoefficient: 1.151292546497023,
        absorbance1cm: 0.5,
      },
      tolerance: 1e-8,
    },
  ],
});
