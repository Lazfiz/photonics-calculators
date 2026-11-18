import { MAX_EXACT_MODE_V } from "../../physics/fiber-optics/step-index-modes";
import { vNumberProblem, vNumberSummary, type VInputMode } from "../../physics/fiber-optics/v-number";
import { defineSchema } from "../types";

const GLOGE = "Gloge D. (1971). Weakly guiding fibers. Applied Optics 10, 2252–2258. https://doi.org/10.1364/AO.10.002252 " +
  "(V = 2π a NA/λ, NA = √(n₁² − n₂²); LP_lm cutoff at the m-th zero of J_(l−1), LP01 has none; total mode count → V²/2); " +
  "LP11 cutoff at V = 2.405, the first zero of J₀.";

const modes: VInputMode[] = ["na", "indices"];
const NO_ANGLE = "The numerical aperture is above 1, so no ray is accepted from air at a half-angle of asin(NA).";

export default defineSchema({
  href: "/fiber-optics/v-number",
  choices: [
    {
      key: "inputMode",
      label: "Input mode",
      options: [
        { value: modes[0], label: "Numerical aperture (the indices are ignored)" },
        { value: modes[1], label: "Core and cladding indices (the NA input is ignored)" },
      ],
      default: "na",
    },
  ],
  inputs: [
    { key: "coreRadius", label: "Core radius a", unit: "µm", toSI: 1e-6, siUnit: "m", default: 4.1, min: 0.1, max: 1000 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 100, max: 20000 },
    { key: "na", label: "Numerical aperture NA", unit: "", toSI: 1, siUnit: "", default: 0.1246, min: 0.001, max: 1 },
    { key: "coreIndex", label: "Core index n₁", unit: "", toSI: 1, siUnit: "", default: 1.4494, min: 1, max: 4 },
    { key: "claddingIndex", label: "Cladding index n₂", unit: "", toSI: 1, siUnit: "", default: 1.444, min: 1, max: 4 },
  ],
  outputs: [
    { key: "V", label: "V-number", unit: "", toSI: 1, siUnit: "" },
    { key: "NA", label: "Numerical aperture", unit: "", toSI: 1, siUnit: "" },
    { key: "cutoff", label: "LP11 cutoff wavelength", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "guidedModes", label: "Guided modes (exact count)", unit: "", toSI: 1, siUnit: "" },
    { key: "approxModes", label: "Guided modes, V²/2 estimate", unit: "", toSI: 1, siUnit: "" },
    { key: "lpModes", label: "Guided LP modes", unit: "", toSI: 1, siUnit: "" },
    { key: "acceptanceAngle", label: "Acceptance half-angle in air", unit: "°", toSI: 1, siUnit: "°" },
  ],
  compute({ inputMode, coreRadius, wavelength, na, coreIndex, claddingIndex }) {
    const mode: VInputMode = inputMode === "indices" ? "indices" : "na";
    const s = vNumberSummary({ mode, a: coreRadius, lambda: wavelength, na, coreIndex, claddingIndex });
    const problem = vNumberProblem(mode, coreIndex, claddingIndex, s.V);
    const warnings: string[] = [];
    if (problem) warnings.push(`No result: ${problem}`);
    else if (!Number.isFinite(s.modes)) {
      warnings.push(`V = ${s.V.toPrecision(4)} is above ${MAX_EXACT_MODE_V}: the exact mode list is not computed; use the V²/2 estimate.`);
    }
    return {
      values: {
        V: s.V, NA: problem ? NaN : s.NA, cutoff: s.cutoff, guidedModes: s.modes, approxModes: s.approx,
        lpModes: problem ? NaN : s.lpModes.length, acceptanceAngle: problem ? NaN : s.acceptanceDeg,
      },
      warnings,
      reasons: problem
        ? {
            V: problem, NA: problem, cutoff: problem, approxModes: problem, lpModes: problem, guidedModes: problem,
            acceptanceAngle: problem,
          }
        : {
            guidedModes: `The exact count is only computed up to V = ${MAX_EXACT_MODE_V}.`,
            acceptanceAngle: NO_ANGLE,
          },
    };
  },
  checks: [
    {
      // a = 4.1 µm, λ = 1550 nm, NA = 0.1246: V = 2π a NA/λ = 2.07085680; λc = 2π a NA/j₀₁ with j₀₁ = 2.40482556 → 1334.74465 nm;
      // only LP01 is guided: 1 LP mode, 2 modes (two polarizations); V²/2 = 2.14422395; asin(0.1246) = 7.15765688°.
      source: GLOGE,
      basis: "computed",
      inputs: {},
      expect: {
        V: 2.070856803887589, cutoff: 1334.7446494627734, guidedModes: 2, lpModes: 1, approxModes: 2.14422395110376,
        acceptanceAngle: 7.157656880406496,
      },
      tolerance: 1e-8,
    },
    {
      // Indices n₁ = 1.45, n₂ = 1.44: NA = √(1.45² − 1.44²) = √0.0289 = 0.17; a = 25 µm, λ = 850 nm: V = 31.4159265;
      // LP cutoffs counted from the zeros of J_(l−1) below V (own Bessel integral, bisection): 129 LP modes, 496 modes
      // (2 per LP0m, 4 per LP_lm); V²/2 = 493.480220; λc = 11104.1474 nm; asin(0.17) = 9.78781906°.
      source: GLOGE,
      basis: "computed",
      inputs: { inputMode: "indices", coreRadius: 25, wavelength: 850, coreIndex: 1.45, claddingIndex: 1.44 },
      expect: {
        V: 31.41592653589801, NA: 0.17, cutoff: 11104.147438078538, guidedModes: 496, lpModes: 129, approxModes: 493.48022005447035,
        acceptanceAngle: 9.787819056714003,
      },
      tolerance: 1e-8,
    },
    {
      // a = 10 µm, λ = 1310 nm, NA = 0.2: V = 9.59264932; 13 LP modes, 46 modes (V²/2 = 46.0094605); λc = 5225.48115 nm; asin(0.2) = 11.5369590°.
      source: GLOGE,
      basis: "computed",
      inputs: { coreRadius: 10, wavelength: 1310, na: 0.2 },
      expect: { V: 9.592649323938302, cutoff: 5225.481147331065, guidedModes: 46, lpModes: 13, approxModes: 46.00946052602698 },
      tolerance: 1e-8,
    },
  ],
});
