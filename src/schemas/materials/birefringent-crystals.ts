import { CRYSTAL_IDS, UNIAXIAL_CRYSTALS, crystalIndices, crystalRange, type CrystalId } from "../../physics/materials/uniaxial-data";
import { defineSchema } from "../types";

const DEFAULT_CRYSTAL: CrystalId = "quartz";

// The coefficients are those of refractiveindex.info's Ghosh data files (SiO2/nk/Ghosh-o and -e, CaCO3/nk/Ghosh-o and -e, fetched),
// "formula 2": n² = 1 + c₀ + Σ cᵢλ²/(λ² − cᵢ₊₁), λ in µm.
const GHOSH = "Ghosh G. (1999). Dispersion-equation coefficients for the refractive index and birefringence of calcite and quartz crystals. " +
  "Opt. Commun. 163, 95–102, doi:10.1016/S0030-4018(99)00091-7 (coefficients as in the refractiveindex.info database, CC0); " +
  "retardance |Δn|·d/λ and half-wave thickness λ/(2|Δn|) for a plate with its optic axis in the face at normal incidence.";

export default defineSchema({
  href: "/materials/birefringent-crystals",
  choices: [
    {
      key: "crystal",
      label: "Crystal",
      options: CRYSTAL_IDS.map((id) => ({ value: id, label: UNIAXIAL_CRYSTALS[id].name })),
      default: DEFAULT_CRYSTAL,
    },
  ],
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 589, min: 150, max: 7000 },
    { key: "thickness", label: "Plate thickness", unit: "mm", toSI: 1e-3, siUnit: "m", default: 1, min: 0.001, max: 100 },
  ],
  outputs: [
    { key: "no", label: "Ordinary index nₒ", unit: "", toSI: 1, siUnit: "" },
    { key: "ne", label: "Extraordinary index nₑ", unit: "", toSI: 1, siUnit: "" },
    { key: "dn", label: "Birefringence Δn = nₑ − nₒ", unit: "", toSI: 1, siUnit: "" },
    { key: "retardance", label: "Retardance of the plate", unit: "waves", toSI: 1, siUnit: "waves" },
    { key: "halfWaveThickness", label: "Zero-order half-wave thickness λ/(2|Δn|)", unit: "µm", toSI: 1e-6, siUnit: "m" },
  ],
  compute({ crystal, wavelength, thickness }) {
    const id = (CRYSTAL_IDS as string[]).includes(crystal) ? (crystal as CrystalId) : DEFAULT_CRYSTAL;
    const [lo, hi] = crystalRange(id);
    const warnings: string[] = [];
    if (!(wavelength >= lo && wavelength <= hi)) {
      warnings.push(`${wavelength * 1e9} nm is outside the ${Math.round(lo * 1e9)}–${Math.round(hi * 1e9)} nm range of this crystal's Sellmeier fit`);
      return { values: { no: NaN, ne: NaN, dn: NaN, retardance: NaN, halfWaveThickness: NaN }, warnings };
    }
    const { no, ne } = crystalIndices(id, wavelength);
    const dn = ne - no;
    return {
      values: {
        no, ne, dn, retardance: (Math.abs(dn) * thickness) / wavelength, halfWaveThickness: wavelength / (2 * Math.abs(dn)),
      },
      warnings,
    };
  },
  checks: [
    {
      // Quartz at 589 nm (page defaults, d = 1 mm), Ghosh's formula evaluated from the database coefficients (scratch groupA/bire.mjs):
      //   n_o = 1.544218, n_e = 1.553318, Δn = 0.00910045; retardance = 0.00910045 · 1e-3 / 589e-9 = 15.4507 waves;
      //   half-wave thickness 589e-9 / (2 · 0.00910045) = 32.3610 µm
      source: GHOSH,
      basis: "computed",
      inputs: {},
      expect: { no: 1.544218, ne: 1.553318, dn: 0.00910045, retardance: 15.4507, halfWaveThickness: 32.3610 },
      tolerance: 0.0005,
    },
    {
      // Calcite at 589.3 nm, d = 10 µm (same method): n_o = 1.658343, n_e = 1.486130, Δn = −0.172213,
      // retardance 0.172213 · 1e-5 / 589.3e-9 = 2.92234 waves, half-wave thickness 1.71096 µm.
      source: GHOSH,
      basis: "computed",
      inputs: { crystal: "calcite", wavelength: 589.3, thickness: 0.01 },
      expect: { no: 1.658343, ne: 1.486130, dn: -0.172213, retardance: 2.92234, halfWaveThickness: 1.71096 },
      tolerance: 0.0005,
    },
  ],
});
