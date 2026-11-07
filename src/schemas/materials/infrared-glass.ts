import {
  WINDOW_MATERIALS, fresnelLimitTransmission, hasFormula, windowIndex, type WindowMaterialId,
} from "../../physics/materials/window-materials";
import { defineSchema } from "../types";

// The page's material buttons, in its order.
const IR_IDS: WindowMaterialId[] = [
  "ge", "si", "znse", "zns", "caf2", "baf2", "mgf2", "nacl", "kbr", "csi", "krs5", "as2s3", "amtir1", "zblan",
];

const CRYSTRAN = "Crystran Ltd, Handbook of Infrared and Ultraviolet Optical Materials, germanium data sheet " +
  "(https://www.crystran.com/optical-materials/germanium-ge): n = 4.0026 at 11 µm, dn/dT +396 × 10⁻⁶ K⁻¹, " +
  "thermal conductivity 58.62 W m⁻¹ K⁻¹, Knoop 780, transmission 1.8 to 23 µm.";
const BURNETT = "Burnett J. H., Kaplan S. G., Stover E., Phenis A. (2016). Refractive index measurements of Ge. Proc. SPIE 9974, 99740X " +
  "(Sellmeier fit at 22 °C, 2–14 µm; coefficients as in the refractiveindex.info database).";
const GAN = "Gan F. (1995). Optical properties of fluoride glasses: a review. J. Non-Cryst. Solids 184, 9–20 (ZBLAN Sellmeier formula, " +
  "0.365–3.5 µm, room temperature; refractiveindex.info). dn/dT: Poulain M. (2024), APL Photonics 9, 091103, midpoint of −8 to −15 × 10⁻⁶ K⁻¹. " +
  "T = 2n/(n² + 1): Born & Wolf, Principles of Optics, Fresnel formulae at normal incidence.";

export default defineSchema({
  href: "/materials/infrared-glass",
  choices: [
    {
      key: "material",
      label: "Material",
      options: IR_IDS.map((id) => ({ value: id, label: WINDOW_MATERIALS[id].name.split(" (")[0] })),
      default: "ge",
    },
  ],
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "µm", toSI: 1e-6, siUnit: "m", default: 4, min: 0.2, max: 60 },
    { key: "temperature", label: "Temperature", unit: "°C", toSI: 1, siUnit: "°C", default: 25, min: -50, max: 200 },
  ],
  outputs: [
    { key: "n", label: "Refractive index n(λ, T)", unit: "", toSI: 1, siUnit: "" },
    { key: "transmission", label: "Fresnel-limited transmission 2n/(n² + 1)", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "dnDT", label: "dn/dT", unit: "×10⁻⁶/K", toSI: 1e-6, siUnit: "1/K" },
    { key: "conductivity", label: "Thermal conductivity", unit: "W/(m·K)", toSI: 1, siUnit: "W/(m·K)" },
    { key: "knoop", label: "Knoop hardness", unit: "kg/mm²", toSI: 9.80665e6, siUnit: "Pa" },
  ],
  compute({ material, wavelength, temperature }) {
    const mat = WINDOW_MATERIALS[material as WindowMaterialId];
    const d = mat.dispersion;
    const nRef = windowIndex(mat, wavelength);
    const tRef = hasFormula(d) ? (d.temperature_C ?? 20) : null;
    const n = mat.dnDT !== null && tRef !== null ? nRef + mat.dnDT * (temperature - tRef) : nRef;
    const warnings: string[] = [];
    if (!hasFormula(d)) warnings.push(`No dispersion formula for ${mat.name}: n is not available.`);
    else if (!Number.isFinite(nRef)) warnings.push("The wavelength is outside the material's Sellmeier formula range: no index.");
    else if (mat.dnDT === null) warnings.push("No sourced dn/dT: n is at the formula's temperature.");
    if (mat.dnDT === null) warnings.push("No sourced dn/dT for this material.");
    if (mat.conductivity === null) warnings.push("No sourced thermal conductivity for this material.");
    return {
      values: {
        n,
        transmission: fresnelLimitTransmission(n),
        dnDT: mat.dnDT ?? NaN,
        conductivity: mat.conductivity ?? NaN,
        knoop: mat.knoop === null ? NaN : mat.knoop * 9.80665e6,
      },
      warnings,
    };
  },
  checks: [
    {
      // Crystran prints n = 4.0026 for Ge at 11 µm; the Burnett formula (22 °C, the temperature the page shifts from) gives 4.00329.
      source: CRYSTRAN + " " + BURNETT,
      basis: "printed",
      inputs: { material: "ge", wavelength: 11, temperature: 22 },
      expect: { n: 4.0026 },
      tolerance: 5e-4,
    },
    {
      // Data-sheet entries printed as "+396 × 10⁻⁶ K⁻¹", "58.62 W m⁻¹ K⁻¹" and "Knoop 780".
      source: CRYSTRAN,
      basis: "printed",
      inputs: { material: "ge" },
      expect: { dnDT: 396, conductivity: 58.62, knoop: 780 },
      tolerance: 1e-6,
    },
    {
      // n² − 1 = 1.22514 λ²/(λ² − 0.08969²) + 1.52898 λ²/(λ² − 21.3825²) at 2 µm gives n = 1.487990; at 100 °C from the formula's
      // 20 °C: 1.487990 − 11.5e-6 · 80 = 1.487070; T = 2n/(n² + 1) = 0.926126 (92.6126 %).
      source: GAN,
      basis: "computed",
      inputs: { material: "zblan", wavelength: 2, temperature: 100 },
      expect: { n: 1.487069979719329, transmission: 92.61260338040697, dnDT: -11.5 },
      tolerance: 1e-8,
    },
  ],
});
