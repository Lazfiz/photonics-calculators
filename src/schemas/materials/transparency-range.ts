import {
  WINDOW_MATERIALS, fresnelLimitTransmission, hasFormula, surfaceReflectance, transmits, windowIndex, type WindowMaterialId,
} from "../../physics/materials/window-materials";
import { defineSchema } from "../types";

// The page's material list, in its order.
const WINDOW_IDS: WindowMaterialId[] = [
  "lif", "mgf2", "caf2", "baf2", "sapphire", "fusedSilica", "quartz", "bk7", "diamond", "nacl", "kbr", "csi", "krs5",
  "zns", "znse", "si", "ge",
];

const MALITSON_1965 = "Malitson I. H. (1965). Interspecimen comparison of the refractive index of fused silica. J. Opt. Soc. Am. 55, 1205, " +
  "doi:10.1364/JOSA.55.001205; n² = 1 + Σ Bᵢλ²/(λ² − Cᵢ²) with B = 0.6961663, 0.4079426, 0.8974794 and C = 0.0684043, 0.1162414, " +
  "9.896161 µm (as in the refractiveindex.info database, SiO2/nk/Malitson.yml); Fresnel equations at normal incidence: " +
  "R = ((n − 1)/(n + 1))², lossless plate T = 2n/(n² + 1) (Born & Wolf, Principles of Optics, §1.5).";
const MALITSON_1963 = "Malitson I. H. (1963). A redetermination of some optical properties of calcium fluoride. Appl. Opt. 2, 1103, " +
  "doi:10.1364/AO.2.001103; n² = 1 + Σ Bᵢλ²/(λ² − Cᵢ²) with B = 0.5675888, 0.4710914, 3.8484723 and C = 0.050263605, 0.1003909, " +
  "34.64904 µm (refractiveindex.info, CaF2/nk/Malitson.yml); Fresnel equations at normal incidence: R = ((n − 1)/(n + 1))², " +
  "lossless plate T = 2n/(n² + 1) (Born & Wolf, Principles of Optics, §1.5); band from the Crystran CaF₂ data sheet.";

export default defineSchema({
  href: "/materials/transparency-range",
  choices: [
    {
      key: "material",
      label: "Material",
      options: WINDOW_IDS.map((id) => ({ value: id, label: WINDOW_MATERIALS[id].name })),
      default: "fusedSilica",
    },
  ],
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 100, max: 100000 },
  ],
  outputs: [
    { key: "n", label: "Refractive index n", unit: "", toSI: 1, siUnit: "" },
    { key: "reflectance", label: "Reflectance per surface ((n − 1)/(n + 1))²", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "transmission", label: "Fresnel-limited transmission 2n/(n² + 1) (inside the band only)", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "inBand", label: "Inside a transmission band (1 yes, 0 no)", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ material, wavelength }) {
    const m = WINDOW_MATERIALS[material as WindowMaterialId];
    const d = m.dispersion;
    const n = windowIndex(m, wavelength);
    const inBand = transmits(m, wavelength);
    const warnings: string[] = [];
    if (!hasFormula(d)) warnings.push(`No dispersion formula for ${m.name}: n is not available.`);
    else if (!Number.isFinite(n)) warnings.push("The wavelength is outside the material's dispersion formula range: no index.");
    if (!inBand) warnings.push("Outside the transmission band: the material absorbs, so no transmission is given.");
    else if (!Number.isFinite(n)) warnings.push("Inside the band, but the index is needed for the Fresnel limit.");
    return {
      values: {
        n,
        reflectance: surfaceReflectance(n),
        transmission: inBand ? fresnelLimitTransmission(n) : NaN,
        inBand: inBand ? 1 : 0,
      },
      warnings,
    };
  },
  checks: [
    {
      // Fused silica at 1.55 µm (λ² = 2.4025 µm²): n² = 1 + 0.6961663 · 2.4025/(2.4025 − 0.00467924) + 0.4079426 · 2.4025/(2.4025 − 0.01351) +
      // 0.8974794 · 2.4025/(2.4025 − 97.93405) gives n = 1.4440236; R = (0.4440236/2.4440236)² = 3.3006643 %; T = 2n/(n² + 1) = 93.609597 %.
      source: MALITSON_1965,
      basis: "computed",
      inputs: { material: "fusedSilica", wavelength: 1550 },
      expect: { n: 1.444023621703261, reflectance: 3.300664266975651, transmission: 93.60959720753539, inBand: 1 },
      tolerance: 1e-8,
    },
    {
      // CaF₂ at 5 µm (inside its 0.13–10 µm band): n = 1.3989581; R = 2.7657271 %; T = 94.617413 %.
      source: MALITSON_1963,
      basis: "computed",
      inputs: { material: "caf2", wavelength: 5000 },
      expect: { n: 1.398958144633464, reflectance: 2.7657271277024322, transmission: 94.6174134022998 },
      tolerance: 1e-8,
    },
  ],
});
