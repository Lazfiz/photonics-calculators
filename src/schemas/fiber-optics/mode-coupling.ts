import { modeCouplingSummary } from "../../physics/fiber-optics/mode-coupling";
import { defineSchema } from "../types";

const YARIV = "Yariv A. (1973). Coupled-mode theory for guided-wave optics. IEEE Journal of Quantum Electronics 9, 919–933. " +
  "https://doi.org/10.1109/JQE.1973.1077767 (lossless co-directional coupling: P₂(z) = P₀(κ²/ψ²) sin²(ψz), ψ = √(κ² + (Δβ/2)²)).";

const NO_EXCHANGE = "κ and Δβ are both zero, so the guides exchange no power and there is no peak or period.";

export default defineSchema({
  href: "/fiber-optics/mode-coupling",
  inputs: [
    { key: "couplingLength", label: "Coupling length L", unit: "µm", toSI: 1e-6, siUnit: "m", default: 1000, min: 0, max: 1e7 },
    { key: "couplingCoeff", label: "Coupling coefficient κ", unit: "mm⁻¹", toSI: 1e3, siUnit: "1/m", default: 0.5, min: 0, max: 1e4 },
    { key: "propConstDiff", label: "Mismatch Δβ = β₁ − β₂", unit: "mm⁻¹", toSI: 1e3, siUnit: "1/m", default: 0.1, min: -1e4, max: 1e4 },
    { key: "inputPower", label: "Input power P₀", unit: "mW", toSI: 1e-3, siUnit: "W", default: 1, min: 0, max: 1e9 },
  ],
  outputs: [
    { key: "coupledPower", label: "Coupled power P₂", unit: "mW", toSI: 1e-3, siUnit: "W" },
    { key: "throughPower", label: "Through power P₁", unit: "mW", toSI: 1e-3, siUnit: "W" },
    { key: "coupledFraction", label: "Coupled fraction P₂/P₀", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "maxTransfer", label: "Maximum transfer κ²/ψ²", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "peakLength", label: "Length of the first maximum π/(2ψ)", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "psi", label: "ψ = √(κ² + (Δβ/2)²)", unit: "mm⁻¹", toSI: 1e3, siUnit: "1/m" },
    { key: "exchangePeriod", label: "Exchange period π/ψ", unit: "mm", toSI: 1e-3, siUnit: "m" },
  ],
  compute({ couplingLength, couplingCoeff, propConstDiff, inputPower }) {
    const s = modeCouplingSummary({ length: couplingLength, kappa: couplingCoeff, deltaBeta: propConstDiff, inputPower });
    return {
      values: {
        coupledPower: s.coupledPower,
        throughPower: s.throughPower,
        coupledFraction: s.fraction,
        maxTransfer: s.peak.fraction,
        peakLength: s.peak.length,
        psi: s.psi,
        exchangePeriod: s.beat,
      },
      reasons: { peakLength: NO_EXCHANGE, exchangePeriod: NO_EXCHANGE },
    };
  },
  checks: [
    {
      // κ = 0.5 /mm, Δβ = 0.1 /mm, L = 1 mm: ψ = √(0.25 + 0.05²) = 0.502493781 /mm; κ²/ψ² = 0.25/0.2525 = 0.990099010;
      // P₂/P₀ = 0.990099010·sin²(0.502493781) = 0.229654102; maximum at π/(2ψ) = 3.12600153 mm; period π/ψ = 6.25200305 mm.
      source: YARIV,
      basis: "computed",
      inputs: {},
      expect: { coupledFraction: 22.965410185127496, maxTransfer: 99.00990099009903, peakLength: 3.1260015268123316, psi: 0.5024937810560445, exchangePeriod: 6.252003053624663 },
      tolerance: 1e-8,
    },
    {
      // Δβ = 0: ψ = κ, so after L = π/(2κ) = π mm (3141.5926535898 µm) sin²(π/2) = 1 and all the power has moved to guide 2.
      source: YARIV,
      basis: "computed",
      inputs: { propConstDiff: 0, couplingLength: 3141.592653589793 },
      expect: { coupledFraction: 100 },
      tolerance: 1e-8,
    },
    {
      // κ = 0.5 /mm, Δβ = 2 /mm, L = 2 mm: ψ = √(0.25 + 1) = 1.118033989 /mm; κ²/ψ² = 0.2;
      // P₂/P₀ = 0.2·sin²(2.236067977) = 0.123794839, so 12.3794839 %, capped at 20 %.
      source: YARIV,
      basis: "computed",
      inputs: { propConstDiff: 2, couplingLength: 2000 },
      expect: { coupledFraction: 12.379483919805907, maxTransfer: 20 },
      tolerance: 1e-8,
    },
  ],
});
