import { SMF28_EQUIVALENT, bendLossPerTurnDb, lp11CutoffWavelength, modeFieldRadius, vNumber } from "../../physics/fiber-optics/macro-bending-loss";
import { defineSchema } from "../types";

const MARCUSE_1977 = "Marcuse D. (1977). Loss analysis of single-mode fiber splices. Bell Syst. Tech. J. 56, 703–718, " +
  "doi:10.1002/j.1538-7305.1977.tb00534.x; Gaussian fit w/a = 0.65 + 1.619 V^(−3/2) + 2.879 V^(−6), V = 2π a NA/λ; " +
  "LP11 cutoff at V = 2.405 (first zero of J₀).";

export default defineSchema({
  href: "/fiber-optics/bend-insensitive",
  inputs: [
    { key: "radius", label: "Bend radius", unit: "mm", toSI: 1e-3, siUnit: "m", default: 7.5, min: 1, max: 100 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 800, max: 1700 },
    { key: "designRadius", label: "Design core radius", unit: "µm", toSI: 1e-6, siUnit: "m", default: 3.4, min: 1, max: 10 },
    { key: "designNA", label: "Design NA", unit: "", toSI: 1, siUnit: "", default: 0.15, min: 0.05, max: 0.35 },
    { key: "coreIndex", label: "Core index n₁", unit: "", toSI: 1, siUnit: "", default: 1.4494, min: 1, max: 4 },
    { key: "elastoOptic", label: "Elasto-optic correction (1 = on, 0 = off)", unit: "", toSI: 1, siUnit: "", default: 1, min: 0, max: 1 },
  ],
  outputs: [
    { key: "smfLoss", label: "Standard SMF bend loss per turn", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "designLoss", label: "Design bend loss per turn", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "smfV", label: "Standard SMF V at the wavelength", unit: "", toSI: 1, siUnit: "" },
    { key: "designV", label: "Design V at the wavelength", unit: "", toSI: 1, siUnit: "" },
    { key: "smfCutoff", label: "Standard SMF LP11 cutoff", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "designCutoff", label: "Design LP11 cutoff", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "smfMfd1550", label: "Standard SMF mode-field diameter at 1550 nm", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "designMfd1310", label: "Design mode-field diameter at 1310 nm", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "designMfd1550", label: "Design mode-field diameter at 1550 nm", unit: "µm", toSI: 1e-6, siUnit: "m" },
  ],
  compute({ radius, wavelength, designRadius, designNA, coreIndex, elastoOptic }) {
    const smf = { ...SMF28_EQUIVALENT, n1: coreIndex };
    const design = { a: designRadius, NA: designNA, n1: coreIndex };
    const eo = elastoOptic === 1;
    const smfLoss = bendLossPerTurnDb(smf, wavelength, radius, undefined, eo);
    const designLoss = bendLossPerTurnDb(design, wavelength, radius, undefined, eo);
    const warnings: string[] = [];
    if (!Number.isFinite(smfLoss) || !Number.isFinite(designLoss)) {
      warnings.push("No result: the model needs V ≥ 0.5 for both fibres and NA < n₁.");
    }
    return {
      values: {
        smfLoss,
        designLoss,
        smfV: vNumber(smf, wavelength),
        designV: vNumber(design, wavelength),
        smfCutoff: lp11CutoffWavelength(smf),
        designCutoff: lp11CutoffWavelength(design),
        smfMfd1550: 2 * modeFieldRadius(smf, 1550e-9),
        designMfd1310: 2 * modeFieldRadius(design, 1310e-9),
        designMfd1550: 2 * modeFieldRadius(design, 1550e-9),
      },
      warnings,
    };
  },
  checks: [
    {
      // Design a = 3.4 µm, NA 0.15 at 1550 nm: V = 2π · 3.4e-6 · 0.15/1.55e-6 = 2π · 0.329032 = 2.067371;
      // λc = 2π · 3.4e-6 · 0.15/2.404826 = 3.20442e-6/2.404826 = 1332.4977 nm;
      // MFD1550: V^1.5 = 2.972539, V^6 = 78.07466 → w/a = 0.65 + 0.544652 + 0.036875 = 1.231527, MFD = 2 · 3.4 · 1.231527 = 8.37439 µm.
      source: MARCUSE_1977,
      basis: "computed",
      inputs: {},
      expect: { designV: 2.0673706494590895, designCutoff: 1332.4976925694214, designMfd1550: 8.374385277279679 },
      tolerance: 1e-8,
    },
    {
      // Design at 1310 nm: V = 2π · 3.4e-6 · 0.15/1.31e-6 = 2.446126; w/a = 0.65 + 1.619/V^1.5 + 2.879/V^6 = 0.65 + 0.423183 + 0.013439 → MFD = 7.389033 µm.
      source: MARCUSE_1977,
      basis: "computed",
      inputs: { wavelength: 1310 },
      expect: { designV: 2.4461255776042665, designMfd1310: 7.389033462869638 },
      tolerance: 1e-8,
    },
    {
      // SMF-28 equivalent a = 4.1 µm, NA 0.1246 at 1550 nm: V = 2π · 4.1e-6 · 0.1246/1.55e-6 = 2.070857;
      // λc = 2π · 4.1e-6 · 0.1246/2.404826 = 1334.7446 nm; MFD = 2 · 4.1 · (0.65 + 1.619/V^1.5 + 2.879/V^6) = 10.08421 µm.
      source: MARCUSE_1977,
      basis: "computed",
      inputs: {},
      expect: { smfV: 2.070856803887589, smfCutoff: 1334.7446494627734, smfMfd1550: 10.084209113123363 },
      tolerance: 1e-8,
    },
  ],
});
