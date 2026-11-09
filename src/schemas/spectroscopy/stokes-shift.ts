import { eV, hc_eV_nm } from "../../physics/constants";
import { stokesShift } from "../../physics/spectroscopy/stokes-shift";
import { defineSchema } from "../types";

const LAKOWICZ = "Lakowicz J.R. (2006). Principles of Fluorescence Spectroscopy, 3rd ed., Springer, ch. 1 (Stokes shift as the gap " +
  "between the absorption and emission maxima), doi:10.1007/978-0-387-46312-4; Δν̃ = 10⁷(1/λ_abs − 1/λ_em) cm⁻¹ with λ in nm " +
  "and ΔE = hc(1/λ_abs − 1/λ_em) are the unit conversions of that definition";

export default defineSchema({
  href: "/spectroscopy/stokes-shift",
  inputs: [
    { key: "absPeak", label: "Absorption maximum λ_abs", unit: "nm", toSI: 1e-9, siUnit: "m", default: 480, min: 150, max: 3000 },
    { key: "emPeak", label: "Emission maximum λ_em", unit: "nm", toSI: 1e-9, siUnit: "m", default: 520, min: 150, max: 3000 },
    { key: "absFWHM", label: "Absorption FWHM (chart only)", unit: "nm", toSI: 1e-9, siUnit: "m", default: 30, min: 0.1, max: 1000 },
    { key: "emFWHM", label: "Emission FWHM (chart only)", unit: "nm", toSI: 1e-9, siUnit: "m", default: 40, min: 0.1, max: 1000 },
  ],
  outputs: [
    { key: "shiftNm", label: "Stokes shift Δλ", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "shiftCm", label: "Stokes shift Δν̃", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹" },
    { key: "shiftEv", label: "Energy difference ΔE", unit: "eV", toSI: eV, siUnit: "J" },
  ],
  compute({ absPeak, emPeak }) {
    const { dNm, dCm, dEv } = stokesShift(absPeak * 1e9, emPeak * 1e9);
    const warnings: string[] = [];
    if (dCm < 0) warnings.push("Anti-Stokes: the emission maximum lies at a shorter wavelength than the absorption maximum.");
    return { values: { shiftNm: dNm * 1e-9, shiftCm: dCm * 100, shiftEv: dEv * eV }, warnings };
  },
  checks: [
    {
      // 480 → 520 nm: Δλ = 40 nm; Δν̃ = 1e7 (1/480 − 1/520) = 1e7 · 40/249600 = 1602.5641 cm⁻¹.
      source: LAKOWICZ,
      basis: "computed",
      inputs: {},
      expect: { shiftNm: 40, shiftCm: 1602.5641025641025 },
      tolerance: 1e-8,
    },
    {
      // 400 → 500 nm: Δν̃ = 1e7 · 100/200000 = 5000 cm⁻¹ exactly; ΔE = hc · 5e-4 nm⁻¹ (hc in eV·nm), in eV.
      source: LAKOWICZ,
      basis: "computed",
      inputs: { absPeak: 400, emPeak: 500 },
      expect: { shiftCm: 5000, shiftEv: hc_eV_nm * 5e-4 },
      tolerance: 1e-8,
    },
  ],
});
