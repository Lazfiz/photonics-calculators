import { STRESS_OPTIC, stressForRetardance, type StressOpticId } from "../../physics/materials/stress-optic";
import { photoelasticRetardance } from "../../physics/polarization/photoelasticity";
import { retardanceFromPath } from "../../physics/polarization/retarders";
import { defineSchema } from "../types";

const GLASS_IDS = Object.keys(STRESS_OPTIC) as StressOpticId[];

const LAW = "Stress-optic law Δn = C (σ₁ − σ₂) and plate retardance R = C d (σ₁ − σ₂) (Dally J. W., Riley W. F. (2005). Experimental " +
  "Stress Analysis, 4th ed., College House Enterprises, theory of photoelasticity; equation numbers not checked); phase Γ = 2πR/λ; " +
  "stress for λ/2 retardance σ = λ/(2 C d).";
const JOG = "Jog E. S. (1957). The dispersion of the stress optical coefficient of vitreous silica. J. Indian Inst. Sci. 39(2), 93, Table I " +
  "(C = 3.55 × 10⁻¹² Pa⁻¹ at 649.5 nm, Filon & Harris mean value, as used for the preset); " + LAW;

export default defineSchema({
  href: "/materials/photoelastic",
  choices: [
    {
      key: "material",
      label: "Glass (the custom C applies only to \"custom\")",
      options: [...GLASS_IDS.map((id) => ({ value: id, label: STRESS_OPTIC[id].name })), { value: "custom", label: "Custom" }],
      default: "silica",
    },
  ],
  inputs: [
    { key: "C", label: "Stress-optic coefficient C (custom)", unit: "×10⁻¹² Pa⁻¹", toSI: 1e-12, siUnit: "1/Pa", default: 3, min: -100, max: 100 },
    { key: "stress", label: "Stress difference σ₁ − σ₂", unit: "MPa", toSI: 1e6, siUnit: "Pa", default: 10, min: -2000, max: 2000 },
    { key: "thickness", label: "Thickness d", unit: "mm", toSI: 1e-3, siUnit: "m", default: 10, min: 0.01, max: 1000 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 633, min: 200, max: 20000 },
  ],
  outputs: [
    { key: "coefficient", label: "Stress-optic coefficient C", unit: "×10⁻¹² Pa⁻¹", toSI: 1e-12, siUnit: "1/Pa" },
    { key: "deltaN", label: "Birefringence Δn = C·σ (signed)", unit: "", toSI: 1, siUnit: "" },
    { key: "phase", label: "Phase Γ = 2πR/λ", unit: "rad", toSI: 1, siUnit: "rad" },
    { key: "order", label: "Fringe order R/λ", unit: "", toSI: 1, siUnit: "" },
    { key: "retardance", label: "Retardance R in the plate (signed)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "retardancePerCm", label: "Retardance per cm", unit: "nm/cm", toSI: 1e-7, siUnit: "" },
    { key: "halfWaveStress", label: "Stress for half-wave retardance", unit: "MPa", toSI: 1e6, siUnit: "Pa" },
  ],
  compute({ material, C: Ccustom, stress, thickness, wavelength }) {
    const custom = material === "custom";
    const C = custom ? Ccustom : STRESS_OPTIC[material as StressOpticId].C;
    const R = photoelasticRetardance(C, thickness, stress);
    const halfWaveStress = stressForRetardance(wavelength / 2, C, thickness);
    const warnings: string[] = [];
    if (wavelength < 400e-9 || wavelength > 2500e-9) {
      warnings.push("C is measured in the visible and glasses absorb outside roughly 0.35–2.5 µm: outside this range the retardance is indicative only.");
    }
    if (!Number.isFinite(halfWaveStress)) warnings.push("C = 0: no birefringence at any stress.");
    return {
      values: {
        coefficient: C,
        deltaN: C * stress,
        phase: retardanceFromPath(R, wavelength),
        order: R / wavelength,
        retardance: R,
        retardancePerCm: photoelasticRetardance(C, 0.01, stress) / 0.01,
        halfWaveStress,
      },
      warnings,
    };
  },
  checks: [
    {
      // Custom C = 3 × 10⁻¹² Pa⁻¹, σ₁ − σ₂ = 10 MPa, d = 10 mm, λ = 633 nm: Δn = 3e-12 · 1e7 = 3e-5; R = Δn d = 3e-7 m = 300 nm
      // (per cm of thickness 3e-5 · 0.01 = 3e-7 m, 300 nm/cm); order = 300/633 = 0.47393365; Γ = 2π · 0.47393365 = 2.97781 rad;
      // half-wave stress = 633e-9/2/(3e-12 · 0.01) = 1.055e7 Pa = 10.55 MPa.
      source: LAW,
      basis: "computed",
      inputs: { material: "custom" },
      expect: {
        coefficient: 3, deltaN: 3e-5, retardance: 300, retardancePerCm: 300, order: 300 / 633, phase: (2 * Math.PI * 300) / 633, halfWaveStress: 10.55,
      },
      tolerance: 1e-8,
    },
    {
      // Fused silica preset, C = 3.55 × 10⁻¹² Pa⁻¹ (649.5 nm), σ = −20 MPa (compression), d = 5 mm: Δn = 3.55e-12 · (−2e7) = −7.1e-5;
      // R = −7.1e-5 · 5e-3 = −3.55e-7 m = −355 nm; per cm −710 nm/cm; at 633 nm half-wave stress = 316.5e-9/(3.55e-12 · 5e-3) = 17.8310 MPa.
      source: JOG,
      basis: "computed",
      inputs: { material: "silica", stress: -20, thickness: 5 },
      expect: { coefficient: 3.55, deltaN: -7.1e-5, retardance: -355, retardancePerCm: -710, halfWaveStress: 316.5e-9 / (3.55e-12 * 5e-3) / 1e6 },
      tolerance: 1e-8,
    },
  ],
});
