import { CRYSTAL_IDS, UNIAXIAL_CRYSTALS, crystalRange } from "../../physics/materials/uniaxial-data";
import { crystalIndicesHeld, crystalSectionRetardance, isCrystalId } from "../../physics/polarization/uniaxial";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;
const WAVELENGTH = 550e-9; // the page evaluates its numbers at 550 nm
const GHOSH = "Ghosh G. (1999). Dispersion-equation coefficients for the refractive index and birefringence of calcite and quartz " +
  "crystals. Optics Communications 163, 95-102, https://doi.org/10.1016/S0030-4018(99)00091-7 (Sellmeier sets); section retardance " +
  "R = |n(θc) − nₒ|·d with 1/n(θ)² = cos²θ/nₒ² + sin²θ/nₑ², Born M., Wolf E. (1999). Principles of Optics, 7th ed., ch. 15.";

export default defineSchema({
  href: "/polarization/orthoconoscopic",
  choices: [
    {
      key: "crystal",
      label: "Crystal",
      options: CRYSTAL_IDS.map((id) => ({ value: id, label: UNIAXIAL_CRYSTALS[id].name })),
      default: "quartz",
    },
    { key: "polars", label: "Polarizers (colour of the page's image only)", options: [{ value: "crossed", label: "Crossed" }, { value: "parallel", label: "Parallel" }], default: "crossed" },
    { key: "accessory", label: "Accessory (colour of the page's image only)", options: [{ value: "none", label: "None" }, { value: "red", label: "First-order red plate (550 nm, +45°)" }], default: "none" },
  ],
  inputs: [
    { key: "axis", label: "Optic axis from the section normal θc", unit: "°", toSI: DEG, siUnit: "rad", default: 90, min: 0, max: 90 },
    { key: "thickness", label: "Section thickness d", unit: "µm", toSI: 1e-6, siUnit: "m", default: 30, min: 1, max: 100 },
    { key: "rotation", label: "Stage rotation ρ (colour and transmission curve of the page only)", unit: "°", toSI: DEG, siUnit: "rad", default: 30, min: 0, max: 360 },
  ],
  outputs: [
    { key: "nOrdinary", label: "Ordinary index nₒ at 550 nm", unit: "", toSI: 1, siUnit: "" },
    { key: "nExtraordinary", label: "Extraordinary index nₑ at 550 nm", unit: "", toSI: 1, siUnit: "" },
    { key: "effectiveBirefringence", label: "Effective birefringence Δn_eff = |n(θc) − nₒ| at 550 nm", unit: "", toSI: 1, siUnit: "" },
    { key: "retardance", label: "Retardance R at 550 nm", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "order", label: "Interference order R/550 nm", unit: "orders", toSI: 1, siUnit: "orders" },
  ],
  compute({ crystal, axis, thickness }) {
    const id = isCrystalId(crystal) ? crystal : "quartz";
    const { no, ne } = crystalIndicesHeld(id, WAVELENGTH);
    const R = crystalSectionRetardance(id, axis, thickness, WAVELENGTH);
    const warnings: string[] = [];
    const [lo, hi] = crystalRange(id);
    if (lo > 380e-9 || hi < 780e-9) warnings.push(`The Sellmeier fit for this crystal covers ${Math.round(lo * 1e9)}–${Math.round(hi * 1e9)} nm: the page's colours hold the indices at the edge value outside that range.`);
    warnings.push("The page's interference colour, extinction positions and transmission curves are not part of the API; the outputs are the 550 nm retardance numbers.");
    return {
      values: { nOrdinary: no, nExtraordinary: ne, effectiveBirefringence: R / thickness, retardance: R, order: R / WAVELENGTH },
      warnings,
    };
  },
  checks: [
    {
      // Quartz at 550 nm (λ² = 0.3025 µm²), Ghosh's n² = A + B₁λ²/(λ² − C₁) + B₂λ²/(λ² − C₂): ordinary A = 1.28604141,
      // B₁ = 1.07044083, C₁ = 0.0100585997, B₂ = 1.10202242, C₂ = 100 gives nₒ = 1.5459484481; extraordinary
      // A = 1.28851804, B₁ = 1.09509924, C₁ = 0.0102101864, B₂ = 1.15662475, C₂ = 100 gives nₑ = 1.5551082200.
      // Axis in the plane (θc = 90°), d = 30 µm: R = (nₑ − nₒ)·d = 0.0091597719 × 30 µm = 274.79316 nm = 0.49962392 orders.
      source: GHOSH,
      basis: "computed",
      inputs: { crystal: "quartz", axis: 90, thickness: 30 },
      expect: { nOrdinary: 1.5459484481, nExtraordinary: 1.55510822, retardance: 274.7931566, order: 0.4996239212 },
      tolerance: 1e-8,
    },
    {
      // Same section with the axis at θc = 45° from the normal: 1/n² = cos²45°/nₒ² + sin²45°/nₑ² gives n(45°) = 1.5505079,
      // R = |n(45°) − nₒ|·d, 0.24870514 orders.
      source: GHOSH,
      basis: "computed",
      inputs: { crystal: "quartz", axis: 45, thickness: 30 },
      expect: { order: 0.24870514 },
      tolerance: 1e-8,
    },
  ],
});
