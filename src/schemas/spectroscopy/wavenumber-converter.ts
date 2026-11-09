import { eV } from "../../physics/constants";
import { photonFromWavelength, photonFromWavenumber } from "../../physics/spectroscopy/wavenumber";
import { defineSchema } from "../types";

const CODATA = "Mohr P. J., Newell D. B., Taylor B. N., Tiesinga E. (2025). CODATA recommended values of the fundamental physical " +
  "constants: 2022. Rev. Mod. Phys. 97, 025002, doi:10.1103/RevModPhys.97.025002 (c, h and e are exact in the SI); " +
  "ν̃ = 1/λ, f = c/λ, E = hc/λ for vacuum wavelengths.";

export default defineSchema({
  href: "/spectroscopy/wavenumber-converter",
  choices: [
    {
      key: "mode",
      label: "Conversion direction",
      options: [
        { value: "wl-to-wn", label: "Vacuum wavelength (nm) to wavenumber" },
        { value: "wn-to-wl", label: "Wavenumber (cm⁻¹) to vacuum wavelength" },
      ],
      default: "wl-to-wn",
    },
  ],
  inputs: [
    { key: "wavelengthMin", label: "Range start λ min", unit: "nm", toSI: 1e-9, siUnit: "m", default: 400, min: 100, max: 49999 },
    { key: "wavelengthMax", label: "Range end λ max", unit: "nm", toSI: 1e-9, siUnit: "m", default: 4000, min: 101, max: 50000 },
    // The unit follows the mode: nm for wl-to-wn, cm⁻¹ for wn-to-wl, so no SI scaling here.
    { key: "singleValue", label: "Value to convert (nm in wl-to-wn mode, cm⁻¹ in wn-to-wl mode)", unit: "", toSI: 1, siUnit: "", default: 1000, min: 1e-3, max: 1e9 },
  ],
  outputs: [
    { key: "rangeWavenumberLow", label: "Range wavenumber at λ max", unit: "cm⁻¹", toSI: 100, siUnit: "1/m" },
    { key: "rangeWavenumberHigh", label: "Range wavenumber at λ min", unit: "cm⁻¹", toSI: 100, siUnit: "1/m" },
    { key: "rangeEnergyLow", label: "Range photon energy at λ max", unit: "eV", toSI: eV, siUnit: "J" },
    { key: "rangeEnergyHigh", label: "Range photon energy at λ min", unit: "eV", toSI: eV, siUnit: "J" },
    { key: "wavelength", label: "Vacuum wavelength of the value", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "wavenumber", label: "Wavenumber of the value", unit: "cm⁻¹", toSI: 100, siUnit: "1/m" },
    { key: "frequency", label: "Frequency of the value", unit: "THz", toSI: 1e12, siUnit: "Hz" },
    { key: "energy", label: "Photon energy of the value", unit: "eV", toSI: eV, siUnit: "J" },
  ],
  validate(si) {
    if (!(si.wavelengthMax > si.wavelengthMin)) return "wavelengthMax must exceed wavelengthMin.";
    return undefined;
  },
  compute(si) {
    const wlMode = si.mode !== "wn-to-wl";
    // singleValue is nm (wl-to-wn) or cm⁻¹ (wn-to-wl), unscaled by toSI.
    const photon = wlMode ? photonFromWavelength(si.singleValue * 1e-9) : photonFromWavenumber(si.singleValue * 100);
    const lo = photonFromWavelength(si.wavelengthMax);
    const hi = photonFromWavelength(si.wavelengthMin);
    return {
      values: {
        rangeWavenumberLow: lo.wavenumber,
        rangeWavenumberHigh: hi.wavenumber,
        rangeEnergyLow: lo.energy,
        rangeEnergyHigh: hi.energy,
        wavelength: photon.wavelength,
        wavenumber: photon.wavenumber,
        frequency: photon.frequency,
        energy: photon.energy,
      },
    };
  },
  checks: [
    {
      // 1000 nm: ν̃ = 1/λ = 10⁷ nm/1000 nm = 10000 cm⁻¹ (exact); f = c/λ = 299792458/10⁻⁶ = 299.792458 THz (exact);
      // E = hc/λ = 1239.8419843320025 eV nm/1000 nm = 1.2398419843 eV (h, c, e exact in the SI).
      source: CODATA,
      basis: "computed",
      inputs: { mode: "wl-to-wn", singleValue: 1000 },
      expect: { wavenumber: 10000, frequency: 299.792458, energy: 1.2398419843320025 },
      tolerance: 1e-8,
    },
    {
      // 3400 cm⁻¹ -> λ = 1/ν̃ = 10⁷/3400 nm = 2941.17647 nm; range 400–4000 nm: 10⁷/4000 = 2500 cm⁻¹ and 10⁷/400 = 25000 cm⁻¹.
      source: CODATA,
      basis: "computed",
      inputs: { mode: "wn-to-wl", singleValue: 3400 },
      expect: { wavelength: 2941.1764705882356, rangeWavenumberLow: 2500, rangeWavenumberHigh: 25000 },
      tolerance: 1e-8,
    },
  ],
});
