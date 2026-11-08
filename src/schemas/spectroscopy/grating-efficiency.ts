import {
  blazeWavelength, gratingOrderRange, littrowAngle, littrowBlazeEfficiency,
} from "../../physics/spectroscopy/spectral-resolution";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;

const PALMER =
  "Palmer C., Loewen E. (2005). Diffraction Grating Handbook, 6th ed., Newport Corporation, ch. 2: Littrow mount " +
  "sin θ = mλ/(2d) and blaze wavelength λ_B = 2d sin φ/m.";

export default defineSchema({
  href: "/spectroscopy/grating-efficiency",
  inputs: [
    { key: "groovesPerMm", label: "Grooves/mm", unit: "lines/mm", toSI: 1e3, siUnit: "1/m", default: 1200, min: 10, max: 6000 },
    { key: "blazeAngle", label: "Blaze angle φ", unit: "°", toSI: DEG, siUnit: "rad", default: 17.5, min: 1, max: 80 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 500, min: 100, max: 20000 },
    { key: "order", label: "Diffraction order m", unit: "", toSI: 1, siUnit: "", default: 1, min: 1, max: 20 },
  ],
  outputs: [
    { key: "blazeWavelength", label: "Blaze wavelength (Littrow)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "efficiency", label: "Scalar efficiency", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "littrowAngle", label: "Littrow angle θ", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "grooveSpacing", label: "Groove spacing d", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "lambdaOverD", label: "λ/d", unit: "", toSI: 1, siUnit: "" },
    { key: "orderMin", label: "Lowest propagating order", unit: "", toSI: 1, siUnit: "" },
    { key: "orderMax", label: "Highest propagating order", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ groovesPerMm, blazeAngle, wavelength, order: orderRaw }) {
    const order = Math.round(orderRaw);
    const d = 1 / groovesPerMm;
    const theta = littrowAngle(wavelength, d, order);
    const propagates = Number.isFinite(theta);
    const orders = propagates ? gratingOrderRange(wavelength, d, theta) : null;
    const lambdaOverD = wavelength / d;
    const warnings: string[] = [];
    if (!propagates) warnings.push(`Order ${order} does not propagate in Littrow above 2d/m = ${((2 * d * 1e9) / order).toFixed(0)} nm.`);
    else if (lambdaOverD >= 0.2) warnings.push("λ/d ≥ 0.2: the scalar efficiency is only an estimate; real efficiency depends on polarization.");
    return {
      values: {
        blazeWavelength: blazeWavelength(d, order, blazeAngle, blazeAngle), // Littrow
        efficiency: propagates ? littrowBlazeEfficiency(wavelength, d, order, blazeAngle) : NaN,
        littrowAngle: theta,
        grooveSpacing: d,
        lambdaOverD,
        orderMin: orders ? orders.min : NaN,
        orderMax: orders ? orders.max : NaN,
      },
      warnings,
    };
  },
  checks: [
    {
      // d = 1 mm/1200 = 833.3333 nm, λ = 500 nm: sin θ = mλ/(2d) = 500/1666.667 = 0.3, θ = asin(0.3) = 17.45760°;
      // λ/d = 0.6; highest propagating order floor(d(1 + sin θ)/λ) = floor(1.6667 · 1.3) = 2.
      source: PALMER,
      basis: "computed",
      inputs: {},
      expect: { littrowAngle: 17.457603123722098, grooveSpacing: 0.8333333333333334, lambdaOverD: 0.6, orderMax: 2 },
      tolerance: 1e-8,
    },
    {
      // λ_B = 2d sin φ/m = 1666.667 nm · sin 17.5° = 501.176 nm.
      source: PALMER,
      basis: "computed",
      inputs: {},
      expect: { blazeWavelength: 501.17633250712186 },
      tolerance: 1e-8,
    },
  ],
});
