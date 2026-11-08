import { CRYSTAL_IDS, UNIAXIAL_CRYSTALS } from "../../physics/materials/uniaxial-data";
import { glanBalancedHypotenuse, glanWindow, type GlanAxis } from "../../physics/polarization/prism-polarizers";
import { resolveCrystalIndices } from "../../physics/polarization/uniaxial";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;
const BORN_WOLF = "Born M., Wolf E. (1999). Principles of Optics, 7th ed., Cambridge University Press, §1.5 (Snell's law, total " +
  "internal reflection when n sin θ ≥ n_gap) and ch. 15 'Optics of crystals'; Bennett J. M., Bennett H. E. (1978). Handbook of Optics, " +
  "McGraw-Hill, ch. 10 (Glan-type polarizing prisms). https://doi.org/10.1017/CBO9781139644181";
const TYPES: Record<string, { label: string; axis: GlanAxis; air: boolean }> = {
  taylor: { label: "Glan-Taylor (air, axis in the plane)", axis: "in-plane", air: true },
  foucault: { label: "Glan-Foucault (air, axis ⟂ plane)", axis: "perpendicular", air: true },
  thompson: { label: "Glan-Thompson (cement, axis ⟂ plane)", axis: "perpendicular", air: false },
};

export default defineSchema({
  href: "/polarization/glans-prism",
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
    { key: "type", label: "Prism type", options: Object.entries(TYPES).map(([value, t]) => ({ value, label: t.label })), default: "taylor" },
  ],
  inputs: [
    { key: "nO", label: "Ordinary index nₒ (custom crystal only)", unit: "", toSI: 1, siUnit: "", default: 1.658, min: 1, max: 5 },
    { key: "nE", label: "Extraordinary index nₑ (custom crystal only)", unit: "", toSI: 1, siUnit: "", default: 1.486, min: 1, max: 5 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 589, min: 200, max: 7000 },
    { key: "cutAngleDeg", label: "Hypotenuse angle θₕ (angle between hypotenuse and entrance face)", unit: "°", toSI: DEG, siUnit: "rad", default: 38.5, min: 10, max: 85 },
    { key: "cementIndex", label: "Cement index (Glan-Thompson only)", unit: "", toSI: 1, siUnit: "", default: 1.55, min: 1.3, max: 1.8 },
  ],
  outputs: [
    { key: "nOrdinary", label: "Ordinary index nₒ", unit: "", toSI: 1, siUnit: "" },
    { key: "nExtraordinary", label: "Extraordinary index nₑ", unit: "", toSI: 1, siUnit: "" },
    { key: "criticalO", label: "Critical angle of the o wave at the gap, asin(n_gap/nₒ)", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "criticalE", label: "Critical angle of the e wave at the gap (axial), asin(n_gap/nₑ)", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "windowLower", label: "Lower edge of the polarizing window, external angle φ", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "windowUpper", label: "Upper edge of the polarizing window, external angle φ", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "fullWidth", label: "Full width of the polarizing window", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "halfField", label: "Symmetric half-field", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "balancedHypotenuse", label: "Balanced θₕ: window centred on the axis", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "lengthOverAperture", label: "Length / aperture L/A = tan θₕ", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ crystal, type, nO, nE, wavelength, cutAngleDeg, cementIndex }) {
    const t = TYPES[type];
    const { no, ne } = resolveCrystalIndices(crystal, wavelength, nO, nE);
    const gapIndex = t.air ? 1 : cementIndex;
    const w = glanWindow({ no, ne, hypotenuse: cutAngleDeg, gapIndex, axis: t.axis });
    const balanced = glanBalancedHypotenuse({ no, ne, gapIndex, axis: t.axis });
    const warnings: string[] = [];
    if (!Number.isFinite(no)) warnings.push("The wavelength is outside this crystal's Sellmeier data range: no indices.");
    else if (!w.axialPolarized) warnings.push("The axial ray is not polarized.");
    if (!Number.isFinite(balanced)) warnings.push("No balanced hypotenuse angle exists for these indices.");
    if (!t.air) warnings.push("Glan-Thompson: the cement index sets the gap index; air-gap types ignore it.");
    return {
      values: {
        nOrdinary: no,
        nExtraordinary: ne,
        criticalO: Math.asin(gapIndex / no),
        criticalE: Math.asin(gapIndex / ne),
        windowLower: w.lower,
        windowUpper: w.upper,
        fullWidth: w.upper - w.lower,
        halfField: w.halfField,
        balancedHypotenuse: balanced,
        lengthOverAperture: Math.tan(cutAngleDeg),
      },
      warnings,
    };
  },
  checks: [
    {
      // Glan-Foucault, custom nₒ = 1.658, nₑ = 1.486 (calcite-like), θₕ = 38.5°, air gap, axis ⟂ plane: both waves keep
      // their index, so each edge is where n sin(θₕ + ψ) = 1 with sin φ = n sin ψ. o edge: ψ = asin(1/1.658) − 38.5° =
      // −1.405149°, φ = asin(1.658 sin ψ) = −2.330146°; e edge: ψ = asin(1/1.486) − 38.5° = 3.794965°, φ = 5.644320°.
      // L/A = tan 38.5° = 0.7954359.
      source: BORN_WOLF,
      basis: "computed",
      inputs: { crystal: "custom", type: "foucault", nO: 1.658, nE: 1.486, cutAngleDeg: 38.5 },
      expect: { windowLower: -2.3301457843, windowUpper: 5.644320017, lengthOverAperture: 0.7954359167 },
      tolerance: 1e-8,
    },
  ],
});
