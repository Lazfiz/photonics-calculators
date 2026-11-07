import { DB_PER_E_FOLD } from "../../physics/fiber-optics/macro-bending-loss";
import { stokesWavelength } from "../../physics/imaging/coherent-raman";
import { RAMAN_LINES, dephasingTime, ramanGainAtPump, ramanGainExponent, type RamanLineId } from "../../physics/materials/raman-gain";
import { defineSchema } from "../types";

const IDS = Object.keys(RAMAN_LINES) as RamanLineId[];

const SAVITSKI = "Savitski V. G., Reilly S., Kemp A. J. (2013). Steady-State Raman Gain in Diamond as a Function of Pump Wavelength. " +
  "IEEE J. Quantum Electron. 49, 218, doi:10.1109/JQE.2012.2237505, Table 1 (g_R = 17 cm/GW at 1064 nm); Raman shift 1332.9 cm⁻¹ and " +
  "FWHM 2.7 cm⁻¹ from Basiev T. T. et al. (1999). Comparative spontaneous Raman spectroscopy of crystals for Raman lasers. " +
  "Appl. Opt. 38, 594, doi:10.1364/AO.38.000594. Stokes line 1/λ_s = 1/λ_p − Ω̃, T₂ = 1/(πcΔν̃) and the steady-state gain exponent " +
  "G = g_R·I·L are the textbook relations (Boyd, Nonlinear Optics, ch. 10: I_s(L) = I_s(0)·e^(g I L)).";

export default defineSchema({
  href: "/materials/raman-scattering",
  choices: [
    {
      key: "material",
      label: "Raman medium",
      options: IDS.map((id) => ({ value: id as string, label: RAMAN_LINES[id].name })),
      default: "diamond",
    },
  ],
  inputs: [
    { key: "pumpWl", label: "Pump wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1064, min: 200, max: 3000 },
    { key: "intensity", label: "Pump intensity", unit: "GW/cm²", toSI: 1e13, siUnit: "W/m²", default: 0.1, min: 0, max: 100 },
    { key: "length", label: "Length L", unit: "mm", toSI: 1e-3, siUnit: "m", default: 10, min: 0.01, max: 1e6 },
  ],
  outputs: [
    { key: "stokes", label: "Stokes wavelength", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "gain", label: "Peak Raman gain g_R", unit: "cm/GW", toSI: 1e-11, siUnit: "m/W" },
    { key: "dephasing", label: "Dephasing time T₂ = 1/(πcΔν̃)", unit: "ps", toSI: 1e-12, siUnit: "s" },
    { key: "gainExponent", label: "Single-pass gain exponent G = g_R·I·L", unit: "", toSI: 1, siUnit: "" },
    { key: "gainDb", label: "Stokes growth e^G in decibels", unit: "dB", toSI: 1, siUnit: "dB" },
  ],
  compute({ material, pumpWl, intensity, length }) {
    const line = RAMAN_LINES[material as RamanLineId];
    const { g, basis } = ramanGainAtPump(line, pumpWl);
    const G = ramanGainExponent(g, intensity, length);
    const warnings: string[] = [];
    if (basis === "scaled") warnings.push("g_R at this pump wavelength is scaled as 1/λ_p from the nearest measured pump wavelength (an estimate).");
    if (line.absorbsBelow && pumpWl < line.absorbsBelow) warnings.push(`${line.name} absorbs below ${(line.absorbsBelow * 1e9).toPrecision(3)} nm, so this pump is absorbed and g_R does not apply.`);
    if (!Number.isFinite(line.fwhm)) warnings.push("The glass line is broad and not Lorentzian: no dephasing time.");
    return {
      values: {
        stokes: stokesWavelength(pumpWl, line.shift),
        gain: g,
        dephasing: dephasingTime(line.fwhm),
        gainExponent: G,
        gainDb: DB_PER_E_FOLD * G,
      },
      warnings,
    };
  },
  checks: [
    {
      // Diamond at its measured 1064 nm point: Ω̃ = 1332.9 cm⁻¹ → 1/λ_s = 1/(1.064e-4 cm) − 1332.9 = 9398.496 − 1332.9 = 8065.596 cm⁻¹,
      // λ_s = 1239.8 nm; G = g I L = 17e-11 m/W · 1e12 W/m² · 0.01 m = 1.7; T₂ = 1/(π · 299792458 m/s · 270 m⁻¹) = 3.9325 ps.
      source: SAVITSKI,
      basis: "computed",
      inputs: { material: "diamond", pumpWl: 1064, intensity: 0.1, length: 10 },
      expect: { gain: 17, gainExponent: 1.7, stokes: 1239.8339442855915, dephasing: 3.932472191760107 },
      tolerance: 1e-8,
    },
  ],
});
