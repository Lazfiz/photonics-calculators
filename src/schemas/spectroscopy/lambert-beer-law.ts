import {
  absorbance, absorbanceFromNapierian, attenuationDb, concentrationForAbsorbance, epsilonForAbsorbance,
  massAbsorptionCoefficient, transmittance,
} from "../../physics/spectroscopy/lambert-beer-law";
import { defineSchema } from "../types";

const GOLD_BOOK = "IUPAC Compendium of Chemical Terminology (Gold Book), entries “absorbance”, “molar (decadic) " +
  "absorption coefficient” and “absorption coefficient”: A = ε c l, T = 10^−A, A = α l / ln 10.";

export default defineSchema({
  href: "/spectroscopy/lambert-beer-law",
  choices: [
    {
      key: "solve",
      label: "Solve for",
      options: [
        { value: "A", label: "Absorbance A from ε, c, l" },
        { value: "c", label: "Concentration c from A, ε, l" },
        { value: "eps", label: "Molar absorption coefficient ε from A, c, l" },
      ],
      default: "A",
    },
  ],
  inputs: [
    { key: "concentration", label: "Concentration c (input unless solving for c)", unit: "mol/L", toSI: 1000, siUnit: "mol/m³", default: 1e-5, min: 0, max: 10 },
    { key: "pathLength", label: "Path length l", unit: "cm", toSI: 1e-2, siUnit: "m", default: 1, min: 0.1, max: 10 },
    { key: "extinctionCoeff", label: "Molar absorption coefficient ε (input unless solving for ε)", unit: "L·mol⁻¹·cm⁻¹", toSI: 0.1, siUnit: "m²/mol", default: 50000, min: 0, max: 4e5 },
    { key: "absorbance", label: "Absorbance A (input when solving for c or ε)", unit: "", toSI: 1, siUnit: "", default: 0.5, min: 0, max: 6 },
    { key: "molarMass", label: "Molar mass M", unit: "g/mol", toSI: 1e-3, siUnit: "kg/mol", default: 500, min: 1, max: 1e6 },
    { key: "alpha", label: "Bulk slab: Napierian absorption coefficient α", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹", default: 1, min: 0, max: 1e5 },
    { key: "thickness", label: "Bulk slab: thickness d", unit: "mm", toSI: 1e-3, siUnit: "m", default: 10, min: 0.001, max: 1000 },
  ],
  outputs: [
    { key: "absorbance", label: "Absorbance A", unit: "", toSI: 1, siUnit: "" },
    { key: "transmittance", label: "Transmittance T = 10^−A", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "concentration", label: "Concentration c", unit: "mol/L", toSI: 1000, siUnit: "mol/m³" },
    { key: "extinctionCoeff", label: "Molar absorption coefficient ε", unit: "L·mol⁻¹·cm⁻¹", toSI: 0.1, siUnit: "m²/mol" },
    { key: "massConcentration", label: "Mass concentration ρ = c M", unit: "mg/L", toSI: 1e-3, siUnit: "kg/m³" },
    { key: "massAbsorptionCoeff", label: "Mass absorption coefficient a = ε/M", unit: "L·g⁻¹·cm⁻¹", toSI: 100, siUnit: "m²/kg" },
    { key: "slabTransmittance", label: "Bulk slab: internal transmittance e^(−αd)", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "slabAbsorbance", label: "Bulk slab: decadic absorbance αd/ln 10", unit: "", toSI: 1, siUnit: "" },
    { key: "slabLossDb", label: "Bulk slab: absorption loss", unit: "dB", toSI: 1, siUnit: "dB" },
  ],
  compute({ solve, concentration, pathLength, extinctionCoeff, absorbance: aIn, molarMass, alpha, thickness }) {
    // Two of A, c, ε are inputs; the third follows from A = ε c l.
    const A = solve === "A" ? absorbance(extinctionCoeff, concentration, pathLength) : aIn;
    const c = solve === "c" ? concentrationForAbsorbance(A, extinctionCoeff, pathLength) : concentration;
    const eps = solve === "eps" ? epsilonForAbsorbance(A, concentration, pathLength) : extinctionCoeff;
    const warnings: string[] = [];
    if (solve === "c" && !Number.isFinite(c)) warnings.push("ε = 0 absorbs nothing, so no concentration gives this A.");
    if (solve === "eps" && !Number.isFinite(eps)) warnings.push("c = 0 absorbs nothing, so no ε gives this A.");
    if (A > 2) {
      warnings.push("A is above ≈ 2 (T < 1 %): stray light and detector noise make measured absorbances read low.");
    }
    const slabA = absorbanceFromNapierian(alpha, thickness);
    return {
      values: {
        absorbance: A,
        transmittance: transmittance(A),
        concentration: c,
        extinctionCoeff: eps,
        massConcentration: c * molarMass,
        massAbsorptionCoeff: massAbsorptionCoefficient(eps, molarMass),
        slabTransmittance: transmittance(slabA),
        slabAbsorbance: slabA,
        slabLossDb: attenuationDb(slabA),
      },
      warnings,
    };
  },
  checks: [
    {
      // ε = 50 000 L mol⁻¹ cm⁻¹, c = 10 µM, l = 1 cm: A = 0.5, T = 10^−0.5 = 31.6228 %.
      source: GOLD_BOOK,
      basis: "computed",
      inputs: { solve: "A", concentration: 1e-5, pathLength: 1, extinctionCoeff: 50000 },
      expect: { absorbance: 0.5, transmittance: 31.6228 },
      tolerance: 1e-6,
    },
    {
      // A = 1 with ε = 116 000 L mol⁻¹ cm⁻¹ (rhodamine 6G near 530 nm) over 1 cm: c = 1/116 000 M = 8.6207 µM.
      source: GOLD_BOOK,
      basis: "computed",
      inputs: { solve: "c", absorbance: 1, extinctionCoeff: 116000, pathLength: 1 },
      expect: { concentration: 8.6207e-6 },
      tolerance: 1e-4,
    },
    {
      // α = 1 cm⁻¹ over 10 mm: αd = 1, T = e⁻¹ = 36.78794 %, A = 1/ln 10, loss 10 A = 4.342945 dB.
      source: GOLD_BOOK,
      basis: "computed",
      inputs: { alpha: 1, thickness: 10 },
      expect: { slabTransmittance: 36.78794, slabLossDb: 4.342945 },
      tolerance: 1e-6,
    },
  ],
});
