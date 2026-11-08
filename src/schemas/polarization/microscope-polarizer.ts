import { analyzerTransmission, microscopeExtinction, minimumRetardance } from "../../physics/polarization/microscope-extinction";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;
const MODEL = "Shurcliff W. A. (1962). Polarized Light: Production and Use, ch. 3 (two sheets with k₁, k₂: H₀ = (k₁² + k₂²)/2, " +
  "H₉₀ = k₁k₂), Harvard University Press; Inoué S., Hyde W. L. (1957). Studies on depolarization of light at microscope lens " +
  "surfaces II, J. Biophys. Biochem. Cytol. 3, 831. https://doi.org/10.1083/jcb.3.6.831";

export default defineSchema({
  href: "/polarization/microscope-polarizer",
  inputs: [
    { key: "logER", label: "Polarizer extinction ratio, log₁₀ ER (each sheet)", unit: "", toSI: 1, siUnit: "", default: 4, min: 1, max: 6 },
    { key: "analyzer", label: "Analyzer angle from crossed", unit: "°", toSI: DEG, siUnit: "rad", default: 0, min: -90, max: 90 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 546, min: 200, max: 2000 },
    { key: "condenserNA", label: "Condenser NA", unit: "", toSI: 1, siUnit: "", default: 0.5, min: 0, max: 0.95 },
    { key: "objectiveNA", label: "Objective NA", unit: "", toSI: 1, siUnit: "", default: 0.65, min: 0, max: 0.95 },
    { key: "surfaces", label: "Uncoated flat air–glass surfaces m in the cone", unit: "", toSI: 1, siUnit: "", default: 2, min: 0, max: 8 },
    { key: "glassIndex", label: "Glass index n", unit: "", toSI: 1, siUnit: "", default: 1.52, min: 1, max: 2.5 },
  ],
  outputs: [
    { key: "systemER", label: "System extinction ratio I_parallel / I_crossed", unit: "", toSI: 1, siUnit: "" },
    { key: "systemERdB", label: "System extinction ratio", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "sheetsER", label: "Polarizers alone (ER + 1/ER)/2", unit: "", toSI: 1, siUnit: "" },
    { key: "surfacesER", label: "Surfaces alone (ideal polarizers), G/L", unit: "", toSI: 1, siUnit: "" },
    { key: "minRetardance", label: "Smallest visible retardance", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "crossed", label: "Crossed transmission (unpolarized source, k₁ = 1)", unit: "", toSI: 1, siUnit: "" },
    { key: "parallel", label: "Parallel transmission (unpolarized source, k₁ = 1)", unit: "", toSI: 1, siUnit: "" },
    { key: "atAngle", label: "Transmission at the analyzer angle", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ logER, analyzer, wavelength, condenserNA, objectiveNA, surfaces, glassIndex }) {
    const ER = 10 ** logER;
    const NAeff = Math.min(condenserNA, objectiveNA);
    const m = Math.round(surfaces);
    const e = microscopeExtinction(ER, glassIndex, m, NAeff);
    const sheetsOnly = microscopeExtinction(ER, glassIndex, 0, 0);
    const warnings: string[] = [];
    if (e.ERsurfaces === Infinity) warnings.push("The surfaces alone leak nothing (no surfaces or no cone): the surfaces-alone ratio is infinite.");
    return {
      values: {
        systemER: e.ER,
        systemERdB: 10 * Math.log10(e.ER),
        sheetsER: sheetsOnly.ER,
        surfacesER: e.ERsurfaces,
        minRetardance: minimumRetardance(wavelength, e.ER),
        crossed: e.crossed,
        parallel: e.parallel,
        atAngle: analyzerTransmission(e, Math.PI / 2 - analyzer),
      },
      warnings,
    };
  },
  checks: [
    {
      // No surfaces, ER = 10⁴ (k₂ = 10⁻⁴, G = 1, L = 0): crossed = k₂ = 1e-4, parallel = ½(1 + k₂²) = 0.500000005,
      // ER_sys = parallel/crossed = (ER + 1/ER)/2 = 5000.00005; at 0° from crossed the transmission is the crossed one.
      source: MODEL,
      basis: "computed",
      inputs: { surfaces: 0 },
      expect: { systemER: 5000.00005, sheetsER: 5000.00005, crossed: 1e-4, parallel: 0.500000005, atAngle: 1e-4 },
      tolerance: 1e-8,
    },
    {
      // Same, λ = 546 nm: R_min = (λ/π) asin(1/√ER_sys) = (546/π) asin(1/√5000.00005) nm = 173.80 × 0.0141421... = 2.457945 nm.
      source: MODEL,
      basis: "computed",
      inputs: { surfaces: 0 },
      expect: { minRetardance: 2.4579454669775918 },
      tolerance: 1e-8,
    },
  ],
});
