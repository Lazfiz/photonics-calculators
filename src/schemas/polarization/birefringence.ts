import { CRYSTAL_IDS, UNIAXIAL_CRYSTALS } from "../../physics/materials/uniaxial-data";
import { plateOrder, retardance } from "../../physics/polarization/retarders";
import { resolveCrystalIndices } from "../../physics/polarization/uniaxial";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;
const BORN_WOLF = "Born M., Wolf E. (1999). Principles of Optics, 7th ed., Cambridge University Press, ch. 15 'Optics of crystals' " +
  "(phase difference Γ = 2π(n_e − n_o)d/λ of a plate with its optic axis parallel to the faces at normal incidence). " +
  "https://doi.org/10.1017/CBO9781139644181";

export default defineSchema({
  href: "/polarization/birefringence",
  choices: [
    {
      key: "crystal",
      label: "Crystal",
      options: [
        ...CRYSTAL_IDS.map((id) => ({ value: id, label: UNIAXIAL_CRYSTALS[id].name })),
        { value: "custom", label: "Custom (no dispersion)" },
      ],
      default: "quartz",
    },
  ],
  inputs: [
    { key: "no", label: "Ordinary index nₒ (custom crystal only)", unit: "", toSI: 1, siUnit: "", default: 1.5443, min: 1, max: 5 },
    { key: "ne", label: "Extraordinary index nₑ (custom crystal only)", unit: "", toSI: 1, siUnit: "", default: 1.5534, min: 1, max: 5 },
    { key: "thickness", label: "Plate thickness", unit: "mm", toSI: 1e-3, siUnit: "m", default: 1, min: 0.001, max: 50 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 550, min: 200, max: 7000 },
  ],
  outputs: [
    { key: "nO", label: "Ordinary index nₒ", unit: "", toSI: 1, siUnit: "" },
    { key: "nE", label: "Extraordinary index nₑ", unit: "", toSI: 1, siUnit: "" },
    { key: "dn", label: "Birefringence Δn = nₑ − nₒ (> 0: optic axis slow)", unit: "", toSI: 1, siUnit: "" },
    { key: "gamma", label: "Phase retardation Γ = 2πΔn·d/λ", unit: "rad", toSI: 1, siUnit: "rad" },
    { key: "waves", label: "Retardation |Δn|·d/λ", unit: "waves", toSI: 1, siUnit: "waves" },
    { key: "degrees", label: "Retardation Γ", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "order", label: "Plate order (whole waves)", unit: "", toSI: 1, siUnit: "" },
    { key: "fraction", label: "Fraction of a wave beyond the order", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ crystal, no: customNo, ne: customNe, thickness, wavelength }) {
    const { no, ne } = resolveCrystalIndices(crystal, wavelength, customNo, customNe);
    const dn = ne - no;
    const order = plateOrder(dn, thickness, wavelength);
    const warnings: string[] = [];
    if (!Number.isFinite(dn)) warnings.push("The wavelength is outside this crystal's Sellmeier data range: no indices.");
    return {
      values: {
        nO: no,
        nE: ne,
        dn,
        gamma: retardance(dn, thickness, wavelength),
        waves: order.waves,
        degrees: retardance(dn, thickness, wavelength),
        order: order.order,
        fraction: order.fraction,
      },
      warnings,
    };
  },
  checks: [
    {
      // Custom nₒ = 1.5443, nₑ = 1.5534 (quartz, no dispersion), d = 1 mm, λ = 550 nm:
      // Δn = 0.0091, |Δn|d/λ = 9.1e-6/5.5e-7 = 182/11 = 16.545454…, Γ = 2π · 182/11 = 103.958157 rad = 5956.3636°.
      source: BORN_WOLF,
      basis: "computed",
      inputs: { crystal: "custom", no: 1.5443, ne: 1.5534, thickness: 1, wavelength: 550 },
      expect: { dn: 0.0091, waves: 16.545454545, gamma: 103.9581569, degrees: 5956.363636, fraction: 0.545454545 },
      tolerance: 1e-8,
    },
    {
      // Custom nₒ = 1.658, nₑ = 1.486 (calcite at 589 nm, negative crystal), d = 0.01 mm, λ = 589 nm:
      // Δn = −0.172, |Δn|d/λ = 1.72e-6/5.89e-7 = 2.9202037, order 2, fraction 0.9202037, Γ = −2π · 2.9202037 = −18.348181 rad.
      source: BORN_WOLF,
      basis: "computed",
      inputs: { crystal: "custom", no: 1.658, ne: 1.486, thickness: 0.01, wavelength: 589 },
      expect: { dn: -0.172, waves: 2.9202037351, gamma: -18.3481812, fraction: 0.9202037351 },
      tolerance: 1e-8,
    },
  ],
});
