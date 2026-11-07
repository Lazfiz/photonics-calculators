import { nonlinearCoefficient } from "../../physics/fiber-optics/fiber-nonlinear";
import { KERR_MEDIA, kerrIndexChange, kerrValuesAt, piPhaseIntensity, type KerrMediumId } from "../../physics/materials/kerr-index";
import { criticalPower, nonlinearPhase } from "../../physics/wave-optics/kerr";
import { defineSchema } from "../types";

const IDS = Object.keys(KERR_MEDIA) as KerrMediumId[];
/** Relative wavelength offset from a medium's reference λ above which the page flags its n₂. */
const LAMBDA_TOLERANCE = 0.05;

const DUBIETIS = "Dubietis A., Tamošauskas G., Šuminas R., Jukna V., Couairon A. (2017). Ultrafast supercontinuum generation in bulk " +
  "condensed media. Lith. J. Phys. 57(3) (arXiv:1706.04356), Table 1: n₂ (10⁻¹⁶ cm²/W) and n₀ at 800 nm; Δn = n₂I (Boyd, Nonlinear Optics).";
const AGRAWAL = "Agrawal G. P. (2019). Nonlinear Fiber Optics, 6th ed.: silica n₂ = 2.6 × 10⁻²⁰ m²/W, γ = 2πn₂/(λ A_eff). " +
  "φ = (2π/λ) n₂ I L (Boyd, Nonlinear Optics). P_cr = 3.77 λ²/(8π n₀ n₂): Fibich G., Gaeta A. L. (2000), Opt. Lett. 25, 335. " +
  "n₀ of fused silica: Malitson I. H. (1965), J. Opt. Soc. Am. 55, 1205.";

export default defineSchema({
  href: "/materials/nonlinear-index",
  choices: [
    {
      key: "material",
      label: "Medium (n₂ and n₀ apply only to \"custom\")",
      options: [...IDS.map((id) => ({ value: id, label: KERR_MEDIA[id].name })), { value: "custom", label: "Custom" }],
      default: "silica-fiber",
    },
  ],
  inputs: [
    { key: "n2", label: "n₂ (custom only)", unit: "cm²/W", toSI: 1e-4, siUnit: "m²/W", default: 2.6e-16, min: 1e-20, max: 1e-10 },
    { key: "n0", label: "Linear index n₀ (custom only)", unit: "", toSI: 1, siUnit: "", default: 1.45, min: 1, max: 5 },
    { key: "intensity", label: "Intensity I", unit: "W/cm²", toSI: 1e4, siUnit: "W/m²", default: 1e12, min: 0, max: 1e16 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 200, max: 20000 },
    { key: "length", label: "Length L", unit: "mm", toSI: 1e-3, siUnit: "m", default: 10, min: 1e-3, max: 1e7 },
    { key: "area", label: "Fibre effective area A_eff", unit: "µm²", toSI: 1e-12, siUnit: "m²", default: 80, min: 0.01, max: 1e6 },
  ],
  outputs: [
    { key: "deltaN", label: "Index change Δn = n₂I", unit: "", toSI: 1, siUnit: "" },
    { key: "phase", label: "Nonlinear phase φ = k₀n₂IL", unit: "rad", toSI: 1, siUnit: "rad" },
    { key: "criticalPower", label: "Critical power P_cr (Gaussian beam)", unit: "W", toSI: 1, siUnit: "W" },
    { key: "gamma", label: "Fibre nonlinear coefficient γ", unit: "W⁻¹km⁻¹", toSI: 1e-3, siUnit: "1/(W·m)" },
    { key: "gammaL", label: "Fibre SPM phase per watt γL", unit: "rad/W", toSI: 1, siUnit: "rad/W" },
    { key: "piIntensity", label: "Intensity for a phase of π over L", unit: "W/cm²", toSI: 1e4, siUnit: "W/m²" },
  ],
  compute({ material, n2: n2Custom, n0: n0Custom, intensity, wavelength, length, area }) {
    const medium = material === "custom" ? null : KERR_MEDIA[material as KerrMediumId];
    const at = medium ? kerrValuesAt(medium, wavelength) : null;
    const n2 = at ? at.n2 : n2Custom;
    const n0 = at ? at.n0 : n0Custom;
    const gamma = nonlinearCoefficient(n2, wavelength, area);
    const warnings: string[] = [];
    if (medium && !medium.dispersion && Math.abs(wavelength - medium.lambda) > LAMBDA_TOLERANCE * medium.lambda) {
      warnings.push(`n₂ is the ${Math.round(medium.lambda * 1e9)} nm value; its dispersion is not modelled.`);
    }
    if (at?.status === "held") warnings.push("The n₂ fit ends at a shorter wavelength: n₂ is held at its long-wavelength end.");
    if (at?.status === "below") warnings.push("The n₂ fit starts at a longer wavelength: no n₂ is given.");
    return {
      values: {
        deltaN: kerrIndexChange(n2, intensity),
        phase: nonlinearPhase(wavelength, n2, intensity, length),
        criticalPower: criticalPower(wavelength, n0, n2),
        gamma,
        gammaL: gamma * length,
        piIntensity: piPhaseIntensity(wavelength, n2, length),
      },
      warnings,
    };
  },
  checks: [
    {
      // Table 1 prints n₂ = 2.4 × 10⁻¹⁶ cm²/W for fused silica at 800 nm, so Δn = n₂I = 2.4e-16 · 1e12 = 2.4e-4.
      source: DUBIETIS,
      basis: "printed",
      inputs: { material: "fused-silica", wavelength: 800, intensity: 1e12 },
      expect: { deltaN: 2.4e-4 },
      tolerance: 1e-9,
    },
    {
      // Table 1 prints n₂ = 3.75 × 10⁻¹⁶ cm²/W for BK7 at 800 nm, so Δn = 3.75e-16 · 1e12 = 3.75e-4.
      source: DUBIETIS,
      basis: "printed",
      inputs: { material: "bk7", wavelength: 800, intensity: 1e12 },
      expect: { deltaN: 3.75e-4 },
      tolerance: 1e-9,
    },
    {
      // Silica fibre, 1550 nm, I = 1e12 W/cm² = 1e16 W/m², L = 10 mm, A_eff = 80 µm², n₂ = 2.6e-20 m²/W, n₀ = 1.444024 (Malitson, evaluated at 1.55 µm):
      // Δn = 2.6e-4; φ = 2π/1.55e-6 · 2.6e-20 · 1e16 · 0.01 = 10.5395 rad; P_cr = 3.77 λ²/(8π n₀ n₂) = 9.59881 MW;
      // γ = 2π · 2.6e-20/(1.55e-6 · 80e-12) = 1.317442e-3 /(W·m) = 1.31744 W⁻¹km⁻¹; γL = 1.317442e-5 rad/W; I_π = λ/(2 n₂ L) = 2.98077e11 W/cm².
      source: AGRAWAL,
      basis: "computed",
      inputs: { material: "silica-fiber" },
      expect: {
        deltaN: 2.6e-4, phase: 10.53953664430124, criticalPower: 9598806.596642321, gamma: 1.3174420805376552,
        gammaL: 1.3174420805376551e-5, piIntensity: 2.9807692 * 1e11, // a product: one literal 2.98e11 trips the "c in mm/s" detector
      },
      tolerance: 1e-6,
    },
  ],
});
