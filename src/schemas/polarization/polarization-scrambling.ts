import {
  J0_ZERO, combinationLock, combinationResonance, lockedGroup, scramblerResidualDop, stageResonance, worstCaseResidualDop,
  type ScramblerStage,
} from "../../physics/polarization/scrambler";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;
const GOLDSTEIN = "Goldstein D. H. (2011). Polarized Light, 3rd ed., CRC Press, ch. Mueller Matrices for Polarizing Components, " +
  "pp. 93–115 (linear retarder Mueller matrix); Watson G. N. (1944). A Treatise on the Theory of Bessel Functions, 2nd ed., " +
  "Cambridge University Press, ch. 2 The Bessel coefficients (J₀).";

/** The five inputs of stage `n`, keeping literal key types. */
const stageInputs = <N extends 1 | 2 | 3>(n: N, axis: number, kHz: number) => [
  { key: `axis${n}` as const, label: `Stage ${n} fast-axis azimuth`, unit: "°", toSI: DEG, siUnit: "rad", default: axis, min: -180, max: 180 },
  { key: `amplitude${n}` as const, label: `Stage ${n} drive amplitude Γm`, unit: "rad", toSI: 1, siUnit: "rad", default: J0_ZERO, min: 0, max: 20 },
  { key: `bias${n}` as const, label: `Stage ${n} bias Γ0`, unit: "rad", toSI: 1, siUnit: "rad", default: 0, min: -20, max: 20 },
  { key: `frequency${n}` as const, label: `Stage ${n} drive frequency`, unit: "kHz", toSI: 1e3, siUnit: "Hz", default: kHz, min: 0.01, max: 1000 },
  { key: `phase${n}` as const, label: `Stage ${n} drive phase φ`, unit: "°", toSI: DEG, siUnit: "rad", default: 0, min: -360, max: 360 },
];

export default defineSchema({
  href: "/polarization/polarization-scrambling",
  choices: [
    { key: "waveform", label: "Drive waveform (all stages)", options: [{ value: "sine", label: "Sine" }, { value: "ramp", label: "Ramp" }], default: "sine" },
  ],
  inputs: [
    { key: "stages", label: "Number of stages (rounded to an integer)", unit: "", toSI: 1, siUnit: "", default: 2, min: 1, max: 3 },
    { key: "azimuth", label: "Input azimuth ψ", unit: "°", toSI: DEG, siUnit: "rad", default: 45, min: -90, max: 90 },
    { key: "ellipticity", label: "Input ellipticity χ", unit: "°", toSI: DEG, siUnit: "rad", default: 0, min: -45, max: 45 },
    ...stageInputs(1, 0, 1),
    ...stageInputs(2, 45, 1.4142),
    ...stageInputs(3, 0, 2.2361),
  ],
  outputs: [
    { key: "residualDop", label: "Residual DOP, this input (long-time average)", unit: "", toSI: 1, siUnit: "" },
    { key: "worstResidualDop", label: "Residual DOP, worst case over all fully polarized inputs", unit: "", toSI: 1, siUnit: "" },
  ],
  compute(si) {
    const n = Math.round(si.stages);
    const waveform = si.waveform === "ramp" ? "ramp" : "sine";
    const all: ScramblerStage[] = [
      { axis: si.axis1, bias: si.bias1, amplitude: si.amplitude1, frequency: si.frequency1, waveform, phase: si.phase1 },
      { axis: si.axis2, bias: si.bias2, amplitude: si.amplitude2, frequency: si.frequency2, waveform, phase: si.phase2 },
      { axis: si.axis3, bias: si.bias3, amplitude: si.amplitude3, frequency: si.frequency3, waveform, phase: si.phase3 },
    ];
    const stages = all.slice(0, n);
    const warnings: string[] = [];
    if (n === 1) warnings.push("One stage cannot scramble light on its own axis: the Stokes component along its eigen-axis is never touched.");
    const locked = lockedGroup(stages);
    if (locked) warnings.push("Two or more stages are locked: the long-time values average over their common period and depend on the drive phases.");
    else if (combinationLock(stages)) warnings.push("The stage frequencies satisfy a combination relation: the long-time values depend on the drive phases.");
    if (combinationResonance(stages.map((s) => s.frequency)) || stageResonance(stages.map((s) => s.frequency))) {
      warnings.push("Stage frequencies are near a resonance: the long-time values hold only for averaging times well beyond the beat period.");
    }
    return {
      values: {
        residualDop: scramblerResidualDop(stages, si.azimuth, si.ellipticity),
        worstResidualDop: worstCaseResidualDop(stages),
      },
      warnings,
    };
  },
  checks: [
    {
      // One sine-driven stage, fast axis 0°, bias 0, Γm = 2 rad, input linear at 45° (S = (1, 0, 1, 0)): ⟨sin Γ⟩ = 0 and
      // ⟨cos Γ⟩ = J₀(2), so the output is (1, 0, J₀(2), 0) with DOP = J₀(2) = Σ(−1)^k/(k!)² = 0.2238907791412357; the
      // eigen-axis component (S1) is untouched, so the worst case is 1.
      source: GOLDSTEIN,
      basis: "computed",
      inputs: { stages: 1, amplitude1: 2 },
      expect: { residualDop: 0.2238907791412357, worstResidualDop: 1 },
      tolerance: 1e-8,
    },
    {
      // One ramp-driven stage, bias 0, Γm = π/2: ⟨cos Γ⟩ = sin(π/2)/(π/2) = 2/π, ⟨sin Γ⟩ = (1 − cos(π/2))/(π/2) = 2/π; input at
      // 45° has S2 = 1, so the output (1, 0, 2/π, ∓2/π) has DOP = √2·2/π = 0.9003163161571061.
      source: GOLDSTEIN,
      basis: "computed",
      inputs: { stages: 1, waveform: "ramp", amplitude1: Math.PI / 2 },
      expect: { residualDop: 0.9003163161571061 },
      tolerance: 1e-8,
    },
  ],
});
