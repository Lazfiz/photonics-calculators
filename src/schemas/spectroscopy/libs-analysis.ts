import { m_u, q } from "../../physics/constants";
import {
  dopplerFwhmFraction, electronDensityFromStark, mcWhirterDensity, sahaRatio, starkFwhm, voigtFwhm,
} from "../../physics/spectroscopy/line-broadening";
import { defineSchema } from "../types";

const CM3 = 1e6; // 1 cm⁻³ in m⁻³
const NM = 1e-9;
const NE_REF = 1e16 * CM3; // the density the Stark half-width w is tabulated at, m⁻³
const GRIEM = "Griem H. R. (1974). Spectral Line Broadening by Plasmas. Academic Press (electron-impact Stark width w at 10¹⁶ cm⁻³, Δλ_S = 2w·nₑ/10¹⁶ cm⁻³).";

export default defineSchema({
  href: "/spectroscopy/libs-analysis",
  choices: [
    {
      key: "solve",
      label: "Solve for",
      options: [
        { value: "width", label: "Stark width from nₑ" },
        { value: "ne", label: "nₑ from measured Stark width" },
      ],
      default: "width",
    },
  ],
  inputs: [
    { key: "temperature", label: "Plasma temperature T", unit: "K", toSI: 1, siUnit: "K", default: 10000, min: 1000, max: 50000 },
    { key: "ne16", label: "Electron density nₑ (used when solving for the width)", unit: "10¹⁶ cm⁻³", toSI: NE_REF, siUnit: "m⁻³", default: 10, min: 0.01, max: 1e4 },
    { key: "starkW", label: "Stark half-width w at 10¹⁶ cm⁻³", unit: "nm", toSI: NM, siUnit: "m", default: 0.01, min: 0, max: 1 },
    { key: "measuredWidth", label: "Measured Stark FWHM (used when solving for nₑ)", unit: "nm", toSI: NM, siUnit: "m", default: 0.2, min: 0, max: 10 },
    { key: "wavelength", label: "Line wavelength", unit: "nm", toSI: NM, siUnit: "m", default: 500, min: 100, max: 2000 },
    { key: "mass", label: "Emitter mass", unit: "u", toSI: m_u, siUnit: "kg", default: 40.078, min: 1, max: 300 },
    { key: "instrument", label: "Instrument FWHM (Gaussian)", unit: "nm", toSI: NM, siUnit: "m", default: 0.05, min: 0, max: 1 },
    { key: "chi", label: "Ionisation energy χ", unit: "eV", toSI: q, siUnit: "J", default: 6.113, min: 1, max: 30 },
    { key: "uRatio", label: "Partition-function ratio U⁺/U⁰", unit: "", toSI: 1, siUnit: "", default: 2, min: 0.01, max: 100 },
    { key: "deltaE", label: "Largest level gap ΔE (McWhirter)", unit: "eV", toSI: q, siUnit: "J", default: 3, min: 0.1, max: 20 },
  ],
  outputs: [
    { key: "dopplerFwhm", label: "Doppler FWHM", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "gaussianFwhm", label: "Doppler + instrument FWHM (Gaussian)", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "starkFwhm", label: "Stark FWHM (Lorentzian)", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "electronDensity", label: "Electron density nₑ", unit: "cm⁻³", toSI: CM3, siUnit: "m⁻³" },
    { key: "voigtFwhm", label: "Observed FWHM (Voigt, exact)", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "sahaRatio", label: "Saha ratio n⁺/n⁰", unit: "", toSI: 1, siUnit: "" },
    { key: "ionisedFraction", label: "Ionised fraction n⁺/(n⁺ + n⁰), single ionisation", unit: "", toSI: 1, siUnit: "" },
    { key: "mcWhirterLimit", label: "McWhirter LTE limit on nₑ", unit: "cm⁻³", toSI: CM3, siUnit: "m⁻³" },
  ],
  // As on the page: the Stark law is linear, so widths stay in metres and densities in m⁻³; Gaussian widths add in quadrature.
  compute({ solve, temperature, ne16, starkW, measuredWidth, wavelength, mass, instrument, chi, uRatio, deltaE }) {
    const warnings: string[] = [];
    const ne = solve === "ne" ? electronDensityFromStark(measuredWidth, starkW, NE_REF) : ne16;
    const stark = solve === "ne" ? measuredWidth : starkFwhm(starkW, ne16, NE_REF);
    const doppler = wavelength * dopplerFwhmFraction(temperature, mass);
    const gaussian = Math.hypot(doppler, instrument);
    const solved = Number.isFinite(ne) && ne > 0;
    const saha = sahaRatio(temperature, chi, uRatio); // n⁺nₑ/n⁰, m⁻³
    const neLte = mcWhirterDensity(temperature, deltaE / q);
    if (Math.abs(mass / m_u - 1.008) < 1e-6) {
      warnings.push("The linear Stark width w·nₑ does not apply to hydrogen Balmer lines (Δλ ∝ nₑ^(2/3)); use Gigosos–Cardeñoso tables.");
    }
    if (!solved) warnings.push("nₑ is not available (set w above zero and a measured width above zero when solving for nₑ), so the Saha ratio and the ionised fraction are null.");
    if (solved && ne < neLte) warnings.push("nₑ is below the McWhirter limit: LTE (and the Saha ratio) is doubtful.");
    if (gaussian > stark && stark > 0) warnings.push("The Gaussian part is wider than the Stark part, so nₑ from this line depends strongly on the instrument function.");
    if (stark === 0) warnings.push("w = 0 gives no Stark broadening; take w for your line from a Stark-width table.");
    return {
      values: {
        dopplerFwhm: doppler,
        gaussianFwhm: gaussian,
        starkFwhm: stark,
        electronDensity: solved ? ne : NaN,
        voigtFwhm: voigtFwhm(gaussian, stark),
        sahaRatio: solved ? saha / ne : NaN,
        ionisedFraction: solved ? saha / (saha + ne) : NaN,
        mcWhirterLimit: neLte,
      },
      warnings,
    };
  },
  checks: [
    {
      // Δλ_S = 2w·nₑ/10¹⁶ cm⁻³ = 2 × 0.01 nm × 10 = 0.2 nm (nₑ = 10 × 10¹⁶ cm⁻³ default).
      source: GRIEM,
      basis: "computed",
      inputs: { solve: "width" },
      expect: { starkFwhm: 0.2 },
      tolerance: 1e-8,
    },
    {
      // nₑ = 10¹⁶ cm⁻³ × Δλ_S/(2w) = 10¹⁶ × 0.2/0.02 = 1×10¹⁷ cm⁻³.
      source: GRIEM,
      basis: "computed",
      inputs: { solve: "ne", measuredWidth: 0.2, starkW: 0.01 },
      expect: { electronDensity: 1e17 },
      tolerance: 1e-8,
    },
    {
      // Δλ_D = λ₀ √(8 k_B T ln2/(m c²)), 500 nm, 10⁴ K, 40.078 u (Ca): 5.656803556×10⁻³ nm, evaluated with the exact SI
      // constants by an independent script (Demtröder, Laser Spectroscopy 1, ch. 3; equation number from memory).
      source: "Demtröder W. (2014). Laser Spectroscopy 1: Basic Principles, 5th ed. Springer, ch. 3, Doppler width.",
      basis: "computed",
      inputs: { wavelength: 500, temperature: 10000, mass: 40.078 },
      expect: { dopplerFwhm: 0.005656803556 },
      tolerance: 1e-8,
    },
  ],
});
