import { CRYSTAL_IDS, UNIAXIAL_CRYSTALS } from "../../physics/materials/uniaxial-data";
import { plateThickness } from "../../physics/polarization/retarders";
import { crystalBirefringence } from "../../physics/polarization/uniaxial";
import { defineSchema } from "../types";

const HECHT = "Hecht E. (2002). Optics, 4th ed., Addison-Wesley, §8.4 Birefringence and §8.7 Retarders " +
  "(plate of order m for a fraction f of a wave: d = (m + f)λ/|Δn|; optic axis in the faces, normal incidence).";

export default defineSchema({
  href: "/polarization/waveplate-thickness",
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
    { key: "birefringence", label: "Birefringence Δn = nₑ − nₒ (custom crystal only)", unit: "", toSI: 1, siUnit: "", default: 0.0092, min: -1, max: 1 },
    { key: "wavelengthNm", label: "Design wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 550, min: 200, max: 7000 },
    { key: "customRetardance", label: "Retardance f", unit: "waves", toSI: 1, siUnit: "waves", default: 0.25, min: 0.01, max: 0.99 },
    { key: "order", label: "Order m (rounded to a whole number)", unit: "", toSI: 1, siUnit: "", default: 10, min: 0, max: 200 },
  ],
  outputs: [
    { key: "absDn", label: "|Δn| at the design wavelength", unit: "", toSI: 1, siUnit: "" },
    { key: "zeroOrderThickness", label: "Zero-order thickness f·λ/|Δn|", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "orderThickness", label: "Order-m thickness (m + f)·λ/|Δn|", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "wholeWaveThickness", label: "Whole-wave plate thickness m·λ/|Δn| (compound zero order: order-m minus this)", unit: "µm", toSI: 1e-6, siUnit: "m" },
  ],
  compute({ crystal, birefringence, wavelengthNm, customRetardance, order }) {
    const dn = crystalBirefringence(crystal, birefringence)(wavelengthNm);
    const m = Math.round(order);
    const warnings: string[] = [];
    if (!Number.isFinite(dn)) warnings.push("The wavelength is outside this crystal's Sellmeier data range: no indices.");
    return {
      values: {
        absDn: Math.abs(dn),
        zeroOrderThickness: plateThickness(dn, wavelengthNm, customRetardance),
        orderThickness: plateThickness(dn, wavelengthNm, m + customRetardance),
        wholeWaveThickness: plateThickness(dn, wavelengthNm, m),
      },
      warnings,
    };
  },
  checks: [
    {
      // Custom Δn = 0.0092, λ = 550 nm, f = 0.25, m = 10: d₀ = 0.25 · 550e-9/0.0092 = 14.945652 µm,
      // d_m = 10.25 · 550e-9/0.0092 = 612.771739 µm, whole-wave 10 · 550e-9/0.0092 = 597.826087 µm.
      source: HECHT,
      basis: "computed",
      inputs: { crystal: "custom", birefringence: 0.0092, wavelengthNm: 550, customRetardance: 0.25, order: 10 },
      expect: { absDn: 0.0092, zeroOrderThickness: 14.94565217, orderThickness: 612.7717391, wholeWaveThickness: 597.8260870 },
      tolerance: 1e-8,
    },
  ],
});
