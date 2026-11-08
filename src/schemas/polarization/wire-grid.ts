import { wireGridResponse } from "../../physics/polarization/wire-grid";
import { defineSchema } from "../types";

const ULRICH = "Ulrich R. (1967). Far-infrared properties of metallic mesh and its complementary structure. Infrared Physics " +
  "7(1), 37–55 (inductive and capacitive grids, shunt impedance Z across free space, t = 2Z/(2Z + Z₀)); Marcuvitz N. (1951). " +
  "Waveguide Handbook, MIT Radiation Laboratory Series vol. 10, ch. 5 (Z∥ = iZ₀(p/λ) ln csc(πw/2p), Babinet complement for E ⟂ strips). " +
  "https://doi.org/10.1016/0020-0891(67)90028-0";

export default defineSchema({
  href: "/polarization/wire-grid",
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "µm", toSI: 1e-6, siUnit: "m", default: 10.6, min: 0.2, max: 3000 },
    { key: "wireSpacing", label: "Period p", unit: "µm", toSI: 1e-6, siUnit: "m", default: 0.83, min: 0.01, max: 1000 },
    { key: "stripWidth", label: "Strip width w", unit: "µm", toSI: 1e-6, siUnit: "m", default: 0.415, min: 0.001, max: 1000 },
    { key: "stripThickness", label: "Strip thickness", unit: "µm", toSI: 1e-6, siUnit: "m", default: 0.1, min: 0.001, max: 100 },
    { key: "wireConductivity", label: "DC conductivity of the metal", unit: "S/m", toSI: 1, siUnit: "S/m", default: 3.77e7, min: 1e4, max: 1e9 },
  ],
  outputs: [
    { key: "tPerp", label: "T (E ⟂ strips, passed)", unit: "", toSI: 1, siUnit: "" },
    { key: "rPerp", label: "R (E ⟂ strips)", unit: "", toSI: 1, siUnit: "" },
    { key: "tPar", label: "T (E ∥ strips, blocked)", unit: "", toSI: 1, siUnit: "" },
    { key: "rPar", label: "R (E ∥ strips)", unit: "", toSI: 1, siUnit: "" },
    { key: "aPar", label: "A (E ∥ strips, ohmic loss)", unit: "", toSI: 1, siUnit: "" },
    { key: "extinctionDb", label: "Extinction ratio 10 log₁₀(T⟂/T∥)", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "periodRatio", label: "p/λ", unit: "", toSI: 1, siUnit: "" },
    { key: "zParRe", label: "Re Z∥ (per square)", unit: "Ω", toSI: 1, siUnit: "Ω" },
    { key: "zParIm", label: "Im Z∥ (per square)", unit: "Ω", toSI: 1, siUnit: "Ω" },
    { key: "zPerpIm", label: "Im Z⟂ (per square)", unit: "Ω", toSI: 1, siUnit: "Ω" },
    { key: "skinDepth", label: "Skin depth", unit: "nm", toSI: 1e-9, siUnit: "m" },
  ],
  validate({ wireSpacing, stripWidth }) {
    return stripWidth < wireSpacing ? undefined : "The strip width must be smaller than the period.";
  },
  compute({ wavelength, wireSpacing, stripWidth, stripThickness, wireConductivity }) {
    const grid = { period: wireSpacing, width: stripWidth, thickness: stripThickness, conductivity: wireConductivity };
    const g = wireGridResponse(grid, wavelength);
    const warnings: string[] = [];
    if (wireSpacing >= wavelength) {
      warnings.push("p ≥ λ: a diffraction order propagates and the quasi-static model does not apply (no result).");
    } else if (g.periodRatio > 0.5) {
      warnings.push(`p/λ = ${g.periodRatio.toFixed(2)}: the formulas are first order in p/λ and lose accuracy well before p reaches λ.`);
    }
    return {
      values: {
        tPerp: g.perpendicular.T,
        rPerp: g.perpendicular.R,
        tPar: g.parallel.T,
        rPar: g.parallel.R,
        aPar: g.parallel.A,
        extinctionDb: g.extinction > 0 && Number.isFinite(g.extinction) ? 10 * Math.log10(g.extinction) : NaN,
        periodRatio: g.periodRatio,
        zParRe: g.parallel.Z.re,
        zParIm: g.parallel.Z.im,
        zPerpIm: g.perpendicular.Z.im,
        skinDepth: g.skinDepth,
      },
      warnings,
    };
  },
  checks: [
    {
      // Defaults (p 0.83 µm, w 0.415 µm, h 0.1 µm, σ 3.77e7 S/m, λ 10.6 µm), shunt sheet T = 4|Z|²/|2Z + Z₀|², Z₀ = 376.730313412 Ω.
      // E ⟂: B = (4/Z₀)(p/λ) ln csc(π/4) = 0.10855/Z₀, Z⟂ = −i/B = −3470.5866 i Ω, T⟂ = 0.9970629054.
      // E ∥: Z∥ = iZ₀(p/λ) ln csc(π/4) + Z_strip p/w = 1.727147 + 11.948479 i Ω (δ = 15.41317 nm), T∥ = 0.004017580614,
      // so 10 log₁₀(T⟂/T∥) = 23.94757959 dB.
      source: ULRICH,
      basis: "computed",
      inputs: {},
      expect: { tPerp: 0.9970629054, tPar: 0.004017580614, extinctionDb: 23.94757959, zParRe: 1.727146926, zParIm: 11.94847901, zPerpIm: -3470.58658, skinDepth: 15.41317245 },
      tolerance: 1e-8,
    },
    {
      // p = 0.1 µm, w = 0.05 µm, h = 0.15 µm, λ = 1 µm: same formulas, T⟂ = 0.9952184430, T∥ = 0.009996072965,
      // 10 log₁₀(T⟂/T∥) = 19.98088998 dB, R∥ = Z₀²/|2Z∥ + Z₀|² = 0.9344149421.
      source: ULRICH,
      basis: "computed",
      inputs: { wavelength: 1, wireSpacing: 0.1, stripWidth: 0.05, stripThickness: 0.15 },
      expect: { tPerp: 0.9952184430, tPar: 0.009996072965, extinctionDb: 19.98088998, rPar: 0.9344149421 },
      tolerance: 1e-8,
    },
  ],
});
