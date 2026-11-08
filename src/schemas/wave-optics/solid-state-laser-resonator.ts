import { solidStateRodLaser } from "../../physics/wave-optics/laser-resonator";
import { mirrorRadius } from "../../physics/wave-optics/two-mirror-resonator";
import { defineSchema } from "../types";

const SOURCE =
  "Koechner W. (2006). Solid-State Laser Engineering, 6th ed., ch. 2–3, Springer, doi:10.1007/0-387-29338-8 (four-level rod: " +
  "g₀l = η_p σ τ P_p λ_p/(h c A), P_th = δ h c A/(2 η_p σ τ λ_p), I_sat = h c/(λ σ τ)); Rigrod W. W. (1965). Saturation effects in " +
  "high-gain lasers. J. Appl. Phys. 36, 2487–2490, doi:10.1063/1.1714517 (output P = I_sat A (1 − R₂)√R₁′ (g₀l + ln√(R₁′R₂))/" +
  "((√R₁′ + √R₂)(1 − √(R₁′R₂))), R₁′ = R_HR e^(−2αl)); Kogelnik H., Li T. (1966). Laser beams and resonators. Appl. Opt. 5, 1550–1567, " +
  "doi:10.1364/ao.5.001550 (two-mirror mode, g = 1 − L/R)";

export default defineSchema({
  href: "/wave-optics/solid-state-laser-resonator",
  inputs: [
    { key: "crystalLength", label: "Crystal length l", unit: "mm", toSI: 1e-3, siUnit: "m", default: 10, min: 0.1, max: 300 },
    { key: "crystalDiameter", label: "Crystal diameter", unit: "mm", toSI: 1e-3, siUnit: "m", default: 3, min: 0.1, max: 50 },
    { key: "n_crystal", label: "Crystal refractive index n", unit: "", toSI: 1, siUnit: "", default: 1.82, min: 1, max: 4 },
    { key: "wavelength", label: "Laser wavelength λ", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1064, min: 300, max: 5000 },
    { key: "pumpWavelength", label: "Pump wavelength λ_p", unit: "nm", toSI: 1e-9, siUnit: "m", default: 808, min: 200, max: 5000 },
    { key: "pump", label: "Absorbed pump power", unit: "W", toSI: 1, siUnit: "W", default: 20, min: 0, max: 1e5 },
    { key: "etaP", label: "Pump efficiency η_p (upper-level ions per absorbed photon)", unit: "", toSI: 1, siUnit: "", default: 1, min: 0.01, max: 1 },
    { key: "sigma", label: "Emission cross-section σ", unit: "1e-19 cm²", toSI: 1e-23, siUnit: "m²", default: 2.8, min: 1e-4, max: 1e4 },
    { key: "tau", label: "Upper-level lifetime τ", unit: "µs", toSI: 1e-6, siUnit: "s", default: 230, min: 1e-3, max: 1e5 },
    { key: "R1", label: "HR radius R₁ (+ concave, − convex, 0 = flat)", unit: "mm", toSI: 1e-3, siUnit: "m", default: 0, min: -1e7, max: 1e7 },
    { key: "R2", label: "Output coupler radius R₂ (+ concave, − convex, 0 = flat)", unit: "mm", toSI: 1e-3, siUnit: "m", default: 200, min: -1e7, max: 1e7 },
    { key: "L_cav", label: "Cavity length L", unit: "mm", toSI: 1e-3, siUnit: "m", default: 150, min: 0.1, max: 1e5 },
    { key: "R_oc", label: "Output coupler reflectance", unit: "", toSI: 1, siUnit: "", default: 0.95, min: 0.01, max: 0.9999 },
    { key: "R_hr", label: "HR reflectance", unit: "", toSI: 1, siUnit: "", default: 0.999, min: 0.01, max: 1 },
    { key: "alpha_c", label: "Crystal loss α", unit: "1/cm", toSI: 100, siUnit: "1/m", default: 0.001, min: 0, max: 10 },
  ],
  outputs: [
    { key: "g1g2", label: "g₁g₂", unit: "", toSI: 1, siUnit: "" },
    { key: "waist", label: "TEM₀₀ waist w₀", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "waistPosition", label: "Waist distance from the HR", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "rodSpot", label: "Largest TEM₀₀ spot in the rod", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "spotOnCoupler", label: "TEM₀₀ spot on the output coupler", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "effectiveLength", label: "Effective cavity length L − l(1 − 1/n)", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "roundTripLoss", label: "Round-trip loss δ = −ln(R_HR R_OC) + 2αl", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "thresholdPump", label: "Threshold pump power", unit: "W", toSI: 1, siUnit: "W" },
    { key: "smallSignalGain", label: "Small-signal gain g₀l at the pump power", unit: "", toSI: 1, siUnit: "" },
    { key: "saturationIntensity", label: "Saturation intensity I_sat", unit: "kW/cm²", toSI: 1e7, siUnit: "W/m²" },
    { key: "outputPower", label: "Output power", unit: "W", toSI: 1, siUnit: "W" },
    { key: "slopeEfficiency", label: "Slope efficiency", unit: "%", toSI: 0.01, siUnit: "" },
  ],
  compute(p) {
    const op = solidStateRodLaser({
      lambda: p.wavelength, lambdaP: p.pumpWavelength, pump: p.pump, etaP: p.etaP, sigma: p.sigma, tau: p.tau,
      rodLength: p.crystalLength, rodDiameter: p.crystalDiameter, n: p.n_crystal, L: p.L_cav,
      R1: mirrorRadius(p.R1), R2: mirrorRadius(p.R2), R_hr: p.R_hr, R_oc: p.R_oc, alpha: p.alpha_c,
    });
    const warnings: string[] = [];
    if (!op.fits) {
      warnings.push("The crystal is longer than the cavity: shorten it or lengthen the cavity. No cavity mode is computed.");
    } else if (op.stability !== "stable") {
      warnings.push(
        `The cavity is ${op.stability === "unstable" ? "unstable" : "on the stability boundary"}: there is no TEM₀₀ mode. The threshold and output still describe a multimode laser only if the cavity confines the light.`,
      );
    }
    if (op.clipped) warnings.push("TEM₀₀ spot (w) is larger than the rod radius: the mode is clipped and the aperture loss is not modelled.");
    return {
      values: {
        g1g2: op.g1 * op.g2,
        waist: op.mode.w0,
        waistPosition: op.waistPos,
        rodSpot: op.rodSpot,
        spotOnCoupler: op.mode.w2,
        effectiveLength: op.Leff,
        roundTripLoss: op.delta,
        thresholdPump: op.pTh,
        smallSignalGain: op.g0l,
        saturationIntensity: op.iSat,
        outputPower: op.pOut,
        slopeEfficiency: op.slope,
      },
      warnings,
    };
  },
  checks: [
    {
      // Defaults. L_eff = L − l(1 − 1/n) = 150 − 10(1 − 1/1.82) = 145.494505 mm; g₁ = 1 (flat), g₂ = 1 − L_eff/R₂ = 0.2725275, g₁g₂ = 0.2725275;
      // z_R = L_eff √(g₁g₂(1 − g₁g₂))/|g₁ + g₂ − 2g₁g₂|, w₀ = √(λ z_R/π) = 173.667118 µm at the HR face (z₁ = 0), w(u) = w₀√(1 + ((u − z₁)/z_R)²)
      // largest in the rod at its far face, 173.997370 µm; w₂ = √((λ L_eff/π)√(g₁/(g₂(1 − g₁g₂)))) = 332.669092 µm;
      // A = π(1.5 mm)², αl = 0.1 1/m · 0.01 m, δ = −ln(0.999 · 0.95) + 2αl = 0.0542938;
      // P_th = δ h c A/(2 η_p σ τ λ_p) = 7.325413 W, g₀l = η_p σ τ P λ_p/(h c A) = 0.0741170, I_sat = h c/(λ σ τ) = 2.899007 kW/cm²;
      // Rigrod with R₁′ = R_HR e^(−2αl) = 0.997003: P = 9.093197 W; slope η_p (λ_p/λ) K = 71.743532 %.
      source: SOURCE,
      basis: "computed",
      inputs: {},
      expect: {
        g1g2: 0.27252747252747256, waist: 173.6671178506314, rodSpot: 173.99736966271152, spotOnCoupler: 332.6690918486952,
        effectiveLength: 145.4945054945055, roundTripLoss: 5.429379472113412, thresholdPump: 7.3254126813887686,
        smallSignalGain: 0.07411704580012955, saturationIntensity: 2.8990068199646952, outputPower: 9.09319656114919,
        slopeEfficiency: 71.74353162407759,
      },
      tolerance: 1e-8,
    },
  ],
});
