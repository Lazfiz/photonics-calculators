import {
  blueLightSmallSourceMaxDuration, blueLightSmallSourceRiskGroup, blueLightWeight,
} from "../../physics/laser-safety/hazard-weighting";
import { defineSchema } from "../types";

const ICNIRP_2013_INCOHERENT = "ICNIRP (2013). Guidelines on limits of exposure to incoherent visible and infrared radiation. " +
  "Health Phys. 105(1), 74–96, Table 2 (B(λ)) and the small-source limits (eqns 15–17); IEC 62471:2006 Table 6.1 (risk groups)";

const RISK_GROUP_INDEX = { Exempt: 0, RG1: 1, RG2: 2, RG3: 3 } as const;

export default defineSchema({
  href: "/laser-safety/blue-light-hazard",
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 450, min: 300, max: 700 },
    { key: "power", label: "Power", unit: "W", toSI: 1, siUnit: "W", default: 1, min: 0, max: 1e6 },
    { key: "beamDiam", label: "Beam diameter", unit: "mm", toSI: 1e-3, siUnit: "m", default: 2, min: 0.001, max: 1e4 },
  ],
  outputs: [
    { key: "irradiance", label: "Corneal irradiance", unit: "W/cm²", toSI: 1e4, siUnit: "W/m²" },
    { key: "weight", label: "B(λ) weight", unit: "", toSI: 1, siUnit: "" },
    { key: "blueIrradiance", label: "Blue-weighted irradiance E_B", unit: "W/m²", toSI: 1, siUnit: "W/m²" },
    { key: "maxExposure", label: "Longest exposure within the small-source limit", unit: "s", toSI: 1, siUnit: "s" },
    { key: "riskGroup", label: "Risk group (0 Exempt, 1 RG1, 2 RG2, 3 RG3)", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ wavelength, power, beamDiam }) {
    const r = beamDiam / 2;
    const E = power / (Math.PI * r * r);
    const B = blueLightWeight(wavelength);
    const EB = E * B;
    const tMax = blueLightSmallSourceMaxDuration(EB);
    const warnings: string[] = [];
    if (tMax === Infinity) warnings.push("E_B is at or below 1 W/m²: no exposure-time limit applies.");
    if (tMax < 0.25) warnings.push("Below 0.25 s the retinal thermal limit governs, which this calculator doesn't evaluate.");
    return {
      values: {
        irradiance: E,
        weight: B,
        blueIrradiance: EB,
        maxExposure: tMax === Infinity ? NaN : tMax,
        riskGroup: RISK_GROUP_INDEX[blueLightSmallSourceRiskGroup(EB)],
      },
      warnings,
    };
  },
  checks: [
    {
      // 450 nm: B = 0.94 (Table 2). 1 W over d = 2 mm: E = 1/(π·(1e-3)²) = 318309.886 W/m² = 31.8309886 W/cm²;
      // E_B = 0.94 E = 299211.2928 W/m²; t = 100/E_B = 3.342120e-4 s; E_B > 400 W/m², so RG3.
      source: ICNIRP_2013_INCOHERENT,
      basis: "computed",
      inputs: { wavelength: 450, power: 1, beamDiam: 2 },
      expect: { weight: 0.94, irradiance: 31.83098862, blueIrradiance: 0.94 * 318309.8862, maxExposure: 3.3421198e-4, riskGroup: 3 },
      tolerance: 1e-6,
    },
    {
      // 500 nm, 1 mW over 4 mm: E = 1e-3/(π·(2e-3)²) = 79.57747 W/m², B = 0.1 (Table 2), E_B = 7.957747 W/m²;
      // t = 100/7.957747 = 12.56637 s; E_B in (1, 400] W/m² is RG2.
      source: ICNIRP_2013_INCOHERENT,
      basis: "computed",
      inputs: { wavelength: 500, power: 0.001, beamDiam: 4 },
      expect: { blueIrradiance: 7.957747155, maxExposure: 12.56637061, riskGroup: 2 },
      tolerance: 1e-6,
    },
  ],
});
