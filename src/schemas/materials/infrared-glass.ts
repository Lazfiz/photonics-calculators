import {
  WINDOW_MATERIALS, dnDTConvention, fresnelLimitTransmission, hasFormula, windowIndex, type WindowMaterialId,
} from "../../physics/materials/window-materials";
import { defineSchema } from "../types";

// The page's material buttons, in its order.
const IR_IDS: WindowMaterialId[] = [
  "ge", "si", "znse", "zns", "caf2", "baf2", "mgf2", "nacl", "kbr", "csi", "krs5", "as2s3", "amtir1", "zblan",
];

const CRYSTRAN = "Crystran Ltd, Handbook of Infrared and Ultraviolet Optical Materials, germanium data sheet " +
  "(https://www.crystran.com/optical-materials/germanium-ge): n = 4.0026 at 11 µm, " +
  "thermal conductivity 58.62 W m⁻¹ K⁻¹, Knoop 780, transmission 1.8 to 23 µm.";
const FREY_GE = "Frey B. J., Leviton D. B., Madison T. J. (2006). Temperature-dependent refractive index of silicon and germanium. " +
  "Proc. SPIE 6273, 62732J, doi:10.1117/12.672850, Table 9: absolute dn/dT of Ge at 295 K, 4.16 × 10⁻⁴ K⁻¹ at 5.5 µm (CHARMS, in vacuum).";
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
    { key: "dnDT", label: "dn/dT (convention: dnDTAbsolute)", unit: "×10⁻⁶/K", toSI: 1e-6, siUnit: "1/K" },
    {
      key: "dnDTAbsolute", label: "dn/dT convention: 1 = absolute (in vacuum, CHARMS, 295 K), 0 = data sheet, absolute or relative to air not stated",
      unit: "", toSI: 1, siUnit: "",
    },
    { key: "dnDTWavelength", label: "Wavelength of an absolute dn/dT", unit: "µm", toSI: 1e-6, siUnit: "m" },
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
    const reasons: Partial<Record<"n" | "transmission" | "dnDT" | "dnDTAbsolute" | "dnDTWavelength" | "conductivity", string>> = {};
    if (!hasFormula(d)) {
      const noFormula = `No dispersion formula for ${mat.name}: n is not available.`;
      warnings.push(noFormula);
      reasons.n = noFormula;
      reasons.transmission = noFormula;
    } else if (!Number.isFinite(nRef)) {
      const outsideRange = "The wavelength is outside the material's Sellmeier formula range: no index.";
      warnings.push(outsideRange);
      reasons.n = outsideRange;
      reasons.transmission = outsideRange;
    } else if (mat.dnDT === null) warnings.push("No sourced dn/dT: n is at the formula's temperature.");
    if (mat.dnDT === null) {
      const noDnDT = "No sourced dn/dT for this material.";
      warnings.push(noDnDT);
      reasons.dnDT = noDnDT;
      reasons.dnDTAbsolute = noDnDT;
      reasons.dnDTWavelength = noDnDT;
    } else {
      warnings.push(`dn/dT: ${dnDTConvention(mat)}${mat.dnDTAbsolute ? "" : " (the two differ by about n · 0.92 × 10⁻⁶/K)"}. ` +
        "It is one value, applied at every wavelength and temperature, so n(T) is an estimate away from that wavelength.");
      if (!mat.dnDTAbsolute) {
        const noLambda = "No wavelength is stored for this dn/dT value: dnDTWavelength is null.";
        warnings.push(noLambda);
        reasons.dnDTWavelength = noLambda;
      }
    }
    if (mat.conductivity === null) {
      const noConductivity = "No sourced thermal conductivity for this material.";
      warnings.push(noConductivity);
      reasons.conductivity = noConductivity;
    }
    return {
      values: {
        n,
        transmission: fresnelLimitTransmission(n),
        dnDT: mat.dnDT ?? NaN,
        dnDTAbsolute: mat.dnDT === null ? NaN : mat.dnDTAbsolute ? 1 : 0,
        dnDTWavelength: mat.dnDTAbsolute?.lambda ?? NaN,
        conductivity: mat.conductivity ?? NaN,
        knoop: mat.knoop === null ? NaN : mat.knoop * 9.80665e6,
      },
      warnings,
      reasons,
    };
  },
  checks: [
    {
      // Crystran prints n = 4.0026 for Ge at 11 µm; the Burnett formula (22 °C, the temperature the page shifts from) gives 4.00329.
      source: CRYSTRAN + " " + BURNETT,
      basis: "printed",
      // The same sheet prints "58.62 W m⁻¹ K⁻¹" and "Knoop 780" (exact here).
      inputs: { material: "ge", wavelength: 11, temperature: 22 },
      expect: { n: 4.0026, conductivity: 58.62, knoop: 780 },
      tolerance: 5e-4,
    },
    {
      // dn/dT is the absolute CHARMS value, printed as 4.16E-04 at 5.5 µm, 295 K (Crystran's +396 × 10⁻⁶ doesn't say which).
      source: FREY_GE,
      basis: "printed",
      inputs: { material: "ge" },
      expect: { dnDT: 416, dnDTAbsolute: 1, dnDTWavelength: 5.5 },
      tolerance: 1e-9,
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
