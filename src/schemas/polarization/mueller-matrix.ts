import { MUELLER_ELEMENTS, applyMueller, chainMueller, type MuellerMatrix } from "../../physics/polarization/mueller";
import { degreeOfPolarization, isPhysicalStokes, polarizedIntensity, type Stokes } from "../../physics/polarization/stokes";
import { defineSchema } from "../types";

const GOLDSTEIN = "Goldstein D. H. (2011). Polarized Light, 3rd ed., ch. Mueller Matrices for Polarizing Components (polarizer, retarder and " +
  "rotator; S′ = M S, a chain acts as M = Mₙ ⋯ M₁), CRC Press. https://doi.org/10.1201/b10436";

const NONE = "none";
const elementChoice = <N extends number>(n: N, fallback: string) => ({
  key: `element${n}` as const,
  label: `Element ${n} (slot ${n}, acts in order; empty slots are skipped)`,
  options: [{ value: NONE, label: "None" }, ...Object.entries(MUELLER_ELEMENTS).map(([id, { label }]) => ({ value: id, label }))],
  default: fallback,
});

export default defineSchema({
  href: "/polarization/mueller-matrix",
  inputs: [
    { key: "s0", label: "Input S₀ (I)", unit: "", toSI: 1, siUnit: "", default: 1, min: 0.01, max: 100 },
    { key: "s1", label: "Input S₁", unit: "", toSI: 1, siUnit: "", default: 1, min: -100, max: 100 },
    { key: "s2", label: "Input S₂", unit: "", toSI: 1, siUnit: "", default: 0, min: -100, max: 100 },
    { key: "s3", label: "Input S₃", unit: "", toSI: 1, siUnit: "", default: 0, min: -100, max: 100 },
  ],
  choices: [elementChoice(1, "h-polarizer"), ...[2, 3, 4, 5, 6].map((n) => elementChoice(n, NONE))],
  outputs: [
    { key: "out0", label: "Output S₀", unit: "", toSI: 1, siUnit: "" },
    { key: "out1", label: "Output S₁", unit: "", toSI: 1, siUnit: "" },
    { key: "out2", label: "Output S₂", unit: "", toSI: 1, siUnit: "" },
    { key: "out3", label: "Output S₃", unit: "", toSI: 1, siUnit: "" },
    { key: "polarized", label: "Polarized intensity √(S₁² + S₂² + S₃²)", unit: "", toSI: 1, siUnit: "" },
    { key: "dop", label: "Output degree of polarization", unit: "%", toSI: 0.01, siUnit: "" },
  ],
  validate({ s0, s1, s2, s3 }) {
    const S: Stokes = [s0, s1, s2, s3];
    if (isPhysicalStokes(S)) return undefined;
    return `Not a physical Stokes vector: √(S₁² + S₂² + S₃²) = ${polarizedIntensity(S).toFixed(4)} exceeds S₀ = ${s0}.`;
  },
  compute({ s0, s1, s2, s3, element1, element2, element3, element4, element5, element6 }) {
    const S: Stokes = [s0, s1, s2, s3];
    const mats = [element1, element2, element3, element4, element5, element6]
      .map((id) => MUELLER_ELEMENTS[id]?.matrix)
      .filter((M): M is MuellerMatrix => M !== undefined);
    const out = applyMueller(chainMueller(mats), S);
    const lit = out[0] > 1e-12 * s0;
    const warnings: string[] = [];
    if (!lit) warnings.push("No light is left (for example crossed polarizers): the output has no defined polarization state.");
    return {
      values: {
        out0: out[0], out1: out[1], out2: out[2], out3: out[3],
        polarized: polarizedIntensity(out),
        dop: lit ? degreeOfPolarization(out) : NaN,
      },
      warnings,
    };
  },
  checks: [
    {
      // Default: horizontal light [1, 1, 0, 0] through an ideal horizontal polarizer (M = ½[[1,1,0,0],[1,1,0,0],0,0]):
      // S₀ = ½(1 + 1) = 1, S₁ = ½(1 + 1) = 1, S₂ = S₃ = 0, DOP = 100 %.
      source: GOLDSTEIN,
      basis: "computed",
      inputs: {},
      expect: { out0: 1, out1: 1, polarized: 1, dop: 100 },
      tolerance: 1e-8,
    },
    {
      // Malus: unpolarized [1, 0, 0, 0] → horizontal polarizer → [½, ½, 0, 0] → 45° polarizer (c = cos 90° = 0, s = 1):
      // S₀ = ½·½ + ½·c·½ = ¼, S₂ = ½·s·S₀-term = ¼; fully polarized, |S| = ¼ (S₁ = 0 to rounding).
      source: GOLDSTEIN,
      basis: "computed",
      inputs: { s1: 0, element2: "45-polarizer" },
      expect: { out0: 0.25, out2: 0.25, polarized: 0.25, dop: 100 },
      tolerance: 1e-8,
    },
    {
      // Linear +45° [1, 0, 1, 0] through a quarter-wave plate with fast axis horizontal (Γ = 90°): S₀ = 1 and
      // S₃ = ∓S₂ = ∓1 (sign by the Goldstein convention), so the output is circular, |S| = 1, DOP = 100 %.
      source: GOLDSTEIN,
      basis: "computed",
      inputs: { s1: 0, s2: 1, element1: "qwp-h" },
      expect: { out0: 1, polarized: 1, dop: 100 },
      tolerance: 1e-8,
    },
  ],
});
