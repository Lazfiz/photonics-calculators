import { IAD_MATERIALS, atMonitorDensity, iadParameters, type IadMaterialId } from "../../physics/thin-film/ion-assisted-deposition";
import { defineSchema } from "../types";

const MARTIN = "Martin P. J., Macleod H. A., Netterfield R. P., Pacey C. G., Sainty W. G. (1983). Ion-assisted deposition of " +
  "thin films. Appl. Opt. 22, 178–184, doi:10.1364/AO.22.000178 (ion-to-molecule arrival ratio as the IAD parameter): " +
  "Φ_i = J/e, Φ_m = r ρ N_A/M, ratio = Φ_i/Φ_m, energy per molecule = ratio × E_ion.";

const IDS = Object.keys(IAD_MATERIALS) as IadMaterialId[];
const isId = (s: string): s is IadMaterialId => Object.hasOwn(IAD_MATERIALS, s);

export default defineSchema({
  href: "/thin-film/ion-assisted-deposition",
  choices: [
    {
      key: "material",
      label: "Film material",
      options: IDS.map((k) => ({ value: k, label: IAD_MATERIALS[k].name })),
      default: "SiO2",
    },
  ],
  inputs: [
    { key: "ionEnergy", label: "Mean ion energy (not the anode voltage)", unit: "eV", toSI: 1, siUnit: "eV", default: 300, min: 0, max: 10000 },
    { key: "ionCurrentDensity", label: "Ion current density at the substrate", unit: "µA/cm²", toSI: 1e-2, siUnit: "A/m²", default: 50, min: 0, max: 100000 },
    { key: "depositionRate", label: "Deposition rate", unit: "nm/s", toSI: 1e-9, siUnit: "m/s", default: 0.5, min: 0.001, max: 1000 },
    { key: "ionMass", label: "Ion mass (Ar⁺ 40, O₂⁺ 32)", unit: "u", toSI: 1, siUnit: "u", default: 40, min: 1, max: 500 },
    { key: "density", label: "Density set in the rate monitor (0 = bulk)", unit: "g/cm³", toSI: 1, siUnit: "g/cm³", default: 0, min: 0, max: 30 },
  ],
  outputs: [
    { key: "ratio", label: "Ions per arriving molecule", unit: "", toSI: 1, siUnit: "" },
    { key: "energyPerMolecule", label: "Ion energy per molecule", unit: "eV", toSI: 1, siUnit: "eV" },
    { key: "energyPerAtom", label: "Ion energy per atom", unit: "eV", toSI: 1, siUnit: "eV" },
    { key: "momentumPerMolecule", label: "Ion momentum per molecule", unit: "√(u·eV)", toSI: 1, siUnit: "√(u·eV)" },
    { key: "ionFlux", label: "Ion flux", unit: "m⁻² s⁻¹", toSI: 1, siUnit: "m⁻² s⁻¹" },
    { key: "moleculeFlux", label: "Molecule arrival rate", unit: "m⁻² s⁻¹", toSI: 1, siUnit: "m⁻² s⁻¹" },
  ],
  compute({ material, ionEnergy, ionCurrentDensity, depositionRate, ionMass, density }) {
    const id: IadMaterialId = isId(material) ? material : "SiO2";
    const mat = atMonitorDensity(IAD_MATERIALS[id], density);
    const r = iadParameters(ionEnergy, ionMass, ionCurrentDensity, depositionRate, mat);
    return {
      values: {
        ratio: r.ratio,
        energyPerMolecule: r.energyPerMolecule,
        energyPerAtom: r.energyPerAtom,
        momentumPerMolecule: r.momentumPerMolecule,
        ionFlux: r.ionFlux,
        moleculeFlux: r.moleculeFlux,
      },
      warnings: [
        "Singly charged ions; the current density is the one measured at the substrate (Faraday cup). Film properties (packing density, index, stress) are not predicted.",
      ],
    };
  },
  checks: [
    {
      // SiO2 (M = 60.084 g/mol, rho = 2200 kg/m³), 0.5 nm/s: Φ_m = 0.5e-9 · 2200 · N_A / 0.060084 = 1.102516e19 m⁻² s⁻¹;
      // 50 µA/cm² = 0.5 A/m²: Φ_i = 0.5/e = 3.120755e18; ratio = 0.2830576; 300 eV: 84.91729 eV per molecule, 28.30576 eV per atom (3 atoms).
      source: MARTIN,
      basis: "computed",
      inputs: { material: "SiO2", ionEnergy: 300, ionCurrentDensity: 50, depositionRate: 0.5, ionMass: 40, density: 0 },
      expect: { ratio: 0.2830576, energyPerMolecule: 84.91729, energyPerAtom: 28.30576, ionFlux: 3.120755e18, moleculeFlux: 1.102516e19 },
      tolerance: 1e-6,
    },
    {
      // Ta2O5 (M = 441.89 g/mol, rho = 8180 kg/m³), 0.3 nm/s: Φ_m = 3.344347e18; 100 µA/cm² = 1 A/m²: Φ_i = 6.241510e18; ratio 1.866287;
      // 500 eV O₂⁺ (32 u): 933.1433 eV per molecule, 133.3062 eV per atom (7 atoms), momentum 1.866287 · √(2 · 32 · 500) = 333.8515.
      source: MARTIN,
      basis: "computed",
      inputs: { material: "Ta2O5", ionEnergy: 500, ionCurrentDensity: 100, depositionRate: 0.3, ionMass: 32, density: 0 },
      expect: { ratio: 1.866287, energyPerMolecule: 933.1433, energyPerAtom: 133.3062, momentumPerMolecule: 333.8515 },
      tolerance: 1e-6,
    },
  ],
});
