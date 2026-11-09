import { NEAR_LEAK_FRACTION, PERTURBATION_FRACTION, dShapedFiberResponse } from "../../physics/fiber-optics/coupled-mode";
import { LP11_CUTOFF_V } from "../../physics/fiber-optics/macro-bending-loss";
import { defineSchema } from "../types";

const GLOGE_SNYDER = "Gloge D. (1971). Weakly guiding fibers. Appl. Opt. 10, 2252–2258, doi:10.1364/AO.10.002252 (LP01 eigenvalue equation " +
  "U J₁(U)/J₀(U) = W K₁(W)/K₀(W), cladding field ψ = J₀(U) K₀(Wρ)/K₀(W), n_eff² = n₂² + (W²/V²)(n₁² − n₂²)); " +
  "Snyder A. W., Love J. D. (1983). Optical Waveguide Theory, Chapman and Hall (first-order perturbation Δ(n_eff²) = η(n_ext² − n₂²), " +
  "η the LP01 power beyond the flat, η = ∫ψ² 2 arccos(ρ₀/ρ) ρ dρ / (π J₁²(U) V²/W²)); Petermann II radius w = √2 a K₁(W)/(U K₀(W)).";

export default defineSchema({
  href: "/fiber-optics/d-shaped-fiber",
  inputs: [
    { key: "cladDia", label: "Cladding diameter", unit: "µm", toSI: 1e-6, siUnit: "m", default: 125, min: 10, max: 1000 },
    { key: "coreDia", label: "Core diameter", unit: "µm", toSI: 1e-6, siUnit: "m", default: 9, min: 1, max: 60 },
    { key: "flatDepth", label: "Flat distance from the core centre", unit: "µm", toSI: 1e-6, siUnit: "m", default: 8, min: 0, max: 500 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 400, max: 2500 },
    { key: "n_core", label: "Core index n₁", unit: "", toSI: 1, siUnit: "", default: 1.4494, min: 1, max: 4 },
    { key: "n_clad", label: "Cladding index n₂", unit: "", toSI: 1, siUnit: "", default: 1.444, min: 1, max: 4 },
    { key: "n_ext", label: "External index on the flat", unit: "", toSI: 1, siUnit: "", default: 1.333, min: 1, max: 2 },
  ],
  outputs: [
    { key: "V", label: "Normalized frequency V", unit: "", toSI: 1, siUnit: "" },
    { key: "nEff", label: "Effective index n_eff", unit: "", toSI: 1, siUnit: "" },
    { key: "eta", label: "LP01 power beyond the flat", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "surface", label: "Intensity at the flat relative to the core boundary", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "mfd", label: "Mode-field diameter (Petermann II)", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "dNeff", label: "First-order index shift Δn_eff", unit: "", toSI: 1, siUnit: "" },
    { key: "sensitivity", label: "Sensitivity ∂n_eff/∂n_ext", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ cladDia, coreDia, flatDepth, wavelength, n_core, n_clad, n_ext }) {
    const r = dShapedFiberResponse(coreDia / 2, n_core, n_clad, flatDepth, n_ext, wavelength);
    const warnings: string[] = [];
    const noFlat = flatDepth >= cladDia / 2;
    const cutsCore = flatDepth < coreDia / 2;
    const leaky = n_ext >= r.nEff;
    let values = {
      V: r.V, nEff: r.nEff, eta: r.eta, surface: r.surface, mfd: 2 * r.mfdRadius, dNeff: r.dNeff, sensitivity: r.sensitivity,
    };
    if (noFlat) {
      warnings.push("The flat lies at or beyond the cladding radius: the fibre is round and nothing is computed.");
      values = { ...values, eta: NaN, surface: NaN, dNeff: NaN, sensitivity: NaN };
    } else if (cutsCore) {
      warnings.push("The flat cuts into the core (distance < core radius): the round-fibre mode no longer applies and nothing is computed.");
    } else if (!Number.isFinite(r.eta)) {
      warnings.push("No result: the model needs n₁ > n₂ and V ≥ 0.5.");
    } else {
      if (r.V > LP11_CUTOFF_V) warnings.push("V > 2.405: the fibre is not single-mode; only LP01 is computed.");
      if (leaky) {
        warnings.push("The external index is at or above n_eff: the mode leaks out through the flat, so the shift and sensitivity do not apply.");
        values = { ...values, dNeff: NaN, sensitivity: NaN };
      } else {
        const margin = r.nEff - n_clad;
        if (Math.abs(r.dNeff) > PERTURBATION_FRACTION * margin) warnings.push(`The external medium shifts n_eff by more than ${100 * PERTURBATION_FRACTION} % of the guidance margin: first-order perturbation theory is only a rough estimate.`);
        if (r.nEff - n_ext < NEAR_LEAK_FRACTION * margin) warnings.push("The external index is close to n_eff: the first-order shift and sensitivity underestimate the true values.");
      }
    }
    return { values, warnings };
  },
  checks: [
    {
      // Defaults: a = 4.5 µm, NA = √(1.4494² − 1.444²) = 0.1249974, V = 2π · 4.5e-6 · 0.1249974/1.55e-6 = 2.280142.
      // LP01 eigenvalues (bisection on U J₁(U) K₀(W) = J₀(U) W K₁(W)): U = 1.613730, W = 1.610876, b = W²/V² = 0.499115,
      // n_eff = √(1.444² + b NA²) = 1.446698. Flat at ρ₀ = 8/4.5 = 1.7778: η = 0.25097 %, ψ²(ρ₀)/ψ²(1) = [K₀(Wρ₀)/K₀(W)]² = 4.8173 %.
      // Δn_eff = η(n_ext² − n₂²)/(2 n_eff) = 2.50971e-3 · (1.776889 − 2.085136)/(2 · 1.446698) = −2.67372e-4; ∂n_eff/∂n_ext = η n_ext/n_eff = 2.31247e-3.
      // Petermann II w = √2 a K₁(W)/(U K₀(W)), MFD = 2w.
      source: GLOGE_SNYDER,
      basis: "computed",
      inputs: {},
      expect: {
        V: 2.2801415175823267,
        nEff: 1.4466977395609701,
        eta: 0.25097142218362912,
        surface: 4.817302987063971,
        dNeff: -0.0002673716349253229,
        sensitivity: 0.002312472720613375,
        mfd: 10.084149421848629,
      },
      tolerance: 1e-8,
    },
  ],
});
