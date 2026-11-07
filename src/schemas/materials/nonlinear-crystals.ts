import {
  SHG_CRYSTALS, SHG_LAMBDA, bestFocus, focusedShg, shgPrefactor, waistForXi, type ShgCrystalId,
} from "../../physics/materials/nonlinear-crystals";
import { defineSchema } from "../types";

const IDS = Object.keys(SHG_CRYSTALS) as ShgCrystalId[];
/** Conversion above which the page flags the undepleted-pump result. */
const DEPLETION_WARNING = 0.1;

const BK = "Boyd G. D., Kleinman D. A. (1968). Parametric interaction of focused Gaussian light beams. J. Appl. Phys. 39, 3597, " +
  "§II: P_2ω = K P_ω², K = 16π² d_eff² L h/(ε₀ c n_ω n_2ω λ³), ξ = L/b, b = 2π n_ω w₀²/λ, h(σ = 0, B = 0) = arctan²ξ/ξ, " +
  "h(σ, B, ξ) = (1/4ξ) ∫∫ dτ dτ′ e^{iσ(τ−τ′) − (B²/ξ)(τ−τ′)²}/((1 + iτ)(1 − iτ′)), B = ρ√(L k_ω)/2.";
const EKSMA = "EKSMA Optics, BBO data sheet (EKSMA_Optics_BBO_Crystals.pdf): n_o 1.6551 (1064 nm), n_o 1.6750 and n_e 1.5555 (532 nm), " +
  "d₂₂ = 2.2 pm/V, d₃₁ = 0.08 pm/V, d_ooe = d₃₁ sinθ − d₂₂ cosθ sin3φ, walk-off 55.9 mrad (type I SHG of 1064 nm). " + BK;

export default defineSchema({
  href: "/materials/nonlinear-crystals",
  choices: [
    {
      key: "material",
      label: "Crystal (the custom parameters apply only to \"custom\")",
      options: [...IDS.map((id) => ({ value: id, label: SHG_CRYSTALS[id].name })), { value: "custom", label: "Custom" }],
      default: "bbo",
    },
  ],
  inputs: [
    { key: "length", label: "Crystal length L", unit: "mm", toSI: 1e-3, siUnit: "m", default: 10, min: 0.1, max: 100 },
    { key: "pumpPower", label: "Pump peak power", unit: "W", toSI: 1, siUnit: "W", default: 5, min: 0, max: 1e9 },
    { key: "waist", label: "Focus waist w₀ (1/e² radius)", unit: "µm", toSI: 1e-6, siUnit: "m", default: 30, min: 1, max: 10000 },
    { key: "pumpWavelength", label: "Pump λ (custom only)", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1064, min: 400, max: 12000 },
    { key: "deff", label: "d_eff (custom only)", unit: "pm/V", toSI: 1e-12, siUnit: "m/V", default: 2, min: 0, max: 500 },
    { key: "n", label: "Phase-matched index n (custom only)", unit: "", toSI: 1, siUnit: "", default: 1.66, min: 1, max: 5 },
    { key: "walkoff", label: "Walk-off ρ (custom only)", unit: "mrad", toSI: 1e-3, siUnit: "rad", default: 0, min: 0, max: 200 },
  ],
  outputs: [
    { key: "shgPower", label: "Second-harmonic power P_2ω = K P_ω²", unit: "W", toSI: 1, siUnit: "W" },
    { key: "efficiency", label: "Conversion efficiency η = K P_ω (undepleted pump)", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "K", label: "Normalized efficiency K", unit: "%/W", toSI: 0.01, siUnit: "1/W" },
    { key: "xi", label: "Focusing parameter ξ = L/b", unit: "", toSI: 1, siUnit: "" },
    { key: "B", label: "Walk-off parameter B", unit: "", toSI: 1, siUnit: "" },
    { key: "h", label: "Boyd–Kleinman h at Δk = 0", unit: "", toSI: 1, siUnit: "" },
    { key: "kBestFocus", label: "K at the best focus, Δk = 0", unit: "%/W", toSI: 0.01, siUnit: "1/W" },
    { key: "waistBestFocus", label: "Waist of the best focus", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "kOptimum", label: "K at the Boyd–Kleinman optimum (Δk tuned)", unit: "%/W", toSI: 0.01, siUnit: "1/W" },
    { key: "waistOptimum", label: "Waist of the Boyd–Kleinman optimum", unit: "µm", toSI: 1e-6, siUnit: "m" },
  ],
  compute({ material, length, pumpPower, waist, pumpWavelength, deff, n, walkoff }) {
    const crystal = material === "custom" ? null : SHG_CRYSTALS[material as ShgCrystalId];
    const m = crystal
      ? { lambda: SHG_LAMBDA, deff: crystal.deff, nOmega: crystal.nOmega, n2Omega: crystal.n2Omega, walkOff: crystal.walkOff }
      : { lambda: pumpWavelength, deff, nOmega: n, n2Omega: n, walkOff: walkoff };
    const shg = focusedShg({ ...m, length, w0: waist });
    const prefactor = shgPrefactor(m.lambda, length, m.deff, m.nOmega, m.n2Omega);
    const best = bestFocus(shg.B);
    const opt = bestFocus(shg.B, true);
    const efficiency = shg.K * pumpPower;
    const warnings: string[] = [];
    if (shg.B > 1) warnings.push(`Walk-off B = ${+shg.B.toPrecision(3)}: the SH beam leaves the fundamental inside the crystal, so h falls.`);
    if (efficiency > DEPLETION_WARNING) warnings.push("Above about 10 % conversion the pump depletes: this undepleted-pump model overestimates P_2ω.");
    return {
      values: {
        shgPower: shg.K * pumpPower ** 2,
        efficiency,
        K: shg.K,
        xi: shg.xi,
        B: shg.B,
        h: shg.h,
        kBestFocus: prefactor * best.h,
        waistBestFocus: waistForXi(m.lambda, m.nOmega, length, best.xi),
        kOptimum: prefactor * opt.h,
        waistOptimum: waistForXi(m.lambda, m.nOmega, length, opt.xi),
      },
      warnings,
    };
  },
  checks: [
    {
      // Custom, no walk-off: λ = 1064 nm, d_eff = 2 pm/V, n = 1.66, L = 10 mm, w₀ = 30 µm, P = 5 W.
      // b = 2π · 1.66 · (30 µm)²/1.064 µm = 8.8217 mm, ξ = 1.133473, h = arctan²ξ/ξ = 0.634243 (a numerical double integral gives 0.6342430),
      // K = 16π² d² L h/(ε₀ c n² λ³) = 4.5470e-4 /W = 0.045470 %/W; η = K P = 0.227350 %; P_2ω = K P² = 11.3675 mW.
      source: BK,
      basis: "computed",
      inputs: { material: "custom", length: 10, pumpPower: 5, waist: 30, pumpWavelength: 1064, deff: 2, n: 1.66, walkoff: 0 },
      expect: { xi: 1.133472954817782, h: 0.634242968242945, K: 0.04546999302275526, efficiency: 0.2273499651137763, shgPower: 0.011367498255688816 },
      tolerance: 1e-5,
    },
    {
      // BBO type I from the EKSMA sheet's indices: sin²θ = (1.6551⁻² − 1.675⁻²)/(1.5555⁻² − 1.675⁻²) gives θ = 22.916°; d_eff = 0.08 sinθ + 2.2 cosθ = 2.0575 pm/V;
      // walk-off tan ρ = (n_e(θ)²/2)(n_e⁻² − n_o⁻²) sin2θ at 532 nm = 55.814 mrad (the sheet prints 55.9); B = ρ√(L k_ω)/2 = 8.7246;
      // L = 10 mm, w₀ = 30 µm: ξ = 1.13683, h(0, B, ξ) = 0.079170 from a numerical double integral (midpoint rule, 3000 × 3000 points);
      // K = 16π² d_eff² L h/(ε₀ c n_ω² λ³) = 6.0426e-5 /W = 0.0060426 %/W; η at 5 W = 0.030213 %; P_2ω = 1.5107 mW.
      source: EKSMA,
      basis: "computed",
      inputs: { material: "bbo", length: 10, pumpPower: 5, waist: 30 },
      expect: { xi: 1.1368286538562735, B: 8.724550597388285, h: 0.07917044163535128, K: 0.006042623105076216, efficiency: 0.03021311552538108, shgPower: 0.001510655776269054 },
      tolerance: 1e-3,
    },
    {
      // B = ρ√(L k_ω)/2 with the sheet's printed ρ = 55.9 mrad for BBO, L = 10 mm, n_o(1064 nm) = 1.6551, λ = 1064 nm:
      // √(0.01 · 2π · 1.6551/1.064e-6) = 312.6, B = 0.0559 · 312.6/2 = 8.7380. The page derives ρ = 55.81 mrad from the indices (0.15 % lower).
      source: EKSMA,
      basis: "computed",
      inputs: { material: "bbo", length: 10 },
      expect: { B: 8.738020349121292 },
      tolerance: 3e-3,
    },
  ],
});
