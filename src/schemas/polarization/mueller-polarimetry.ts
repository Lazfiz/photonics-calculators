import { MUELLER_ELEMENT_KINDS, applyMueller, chainMueller, muellerElementKind, muellerElementMatrix } from "../../physics/polarization/mueller";
import { analyzerIntensity, degreeOfPolarization, isPhysicalStokes, polarizedIntensity, type Stokes } from "../../physics/polarization/stokes";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;
const GOLDSTEIN = "Goldstein D. H. (2011). Polarized Light, 3rd ed., ch. Mueller Matrices for Polarizing Components (S′ = M S, M = M₂M₁; " +
  "intensity behind an ideal analyzer ½(S₀ + S₁ cos 2θ + S₂ sin 2θ)), CRC Press. https://doi.org/10.1201/b10436";

const kindChoice = <N extends number>(n: N, fallback: string) => ({
  key: `element${n}` as const,
  label: `Element ${n}`,
  options: MUELLER_ELEMENT_KINDS.map((k) => ({ value: k, label: k[0].toUpperCase() + k.slice(1) })),
  default: fallback,
});
const paramInput = <N extends number>(n: N, def: number) => ({
  key: `param${n}` as const, label: `Element ${n} parameter: transmission axis (°), retardance (°), rotation (°) or depolarization (0–100 %)`,
  unit: "", toSI: 1, siUnit: "", default: def, min: -720, max: 720,
});
const axisInput = <N extends number>(n: N) => ({
  key: `axis${n}` as const, label: `Element ${n} fast axis (retarder only)`, unit: "°", toSI: 1, siUnit: "°", default: 0, min: -360, max: 360,
});

export default defineSchema({
  href: "/polarization/mueller-polarimetry",
  inputs: [
    { key: "s0", label: "Input S₀ (I)", unit: "", toSI: 1, siUnit: "", default: 1, min: 0.01, max: 100 },
    { key: "s1", label: "Input S₁", unit: "", toSI: 1, siUnit: "", default: 1, min: -100, max: 100 },
    { key: "s2", label: "Input S₂", unit: "", toSI: 1, siUnit: "", default: 0, min: -100, max: 100 },
    { key: "s3", label: "Input S₃", unit: "", toSI: 1, siUnit: "", default: 0, min: -100, max: 100 },
    paramInput(1, 90), axisInput(1), paramInput(2, 0), axisInput(2),
    { key: "analyzerAngle", label: "Analyzer angle", unit: "°", toSI: DEG, siUnit: "rad", default: 45, min: -360, max: 360 },
  ],
  choices: [kindChoice(1, "retarder"), kindChoice(2, "polarizer")],
  outputs: [
    { key: "out0", label: "Output S₀", unit: "", toSI: 1, siUnit: "" },
    { key: "out1", label: "Output S₁", unit: "", toSI: 1, siUnit: "" },
    { key: "out2", label: "Output S₂", unit: "", toSI: 1, siUnit: "" },
    { key: "out3", label: "Output S₃", unit: "", toSI: 1, siUnit: "" },
    { key: "polarized", label: "Polarized intensity |S|", unit: "", toSI: 1, siUnit: "" },
    { key: "dop", label: "Output degree of polarization", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "analyzed", label: "Intensity behind the analyzer", unit: "", toSI: 1, siUnit: "" },
  ],
  validate({ s0, s1, s2, s3 }) {
    const S: Stokes = [s0, s1, s2, s3];
    if (isPhysicalStokes(S)) return undefined;
    return `Not a physical Stokes vector: √(S₁² + S₂² + S₃²) = ${polarizedIntensity(S).toFixed(4)} exceeds S₀ = ${s0}.`;
  },
  compute({ s0, s1, s2, s3, element1, element2, param1, axis1, param2, axis2, analyzerAngle }) {
    const S: Stokes = [s0, s1, s2, s3];
    const M = chainMueller([
      muellerElementMatrix(muellerElementKind(element1, "retarder"), param1, axis1),
      muellerElementMatrix(muellerElementKind(element2, "polarizer"), param2, axis2),
    ]);
    const out = applyMueller(M, S);
    const lit = out[0] > 1e-12 * s0;
    const warnings: string[] = [];
    if (!lit) warnings.push("No light is left (for example crossed polarizers): the output has no defined polarization state.");
    return {
      values: {
        out0: out[0], out1: out[1], out2: out[2], out3: out[3],
        polarized: polarizedIntensity(out),
        dop: lit ? degreeOfPolarization(out) : NaN,
        analyzed: analyzerIntensity(out, analyzerAngle),
      },
      warnings,
    };
  },
  checks: [
    {
      // Default: H light [1, 1, 0, 0] through a quarter-wave plate with fast axis H (unchanged, it is an eigenstate),
      // then a horizontal polarizer: S₀ = ½(1 + 1) = 1, S₁ = 1, DOP = 100 %; analyzer at 45°: ½(1 + 1·cos 90°) = ½.
      source: GOLDSTEIN,
      basis: "computed",
      inputs: {},
      expect: { out0: 1, out1: 1, polarized: 1, dop: 100, analyzed: 0.5 },
      tolerance: 1e-8,
    },
    {
      // +45° light [1, 0, 1, 0] → QWP fast H → circular [1, 0, 0, ∓1] → horizontal polarizer: S₀ = ½, S₁ = ½, S₂ = S₃ = 0,
      // DOP = 100 %; analyzer at 45°: ½(½ + ½ cos 90°) = ¼.
      source: GOLDSTEIN,
      basis: "computed",
      inputs: { s1: 0, s2: 1 },
      expect: { out0: 0.5, out1: 0.5, polarized: 0.5, dop: 100, analyzed: 0.25 },
      tolerance: 1e-8,
    },
    {
      // H light → depolarizer with 50 % depolarization (d = 1 − 0.5 = 0.5: [1, ½, 0, 0]) → rotator by 0° (identity):
      // DOP = ½ = 50 %; analyzer at 45°: ½(1 + ½ cos 90°) = ½.
      source: GOLDSTEIN,
      basis: "computed",
      inputs: { element1: "depolarizer", param1: 50, element2: "rotator", param2: 0 },
      expect: { out0: 1, out1: 0.5, polarized: 0.5, dop: 50, analyzed: 0.5 },
      tolerance: 1e-8,
    },
  ],
});
