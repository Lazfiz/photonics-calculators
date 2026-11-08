import { CRYSTAL_IDS, UNIAXIAL_CRYSTALS } from "../../physics/materials/uniaxial-data";
import { plateOrder, plateThickness } from "../../physics/polarization/retarders";
import { crystalBirefringence } from "../../physics/polarization/uniaxial";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;
const HECHT = "Hecht E. (2002). Optics, 4th ed., Addison-Wesley, §8.4 Birefringence and §8.7 Retarders " +
  "(retardance 2πΔn·d/λ of a plate with its optic axis in the faces, at normal incidence).";

export default defineSchema({
  href: "/polarization/waveplate-order",
  choices: [
    {
      key: "crystal",
      label: "Crystal",
      options: [
        ...CRYSTAL_IDS.map((id) => ({ value: id, label: UNIAXIAL_CRYSTALS[id].name })),
        { value: "custom", label: "Custom (no dispersion)" },
      ],
      default: "quartz",
    },
  ],
  inputs: [
    { key: "birefringence", label: "Birefringence Δn = nₑ − nₒ (custom crystal only)", unit: "", toSI: 1, siUnit: "", default: 0.009, min: -1, max: 1 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 550, min: 200, max: 7000 },
    { key: "thickness", label: "Plate thickness", unit: "µm", toSI: 1e-6, siUnit: "m", default: 100, min: 0.1, max: 50000 },
  ],
  outputs: [
    { key: "dn", label: "Birefringence Δn = nₑ − nₒ (> 0: optic axis slow)", unit: "", toSI: 1, siUnit: "" },
    { key: "pathDifference", label: "Retardation |Δn|·d", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "phase", label: "Phase retardation Γ = 2πΔn·d/λ", unit: "rad", toSI: 1, siUnit: "rad" },
    { key: "phaseDeg", label: "Phase retardation Γ", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "waves", label: "Retardation |Δn|·d/λ", unit: "waves", toSI: 1, siUnit: "waves" },
    { key: "order", label: "Plate order (whole waves)", unit: "", toSI: 1, siUnit: "" },
    { key: "fraction", label: "Fraction of a wave beyond the order", unit: "waves", toSI: 1, siUnit: "waves" },
    { key: "qwpThickness", label: "Zero-order quarter-wave thickness", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "hwpThickness", label: "Zero-order half-wave thickness", unit: "µm", toSI: 1e-6, siUnit: "m" },
  ],
  compute({ crystal, birefringence, wavelength, thickness }) {
    const dn = crystalBirefringence(crystal, birefringence)(wavelength);
    const o = plateOrder(dn, thickness, wavelength);
    const warnings: string[] = [];
    if (!Number.isFinite(dn)) warnings.push("The wavelength is outside this crystal's Sellmeier data range: no indices.");
    const phase = 2 * Math.PI * o.waves;
    return {
      values: {
        dn,
        pathDifference: Math.abs(dn) * thickness,
        phase,
        phaseDeg: phase,
        waves: o.waves,
        order: o.order,
        fraction: o.fraction,
        qwpThickness: plateThickness(dn, wavelength, 0.25),
        hwpThickness: plateThickness(dn, wavelength, 0.5),
      },
      warnings,
    };
  },
  checks: [
    {
      // Custom Δn = 0.009, d = 100 µm, λ = 550 nm: |Δn|d = 9e-7 m = 900 nm, waves = 9e-7/5.5e-7 = 18/11 = 1.636363…,
      // order 1, fraction 7/11 = 0.636363…, Γ = 2π · 18/11 = 10.2815760 rad, quarter wave d = 0.25 · 550 nm / 0.009 = 15.277778 µm.
      source: HECHT,
      basis: "computed",
      inputs: { crystal: "custom", birefringence: 0.009, thickness: 100, wavelength: 550 },
      expect: { waves: 1.636363636, fraction: 0.636363636, pathDifference: 900, phase: 10.28157596, qwpThickness: 15.27777778, hwpThickness: 30.55555556 },
      tolerance: 1e-8,
    },
  ],
});
