import { bundleSummary, type BundlePacking } from "../../physics/fiber-optics/fiber-bundle";
import { defineSchema } from "../types";

const BUNDLE_MODEL = "Hexagonal ring bundles: n full rings hold 3n(n + 1) + 1 fibres and span (2n + 1)·d_clad; core fill N·(d_core/D)², " +
  "infinite-array packing fraction π/(2√3) (textbook close-packing geometry of equal discs, e.g. Conway J. H., Sloane N. J. A. (1999). " +
  "Sphere Packings, Lattices and Groups, 3rd ed., Springer, ch. 1); étendue G = π·A·NA² per fibre in air " +
  "(Kosterin A., Temyanko V., Fallahi M., Mansuripur M. (2004). Tapered fiber bundles for combining high-power diode lasers. " +
  "Appl. Opt. 43, 3893–3900, doi:10.1364/AO.43.003893).";

export default defineSchema({
  href: "/fiber-optics/fiber-bundle",
  inputs: [
    { key: "fiberCount", label: "Number of fibres", unit: "", toSI: 1, siUnit: "", default: 37, min: 1, max: 10000 },
    { key: "fiberCoreDia", label: "Fibre core diameter", unit: "µm", toSI: 1e-6, siUnit: "m", default: 62.5, min: 0.1, max: 5000 },
    { key: "fiberCladDia", label: "Fibre cladding diameter", unit: "µm", toSI: 1e-6, siUnit: "m", default: 125, min: 1, max: 5000 },
    { key: "na", label: "Fibre NA", unit: "", toSI: 1, siUnit: "", default: 0.22, min: 0.01, max: 1 },
  ],
  choices: [
    {
      key: "packing", label: "Packing geometry", default: "hexagonal",
      options: [{ value: "hexagonal", label: "Hexagonal rings" }, { value: "square", label: "Square grid" }],
    },
  ],
  outputs: [
    { key: "D", label: "Bundle diameter", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "rings", label: "Hexagonal rings", unit: "", toSI: 1, siUnit: "" },
    { key: "fullCount", label: "Fibres in that many full rings", unit: "", toSI: 1, siUnit: "" },
    { key: "cladFill", label: "Cladding fill", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "coreFill", label: "Core fill", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "packingLoss", label: "Packing-fraction loss", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "etendue", label: "Total étendue", unit: "mm²·sr", toSI: 1e-6, siUnit: "m²·sr" },
    { key: "arrayLimit", label: "Infinite-array core fill", unit: "%", toSI: 0.01, siUnit: "" },
  ],
  validate: ({ fiberCoreDia, fiberCladDia }) =>
    fiberCoreDia > fiberCladDia ? "The core diameter cannot exceed the cladding diameter." : undefined,
  compute({ fiberCount, fiberCoreDia, fiberCladDia, na, packing }) {
    const kind: BundlePacking = packing === "square" ? "square" : "hexagonal";
    const r = bundleSummary(Math.round(fiberCount), fiberCoreDia, fiberCladDia, na, kind);
    const warnings: string[] = [];
    if (kind === "square") warnings.push("The ring count and full-ring fibre count describe hexagonal packing only; the diameter and fills use the square grid.");
    return { values: r, warnings };
  },
  checks: [
    {
      // Hexagonal, N = 37: 3n(n + 1) + 1 = 37 gives n = 3 rings; D = (2·3 + 1)·125 µm = 875 µm = 0.875 mm.
      // Core fill = 37·(62.5/875)² = 37/196 = 0.18877551 → 18.877551 %; cladding fill = 37·(125/875)² = 37/49 = 75.510204 %.
      // Packing loss = −10 log₁₀(37/196) = 10 log₁₀(5.2972973) = 7.2405435 dB. Infinite-array fill = π/(2√3)·(62.5/125)² = 0.9068997/4 = 22.672492 %.
      // Étendue = N·π²·d²·NA²/4 = 37 · 9.8696044 · (62.5e-6)² · 0.0484 / 4 = 1.72602e-8 m²·sr = 0.0172602 mm²·sr.
      source: BUNDLE_MODEL,
      basis: "computed",
      inputs: {},
      expect: {
        D: 0.875, rings: 3, fullCount: 37, coreFill: 18.877551020408163, cladFill: 75.51020408163265,
        packingLoss: 7.24054347289481, arrayLimit: 22.672492052927723, etendue: 0.01726024175924885,
      },
      tolerance: 1e-8,
    },
    {
      // Square grid, N = 37: m = ⌈√37⌉ = 7, D = ((7 − 1)√2 + 1)·125 µm = 9.4852814 · 125 µm = 1.18566 mm.
      // Core fill = 37·(62.5/1185.66)² = 37 · 0.0027788 = 10.2811 %.
      source: BUNDLE_MODEL,
      basis: "computed",
      inputs: { packing: "square" },
      expect: { D: 1.1856601717798216, coreFill: 10.281140539111014 },
      tolerance: 1e-8,
    },
  ],
});
