import { stressMeasurement } from "../../physics/thin-film/stoney";
import { defineSchema } from "../types";

const STONEY = "Stoney G. G. (1909). The tension of metallic films deposited by electrolysis. Proc. R. Soc. Lond. A 82, 172–175, " +
  "doi:10.1098/rspa.1909.0021; with the substrate's biaxial modulus E_s/(1 − ν_s) as in Janssen G. C. A. M. et al. (2009), " +
  "Celebrating the 100th anniversary of the Stoney equation for film stress, Thin Solid Films 517, 1858–1867, " +
  "doi:10.1016/j.tsf.2008.07.014: σ_f = E_s t_s² Δκ/(6 (1 − ν_s) t_f), κ = 2h/(a² + h²) for a spherical cap.";
const FREUND = "Freund L. B., Suresh S. (2003). Thin Film Materials: Stress, Defect Formation and Surface Evolution, Cambridge University Press, " +
  "ch. 2 (thermal mismatch strain): σ_th = E_f/(1 − ν_f) (α_s − α_f)(T − T_dep); " + STONEY;

export default defineSchema({
  href: "/thin-film/stress-measurement",
  inputs: [
    { key: "radius", label: "Measurement radius a", unit: "mm", toSI: 1e-3, siUnit: "m", default: 25, min: 0.1, max: 1000 },
    { key: "substrateThickness", label: "Substrate thickness t_s", unit: "mm", toSI: 1e-3, siUnit: "m", default: 0.5, min: 0.001, max: 100 },
    { key: "youngsModulus", label: "Substrate Young's modulus E_s", unit: "GPa", toSI: 1e9, siUnit: "Pa", default: 70, min: 0.1, max: 1500 },
    { key: "poissonRatio", label: "Substrate Poisson's ratio ν_s", unit: "", toSI: 1, siUnit: "", default: 0.22, min: 0, max: 0.5 },
    { key: "alphaSub", label: "Substrate expansion α_s", unit: "ppm/K", toSI: 1e-6, siUnit: "1/K", default: 9, min: -10, max: 50 },
    { key: "thickness", label: "Film thickness t_f", unit: "nm", toSI: 1e-9, siUnit: "m", default: 100, min: 0.1, max: 1e6 },
    { key: "filmModulus", label: "Film Young's modulus E_f", unit: "GPa", toSI: 1e9, siUnit: "Pa", default: 70, min: 0.1, max: 1500 },
    { key: "filmPoisson", label: "Film Poisson's ratio ν_f", unit: "", toSI: 1, siUnit: "", default: 0.17, min: 0, max: 0.5 },
    { key: "alphaFilm", label: "Film expansion α_f", unit: "ppm/K", toSI: 1e-6, siUnit: "1/K", default: 0.5, min: -10, max: 50 },
    { key: "deflectionBeforeUm", label: "Center deflection before deposition", unit: "µm", toSI: 1e-6, siUnit: "m", default: 0, min: -10000, max: 10000 },
    { key: "deflectionUm", label: "Center deflection after deposition (+ = film side concave)", unit: "µm", toSI: 1e-6, siUnit: "m", default: 1, min: -10000, max: 10000 },
    { key: "depositionTemp", label: "Deposition temperature", unit: "°C", toSI: 1, siUnit: "°C", default: 200, min: -273, max: 2000 },
    { key: "temperature", label: "Measurement temperature", unit: "°C", toSI: 1, siUnit: "°C", default: 25, min: -273, max: 2000 },
  ],
  outputs: [
    { key: "stress", label: "Film stress (tensile > 0)", unit: "MPa", toSI: 1e6, siUnit: "Pa" },
    { key: "thermal", label: "Thermal mismatch stress", unit: "MPa", toSI: 1e6, siUnit: "Pa" },
    { key: "intrinsic", label: "Intrinsic stress", unit: "MPa", toSI: 1e6, siUnit: "Pa" },
    { key: "deltaKappa", label: "Curvature change Δκ", unit: "1/m", toSI: 1, siUnit: "1/m" },
    { key: "forcePerWidth", label: "Force per width σ·t_f", unit: "N/m", toSI: 1, siUnit: "N/m" },
    { key: "strain", label: "Film strain", unit: "µε", toSI: 1e-6, siUnit: "" },
    { key: "energy", label: "Stored elastic energy per area", unit: "mJ/m²", toSI: 1e-3, siUnit: "J/m²" },
    { key: "thicknessRatio", label: "t_f / t_s", unit: "", toSI: 1, siUnit: "" },
  ],
  compute(i) {
    const r = stressMeasurement({
      a: i.radius, tS: i.substrateThickness, tF: i.thickness, Es: i.youngsModulus, nuS: i.poissonRatio, Ef: i.filmModulus,
      nuF: i.filmPoisson, alphaS: i.alphaSub, alphaF: i.alphaFilm, hBefore: i.deflectionBeforeUm, hAfter: i.deflectionUm,
      Tdep: i.depositionTemp, T: i.temperature,
    });
    const warnings: string[] = [];
    // The inputs are SI here: deflections in m, thickness in m.
    const bow = Math.max(Math.abs(i.deflectionBeforeUm), Math.abs(i.deflectionUm));
    if (bow > 0.3 * i.substrateThickness) {
      warnings.push("The bow exceeds 30 % of the substrate thickness: Stoney's equation assumes deflections much smaller than t_s, so treat the stress as an estimate.");
    }
    if (r.thicknessRatio >= 0.1) {
      warnings.push("t_f/t_s ≥ 0.1: Stoney assumes a film much thinner than the substrate, so the stress is only approximate.");
    }
    return { values: r, warnings };
  },
  checks: [
    {
      // Defaults. κ = 2h/(a² + h²) = 2e-6/(6.25e-4 + 1e-12) = 3.2e-3 1/m (h = 1 µm, a = 25 mm, before = 0).
      // σ_f = E_s t_s² κ/(6 (1 − ν_s) t_f) = 70e9 · (5e-4)² · 3.2e-3/(6 · 0.78 · 1e-7) = 119.658 MPa; force = σ t_f = 11.9658 N/m.
      source: STONEY,
      basis: "computed",
      inputs: {},
      expect: { stress: 119.65811946666666, deltaKappa: 0.0031999999948799994, forcePerWidth: 11.965811946666665 },
      tolerance: 1e-8,
    },
    {
      // σ_th = E_f/(1 − ν_f) (α_s − α_f)(T − T_dep) = 70e9/0.83 · 8.5e-6 · (25 − 200) = −125.4518 MPa; intrinsic = 119.6581 + 125.4518 = 245.1099 MPa.
      // ε = σ_f (1 − ν_f)/E_f = 119.6581e6 · 0.83/70e9 = 1418.80 µε; U = σ_f² t_f (1 − ν_f)/E_f = 16.9771 mJ/m².
      source: FREUND,
      basis: "computed",
      inputs: {},
      expect: { thermal: -125.45180722891565, intrinsic: 245.10992669558232, strain: 1418.8034165333333, energy: 16.97713487152604 },
      tolerance: 1e-8,
    },
  ],
});
