import { XRAY_MATERIALS, xrayIndex, xrayTransmission, type XRayMaterialId } from "../../physics/materials/x-ray-optics";
import { defineSchema } from "../types";

const IDS = Object.keys(XRAY_MATERIALS) as XRayMaterialId[];

const CXRO = "Gullikson E. M., Center for X-Ray Optics (CXRO), 'Index of refraction' calculator (https://henke.lbl.gov/cgi-bin/getdb.pl, " +
  "queried 2026-11-07), built on Henke B. L., Gullikson E. M., Davis J. C. (1993). X-ray interactions: photoabsorption, scattering, " +
  "transmission, and reflection at E = 50–30,000 eV, Z = 1–92. At. Data Nucl. Data Tables 54, 181, doi:10.1006/adnd.1993.1013; " +
  "n = 1 − δ − iβ, δ and β in the calculator's printed output, β including Compton scattering.";

export default defineSchema({
  href: "/materials/x-ray-optics",
  choices: [
    {
      key: "material",
      label: "Material",
      options: IDS.map((id) => ({ value: id, label: XRAY_MATERIALS[id].label })),
      default: "Be",
    },
  ],
  inputs: [
    { key: "density", label: "Density (0 = the material's preset)", unit: "g/cm³", toSI: 1000, siUnit: "kg/m³", default: 0, min: 0, max: 25 },
    { key: "energy", label: "Photon energy", unit: "keV", toSI: 1000, siUnit: "eV", default: 10, min: 1, max: 30 },
    { key: "thickness", label: "Thickness", unit: "µm", toSI: 1e-6, siUnit: "m", default: 100, min: 0, max: 1e5 },
  ],
  outputs: [
    { key: "delta", label: "Decrement δ (n = 1 − δ − iβ)", unit: "", toSI: 1, siUnit: "" },
    { key: "beta", label: "Absorption index β (photoabsorption + Compton)", unit: "", toSI: 1, siUnit: "" },
    { key: "thetaC", label: "Critical angle θ_c = √(2δ)", unit: "mrad", toSI: 1e-3, siUnit: "rad" },
    { key: "attenuationLength", label: "1/e intensity attenuation length λ/(4πβ)", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "massAttenuation", label: "Mass attenuation μ/ρ", unit: "cm²/g", toSI: 0.1, siUnit: "m²/kg" },
    { key: "transmission", label: "Transmission exp(−t/L)", unit: "%", toSI: 0.01, siUnit: "" },
  ],
  compute({ material, density, energy, thickness }) {
    const mat = XRAY_MATERIALS[material as XRayMaterialId];
    // The page: 0 selects the preset; otherwise the density is clamped to 0.01–25 g/cm³.
    const rho = density > 0 ? Math.min(25000, Math.max(10, density)) : mat.rho_gcc * 1000;
    const r = xrayIndex(mat.formula, rho, energy);
    const warnings: string[] = [];
    if (!Number.isFinite(r.delta)) warnings.push("Outside the Henke tables (1–30 keV) or no valid density: no result.");
    return {
      values: {
        delta: r.delta,
        beta: r.beta,
        thetaC: r.thetaC,
        attenuationLength: r.attenuationLength,
        massAttenuation: r.massAttenuation,
        transmission: xrayTransmission(thickness, r.attenuationLength),
      },
      warnings,
    };
  },
  checks: [
    {
      // CXRO output for Be, ρ = 1.848 g/cm³, 10000 eV: delta 3.40754082E-06, beta 1.02839592E-09.
      source: CXRO,
      basis: "printed",
      inputs: { material: "Be", density: 1.848, energy: 10 },
      expect: { delta: 3.40754082e-6, beta: 1.02839592e-9 },
      tolerance: 2e-3,
    },
    {
      // CXRO output for Si, ρ = 2.33 g/cm³, 10000 eV: delta 4.88892465E-06, beta 7.37899413E-08.
      source: CXRO,
      basis: "printed",
      inputs: { material: "Si", density: 2.33, energy: 10 },
      expect: { delta: 4.88892465e-6, beta: 7.37899413e-8 },
      tolerance: 2e-3,
    },
  ],
});
