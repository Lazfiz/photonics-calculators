import { differenceFrequencyModel } from "../../physics/wave-optics/three-wave";
import { defineSchema } from "../types";

export default defineSchema({
  href: "/wave-optics/difference-frequency",
  inputs: [
    { key: "lambdaPump", label: "Pump wavelength λ_p", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1064, min: 200, max: 20000 },
    { key: "lambdaSignal", label: "Signal wavelength λ_s", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 200, max: 20000 },
    { key: "deff", label: "Effective nonlinear coefficient d_eff", unit: "pm/V", toSI: 1e-12, siUnit: "m/V", default: 12.4, min: 0, max: 1000 },
    { key: "crystalLength", label: "Crystal length L", unit: "mm", toSI: 1e-3, siUnit: "m", default: 20, min: 0.01, max: 1000 },
    { key: "pumpPower", label: "Pump power P_p", unit: "mW", toSI: 1e-3, siUnit: "W", default: 500, min: 0, max: 1e9 },
    { key: "signalPower", label: "Signal power P_s", unit: "mW", toSI: 1e-3, siUnit: "W", default: 10, min: 0, max: 1e9 },
    { key: "beamWaist", label: "Beam radius w (1/e², both beams)", unit: "µm", toSI: 1e-6, siUnit: "m", default: 150, min: 1, max: 1e5 },
    { key: "nPump", label: "Refractive index at the pump n_p", unit: "", toSI: 1, siUnit: "", default: 2.1555, min: 1, max: 5 },
    { key: "nSignal", label: "Refractive index at the signal n_s", unit: "", toSI: 1, siUnit: "", default: 2.1376, min: 1, max: 5 },
    { key: "nIdler", label: "Refractive index at the idler n_i", unit: "", toSI: 1, siUnit: "", default: 2.0814, min: 1, max: 5 },
    { key: "deltaK", label: "Residual phase mismatch Δk after phase matching", unit: "rad/mm", toSI: 1e3, siUnit: "rad/m", default: 0, min: -1e4, max: 1e4 },
  ],
  outputs: [
    { key: "idlerPower", label: "Idler power P_i", unit: "µW", toSI: 1e-6, siUnit: "W" },
    { key: "idlerWavelength", label: "Idler wavelength λ_i", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "normalizedEfficiency", label: "Normalized efficiency P_i/(P_pP_s)", unit: "%/W", toSI: 0.01, siUnit: "1/W" },
    { key: "qpmPeriod", label: "First-order QPM period 2π/|Δk|", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "gainLength", label: "On-axis parametric gain ΓL", unit: "", toSI: 1, siUnit: "" },
    { key: "focusingRatio", label: "L over the smallest confocal parameter", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ lambdaPump, lambdaSignal, deff, crystalLength, pumpPower, signalPower, beamWaist, nPump, nSignal, nIdler, deltaK }) {
    const r = differenceFrequencyModel({
      lambdaPump, lambdaSignal, deff, length: crystalLength, pumpPower, signalPower, waist: beamWaist, nPump, nSignal, nIdler, deltaK,
    });
    const valid = Number.isFinite(r.lambdaIdler);
    const warnings: string[] = [];
    if (!valid) warnings.push("The signal wavelength must be longer than the pump wavelength: the idler is at 1/λ_i = 1/λ_p − 1/λ_s.");
    if (valid && r.gainLength > 0.5) {
      warnings.push(`On-axis gain ΓL = ${r.gainLength.toPrecision(3)}: the signal is amplified as well (G = cosh²ΓL), so the low-gain law underestimates the idler.`);
    }
    if (valid && r.focusingRatio > 0.5) {
      warnings.push(
        `L is ${r.focusingRatio.toPrecision(3)} times the smallest confocal parameter 2πnw²/λ (${r.limitingBeam}, ${(r.confocalMin * 1e3).toPrecision(3)} mm): the beams change size in the crystal, so the plane-wave value overestimates P_i.`,
      );
    }
    return {
      values: {
        idlerPower: r.idlerPower,
        idlerWavelength: r.lambdaIdler,
        normalizedEfficiency: r.normalizedEfficiency,
        qpmPeriod: r.qpmPeriod,
        gainLength: r.gainLength,
        focusingRatio: r.focusingRatio,
      },
      warnings,
    };
  },
  checks: [
    {
      // λ_i = 1/(1/1064 − 1/1550 nm); η = 8π² d² L² sinc²(ΔkL/2)/(ε₀ c n_p n_s n_i λ_i²) at Δk = 0; P_i = η P_pP_s/(π w²)
      // for equal radii (2P_pP_s/(π·2w²)); Δk = 2π(n_p/λ_p − n_s/λ_s − n_i/λ_i), period 2π/|Δk|; b = 2π n w²/λ, idler w/√2.
      source: "Boyd R. W. (2008). Nonlinear Optics, 3rd ed. Academic Press, §2.2 (coupled-amplitude equations for DFG); Boyd G. D., Kleinman D. A. (1968). Parametric interaction of focused Gaussian light beams. J. Appl. Phys. 39, 3597–3639 (confocal parameter).",
      basis: "computed",
      inputs: {},
      expect: {
        idlerWavelength: 3393.4156378600833,
        idlerPower: 1.1718098460197115,
        normalizedEfficiency: 0.023436196920394232,
        qpmPeriod: 29.95375802332797,
        focusingRatio: 0.46129538684925275,
      },
      tolerance: 1e-8,
    },
    {
      // Δk L = π (Δk = π/20 mm⁻¹ for L = 20 mm): sinc²(π/2) = 4/π², so P_i = 1.1718098460197115 µW · 4/π².
      source: "Boyd R. W. (2008). Nonlinear Optics, 3rd ed. Academic Press, §2.2 (sinc²(ΔkL/2) dependence on the phase mismatch).",
      basis: "computed",
      inputs: { deltaK: 0.15707963267948966 },
      expect: { idlerPower: 0.474916642409851 },
      tolerance: 1e-8,
    },
  ],
});
