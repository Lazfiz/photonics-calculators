import { retarderRow, retarderTypes } from "../../physics/polarization/retarders";
import { defineSchema } from "../types";

const HECHT = "Hecht E. (2002). Optics, 4th ed., Addison-Wesley, §8.4 Birefringence and §8.7 Retarders " +
  "(zero-order and multi-order plates, d = (m + f)λ/|Δn|; crossed plates retard by the difference of their retardances).";
const BORN_WOLF_TIR = "Born M., Wolf E. (1999). Principles of Optics, 7th ed., Cambridge University Press, §1.5.4 Total reflection " +
  "(Fresnel rhomb: tan(δ/2) = cos θ √(sin²θ − 1/n²)/sin²θ per reflection). https://doi.org/10.1017/CBO9781139644181.010";

/** Output specs of one retarder type; the keys keep their literal types. */
const typeOutputs = <N extends string>(id: N, name: string) => [
  { key: `${id}Waves` as const, label: `${name}: retardance at λ₀ (multi-order folded to one wave)`, unit: "waves", toSI: 1, siUnit: "waves" },
  { key: `${id}BandLow` as const, label: `${name}: lower edge of the band within ±1 % of the target`, unit: "nm", toSI: 1e-9, siUnit: "m" },
  { key: `${id}BandHigh` as const, label: `${name}: upper edge of the band within ±1 % of the target`, unit: "nm", toSI: 1e-9, siUnit: "m" },
  { key: `${id}Tilt` as const, label: `${name}: change of retardance at 5° tilt`, unit: "waves", toSI: 1, siUnit: "waves" },
];

export default defineSchema({
  href: "/polarization/retarder-types",
  inputs: [
    { key: "wavelength", label: "Design wavelength λ₀", unit: "nm", toSI: 1e-9, siUnit: "m", default: 550, min: 350, max: 1800 },
    { key: "retardance", label: "Target retardance", unit: "waves", toSI: 1, siUnit: "waves", default: 0.25, min: 0.05, max: 0.95 },
    { key: "order", label: "Multi-order m (rounded to a whole number)", unit: "", toSI: 1, siUnit: "", default: 10, min: 1, max: 100 },
    { key: "lambda1", label: "Achromat λ₁", unit: "nm", toSI: 1e-9, siUnit: "m", default: 510, min: 350, max: 1800 },
    { key: "lambda2", label: "Achromat λ₂", unit: "nm", toSI: 1e-9, siUnit: "m", default: 600, min: 350, max: 1800 },
  ],
  outputs: [
    { key: "zeroThickness", label: "Zero order: quartz thickness", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "multiThickness", label: "Multi-order: quartz thickness", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "compoundThickness1", label: "Compound zero order: thicker quartz plate", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "compoundThickness2", label: "Compound zero order: thinner, crossed quartz plate", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "achromaticQuartz", label: "Achromatic: quartz thickness", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "achromaticMgF2", label: "Achromatic: MgF₂ thickness", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "rhombReflections", label: "Fresnel rhomb (N-BK7): total internal reflections", unit: "", toSI: 1, siUnit: "" },
    { key: "rhombAngle", label: "Fresnel rhomb (N-BK7): angle of incidence at each reflection", unit: "°", toSI: Math.PI / 180, siUnit: "rad" },
    ...typeOutputs("zero", "Zero order"),
    ...typeOutputs("multi", "Multi-order"),
    ...typeOutputs("compound", "Compound zero order"),
    ...typeOutputs("achromatic", "Achromatic"),
    ...typeOutputs("rhomb", "Fresnel rhomb"),
  ],
  compute({ wavelength, retardance, order, lambda1, lambda2 }) {
    const m = Math.round(order);
    const [zero, multi, compound, achromatic, rhomb] = retarderTypes(wavelength, retardance, m, lambda1, lambda2);
    const row = <N extends string>(id: N, t: typeof zero) => {
      const r = retarderRow(t, wavelength, retardance);
      return {
        [`${id}Waves`]: r.at, [`${id}BandLow`]: r.band[0], [`${id}BandHigh`]: r.band[1], [`${id}Tilt`]: r.tilt,
      } as Record<`${N}Waves` | `${N}BandLow` | `${N}BandHigh` | `${N}Tilt`, number>;
    };
    const warnings: string[] = [];
    if (!Number.isFinite(achromatic.d[0])) {
      warnings.push("No achromat for these wavelengths: the two quartz and MgF₂ thicknesses would need opposite signs.");
    }
    const bandless = [zero, multi, compound, achromatic, rhomb].filter((t) => !Number.isFinite(retarderRow(t, wavelength, retardance).band[0]));
    if (bandless.length) warnings.push(`No band within ±1 % of the target at λ₀ for: ${bandless.map((t) => t.name).join(", ")}.`);
    return {
      values: {
        zeroThickness: zero.d[0],
        multiThickness: multi.d[0],
        compoundThickness1: compound.d[0],
        compoundThickness2: compound.d[1],
        achromaticQuartz: achromatic.d[0],
        achromaticMgF2: achromatic.d[1],
        rhombReflections: rhomb.reflections ?? NaN,
        rhombAngle: rhomb.theta ?? NaN,
        ...row("zero", zero),
        ...row("multi", multi),
        ...row("compound", compound),
        ...row("achromatic", achromatic),
        ...row("rhomb", rhomb),
      },
      warnings,
    };
  },
  checks: [
    {
      // By construction every type but the achromat gives exactly the target at λ₀ (d = fλ/|Δn|, multi-order folded
      // to the fraction left after m whole waves, compound d_m − d_whole, rhomb 2 × 45° = 90° = 0.25 wave):
      // the retardance recomputed through the tilted-plate wave solver must return 0.25 waves, and the rhomb needs
      // two reflections (n = 1.5185 gives δ_max = 46.5° > 45° per reflection).
      source: HECHT,
      basis: "computed",
      inputs: { wavelength: 550, retardance: 0.25, order: 10 },
      expect: { zeroWaves: 0.25, multiWaves: 0.25, compoundWaves: 0.25, rhombWaves: 0.25, rhombReflections: 2 },
      tolerance: 1e-8,
    },
    {
      // Half-wave: 180° needs four reflections of 45° each (two would need 90° > δ_max = 46.5° per reflection).
      source: BORN_WOLF_TIR,
      basis: "computed",
      inputs: { wavelength: 550, retardance: 0.5, order: 10 },
      expect: { rhombWaves: 0.5, rhombReflections: 4, zeroWaves: 0.5 },
      tolerance: 1e-8,
    },
  ],
});
