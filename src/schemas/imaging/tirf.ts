import {
  tirfCriticalAngle, tirfInterfaceIntensity, tirfMaxAngle, tirfPenetrationDepth,
} from "../../physics/imaging/tirf";
import { defineSchema } from "../types";

const AXELROD = "Axelrod D. (2001). Total internal reflection fluorescence microscopy in cell biology. Traffic 2, " +
  "764–774, eqs. 2, 4, 5. https://doi.org/10.1034/j.1600-0854.2001.21104.x";

export default defineSchema({
  href: "/imaging/tirf",
  inputs: [
    { key: "na", label: "Objective NA", unit: "", toSI: 1, siUnit: "", default: 1.49, min: 0.1, max: 1.8 },
    { key: "n1", label: "n₁ (coverslip / immersion)", unit: "", toSI: 1, siUnit: "", default: 1.518, min: 1, max: 2 },
    { key: "n2", label: "n₂ (sample medium)", unit: "", toSI: 1, siUnit: "", default: 1.33, min: 1, max: 2 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 488, min: 300, max: 1500 },
    { key: "theta", label: "Incidence angle in the glass θ", unit: "°", toSI: Math.PI / 180, siUnit: "rad", default: 65, min: 0, max: 89.9 },
  ],
  outputs: [
    { key: "criticalAngle", label: "Critical angle θ_c", unit: "°", toSI: Math.PI / 180, siUnit: "rad" },
    { key: "maxAngle", label: "Objective's largest angle", unit: "°", toSI: Math.PI / 180, siUnit: "rad" },
    { key: "depth", label: "Intensity penetration depth d", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "fieldDecayLength", label: "Field decay length 2d", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "intensityAt100nm", label: "Intensity at 100 nm", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "interfaceS", label: "Interface intensity, s-polarised", unit: "× incident", toSI: 1, siUnit: "" },
    { key: "interfaceP", label: "Interface intensity, p-polarised", unit: "× incident", toSI: 1, siUnit: "" },
  ],
  validate({ na, n1, n2 }) {
    if (!(n2 < n1)) return `No total internal reflection: n₂ (${n2}) must be below n₁ (${n1}).`;
    if (na > n1) return `An objective NA of ${na} is not possible with immersion of n₁ = ${n1}.`;
    return undefined;
  },
  compute({ na, n1, n2, wavelength, theta }) {
    const thetaC = tirfCriticalAngle(n1, n2);
    const thetaMax = tirfMaxAngle(na, n1);
    const depth = tirfPenetrationDepth(wavelength, n1, n2, theta);
    const { s, p } = tirfInterfaceIntensity(n1, n2, theta);
    const tir = theta > thetaC;
    const warnings: string[] = [];
    if (!tir) {
      warnings.push("The angle is at or below the critical angle: the beam is transmitted into the sample (epi or HILO illumination), with no evanescent field.");
    } else if (!(na > n2)) {
      warnings.push("The objective's NA is not above n₂, so it cannot reach the critical angle; the values are for prism-type TIRF.");
    } else if (theta > thetaMax) {
      warnings.push("The angle lies beyond the objective's largest angle; the values are for prism-type TIRF.");
    }
    return {
      values: {
        criticalAngle: thetaC,
        maxAngle: thetaMax,
        depth: tir ? depth : NaN,
        fieldDecayLength: tir ? 2 * depth : NaN,
        intensityAt100nm: tir ? Math.exp(-100e-9 / depth) : NaN,
        interfaceS: tir ? s : NaN,
        interfaceP: tir ? p : NaN,
      },
      warnings,
    };
  },
  checks: [
    {
      // 488 nm, glass 1.518 on water 1.33, 65°: d = λ/(4π√(n₁² sin²θ − n₂²)) = 110.34 nm; θ_c = 61.18°, θ_max(NA 1.49) = 78.98°.
      source: AXELROD,
      basis: "computed",
      inputs: { na: 1.49, n1: 1.518, n2: 1.33, wavelength: 488, theta: 65 },
      expect: { depth: 110.344, criticalAngle: 61.1817, maxAngle: 78.9782 },
      tolerance: 1e-5,
    },
    {
      // Interface intensity from the Fresnel transmission with imaginary cos θ₂: s 3.0747 and p 3.9323 times the incident at 65°.
      source: AXELROD,
      basis: "computed",
      inputs: { n1: 1.518, n2: 1.33, theta: 65 },
      expect: { interfaceS: 3.0747, interfaceP: 3.93227 },
      tolerance: 1e-5,
    },
  ],
});
