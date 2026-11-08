import { sumFrequencyModel } from "../../physics/wave-optics/sum-frequency";
import { defineSchema } from "../types";

export default defineSchema({
  href: "/wave-optics/sum-frequency",
  inputs: [
    { key: "lambda1", label: "Wavelength λ₁", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1064, min: 200, max: 20000 },
    { key: "lambda2", label: "Wavelength λ₂", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 200, max: 20000 },
    { key: "deff", label: "Effective nonlinear coefficient d_eff", unit: "pm/V", toSI: 1e-12, siUnit: "m/V", default: 12.4, min: 0, max: 1000 },
    { key: "crystalLength", label: "Crystal length L", unit: "mm", toSI: 1e-3, siUnit: "m", default: 10, min: 0.01, max: 1000 },
    { key: "power1", label: "Power P₁", unit: "mW", toSI: 1e-3, siUnit: "W", default: 100, min: 0, max: 1e9 },
    { key: "power2", label: "Power P₂", unit: "mW", toSI: 1e-3, siUnit: "W", default: 50, min: 0, max: 1e9 },
    { key: "beamWaist", label: "Beam radius w (1/e², both beams)", unit: "µm", toSI: 1e-6, siUnit: "m", default: 50, min: 1, max: 1e5 },
    { key: "n1", label: "Refractive index n₁ at λ₁", unit: "", toSI: 1, siUnit: "", default: 2.1555, min: 1, max: 5 },
    { key: "n2", label: "Refractive index n₂ at λ₂", unit: "", toSI: 1, siUnit: "", default: 2.1376, min: 1, max: 5 },
    { key: "n3", label: "Refractive index n₃ at λ₃", unit: "", toSI: 1, siUnit: "", default: 2.2027, min: 1, max: 5 },
    { key: "deltaK", label: "Residual phase mismatch Δk after phase matching", unit: "rad/mm", toSI: 1e3, siUnit: "rad/m", default: 0, min: -1e4, max: 1e4 },
  ],
  outputs: [
    { key: "sfgPower", label: "SFG power P₃", unit: "µW", toSI: 1e-6, siUnit: "W" },
    { key: "sfgWavelength", label: "SFG wavelength λ₃", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "normalizedEfficiency", label: "Normalized efficiency P₃/(P₁P₂)", unit: "%/W", toSI: 0.01, siUnit: "1/W" },
    { key: "qpmPeriod", label: "First-order QPM period 2π/|Δk|", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "focusingRatio", label: "L over the smaller confocal parameter", unit: "", toSI: 1, siUnit: "" },
    { key: "photonConversion", label: "Share of the weaker beam's photons converted", unit: "%", toSI: 0.01, siUnit: "" },
  ],
  compute({ lambda1, lambda2, deff, crystalLength, power1, power2, beamWaist, n1, n2, n3, deltaK }) {
    const r = sumFrequencyModel({ lambda1, lambda2, deff, length: crystalLength, power1, power2, waist: beamWaist, n1, n2, n3, deltaK });
    const warnings: string[] = [];
    if (r.focusingRatio > 0.5) {
      warnings.push(`L is ${r.focusingRatio.toPrecision(3)} times the smaller confocal parameter 2πnw²/λ (${(r.confocalMin * 1e3).toPrecision(3)} mm): the beams change size in the crystal, so the plane-wave value overestimates P₃. Widen the beams or use a Boyd–Kleinman focusing model.`);
    }
    if (r.photonFraction > 0.1) {
      warnings.push(`${(r.photonFraction * 100).toPrecision(3)} % of the weaker beam's photons are converted: the inputs deplete and the undepleted-input result no longer holds.`);
    }
    if (!(power1 > 0 && power2 > 0)) warnings.push("A zero input power gives no SFG and no normalized efficiency or photon share.");
    return {
      values: {
        sfgPower: r.power3,
        sfgWavelength: r.lambda3,
        normalizedEfficiency: r.normalized,
        qpmPeriod: r.qpmPeriod,
        focusingRatio: r.focusingRatio,
        photonConversion: r.photonFraction,
      },
      warnings,
    };
  },
  checks: [
    {
      // λ₃ = 1/(1/1064 + 1/1550) nm = 630.9105 nm. η = 8π²d²L²/(ε₀ c n₁n₂n₃λ₃²) = 1.13214e-10 m²/W at Δk = 0,
      // P₃ = η·2P₁P₂/(π(w₁² + w₂²)) = 72.0740 µW, P₃/(P₁P₂) = 1.44148 %/W,
      // Δk_material = 2π(n₃/λ₃ − n₁/λ₁ − n₂/λ₂) = 5.42622e5 /m, QPM period 2π/Δk = 11.5793 µm, ξ = L/b = 0.461621 (b = 2πn₂w²/λ₂ is the smaller).
      source: "Boyd R. W. (2008). Nonlinear Optics, 3rd ed., §2.2 (SFG coupled-amplitude equations, I₃ = 8π²d_eff²L²sinc²(ΔkL/2)I₁I₂/(ε₀cn₁n₂n₃λ₃²)); Gaussian overlap ∫I₁I₂dA = 2P₁P₂/(π(w₁² + w₂²)).",
      basis: "computed",
      inputs: {},
      expect: {
        sfgWavelength: 630.910482019893,
        sfgPower: 72.07397702970588,
        normalizedEfficiency: 1.4414795405941172,
        qpmPeriod: 11.579313947414293,
        focusingRatio: 0.46162081173734615,
        photonConversion: 0.05867384205019669,
      },
      tolerance: 1e-8,
    },
    {
      // ΔkL/2 = π/2 (Δk = π/L = 0.3141593 rad/mm for L = 10 mm): sinc² = 4/π², so P₃ = 72.0740 µW × 4/π² = 29.2105 µW.
      source: "Boyd R. W. (2008). Nonlinear Optics, 3rd ed., §2.2 (sinc²(ΔkL/2) phase-mismatch factor).",
      basis: "computed",
      inputs: { deltaK: 0.3141592653589793 },
      expect: { sfgPower: 29.21048264984186 },
      tolerance: 1e-8,
    },
  ],
});
