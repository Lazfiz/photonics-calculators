import { diamondIndex } from "../../physics/materials/crystal-properties";
import { WINDOW_MATERIALS, fresnelLimitTransmission, surfaceReflectance, transmits } from "../../physics/materials/window-materials";
import { defineSchema } from "../types";

const PETER = "Peter F. (1923). Über Brechungsindizes und Absorptionskonstanten des Diamanten zwischen 644 und 226 mμ. " +
  "Z. Phys. 15, 358–368, doi:10.1007/BF01330487; formula n² = 1 + 0.3306λ²/(λ² − 0.175²) + 4.3356λ²/(λ² − 0.106²), λ in µm " +
  "(coefficients as listed in the refractiveindex.info database, C/nk/Peter.yml); reflectance ((n − 1)/(n + 1))² and plate " +
  "transmission 2n/(n² + 1) are the Fresnel equations at normal incidence.";

export default defineSchema({
  href: "/materials/diamond-optics",
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 589, min: 226, max: 20000 },
  ],
  outputs: [
    { key: "n", label: "Refractive index n", unit: "", toSI: 1, siUnit: "" },
    { key: "reflectance", label: "Reflectance per surface ((n − 1)/(n + 1))²", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "transmission", label: "Fresnel-limited transmission 2n/(n² + 1)", unit: "%", toSI: 0.01, siUnit: "" },
  ],
  compute({ wavelength }) {
    const { n } = diamondIndex(wavelength);
    const warnings: string[] = [];
    if (!Number.isFinite(n)) warnings.push("Outside the index model's 226 nm–20 µm range.");
    else if (!transmits(WINDOW_MATERIALS.diamond, wavelength)) {
      warnings.push("Inside an absorption band (multiphonon 2.5–7 µm or the UV edge): the plate transmits less than the Fresnel limit.");
    }
    return {
      values: { n, reflectance: surfaceReflectance(n), transmission: fresnelLimitTransmission(n) },
      warnings,
    };
  },
  checks: [
    {
      // Peter's formula at 0.589 µm: n² = 1 + 0.3306 · 0.346921/(0.346921 − 0.030625) + 4.3356 · 0.346921/(0.346921 − 0.011236)
      // gives n = 2.4172982; R = (1.4172982/3.4172982)² = 17.201119 %; T = 2n/(n² + 1) = 70.646834 %.
      source: PETER,
      basis: "computed",
      inputs: { wavelength: 589 },
      expect: { n: 2.4172981917059504, reflectance: 17.201119480156082, transmission: 70.64683416600217 },
      tolerance: 1e-8,
    },
    {
      // Same formula at 0.4 µm: n = 2.4641269; R = 17.863636 %; T = 69.687620 %.
      source: PETER,
      basis: "computed",
      inputs: { wavelength: 400 },
      expect: { n: 2.4641269479157515, reflectance: 17.863636390974216, transmission: 69.68762047741778 },
      tolerance: 1e-8,
    },
  ],
});
