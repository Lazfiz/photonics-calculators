import { correctionCE } from "../../physics/laser-safety/eye-exposure-limits";
import { diffuseExposure, diffuseHazardDistance, NEAR_POINT } from "../../physics/laser-safety/hazard-distance";
import { defineSchema } from "../types";
import { EXPOSURE, ICNIRP_2013, WAVELENGTH } from "./common";

const DIFFUSE = "ANSI Z136.1-2014 and IEC TR 60825-14: Lambertian spot irradiance E = ρP/(πr²) at distance r on the normal, " +
  `α = d₆₃/r with d₆₃ = d/√2 (IEC 60825-1); limits and C_E = α/α_min from ${ICNIRP_2013}, Table 2 and Table 5.`;

export default defineSchema({
  href: "/laser-safety/diffuse-reflection",
  inputs: [
    { key: "power", label: "Beam power", unit: "mW", toSI: 1e-3, siUnit: "W", default: 5000, min: 0, max: 1e9 },
    { ...WAVELENGTH, default: 1064 },
    { key: "beamDiameter", label: "Spot diameter on the surface, 1/e²", unit: "mm", toSI: 1e-3, siUnit: "m", default: 5, min: 0, max: 1e4 },
    { key: "surfaceReflectance", label: "Surface reflectance ρ", unit: "", toSI: 1, siUnit: "", default: 0.1, min: 0, max: 1 },
    { key: "viewingDistance", label: "Viewing distance", unit: "m", toSI: 1, siUnit: "m", default: 0.5, min: 1e-4, max: 1e4 },
    { ...EXPOSURE, key: "exposureTime", default: 10 },
  ],
  outputs: [
    { key: "irradiance", label: "Corneal irradiance at the viewer", unit: "W/m²", toSI: 1, siUnit: "W/m²" },
    { key: "alpha", label: "Apparent source size α", unit: "mrad", toSI: 1e-3, siUnit: "rad" },
    { key: "correctionCE", label: "Retinal correction C_E (400 to 1400 nm only)", unit: "", toSI: 1, siUnit: "" },
    { key: "ratio", label: "Highest exposure / limit", unit: "", toSI: 1, siUnit: "" },
    { key: "hazardDistance", label: "Diffuse hazard distance (0: within the limits at any distance)", unit: "m", toSI: 1, siUnit: "m" },
    { key: "opticalDensity", label: "Optical density needed at the viewing distance", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ power, wavelength, beamDiameter, surfaceReflectance, viewingDistance, exposureTime }) {
    const reflected = surfaceReflectance * power;
    const at = diffuseExposure(wavelength, reflected, beamDiameter, viewingDistance, exposureTime);
    const haz = diffuseHazardDistance(wavelength, reflected, beamDiameter, exposureTime);
    const warnings: string[] = [];
    if (at.limits.length === 0 || Number.isNaN(haz.distance)) {
      warnings.push("The eye limits cover 180 nm to 1 mm.");
      return { values: { irradiance: NaN, alpha: NaN, correctionCE: NaN, ratio: NaN, hazardDistance: NaN, opticalDensity: NaN }, warnings };
    }
    const maxRatio = Math.max(...at.limits.map((l) => l.ratio));
    // C_E belongs to the retinal thermal limit, which is only in force from 400 to 1400 nm.
    const retinal = wavelength >= 400e-9 && wavelength <= 1400e-9;
    if (!retinal) warnings.push("C_E applies from 400 to 1400 nm only.");
    if (retinal && viewingDistance < NEAR_POINT) warnings.push("Nearer than 10 cm the eye can't focus the spot, so the retinal limits are assessed at 10 cm.");
    return {
      values: {
        irradiance: at.irradiance,
        alpha: at.alpha,
        correctionCE: retinal ? correctionCE(at.alpha, exposureTime, "open") : NaN,
        ratio: maxRatio,
        hazardDistance: haz.distance,
        opticalDensity: Math.max(0, Math.log10(maxRatio)),
      },
      warnings,
    };
  },
  checks: [
    {
      // ρP = 0.1 × 5 W = 0.5 W at r = 0.5 m: E = 0.5/(π × 0.25) = 0.636620 W/m². The page's Gaussian near-field
      // factor (x = 8r²/d² = 80000) lowers it by 2.5e-5.
      source: DIFFUSE,
      basis: "computed",
      inputs: {},
      expect: { irradiance: 0.5 / (Math.PI * 0.25) },
      tolerance: 1e-4,
    },
    {
      // d₆₃ = 5 mm/√2 = 3.5355 mm, α = d₆₃/r = 7.0711 mrad (between α_min 1.5 mrad and α_max 100 mrad), so
      // C_E = α/α_min = 7.0711/1.5 = 4.71405.
      source: DIFFUSE,
      basis: "computed",
      inputs: {},
      expect: { alpha: 7.0710678118654755, correctionCE: 4.714045207910317 },
      tolerance: 1e-8,
    },
  ],
});
