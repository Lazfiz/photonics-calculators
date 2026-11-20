import { CRYSTAL_IDS, UNIAXIAL_CRYSTALS } from "../../physics/materials/uniaxial-data";
import { type PolarizerDesign, prismPolarizer } from "../../physics/polarization/prism-polarizers";
import { resolveCrystalIndices } from "../../physics/polarization/uniaxial";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;
const BORN_WOLF = "Born M., Wolf E. (1999). Principles of Optics, 7th ed., Cambridge University Press, §1.5.1 (Snell's law, " +
  "conserved tangential wave vector) and ch. 15 'Optics of crystals'; Shurcliff W. A. (1962). Polarized Light, Harvard University " +
  "Press, ch. 5 (Wollaston prism: split ≈ 2|Δn| tan α). https://doi.org/10.1017/CBO9781139644181";
const DESIGNS: { value: PolarizerDesign; label: string }[] = [
  { value: "glan", label: "Glan-Taylor" },
  { value: "wollaston", label: "Wollaston" },
  { value: "rochon", label: "Rochon" },
  { value: "senarmont", label: "Sénarmont" },
];

export default defineSchema({
  href: "/polarization/birefringent-polarizer",
  choices: [
    {
      key: "crystal",
      label: "Crystal",
      options: [
        ...CRYSTAL_IDS.map((id) => ({ value: id, label: UNIAXIAL_CRYSTALS[id].name })),
        { value: "custom", label: "Custom (no dispersion)" },
      ],
      default: "calcite",
    },
    { key: "type", label: "Design", options: DESIGNS, default: "wollaston" },
  ],
  inputs: [
    { key: "nO", label: "Ordinary index nₒ (custom crystal only)", unit: "", toSI: 1, siUnit: "", default: 1.658, min: 1, max: 5 },
    { key: "nE", label: "Extraordinary index nₑ (custom crystal only)", unit: "", toSI: 1, siUnit: "", default: 1.486, min: 1, max: 5 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 589, min: 200, max: 7000 },
    { key: "prismAngleDeg", label: "Wedge angle α (splitters) or hypotenuse angle (Glan-Taylor)", unit: "°", toSI: DEG, siUnit: "rad", default: 20, min: 1, max: 80 },
  ],
  outputs: [
    { key: "nOrdinary", label: "Ordinary index nₒ", unit: "", toSI: 1, siUnit: "" },
    { key: "nExtraordinary", label: "Extraordinary index nₑ", unit: "", toSI: 1, siUnit: "" },
    { key: "sExit", label: "Exit angle of the s beam in air (splitters)", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "pExit", label: "Exit angle of the p beam in air (splitters)", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "separation", label: "Angle between the two beams (splitters)", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "smallAngle", label: "First-order estimate 2|Δn| tan α (Wollaston) or |Δn| tan α (Rochon, Sénarmont)", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "windowLower", label: "Lower edge of the polarizing window, external angle (Glan-Taylor)", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "windowUpper", label: "Upper edge of the polarizing window, external angle (Glan-Taylor)", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "halfField", label: "Symmetric half-field (Glan-Taylor)", unit: "°", toSI: DEG, siUnit: "rad" },
  ],
  compute({ crystal, type, nO: customNo, nE: customNe, wavelength, prismAngleDeg }) {
    const { no, ne } = resolveCrystalIndices(crystal, wavelength, customNo, customNe);
    const { split, glan } = prismPolarizer(type as PolarizerDesign, no, ne, prismAngleDeg);
    const warnings: string[] = [];
    type Key = "nOrdinary" | "nExtraordinary" | "sExit" | "pExit" | "separation" | "smallAngle" | "windowLower" | "windowUpper" | "halfField";
    const reasons: Partial<Record<Key, string>> = {};
    const splitterKeys = ["sExit", "pExit", "separation", "smallAngle"] as const;
    const windowKeys = ["windowLower", "windowUpper", "halfField"] as const;
    if (!Number.isFinite(no)) {
      const noIndices = "The wavelength is outside this crystal's Sellmeier data range: no indices.";
      warnings.push(noIndices);
      for (const k of ["nOrdinary", "nExtraordinary", ...splitterKeys, ...windowKeys] as const) reasons[k] = noIndices;
    }
    if (type === "glan") {
      const notSplitter = "Glan-Taylor: the splitter outputs (exit angles, separation) do not apply.";
      warnings.push(notSplitter);
      for (const k of splitterKeys) reasons[k] = notSplitter;
    } else {
      const notGlan = "Splitter: the Glan-Taylor window outputs do not apply.";
      warnings.push(notGlan);
      for (const k of windowKeys) reasons[k] = notGlan;
      if (split && Number.isFinite(no)) {
        const reflected = "Splitter: a beam is totally reflected at the wedge interface or the exit face, so it has no exit angle.";
        if (!Number.isFinite(split.s)) reasons.sExit = reflected;
        if (!Number.isFinite(split.p)) reasons.pExit = reflected;
        if (!Number.isFinite(split.separation)) reasons.separation = reflected;
        if (!Number.isFinite(split.s) || !Number.isFinite(split.p)) warnings.push(reflected);
      }
    }
    if (glan && !glan.axialPolarized) warnings.push("The axial ray is not polarized.");
    if (glan && Number.isFinite(no) && !Number.isFinite(glan.lower)) {
      const noWindow = "Glan-Taylor: no polarizing window exists for these indices and this hypotenuse angle: windowLower and windowUpper are null.";
      warnings.push(noWindow);
      reasons.windowLower = noWindow;
      reasons.windowUpper = noWindow;
    }
    return {
      values: {
        nOrdinary: no,
        nExtraordinary: ne,
        sExit: split?.s ?? NaN,
        pExit: split?.p ?? NaN,
        separation: split?.separation ?? NaN,
        smallAngle: split?.smallAngle ?? NaN,
        windowLower: glan?.lower ?? NaN,
        windowUpper: glan?.upper ?? NaN,
        halfField: glan?.halfField ?? NaN,
      },
      warnings,
      reasons,
    };
  },
  checks: [
    {
      // Custom nₒ = 1.658, nₑ = 1.486, α = 20°, Wollaston (normal incidence, air). s: ordinary in wedge 1, extraordinary in
      // wedge 2: nₒ sin α = nₑ sin β_s, sin ε_s = nₑ sin(β_s − α) → ε_s = 3.617226°. p: nₑ sin α = nₒ sin β_p,
      // sin ε_p = nₒ sin(β_p − α) → ε_p = −3.564858°. Separation = 7.182084°; first order 2·0.172·tan 20° = 7.173762°.
      source: BORN_WOLF,
      basis: "computed",
      inputs: { crystal: "custom", type: "wollaston", nO: 1.658, nE: 1.486, prismAngleDeg: 20 },
      expect: { separation: 7.182083709, smallAngle: 7.173761652 },
      tolerance: 1e-8,
    },
  ],
});
