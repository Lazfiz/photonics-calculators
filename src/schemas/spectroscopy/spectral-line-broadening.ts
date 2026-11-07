import { m_u } from "../../physics/constants";
import {
  dopplerFwhmFraction, pseudoVoigtTch, voigtFwhm, voigtFwhmOlivero,
} from "../../physics/spectroscopy/line-broadening";
import { defineSchema } from "../types";

const ATM = 101325;
const OLIVERO = "Olivero J. J., Longbothum R. L. (1977). Empirical fits to the Voigt line width: a brief review. " +
  "J. Quant. Spectrosc. Radiat. Transfer 17, 233–236. https://doi.org/10.1016/0022-4073(77)90161-3";

export default defineSchema({
  href: "/spectroscopy/spectral-line-broadening",
  choices: [
    {
      key: "mode",
      label: "Input mode",
      options: [
        { value: "gas", label: "From gas conditions" },
        { value: "widths", label: "From Gaussian and Lorentzian widths" },
      ],
      default: "gas",
    },
  ],
  // The widths-mode inputs are "any unit" on the page; here they are cm⁻¹ and the widths come back in cm⁻¹.
  inputs: [
    { key: "centerWl", label: "Centre wavelength λ₀ (gas mode)", unit: "nm", toSI: 1e-9, siUnit: "m", default: 500, min: 100, max: 1e5 },
    { key: "temperature", label: "Temperature T (gas mode)", unit: "K", toSI: 1, siUnit: "K", default: 5000, min: 1, max: 1e5 },
    { key: "molecularMass", label: "Atomic or molecular mass (gas mode)", unit: "u", toSI: m_u, siUnit: "kg", default: 20, min: 1, max: 1000 },
    { key: "pressure", label: "Pressure P (gas mode)", unit: "atm", toSI: ATM, siUnit: "Pa", default: 1, min: 0, max: 100 },
    { key: "gammaCol", label: "Pressure-broadening coefficient γ, HWHM (gas mode)", unit: "cm⁻¹/atm", toSI: 100 / ATM, siUnit: "m⁻¹/Pa", default: 0.1, min: 0, max: 10 },
    { key: "naturalWidth", label: "Natural width, FWHM (gas mode)", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹", default: 0.001, min: 0, max: 10 },
    { key: "fwhmG", label: "Gaussian FWHM Δ_G (widths mode)", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹", default: 0.5, min: 0, max: 1e6 },
    { key: "fwhmL", label: "Lorentzian FWHM Δ_L (widths mode)", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹", default: 0.3, min: 0, max: 1e6 },
  ],
  outputs: [
    { key: "gaussianFwhm", label: "Gaussian FWHM Δ_G", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹" },
    { key: "lorentzianFwhm", label: "Lorentzian FWHM Δ_L", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹" },
    { key: "voigtFwhm", label: "Voigt FWHM (exact)", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹" },
    { key: "voigtOlivero", label: "Voigt FWHM, Olivero-Longbothum approximation", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹" },
    { key: "tchFwhm", label: "Thompson-Cox-Hastings pseudo-Voigt FWHM", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹" },
    { key: "tchEta", label: "TCH Lorentzian mixing η", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ mode, centerWl, temperature, molecularMass, pressure, gammaCol, naturalWidth, fwhmG, fwhmL }) {
    const gas = mode === "gas";
    const fG = gas ? (1 / centerWl) * dopplerFwhmFraction(temperature, molecularMass) : fwhmG;
    const fL = gas ? 2 * gammaCol * pressure + naturalWidth : fwhmL;
    const hasWidth = fG + fL > 0;
    const tch = pseudoVoigtTch(fG, fL);
    const warnings: string[] = [];
    if (!hasWidth) warnings.push("Both widths are zero, so there is no line shape.");
    return {
      values: {
        gaussianFwhm: fG,
        lorentzianFwhm: fL,
        voigtFwhm: voigtFwhm(fG, fL),
        voigtOlivero: hasWidth ? voigtFwhmOlivero(fG, fL) : NaN,
        tchFwhm: hasWidth ? tch.fwhm : NaN,
        tchEta: hasWidth ? tch.eta : NaN,
      },
      warnings,
    };
  },
  checks: [
    {
      // Δ_G 0.5, Δ_L 0.3: exact Voigt FWHM by bisection 0.67941; the Olivero-Longbothum fit 0.67951 (0.02 % quoted); TCH 0.67679.
      source: OLIVERO + "; Thompson P., Cox D. E., Hastings J. B. (1987). J. Appl. Cryst. 20, 79–83. https://doi.org/10.1107/S0021889887087090",
      basis: "computed",
      inputs: { mode: "widths", fwhmG: 0.5, fwhmL: 0.3 },
      expect: { voigtFwhm: 0.67941, voigtOlivero: 0.67951, tchFwhm: 0.67679 },
      tolerance: 2e-5,
    },
    {
      // Page defaults: 500 nm (20 000 cm⁻¹), 5000 K, 20 u give a Doppler FWHM of 0.2265 cm⁻¹ and, with 0.201 cm⁻¹ Lorentzian, a Voigt FWHM of 0.3525 cm⁻¹.
      source: "Demtröder W. (2015). Laser Spectroscopy, Vol. 1, 5th ed., ch. 3 (Doppler FWHM Δν_D = ν₀√(8 k_B T ln 2/(m c²))). Springer.",
      basis: "computed",
      inputs: { mode: "gas" },
      expect: { gaussianFwhm: 0.22649, lorentzianFwhm: 0.201, voigtFwhm: 0.35249 },
      tolerance: 5e-5,
    },
  ],
});
