import { etalonOrder, fsrFrequency, fsrWavelength, fwhmFrequency, gapAngle } from "../../physics/spectroscopy/etalon";
import { airyPeakNear, coefficientOfFinesse, reflectingFinesse } from "../../physics/thin-film/interference";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;

const HECHT =
  "Hecht E. (2017). Optics, 5th ed., Pearson, §9.6.1: Fabry-Pérot transmission T = 1/(1 + F sin²(δ/2)), " +
  "F = 4R/(1 − R)², δ = 4πnd cos θ/λ, free spectral range c/(2nd cos θ) = λ²/(2nd cos θ), finesse ℱ = π√R/(1 − R).";

export default defineSchema({
  href: "/spectroscopy/etalon-fsr",
  inputs: [
    { key: "n", label: "Gap index n", unit: "", toSI: 1, siUnit: "", default: 1.0, min: 1, max: 5 },
    { key: "d", label: "Gap d", unit: "µm", toSI: 1e-6, siUnit: "m", default: 10, min: 0.1, max: 1e5 },
    { key: "theta", label: "Incidence angle in air θ₀", unit: "°", toSI: DEG, siUnit: "rad", default: 0, min: 0, max: 80 },
    { key: "R", label: "Mirror reflectance R", unit: "", toSI: 1, siUnit: "", default: 0.8, min: 0, max: 0.9999 },
    { key: "wavelength", label: "Design wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 100, max: 20000 },
  ],
  outputs: [
    { key: "fsrWavelength", label: "FSR in wavelength λ²/(2nd cos θ)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "fsrFrequency", label: "FSR in frequency c/(2nd cos θ)", unit: "GHz", toSI: 1e9, siUnit: "Hz" },
    { key: "finesse", label: "Reflecting finesse π√R/(1 − R)", unit: "", toSI: 1, siUnit: "" },
    { key: "coefficientOfFinesse", label: "Coefficient of finesse F = 4R/(1 − R)²", unit: "", toSI: 1, siUnit: "" },
    { key: "fwhmFrequency", label: "Fringe FWHM (frequency)", unit: "GHz", toSI: 1e9, siUnit: "Hz" },
    { key: "order", label: "Interference order at the design wavelength", unit: "", toSI: 1, siUnit: "" },
    { key: "peakWavelength", label: "Nearest transmission peak", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "peakFwhm", label: "Peak FWHM (wavelength)", unit: "pm", toSI: 1e-12, siUnit: "m" },
    { key: "contrast", label: "Contrast T_max/T_min = 1 + F", unit: "", toSI: 1, siUnit: "" },
    { key: "gapAngle", label: "Gap angle θ", unit: "°", toSI: DEG, siUnit: "rad" },
  ],
  compute({ n, d, theta, R, wavelength }) {
    const thetaGap = gapAngle(theta, n);
    const cosT = Math.cos(thetaGap);
    const F = coefficientOfFinesse(R);
    const fsrNu = fsrFrequency(n, d, cosT);
    const peak = airyPeakNear(n * d * cosT, wavelength, F);
    const warnings: string[] = [];
    if (!(F >= 1)) warnings.push("F < 1 (R below about 0.17): the transmission never falls to one half, so the FWHM is undefined.");
    return {
      values: {
        fsrWavelength: fsrWavelength(wavelength, n, d, cosT),
        fsrFrequency: fsrNu,
        finesse: reflectingFinesse(F),
        coefficientOfFinesse: F,
        fwhmFrequency: fwhmFrequency(fsrNu, F),
        order: etalonOrder(n, d, cosT, wavelength),
        peakWavelength: peak.wavelength,
        peakFwhm: peak.fwhm,
        contrast: 1 + F,
        gapAngle: thetaGap,
      },
      warnings,
    };
  },
  checks: [
    {
      // n = 1, d = 10 µm, θ = 0, R = 0.8, λ = 1550 nm: FSR_λ = 1550²/(2 · 10 000) nm = 120.125 nm;
      // FSR_ν = c/(2 · 10 µm) = 299 792 458/2e-5 Hz = 14 989.6229 GHz; F = 4 · 0.8/0.2² = 80; ℱ = π√0.8/0.2 = 14.04963;
      // contrast 1 + F = 81; order 2nd/λ = 12.9032.
      source: HECHT,
      basis: "computed",
      inputs: {},
      expect: { fsrWavelength: 120.125, fsrFrequency: 14989.6229, coefficientOfFinesse: 80, finesse: 14.049629462081453, contrast: 81, order: 12.903225806451612 },
      tolerance: 1e-8,
    },
  ],
});
