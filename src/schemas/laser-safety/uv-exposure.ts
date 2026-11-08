import { actinicUvWeight, uvMaxIrradiance } from "../../physics/laser-safety/hazard-weighting";
import { defineSchema } from "../types";

const ICNIRP_2004_UV = "ICNIRP (2004). Guidelines on limits of exposure to ultraviolet radiation of wavelengths between 180 nm " +
  "and 400 nm (incoherent optical radiation). Health Phys. 87(2), 171–186, Table 1 (S(λ)) and the eye limits within 8 h " +
  "(30 J/m² effective, 10⁴ J/m² UVA)";

export default defineSchema({
  href: "/laser-safety/uv-exposure",
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 254, min: 180, max: 400 },
    { key: "exposureTime", label: "Exposure time", unit: "h", toSI: 3600, siUnit: "s", default: 8, min: 1e-6, max: 8 },
    { key: "beamArea", label: "Beam/source area", unit: "cm²", toSI: 1e-4, siUnit: "m²", default: 1, min: 0, max: 1e6 },
  ],
  outputs: [
    { key: "weight", label: "S(λ) weight", unit: "", toSI: 1, siUnit: "" },
    { key: "mpeIrradiance", label: "Highest irradiance within both limits", unit: "W/cm²", toSI: 1e4, siUnit: "W/m²" },
    { key: "mpeExposure", label: "Radiant exposure over the time", unit: "J/cm²", toSI: 1e4, siUnit: "J/m²" },
    { key: "maxPower", label: "Max power over the source area", unit: "W", toSI: 1, siUnit: "W" },
  ],
  compute({ wavelength, exposureTime, beamArea }) {
    const E = uvMaxIrradiance(wavelength, exposureTime); // W/m²
    return {
      values: {
        weight: actinicUvWeight(wavelength),
        mpeIrradiance: E,
        mpeExposure: E * exposureTime,
        maxPower: E * beamArea,
      },
    };
  },
  checks: [
    {
      // 254 nm, 8 h = 28800 s: S = 0.50. E = 30/(0.5·28800) = 2.083333e-3 W/m² = 2.083333e-7 W/cm²; H = 30/0.5 = 60 J/m²
      // = 6e-3 J/cm²; over 1 cm² = 2.083333e-7 W.
      source: ICNIRP_2004_UV,
      basis: "computed",
      inputs: { wavelength: 254, exposureTime: 8, beamArea: 1 },
      expect: { weight: 0.5, mpeIrradiance: 2.083333333e-7, mpeExposure: 6e-3, maxPower: 2.083333333e-7 },
      tolerance: 1e-9,
    },
    {
      // 365 nm, 8 h: S = 1.1e-4, actinic 30/(1.1e-4·28800) = 9.47 W/m²; UVA 1e4/28800 = 0.347222 W/m² = 3.472222e-5 W/cm²
      // governs; H = 1e4 J/m² = 1 J/cm².
      source: ICNIRP_2004_UV,
      basis: "computed",
      inputs: { wavelength: 365, exposureTime: 8, beamArea: 1 },
      expect: { mpeIrradiance: 3.472222222e-5, mpeExposure: 1 },
      tolerance: 1e-9,
    },
  ],
});
