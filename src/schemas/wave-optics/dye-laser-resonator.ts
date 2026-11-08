import { dyeLaserCw } from "../../physics/wave-optics/laser-resonator";
import { mirrorRadius } from "../../physics/wave-optics/two-mirror-resonator";
import { defineSchema } from "../types";

const SOURCE =
  "Svelto O. (2010). Principles of Lasers, 5th ed. Springer, doi:10.1007/978-1-4419-1302-9, ch. 6–7 (threshold g₀l = δ/2, " +
  "pumped gain g₀l = η_p σ τ P_p λ_p/(h c A), A = π(w₀² + w_p²)/2, I_sat = h c/(λ σ τ)); Rigrod W. W. (1965). Saturation effects " +
  "in high-gain lasers. J. Appl. Phys. 36, 2487–2490, doi:10.1063/1.1714517 (output); Kogelnik H., Li T. (1966). Laser beams and " +
  "resonators. Appl. Opt. 5, 1550–1567, doi:10.1364/AO.5.001550 (resonator mode); triplet gain factor 1 − σ_T k_ST τ_eff/σ_e " +
  "after Peterson O. G., Tuccio S. A., Snavely B. B. (1970). Appl. Phys. Lett. 17, 245–247, doi:10.1063/1.1653384, with " +
  "τ_eff = (c√π/(2v)) erfcx(c/(2vτ_T)), c² = (w₀² + w_p²)/2 (the page's own jet-flow derivation)";

export default defineSchema({
  href: "/wave-optics/dye-laser-resonator",
  inputs: [
    { key: "wavelength", label: "Laser wavelength λ", unit: "nm", toSI: 1e-9, siUnit: "m", default: 590, min: 300, max: 1200 },
    { key: "pumpWavelength", label: "Pump wavelength λₚ", unit: "nm", toSI: 1e-9, siUnit: "m", default: 532, min: 200, max: 1200 },
    { key: "pump", label: "Pump power absorbed in the jet", unit: "W", toSI: 1, siUnit: "W", default: 3, min: 0, max: 1000 },
    { key: "etaP", label: "Pump efficiency ηₚ", unit: "", toSI: 1, siUnit: "", default: 1, min: 0.01, max: 1 },
    { key: "pumpSpot", label: "Pump spot radius wₚ in the jet", unit: "µm", toSI: 1e-6, siUnit: "m", default: 30, min: 1, max: 1e4 },
    { key: "sigmaE", label: "Emission cross-section σₑ", unit: "10⁻¹⁶ cm²", toSI: 1e-20, siUnit: "m²", default: 1.1, min: 1e-3, max: 100 },
    { key: "tau", label: "Singlet lifetime τ", unit: "ns", toSI: 1e-9, siUnit: "s", default: 4.2, min: 0.01, max: 1000 },
    { key: "sigmaT", label: "Triplet absorption σ_T at λ", unit: "10⁻¹⁷ cm²", toSI: 1e-21, siUnit: "m²", default: 3.7, min: 0, max: 1000 },
    { key: "kST", label: "Intersystem crossing rate k_ST", unit: "10⁶ 1/s", toSI: 1e6, siUnit: "1/s", default: 3.4, min: 0, max: 1e4 },
    { key: "tauT", label: "Triplet lifetime τ_T", unit: "µs", toSI: 1e-6, siUnit: "s", default: 0.25, min: 1e-3, max: 1e6 },
    { key: "flowSpeed", label: "Jet flow speed v", unit: "m/s", toSI: 1, siUnit: "m/s", default: 5, min: 0.01, max: 100 },
    { key: "cavityLength", label: "Mirror spacing L", unit: "mm", toSI: 1e-3, siUnit: "m", default: 99, min: 1, max: 1e4 },
    { key: "R1", label: "Mirror 1 radius R₁ (0 = flat)", unit: "mm", toSI: 1e-3, siUnit: "m", default: 50, min: -1e7, max: 1e7 },
    { key: "R2", label: "Mirror 2 radius R₂ (0 = flat)", unit: "mm", toSI: 1e-3, siUnit: "m", default: 50, min: -1e7, max: 1e7 },
    { key: "R_oc", label: "Output coupler reflectance", unit: "", toSI: 1, siUnit: "", default: 0.97, min: 0.01, max: 0.9999 },
    { key: "loss", label: "Other loss per pass (jet surfaces, scatter)", unit: "%", toSI: 0.01, siUnit: "", default: 1, min: 0, max: 50 },
  ],
  outputs: [
    { key: "g1g2", label: "g₁g₂", unit: "", toSI: 1, siUnit: "" },
    { key: "waist", label: "TEM₀₀ waist w₀ in the jet", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "waistPosition", label: "Waist distance from mirror 1", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "tauEff", label: "Effective triplet lifetime τ_eff", unit: "µs", toSI: 1e-6, siUnit: "s" },
    { key: "gainLeft", label: "Gain left after triplet absorption", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "roundTripLoss", label: "Round-trip loss δ = −ln R_OC + 2 × loss per pass", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "thresholdPower", label: "Threshold pump power", unit: "W", toSI: 1, siUnit: "W" },
    { key: "gain", label: "Small-signal gain g₀l", unit: "", toSI: 1, siUnit: "" },
    { key: "saturationIntensity", label: "Saturation intensity I_sat = hc/(λσₑτ)", unit: "kW/cm²", toSI: 1e7, siUnit: "W/m²" },
    { key: "outputPower", label: "Output power", unit: "W", toSI: 1, siUnit: "W" },
    { key: "slopeEfficiency", label: "Slope efficiency", unit: "%", toSI: 0.01, siUnit: "" },
  ],
  compute(p) {
    const op = dyeLaserCw({
      lambda: p.wavelength, lambdaP: p.pumpWavelength, pump: p.pump, etaP: p.etaP, wp: p.pumpSpot, sigmaE: p.sigmaE,
      sigmaT: p.sigmaT, kST: p.kST, tauT: p.tauT, flow: p.flowSpeed, L: p.cavityLength, R1: mirrorRadius(p.R1),
      R2: mirrorRadius(p.R2), R_oc: p.R_oc, lossPerPass: p.loss, tau: p.tau,
    });
    const warnings: string[] = [];
    if (op.stability !== "stable") {
      warnings.push(`The cavity is ${op.stability === "unstable" ? "unstable" : "on the stability boundary"}: there is no TEM₀₀ mode, so no waist, threshold or output.`);
    } else if (!(op.factor > 0)) {
      warnings.push("Triplet absorption exceeds the singlet gain (σ_T k_ST τ_eff ≥ σₑ): the dye cannot lase CW. Flow faster, focus the pump tighter or quench the triplets.");
    }
    return {
      values: {
        g1g2: op.g1 * op.g2,
        waist: op.mode.w0,
        waistPosition: op.mode.z1,
        tauEff: op.tauEff,
        gainLeft: op.factor,
        roundTripLoss: op.delta,
        thresholdPower: op.pTh,
        gain: op.g0l,
        saturationIntensity: op.iSat,
        outputPower: op.pOut,
        slopeEfficiency: op.slope,
      },
      warnings,
    };
  },
  checks: [
    {
      // Defaults. g = 1 − 99/50 = −0.98, p = 0.9604, z_R = L√(p(1 − p))/|g₁ + g₂ − 2p| = 0.099 · 0.195018/3.8808 = 4.9748 mm, w₀ = √(λ z_R/π) = 30.566441 µm,
      // z₁ = 49.5 mm; c² = (w₀² + w_p²)/2, τ_eff = (c√π/(2v)) erfcx(c/(2vτ_T)) = 0.24915674 µs (erfcx by continued fraction),
      // gain left 1 − σ_T k_ST τ_eff/σₑ = 71.505529 %; δ = −ln 0.97 + 2(−ln 0.99) = 5.055988 %; A = π(w₀² + w_p²)/2,
      // P_th = δ h c A/(2 η_p σ τ λ_p) = 0.82328747 W, g₀l(3 W) = 0.09211827, I_sat = 728.757 kW/cm²,
      // Rigrod P_out = I_sat A_m K (g₀l + ln√(R₁'R₂)) = 0.64196232 W, slope = f η_p (λ_p/λ)(A_m/A) K = 29.492287 %.
      source: SOURCE,
      basis: "computed",
      inputs: {},
      expect: {
        g1g2: 0.9604, waist: 30.56644069377632, waistPosition: 49.5, tauEff: 0.24915674207081373, gainLeft: 71.50552895226512,
        roundTripLoss: 5.055987919171147, thresholdPower: 0.823287465695769, gain: 0.09211827210739104,
        saturationIntensity: 728.7570097398666, outputPower: 0.6419623179105719, slopeEfficiency: 29.492287465316124,
      },
      tolerance: 1e-8,
    },
    {
      // L = 60 mm, R₁ = R₂ = 50 mm (g = −0.2), w_p = 20 µm, 12 W absorbed, v = 20 m/s, R_OC = 0.9, loss 2 % per pass, rest default:
      // w₀ = 67.824856 µm, τ_eff = 0.24527377 µs, gain left 71.949600 %, δ = 14.576593 %, P_th = 6.4302668 W,
      // g₀l = 0.13601233, P_out = 2.5953956 W, slope = 46.598203 %.
      source: SOURCE,
      basis: "computed",
      inputs: { cavityLength: 60, pumpSpot: 20, pump: 12, flowSpeed: 20, R_oc: 0.9, loss: 2 },
      expect: {
        waist: 67.82485626434229, waistPosition: 30, tauEff: 0.24527376583124613, gainLeft: 71.94960023493566,
        roundTripLoss: 14.576593029286522, thresholdPower: 6.4302667821714286, gain: 0.13601233220713282,
        outputPower: 2.5953955649176756, slopeEfficiency: 46.59820252449221,
      },
      tolerance: 1e-8,
    },
  ],
});
