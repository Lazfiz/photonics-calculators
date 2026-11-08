import {
  dispersionLength, fundamentalSolitonPower, nonlinearLength, sechT0, solitonContent, solitonOrder, solitonPeriod,
} from "../../physics/wave-optics/soliton";
import { defineSchema } from "../types";

export default defineSchema({
  href: "/wave-optics/soliton",
  inputs: [
    { key: "pulseWidth", label: "Pulse FWHM, sech²", unit: "fs", toSI: 1e-15, siUnit: "s", default: 100, min: 1, max: 1e5 },
    { key: "peakPower", label: "Peak power P₀", unit: "W", toSI: 1, siUnit: "W", default: 5000, min: 0, max: 1e7 },
    { key: "beta2", label: "Group-velocity dispersion β₂", unit: "ps²/km", toSI: 1e-27, siUnit: "s²/m", default: -11.83, min: -1000, max: 1000 },
    { key: "gamma", label: "Nonlinear coefficient γ", unit: "1/(W·km)", toSI: 1e-3, siUnit: "1/(W·m)", default: 1.3, min: 0.01, max: 1e5 },
    { key: "distance", label: "Fibre length (for the plots)", unit: "m", toSI: 1, siUnit: "m", default: 2, min: 0, max: 1e5 },
  ],
  outputs: [
    { key: "halfWidth", label: "Half-width T₀ = FWHM/1.7627", unit: "fs", toSI: 1e-15, siUnit: "s" },
    { key: "dispersionLength", label: "Dispersion length L_D = T₀²/|β₂|", unit: "m", toSI: 1, siUnit: "m" },
    { key: "nonlinearLength", label: "Nonlinear length L_NL = 1/(γP₀)", unit: "m", toSI: 1, siUnit: "m" },
    { key: "solitonPeriod", label: "Soliton period z₀ = (π/2) L_D", unit: "m", toSI: 1, siUnit: "m" },
    { key: "fundamentalPower", label: "Fundamental soliton power P₁ = |β₂|/(γT₀²)", unit: "W", toSI: 1, siUnit: "W" },
    { key: "solitonOrder", label: "Soliton order N = √(γP₀T₀²/|β₂|)", unit: "", toSI: 1, siUnit: "" },
    { key: "solitonCount", label: "Solitons inside the input, floor(N + 1/2) (anomalous dispersion)", unit: "", toSI: 1, siUnit: "" },
    { key: "strongestSolitonPower", label: "Peak power of the strongest soliton, (2N − 1)²P₁", unit: "W", toSI: 1, siUnit: "W" },
  ],
  compute({ pulseWidth, peakPower, beta2, gamma }) {
    const t0 = sechT0(pulseWidth);
    const P1 = fundamentalSolitonPower(beta2, gamma, t0);
    const N = solitonOrder(peakPower, beta2, gamma, t0);
    const anomalous = beta2 < 0;
    const content = solitonContent(N);
    const warnings: string[] = [];
    if (!Number.isFinite(dispersionLength(t0, beta2))) warnings.push("β₂ = 0: no dispersion length, so the pulse only gains SPM phase and keeps its intensity shape.");
    else if (!anomalous) warnings.push("Normal dispersion (β₂ > 0): no bright soliton, the pulse broadens; the soliton count and strongest-soliton power have no value.");
    else if (content.count === 0) warnings.push("N < 1/2: no soliton, the pulse disperses.");
    return {
      values: {
        halfWidth: t0,
        dispersionLength: dispersionLength(t0, beta2),
        nonlinearLength: nonlinearLength(gamma, peakPower),
        solitonPeriod: solitonPeriod(t0, beta2),
        fundamentalPower: P1,
        solitonOrder: N,
        solitonCount: anomalous ? content.count : NaN,
        strongestSolitonPower: anomalous && content.count > 0 ? content.amplitude ** 2 * P1 : NaN,
      },
      warnings,
    };
  },
  checks: [
    {
      // T0 = FWHM/(2 ln(1+sqrt2)) = 56.7296 fs, L_D = T0^2/|b2| = 0.272042 m, L_NL = 1/(gP0) = 1/6.5 = 0.153846 m,
      // z0 = (pi/2) L_D = 0.427322 m, P1 = |b2|/(g T0^2) = 2827.62 W, N = sqrt(g P0 T0^2/|b2|) = 1.329763.
      source: "Agrawal G. P. (2019). Nonlinear Fiber Optics, 6th ed., §3.1–3.2 and §5.2 (L_D = T₀²/|β₂|, L_NL = 1/(γP₀), N² = L_D/L_NL, z₀ = (π/2)L_D, T_FWHM = 1.763 T₀).",
      basis: "computed",
      inputs: {},
      expect: {
        halfWidth: 56.72963285532556,
        dispersionLength: 0.272041525266275,
        nonlinearLength: 0.15384615384615385,
        solitonPeriod: 0.42732182862394585,
        fundamentalPower: 2827.6226156203325,
        solitonOrder: 1.3297631045531333,
      },
      tolerance: 1e-8,
    },
    {
      // N = 1.329763: one soliton, floor(N + 1/2) = 1, amplitude 2N - 1 = 1.659526, so the strongest has (2N - 1)^2 P1 = 7787.35 W.
      source: "Satsuma J., Yajima N. (1974). Initial value problems of one-dimensional self-modulation of nonlinear waves in dispersive media. Prog. Theor. Phys. Suppl. 55, 284–306 (the input N sech τ holds ⌊N + ½⌋ solitons of amplitude 2η_k).",
      basis: "computed",
      inputs: {},
      expect: { solitonCount: 1, strongestSolitonPower: 7787.349704212554 },
      tolerance: 1e-8,
    },
  ],
});
