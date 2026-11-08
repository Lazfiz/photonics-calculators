import { absorptance, relativeQuantumYield, type QuantumYieldInput } from "../../physics/spectroscopy/quantum-yield";
import { defineSchema } from "../types";

const WURTH = "Würth C., Grabolle M., Pauli J., Spieles M., Resch-Genger U. (2013). Relative and absolute determination of " +
  "fluorescence quantum yields of transparent samples. Nat. Protoc. 8, 1535–1550, doi:10.1038/nprot.2013.087; " +
  "Φ_s = Φ_ref (F_s/F_ref)(f_ref/f_s)(n_s²/n_ref²), f = 1 − 10^(−A) (equation form as in the physics module header).";

export default defineSchema({
  href: "/spectroscopy/fluorescence-quantum-yield",
  inputs: [
    { key: "sampleInt", label: "Sample integrated emission F_s", unit: "", toSI: 1, siUnit: "", default: 50000, min: 0, max: 1e15 },
    { key: "refInt", label: "Reference integrated emission F_ref", unit: "", toSI: 1, siUnit: "", default: 80000, min: 0, max: 1e15 },
    { key: "sampleAbs", label: "Sample absorbance A_s at the excitation wavelength", unit: "", toSI: 1, siUnit: "", default: 0.05, min: 0, max: 5 },
    { key: "refAbs", label: "Reference absorbance A_ref at the excitation wavelength", unit: "", toSI: 1, siUnit: "", default: 0.1, min: 0, max: 5 },
    { key: "refQY", label: "Reference quantum yield Φ_ref", unit: "", toSI: 1, siUnit: "", default: 0.546, min: 0, max: 1 },
    { key: "refrIdxSample", label: "Refractive index of the sample solvent", unit: "", toSI: 1, siUnit: "", default: 1.333, min: 1, max: 3 },
    { key: "refrIdxRef", label: "Refractive index of the reference solvent", unit: "", toSI: 1, siUnit: "", default: 1.333, min: 1, max: 3 },
  ],
  outputs: [
    { key: "quantumYield", label: "Quantum yield Φ_s (absorptance form)", unit: "", toSI: 1, siUnit: "" },
    { key: "quantumYieldLinear", label: "Φ_s by the absorbance-ratio approximation", unit: "", toSI: 1, siUnit: "" },
    { key: "absorptanceSample", label: "Sample absorptance f_s = 1 − 10^(−A_s)", unit: "", toSI: 1, siUnit: "" },
    { key: "absorptanceReference", label: "Reference absorptance f_ref", unit: "", toSI: 1, siUnit: "" },
    { key: "indexFactor", label: "Refractive-index factor (n_s/n_ref)²", unit: "", toSI: 1, siUnit: "" },
  ],
  compute(i) {
    const q: QuantumYieldInput = {
      sampleEmission: i.sampleInt, referenceEmission: i.refInt,
      sampleAbsorbance: i.sampleAbs, referenceAbsorbance: i.refAbs,
      sampleIndex: i.refrIdxSample, referenceIndex: i.refrIdxRef, referenceYield: i.refQY,
    };
    const phi = relativeQuantumYield(q);
    const warnings: string[] = [];
    if (q.referenceEmission === 0) warnings.push("Undefined: the reference emission is 0.");
    else if (q.sampleAbsorbance === 0 || q.referenceAbsorbance === 0) warnings.push("Undefined: an absorbance is 0.");
    else if (phi > 1) warnings.push("Φ_s > 1: the inputs are inconsistent (check the standard, the absorbances and the detector).");
    if (Math.max(q.sampleAbsorbance, q.referenceAbsorbance) > 0.1) {
      warnings.push("A > 0.1: inner-filter effects are likely; dilute the samples.");
    }
    return {
      values: {
        quantumYield: phi,
        quantumYieldLinear: relativeQuantumYield(q, "absorbance"),
        absorptanceSample: absorptance(q.sampleAbsorbance),
        absorptanceReference: absorptance(q.referenceAbsorbance),
        indexFactor: (q.sampleIndex / q.referenceIndex) ** 2,
      },
      warnings,
    };
  },
  checks: [
    {
      // f(0.05) = 1 − 10^−0.05 = 0.10874906, f(0.1) = 0.20567177; Φ_s = 0.546 · (50000/80000) · (0.20567177/0.10874906) · 1
      // = 0.546 · 0.625 · 1.8912 = 0.64538938; absorbance ratio: 0.546 · 0.625 · 2 = 0.6825.
      source: WURTH,
      basis: "computed",
      inputs: {},
      expect: { quantumYield: 0.6453893826381407, quantumYieldLinear: 0.6825, absorptanceSample: 0.10874906186625449, absorptanceReference: 0.20567176527571854 },
      tolerance: 1e-8,
    },
    {
      // Equal absorbances cancel (f ratio = 1): Φ_s = 0.5 · (30000/60000) · 1 · (1.5/1.0)² = 0.5 · 0.5 · 2.25 = 0.5625, same for both forms.
      source: WURTH,
      basis: "computed",
      inputs: { sampleInt: 30000, refInt: 60000, sampleAbs: 0.1, refAbs: 0.1, refQY: 0.5, refrIdxSample: 1.5, refrIdxRef: 1 },
      expect: { quantumYield: 0.5625, quantumYieldLinear: 0.5625, indexFactor: 2.25 },
      tolerance: 1e-8,
    },
  ],
});
