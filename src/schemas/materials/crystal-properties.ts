import { crystalIndices, crystalRange } from "../../physics/materials/uniaxial-data";
import { extraordinaryIndex, maxWalkoff, walkoffAngle } from "../../physics/polarization/uniaxial";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;
const IDS = ["calcite", "quartz", "sapphire"] as const;
type Id = (typeof IDS)[number];
const LABELS: Record<Id, string> = { calcite: "Calcite (CaCO₃)", quartz: "Crystal quartz (SiO₂)", sapphire: "Sapphire (Al₂O₃)" };

const GHOSH = "Ghosh G. (1999). Dispersion-equation coefficients for the refractive index and birefringence of calcite and " +
  "quartz crystals. Opt. Commun. 163, 95–102, doi:10.1016/S0030-4018(99)00091-7 (coefficients as listed in the " +
  "refractiveindex.info database, CaCO₃ and SiO₂ Ghosh-o.yml / Ghosh-e.yml); walk-off tan ρ = (nₒ² − nₑ²) sin 2θ / " +
  "(2(nₑ² cos²θ + nₒ² sin²θ)), Born M., Wolf E., Principles of Optics, ch. 15.";

export default defineSchema({
  href: "/materials/crystal-properties",
  choices: [
    {
      key: "crystal",
      label: "Crystal",
      options: IDS.map((id) => ({ value: id, label: LABELS[id] })),
      default: "calcite",
    },
  ],
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 589, min: 150, max: 5500 },
    { key: "angle", label: "Wave normal from optic axis θ", unit: "°", toSI: 1, siUnit: "°", default: 45, min: 0, max: 90 },
    { key: "thickness", label: "Crystal length", unit: "mm", toSI: 1e-3, siUnit: "m", default: 10, min: 0.01, max: 100 },
  ],
  outputs: [
    { key: "no", label: "nₒ", unit: "", toSI: 1, siUnit: "" },
    { key: "ne", label: "nₑ", unit: "", toSI: 1, siUnit: "" },
    { key: "deltaN", label: "Δn = nₑ − nₒ", unit: "", toSI: 1, siUnit: "" },
    { key: "neTheta", label: "nₑ(θ), index of the e wave at θ", unit: "", toSI: 1, siUnit: "" },
    { key: "walkoff", label: "Walk-off angle |ρ|", unit: "°", toSI: 1, siUnit: "°" },
    { key: "displacement", label: "o–e separation after the crystal length, L·tan ρ", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "maxWalkoff", label: "Largest walk-off", unit: "°", toSI: 1, siUnit: "°" },
    { key: "maxWalkoffAngle", label: "θ of the largest walk-off, atan(nₑ/nₒ)", unit: "°", toSI: 1, siUnit: "°" },
  ],
  compute({ crystal, wavelength, angle, thickness }) {
    const id = crystal as Id;
    const [lo, hi] = crystalRange(id);
    const inRange = wavelength >= lo && wavelength <= hi;
    const { no, ne } = inRange ? crystalIndices(id, wavelength) : { no: NaN, ne: NaN };
    const rho = walkoffAngle(no, ne, angle * DEG);
    const peak = maxWalkoff(no, ne);
    const warnings: string[] = [];
    if (!inRange) {
      warnings.push(`The Sellmeier fit for ${LABELS[id]} covers ${+(lo * 1e9).toPrecision(4)}–${+(hi * 1e9).toPrecision(4)} nm: no indices outside it.`);
    }
    return {
      values: {
        no, ne, deltaN: ne - no, neTheta: extraordinaryIndex(no, ne, angle * DEG),
        walkoff: Math.abs(rho) / DEG, displacement: thickness * Math.tan(Math.abs(rho)),
        maxWalkoff: Math.abs(peak.rho) / DEG, maxWalkoffAngle: peak.theta / DEG,
      },
      warnings,
    };
  },
  checks: [
    {
      // Ghosh's calcite coefficients (n² = 1 + c0 + c1λ²/(λ² − c2) + c3λ²/(λ² − c4), λ in µm, o: 0.73358749 0.96464345
      // 1.94325203e-2 1.82831454 120; e: 0.35859695 0.82427830 1.06689543e-2 0.14429128 120) at 0.589 µm: nₒ = 1.658363646,
      // nₑ = 1.486139446, Δn = −0.172224200. θ = 45°: nₑ(θ) = 1.565189366, tan ρ from the walk-off equation gives
      // ρ = 6.232699091°, L = 10 mm: 10 tan ρ = 1.092122422 mm. Largest walk-off 6.269906789° at atan(nₑ/nₒ) = 41.865046606°.
      source: GHOSH,
      basis: "computed",
      inputs: { crystal: "calcite", wavelength: 589, angle: 45, thickness: 10 },
      expect: {
        no: 1.6583636457143514, ne: 1.486139445553737, deltaN: -0.17222420016061446, neTheta: 1.565189365941122,
        walkoff: 6.2326990909695, displacement: 1.092122422251072, maxWalkoff: 6.269906788964556, maxWalkoffAngle: 41.865046605517726,
      },
      tolerance: 1e-8,
    },
    {
      // Ghosh's quartz coefficients (o: 0.28604141 1.07044083 1.00585997e-2 1.10202242 100; e: 0.28851804 1.09509924
      // 1.02101864e-2 1.15662475 100) at 0.589 µm: nₒ = 1.544217858, nₑ = 1.553318310, Δn = +0.009100452.
      source: GHOSH,
      basis: "computed",
      inputs: { crystal: "quartz", wavelength: 589 },
      expect: { no: 1.5442178576765409, ne: 1.5533183095309755, deltaN: 0.009100451854434 },
      tolerance: 1e-7,
    },
  ],
});
