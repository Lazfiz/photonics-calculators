import {
  absorbanceError, apparentAbsorbanceLimit, maxStrayRatio, measuredAbsorbance, measuredTransmittance, orderSortingWindow,
  overlapFreeBand, overlappingOrders,
} from "../../physics/spectroscopy/stray-light";
import { defineSchema } from "../types";

const SKOOG = "Skoog D. A., Holler F. J., Crouch S. R. (2007). Principles of Instrumental Analysis, 6th ed., Thomson Brooks/Cole, ch. 13 " +
  "(stray radiation): T_m = (T + S T_s)/(1 + S), the same model as T_m = (1 − s)T + s T_s with s = S/(1 + S); A_m = −log₁₀ T_m; " +
  "stray ratio s as defined by ASTM E387 (opaque-filter method).";
const PALMER = "Palmer C., Loewen E. (2005). Diffraction Grating Handbook, 6th ed., Newport Corporation (Richardson Optics), ch. 2: " +
  "order m of λ and order n of λ′ share a diffraction angle when nλ′ = mλ.";

export default defineSchema({
  href: "/spectroscopy/stray-light",
  inputs: [
    { key: "strayLightRatio", label: "Stray light ratio s (of detected power)", unit: "", toSI: 1, siUnit: "", default: 0.001, min: 0, max: 0.5 },
    { key: "absorbance", label: "True absorbance A", unit: "AU", toSI: 1, siUnit: "", default: 3, min: 0, max: 8 },
    { key: "strayTransmittance", label: "Sample transmittance for the stray light T_s", unit: "", toSI: 1, siUnit: "", default: 1, min: 0, max: 1 },
    { key: "tolerance", label: "Absorbance tolerance", unit: "AU", toSI: 1, siUnit: "", default: 0.01, min: 1e-4, max: 1 },
    { key: "order", label: "Working order m", unit: "", toSI: 1, siUnit: "", default: 1, min: 1, max: 10 },
    { key: "centralWavelength", label: "Set wavelength λ", unit: "nm", toSI: 1e-9, siUnit: "m", default: 600, min: 100, max: 20000 },
    { key: "lambdaMin", label: "Source/detector λ min", unit: "nm", toSI: 1e-9, siUnit: "m", default: 200, min: 100, max: 20000 },
    { key: "lambdaMax", label: "Source/detector λ max", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1100, min: 100, max: 20000 },
  ],
  outputs: [
    { key: "measuredTransmittance", label: "Measured transmittance T_m", unit: "", toSI: 1, siUnit: "" },
    { key: "measuredAbsorbance", label: "Measured absorbance A_m", unit: "AU", toSI: 1, siUnit: "" },
    { key: "absorbanceError", label: "Absorbance error ΔA = A_m − A", unit: "AU", toSI: 1, siUnit: "" },
    { key: "maxAbsorbance", label: "Highest readable absorbance A_max = −log₁₀(s T_s)", unit: "AU", toSI: 1, siUnit: "" },
    { key: "maxStrayRatio", label: "Largest s for |ΔA| ≤ tolerance", unit: "", toSI: 1, siUnit: "" },
    { key: "filterLow", label: "Order-sorting filter pass band, lower edge mλ/(m + 1)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "filterHigh", label: "Order-sorting filter pass band, upper edge mλ/(m − 1)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "cleanLow", label: "Overlap-free band, lower edge", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "cleanHigh", label: "Overlap-free band, upper edge", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "overlapCount", label: "Other orders arriving with λ inside the range", unit: "", toSI: 1, siUnit: "" },
  ],
  compute(si) {
    const s = si.strayLightRatio;
    const A = si.absorbance;
    const Ts = si.strayTransmittance;
    const order = Math.round(si.order);
    const lo = si.lambdaMin;
    const hi = Math.max(si.lambdaMax, lo);
    const sMax = maxStrayRatio(A, si.tolerance, Ts);
    const aMax = apparentAbsorbanceLimit(s, Ts);
    const band = orderSortingWindow(si.centralWavelength, order);
    const clean = overlapFreeBand(lo, hi, order);
    const warnings: string[] = [];
    if (!Number.isFinite(aMax)) warnings.push("s·T_s = 0: no stray light reaches the detector, so there is no absorbance ceiling.");
    if (!Number.isFinite(sMax)) warnings.push("T_s ≤ T: stray light does not lower the reading, so there is no largest s.");
    if (!Number.isFinite(band.high)) warnings.push("First order: a long-pass filter above mλ/(m + 1) is enough, there is no upper edge.");
    if (!Number.isFinite(clean.low)) warnings.push("Every λ of this order shares its angle with another order inside the range; narrow the range with filters.");
    return {
      values: {
        measuredTransmittance: measuredTransmittance(10 ** -A, s, Ts), measuredAbsorbance: measuredAbsorbance(A, s, Ts),
        absorbanceError: absorbanceError(A, s, Ts), maxAbsorbance: aMax, maxStrayRatio: sMax,
        filterLow: band.low, filterHigh: band.high, cleanLow: clean.low, cleanHigh: clean.high,
        overlapCount: overlappingOrders(si.centralWavelength, order, lo, hi).length,
      },
      warnings,
    };
  },
  checks: [
    {
      // Defaults: T = 10⁻³, s = 0.001, T_s = 1. T_m = 0.999 · 0.001 + 0.001 · 1 = 0.001999; A_m = −log₁₀ 0.001999 = 2.6991872;
      // ΔA = A_m − 3 = −0.3008128; A_max = −log₁₀(0.001 · 1) = 3; s_max = T(10^0.01 − 1)/(1 − T) = 2.33163e-5.
      source: SKOOG,
      basis: "computed",
      inputs: {},
      expect: {
        measuredTransmittance: 0.001999, measuredAbsorbance: 2.6991872058818833, absorbanceError: -0.3008127941181169, maxAbsorbance: 3,
        maxStrayRatio: 0.00002331630858934348,
      },
      tolerance: 1e-8,
    },
    {
      // A = 2 (T = 0.01), s = 0.01, T_s = 0.5: T_m = 0.99 · 0.01 + 0.01 · 0.5 = 0.0149; A_m = −log₁₀ 0.0149 = 1.8268137;
      // ΔA = −0.1731863.
      source: SKOOG,
      basis: "computed",
      inputs: { absorbance: 2, strayLightRatio: 0.01, strayTransmittance: 0.5 },
      expect: { measuredTransmittance: 0.0149, measuredAbsorbance: 1.826813731587726, absorbanceError: -0.17318626841227402 },
      tolerance: 1e-8,
    },
    {
      // Defaults, m = 1, λ = 600 nm, range 200–1100 nm: filter lower edge mλ/(m + 1) = 300 nm (long-pass, no upper edge); order n = 2
      // brings 300 nm and n = 3 brings 200 nm (λ′ = mλ/n ≥ 200): two other orders; overlap-free band max(200, 0) to
      // min(1100, 200 · 2) = 200–400 nm.
      source: PALMER,
      basis: "computed",
      inputs: {},
      expect: { cleanLow: 200, cleanHigh: 400, overlapCount: 2, filterLow: 300 },
      tolerance: 1e-8,
    },
  ],
});
