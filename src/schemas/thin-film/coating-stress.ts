import { stoneyLayeredCurvature } from "../../physics/thin-film/stoney";
import { defineSchema } from "../types";

const STONEY = "Stoney G. G. (1909). The tension of metallic films deposited by electrolysis. Proc. R. Soc. Lond. A 82, 172–175, " +
  "doi:10.1098/rspa.1909.0021; with the substrate's biaxial modulus E_s/(1 − ν_s) as in Janssen G. C. A. M. et al. (2009), " +
  "Celebrating the 100th anniversary of the Stoney equation for film stress, Thin Solid Films 517, 1858–1867, " +
  "doi:10.1016/j.tsf.2008.07.014: κ = 6 σ_f t_f (1 − ν_s)/(E_s t_s²); the forces σ_f t_f of N identical layers add.";

export default defineSchema({
  href: "/thin-film/coating-stress",
  inputs: [
    { key: "sigmaFilm", label: "Film stress (tensile > 0)", unit: "MPa", toSI: 1e6, siUnit: "Pa", default: 200, min: -10000, max: 10000 },
    { key: "dFilm", label: "Film thickness per layer", unit: "nm", toSI: 1e-9, siUnit: "m", default: 500, min: 0, max: 100000 },
    { key: "eSub", label: "Substrate Young's modulus", unit: "GPa", toSI: 1e9, siUnit: "Pa", default: 70, min: 0.1, max: 1500 },
    { key: "nuSub", label: "Substrate Poisson's ratio", unit: "", toSI: 1, siUnit: "", default: 0.17, min: 0, max: 0.5 },
    { key: "tSub", label: "Substrate thickness", unit: "mm", toSI: 1e-3, siUnit: "m", default: 1, min: 0.01, max: 100 },
    { key: "numLayers", label: "Number of layers (rounded to a whole number)", unit: "", toSI: 1, siUnit: "", default: 10, min: 1, max: 100 },
  ],
  outputs: [
    { key: "curvature1", label: "Curvature, 1 layer (> 0: film side concave)", unit: "1/m", toSI: 1, siUnit: "1/m" },
    { key: "curvatureN", label: "Curvature, N layers (> 0: film side concave)", unit: "1/m", toSI: 1, siUnit: "1/m" },
    { key: "radiusN", label: "Radius of curvature, N layers", unit: "m", toSI: 1, siUnit: "m" },
    { key: "thicknessRatio", label: "Total coating thickness / substrate thickness", unit: "%", toSI: 0.01, siUnit: "" },
  ],
  compute({ sigmaFilm, dFilm, eSub, nuSub, tSub, numLayers }) {
    const n = Math.max(1, Math.round(numLayers));
    const curvature1 = stoneyLayeredCurvature(sigmaFilm, dFilm, 1, eSub, nuSub, tSub);
    const curvatureN = stoneyLayeredCurvature(sigmaFilm, dFilm, n, eSub, nuSub, tSub);
    const radiusN = 1 / Math.abs(curvatureN);
    const thicknessRatio = (n * dFilm) / tSub;
    const warnings: string[] = [];
    if (!Number.isFinite(radiusN)) warnings.push("Zero curvature (no film stress or thickness): the substrate stays flat, so the radius is infinite.");
    if (thicknessRatio > 0.05) {
      warnings.push("The coating is more than 5 % as thick as the substrate; Stoney's equation assumes t_f ≪ t_s, so treat the curvature as an estimate.");
    }
    return { values: { curvature1, curvatureN, radiusN, thicknessRatio }, warnings };
  },
  checks: [
    {
      // 200 MPa, 500 nm, E = 70 GPa, ν = 0.17, t_s = 1 mm: κ1 = 6 · 2e8 · 5e-7 · 0.83 / (7e10 · 1e-6) = 498/7e4 = 7.114286e-3 1/m;
      // ten layers: κ = 7.114286e-2 1/m, R = 14.056225 m; t_f/t_s = 10 · 500 nm/1 mm = 0.5 %.
      source: STONEY,
      basis: "computed",
      inputs: { sigmaFilm: 200, dFilm: 500, eSub: 70, nuSub: 0.17, tSub: 1, numLayers: 10 },
      expect: { curvature1: 7.114285714285714e-3, curvatureN: 7.114285714285714e-2, radiusN: 14.056224899598392, thicknessRatio: 0.5 },
      tolerance: 1e-8,
    },
    {
      // Compressive 300 MPa, 1 µm, silicon wafer (E = 130 GPa, ν = 0.28, t_s = 0.525 mm), 4 layers:
      // κ1 = 6 · (−3e8) · 1e-6 · 0.72 / (1.3e11 · 2.75625e-7) = −1.296e3/3.583125e4 = −3.6169545e-2 1/m, κ4 = −0.14467818 1/m.
      source: STONEY,
      basis: "computed",
      inputs: { sigmaFilm: -300, dFilm: 1000, eSub: 130, nuSub: 0.28, tSub: 0.525, numLayers: 4 },
      expect: { curvature1: -0.036169544740973315, curvatureN: -0.14467817896389326, radiusN: 6.911892361111111 },
      tolerance: 1e-8,
    },
  ],
});
