import { LASER_MAX_DELTA, fiberLaserSummary } from "../../physics/fiber-optics/fiber-laser";
import { defineSchema } from "../types";

const RIGROD =
  "Rigrod W. W. (1965). Saturation effects in high-gain lasers. J. Appl. Phys. 36(8), 2487–2490, doi:10.1063/1.1714517 " +
  "(standing-wave laser with homogeneous gain of any size: P/P_sat = (1 − R₂)√R₁ (g₀L + ln√(R₁R₂)) / ((√R₁ + √R₂)(1 − √(R₁R₂))), " +
  "with g₀L the single-pass small-signal gain in nepers and the internal round-trip loss folded into R₁ = 10^(−loss/10)).";
const GLOGE =
  "Gloge D. (1971). Weakly guiding fibers. Appl. Opt. 10(10), 2252–2258, doi:10.1364/AO.10.002252 (V = 2πa·NA/λ, LP11 cutoff at " +
  "V = 2.405, Δ = NA²/(2n₁²)); Petermann II mode-field radius w = √2 a K₁(W)/(U K₀(W)) of the exact LP01 mode.";

export default defineSchema({
  href: "/fiber-optics/fiber-laser",
  inputs: [
    { key: "pumpPower", label: "Pump power", unit: "W", toSI: 1, siUnit: "W", default: 100, min: 0, max: 1e5 },
    { key: "pumpWavelength", label: "Pump wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 976, min: 400, max: 2200 },
    { key: "laserWavelength", label: "Laser wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1064, min: 400, max: 2200 },
    { key: "slopeEfficiency", label: "Slope efficiency", unit: "%", toSI: 0.01, siUnit: "", default: 80, min: 0, max: 100 },
    { key: "thresholdPower", label: "Threshold pump power", unit: "W", toSI: 1, siUnit: "W", default: 2, min: 0, max: 1e4 },
    { key: "smallSignalGain", label: "Small-signal single-pass gain", unit: "dB", toSI: 1, siUnit: "dB", default: 13, min: 0.01, max: 60 },
    { key: "outputCoupling", label: "Output coupler transmission", unit: "%", toSI: 0.01, siUnit: "", default: 10, min: 0.01, max: 99.99 },
    { key: "cavityLoss", label: "Internal round-trip loss", unit: "dB", toSI: 1, siUnit: "dB", default: 0.5, min: 0, max: 30 },
    { key: "coreDiameter", label: "Signal core diameter", unit: "µm", toSI: 1e-6, siUnit: "m", default: 10, min: 1, max: 1000 },
    { key: "NA", label: "Core NA", unit: "", toSI: 1, siUnit: "", default: 0.08, min: 0.01, max: 1 },
  ],
  outputs: [
    { key: "outputPower", label: "Output power η_s(P_pump − P_th)", unit: "W", toSI: 1, siUnit: "W" },
    { key: "opticalEfficiency", label: "Optical-to-optical efficiency", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "stokesEfficiency", label: "Stokes efficiency λ_p/λ_l", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "efficiencyBeyondStokes", label: "Efficiency beyond Stokes", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "optimumCoupling", label: "Optimum output coupler transmission (Rigrod)", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "optimumOutput", label: "Rigrod output at the optimum, in units of P_sat", unit: "", toSI: 1, siUnit: "" },
    { key: "couplerOutput", label: "Rigrod output at your coupler, in units of P_sat", unit: "", toSI: 1, siUnit: "" },
    { key: "fractionOfOptimum", label: "Output at your coupler as a fraction of the optimum", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "V", label: "V number at the laser wavelength", unit: "", toSI: 1, siUnit: "" },
    { key: "guidedModes", label: "Guided LP modes (counting polarizations)", unit: "", toSI: 1, siUnit: "" },
    { key: "modeFieldDiameter", label: "LP01 mode-field diameter (Petermann II)", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "cutoffWavelength", label: "Single-mode (LP11) cutoff wavelength", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "delta", label: "Core–cladding index step Δ", unit: "%", toSI: 0.01, siUnit: "" },
  ],
  compute(si) {
    const r = fiberLaserSummary({
      pumpPower: si.pumpPower, pumpLambda: si.pumpWavelength, laserLambda: si.laserWavelength, slopeEfficiency: si.slopeEfficiency,
      thresholdPower: si.thresholdPower, gainDb: si.smallSignalGain, transmission: si.outputCoupling, lossDb: si.cavityLoss,
      coreDiameter: si.coreDiameter, NA: si.NA,
    });
    const belowThreshold = !(r.optOut > 0);
    const warnings: string[] = [];
    if (belowThreshold) warnings.push("The gain does not overcome the internal loss: below threshold, so no optimum coupler or Rigrod output exists.");
    if (r.stokes > 1) warnings.push("Stokes efficiency above 100 %: the pump wavelength is longer than the laser wavelength.");
    if (r.beyond > 1) warnings.push("Efficiency beyond Stokes above 100 %: the slope exceeds the quantum limit.");
    if (r.delta > LASER_MAX_DELTA) warnings.push("Core–cladding Δ exceeds 2 %: weak-guidance formulas lose accuracy.");
    return {
      values: {
        outputPower: r.out,
        opticalEfficiency: r.optical,
        stokesEfficiency: r.stokes,
        efficiencyBeyondStokes: r.beyond,
        optimumCoupling: belowThreshold ? NaN : r.Topt,
        optimumOutput: belowThreshold ? NaN : r.optOut,
        couplerOutput: r.atT,
        fractionOfOptimum: belowThreshold ? NaN : r.atT / r.optOut,
        V: r.V,
        guidedModes: r.modes,
        modeFieldDiameter: r.mfd,
        cutoffWavelength: r.cutoffWavelength,
        delta: r.delta,
      },
      warnings,
    };
  },
  checks: [
    {
      // Slope-efficiency model: P_out = η_s (P_pump − P_th) = 0.8 · (100 − 2) = 78.4 W, optical efficiency 78.4/100 = 78.4 %.
      // Stokes = λ_p/λ_l = 976/1064 = 91.729323 %; beyond Stokes = η_s/(λ_p/λ_l) = 0.8 · 1064/976 = 87.213115 %.
      // Δ = NA²/(2n₁²) = 0.0064/(2 · 1.45²) = 0.0064/4.205 = 0.1521998 %. Cutoff λ_c = 2πa·NA/2.404826 = 2π · 5e-6 · 0.08/2.404826 = 1045.0962 nm.
      // V = 2π · 5e-6 · 0.08/1.064e-6 = 2.3620997.
      source: GLOGE,
      basis: "computed",
      inputs: {},
      expect: {
        outputPower: 78.4,
        opticalEfficiency: 78.4,
        stokesEfficiency: 91.72932330827068,
        efficiencyBeyondStokes: 87.21311475409836,
        delta: 0.1521997621878716,
        cutoffWavelength: 1045.0962294662131,
        V: 2.3620997395411982,
      },
      tolerance: 1e-8,
    },
    {
      // g₀L = 13 dB/(10/ln 10) = 13 · 0.2302585 = 2.9933606 Np; R₁ = 10^(−0.05) = 0.8912509; coupler T = 10 %, R₂ = 0.9,
      // √(R₁R₂) = 0.8956148, ln √(R₁R₂) = −0.1102449, net = g₀L + ln √(R₁R₂) = 2.8831157. P/P_sat:
      // (1 − R₂)√R₁ = 0.0944061, √R₁ + √R₂ = 1.8927442, 1 − √(R₁R₂) = 0.1043852, so P/P_sat = 0.0944061 · 2.8831157/(1.8927442 · 0.1043852) = 1.3776255.
      // Optimum (own dense scan + golden refinement of the same Rigrod expression): T_opt = 51.50592 %, P/P_sat = 2.2270768,
      // so the 10 % coupler gives 61.85801 % of it. The maximum is flat, so the optimum output is exact but T_opt itself
      // is only fixed to about 1e-8 in absolute terms: it is not checked.
      source: RIGROD,
      basis: "computed",
      inputs: {},
      expect: { couplerOutput: 1.3776254937392125, optimumOutput: 2.2270767924655392, fractionOfOptimum: 61.8580148830018 },
      tolerance: 1e-8,
    },
    {
      // Lossless rear mirror (R₁ = 1): the Rigrod output tends to g₀L as R₂ → 1 ((1 − R₂)/(1 − √R₂) → 2, so P → g₀L),
      // g₀L = 13 · ln(10)/10 = 2.9933606 Np.
      source: RIGROD,
      basis: "computed",
      inputs: { cavityLoss: 0 },
      expect: { optimumOutput: 2.99336062089226 },
      tolerance: 1e-8,
    },
  ],
});
