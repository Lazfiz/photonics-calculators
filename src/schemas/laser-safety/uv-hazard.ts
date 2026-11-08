import { actinicUvWeight, uvHazard } from "../../physics/laser-safety/hazard-weighting";
import { defineSchema } from "../types";

const ICNIRP_2004_UV = "ICNIRP (2004). Guidelines on limits of exposure to ultraviolet radiation of wavelengths between 180 nm " +
  "and 400 nm (incoherent optical radiation). Health Phys. 87(2), 171–186, Table 1 (S(λ)) and the eye limits within 8 h " +
  "(30 J/m² effective, 10⁴ J/m² UVA)";

// The page's exposure time is plain React state (not in the URL), so the exposure fraction is not an output here.
export default defineSchema({
  href: "/laser-safety/uv-hazard",
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 254, min: 180, max: 400 },
    { key: "spectralIrr", label: "Irradiance at the eye", unit: "W/cm²", toSI: 1e4, siUnit: "W/m²", default: 0.01, min: 0, max: 1e6 },
  ],
  outputs: [
    { key: "weight", label: "S(λ) weight", unit: "", toSI: 1, siUnit: "" },
    { key: "effectiveIrradiance", label: "Effective (S-weighted) irradiance", unit: "W/cm²", toSI: 1e4, siUnit: "W/m²" },
    { key: "maxExposure", label: "Longest exposure within both 8 h limits", unit: "s", toSI: 1, siUnit: "s" },
  ],
  compute({ wavelength, spectralIrr }) {
    const h = uvHazard(wavelength, spectralIrr);
    const warnings: string[] = [];
    if (h.tMax === Infinity) warnings.push("No UV exposure limit is reached at this irradiance and wavelength.");
    return {
      values: {
        weight: actinicUvWeight(wavelength),
        effectiveIrradiance: h.E_eff,
        maxExposure: h.tMax === Infinity ? NaN : h.tMax,
      },
      warnings,
    };
  },
  checks: [
    {
      // 254 nm: S = 0.50 (Table 1 row 254). 0.01 W/cm² = 100 W/m²; E_eff = 50 W/m² = 5e-3 W/cm²; t = 30 J/m² / 50 W/m² = 0.6 s.
      source: ICNIRP_2004_UV,
      basis: "computed",
      inputs: { wavelength: 254, spectralIrr: 0.01 },
      expect: { weight: 0.5, effectiveIrradiance: 0.005, maxExposure: 0.6 },
      tolerance: 1e-9,
    },
    {
      // 365 nm: S = 1.1e-4. 100 W/m²: actinic 30/(100·1.1e-4) = 2727.27 s; UVA 1e4/100 = 100 s, which governs.
      source: ICNIRP_2004_UV,
      basis: "computed",
      inputs: { wavelength: 365, spectralIrr: 0.01 },
      expect: { weight: 1.1e-4, maxExposure: 100 },
      tolerance: 1e-9,
    },
  ],
});
