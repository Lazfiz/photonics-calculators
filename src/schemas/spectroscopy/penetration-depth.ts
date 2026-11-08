import { absorptionCoefficient, penetrationDepth } from "../../physics/spectroscopy/depth";
import { defineSchema } from "../types";

const BORN_WOLF = "M. Born, E. Wolf, Principles of Optics, 7th ed., Cambridge University Press 1999, ch. 14 (complex " +
  "index N = n + ik, k_z = k0 √(N² − n0² sin²θ)): " +
  "α = 4πk/λ0, d_p = λ0 / (4π Im √(N² − n0² sin²θ)).";
const AXELROD = "D. Axelrod, Total Internal Reflection Fluorescence Microscopy in Cell Biology, Traffic 2, 764–774 (2001), " +
  "doi:10.1034/j.1600-0854.2001.21104.x: evanescent depth d = λ0/(4π √(n0² sin²θ − n²)).";

export default defineSchema({
  href: "/spectroscopy/penetration-depth",
  inputs: [
    { key: "wavelengthNm", label: "Vacuum wavelength λ₀", unit: "nm", toSI: 1e-9, siUnit: "m", default: 800, min: 10, max: 1e6 },
    { key: "ambientIndex", label: "Incident-medium index n₀", unit: "", toSI: 1, siUnit: "", default: 1, min: 1, max: 5 },
    { key: "refractiveIndexN", label: "Refractive index n", unit: "", toSI: 1, siUnit: "", default: 1.5, min: 0.01, max: 10 },
    { key: "extinctionCoeffK", label: "Extinction coefficient k", unit: "", toSI: 1, siUnit: "", default: 0.001, min: 0, max: 20 },
    { key: "angleDeg", label: "Angle of incidence θ", unit: "°", toSI: Math.PI / 180, siUnit: "rad", default: 0, min: 0, max: 89.9 },
  ],
  outputs: [
    { key: "alpha", label: "Absorption coefficient α = 4πk/λ₀", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹" },
    { key: "depth", label: "Intensity 1/e depth d_p at θ", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "fieldDepth", label: "Field 1/e depth 2 d_p at θ", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "normalDepth", label: "Depth at normal incidence 1/α", unit: "µm", toSI: 1e-6, siUnit: "m" },
  ],
  compute({ wavelengthNm: lambda, ambientIndex: n0, refractiveIndexN: n, extinctionCoeffK: k, angleDeg: theta }) {
    const dp = penetrationDepth(lambda, n0, n, k, theta);
    const dNormal = penetrationDepth(lambda, n0, n, k, 0);
    const warnings: string[] = [];
    if (dp === Infinity) warnings.push("k = 0 below the critical angle: the wave propagates without loss, so the depth is infinite.");
    return {
      values: {
        alpha: absorptionCoefficient(k, lambda),
        depth: dp,
        fieldDepth: 2 * dp,
        normalDepth: dNormal,
      },
      warnings,
    };
  },
  checks: [
    {
      // λ0 = 800 nm, k = 0.001, normal incidence: α = 4π · 0.001 / 8e-7 m⁻¹ = 5000π m⁻¹ = 157.0796327 cm⁻¹;
      // d_p = 1/α = 2e-4/π m = 63.66197724 µm; field depth 127.32395447 µm.
      source: BORN_WOLF,
      basis: "computed",
      inputs: {},
      expect: { alpha: 157.0796327, depth: 63.66197724, fieldDepth: 127.32395447 },
      tolerance: 1e-8,
    },
    {
      // TIR, k = 0: n0 = 1.52, n = 1.33, θ = 70°, λ0 = 488 nm. n0 sin θ = 1.42833278, squared 2.04 − 1.7689 = 0.27125,
      // sqrt = 0.52080182, d = 488 / (4π · 0.52080182) = 74.5654187 nm = 0.0745654187 µm.
      source: AXELROD,
      basis: "computed",
      inputs: { wavelengthNm: 488, ambientIndex: 1.52, refractiveIndexN: 1.33, extinctionCoeffK: 0, angleDeg: 70 },
      expect: { depth: 0.0745654187 },
      tolerance: 1e-8,
    },
  ],
});
