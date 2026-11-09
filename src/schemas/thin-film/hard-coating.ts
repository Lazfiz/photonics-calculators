import { hardCoatingOptics } from "../../physics/thin-film/hard-coating";
import { biaxialStrainEnergy, deflectionFromCurvature, delaminationThickness, stoneyCurvature } from "../../physics/thin-film/stoney";
import { defineSchema } from "../types";

const pure = { unit: "", toSI: 1, siUnit: "" } as const;
const percent = { unit: "%", toSI: 0.01, siUnit: "" } as const;
const nm = { unit: "nm", toSI: 1e-9, siUnit: "m" } as const;

const MACLEOD = "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., CRC Press, ch. 2 (characteristic matrix, quarter-wave layer maps Y to n²/Y) and ch. 4 (single-layer coatings).";
const STONEY = "Stoney G. G. (1909). The tension of metallic films deposited by electrolysis. Proc. R. Soc. Lond. A 82, 172–175, " +
  "doi:10.1098/rspa.1909.0021: κ = 6 σ t_f (1 − ν_s)/(E_s t_s²); sagitta h = κa²/(1 + √(1 − κ²a²)) of a spherical cap; " +
  "stored energy U = σ² t_f (1 − ν_f)/E_f and delamination thickness t_c = Γ E_f/((1 − ν_f) σ²) after Hutchinson J. W., Suo Z. (1991), " +
  "Mixed mode cracking in layered materials, Adv. Appl. Mech. 29, 63–191, doi:10.1016/S0065-2156(08)70164-9.";

export default defineSchema({
  href: "/thin-film/hard-coating",
  inputs: [
    { key: "nCoat", label: "Coating index", ...pure, default: 2.1, min: 1, max: 4 },
    { key: "nSub", label: "Substrate index", ...pure, default: 1.52, min: 1, max: 4 },
    { key: "designWl", label: "Design wavelength λ₀", ...nm, default: 550, min: 200, max: 5000 },
    { key: "thickness", label: "Coating thickness", ...nm, default: 200, min: 0, max: 20000 },
    { key: "stressMPa", label: "Film stress (tensile > 0, compressive < 0)", unit: "MPa", toSI: 1e6, siUnit: "Pa", default: -500, min: -10000, max: 10000 },
    { key: "Ef", label: "Film Young's modulus", unit: "GPa", toSI: 1e9, siUnit: "Pa", default: 150, min: 1, max: 1200 },
    { key: "nuF", label: "Film Poisson ratio", ...pure, default: 0.25, min: 0, max: 0.49 },
    { key: "toughness", label: "Interface toughness Γ", unit: "J/m²", toSI: 1, siUnit: "J/m²", default: 5, min: 0.01, max: 1000 },
    { key: "Es", label: "Substrate Young's modulus", unit: "GPa", toSI: 1e9, siUnit: "Pa", default: 72, min: 1, max: 1200 },
    { key: "nuS", label: "Substrate Poisson ratio", ...pure, default: 0.22, min: 0, max: 0.49 },
    { key: "tSub", label: "Substrate thickness", unit: "mm", toSI: 1e-3, siUnit: "m", default: 1, min: 0.01, max: 100 },
    { key: "diam", label: "Substrate diameter", unit: "mm", toSI: 1e-3, siUnit: "m", default: 25, min: 1, max: 1000 },
  ],
  outputs: [
    { key: "R0", label: "Reflectance at λ₀ of the coated face", ...percent },
    { key: "bare", label: "Reflectance of the uncoated face", ...percent },
    { key: "meanR", label: "Mean reflectance over the band (400–700 nm for visible designs, else 0.8–1.2 λ₀)", ...percent },
    { key: "minR", label: "Minimum reflectance over the band", ...percent },
    { key: "maxR", label: "Maximum reflectance over the band", ...percent },
    { key: "quarterWaveR", label: "Reflectance at λ₀ of a quarter-wave film of this index", ...percent },
    { key: "halfWave", label: "Half-wave thickness λ₀/(2n)", ...nm },
    { key: "nearestAbsentee", label: "Nearest absentee thickness", ...nm },
    { key: "curvature", label: "Substrate curvature (> 0: film side concave)", unit: "1/m", toSI: 1, siUnit: "1/m" },
    { key: "bow", label: "Substrate bow (sagitta) over the diameter", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "energy", label: "Stored elastic energy U", unit: "J/m²", toSI: 1, siUnit: "J/m²" },
    { key: "delaminationThickness", label: "Thickness where U = Γ", unit: "µm", toSI: 1e-6, siUnit: "m" },
  ],
  compute({ nCoat, nSub, designWl, thickness, stressMPa, Ef, nuF, toughness, Es, nuS, tSub, diam }) {
    // stressMPa, Ef, Es arrive in Pa; lengths in m.
    const o = hardCoatingOptics(nCoat, nSub, thickness, designWl);
    const curvature = stoneyCurvature(stressMPa, thickness, Es, nuS, tSub);
    const bow = Math.abs(deflectionFromCurvature(curvature, diam / 2));
    const tc = delaminationThickness(toughness, stressMPa, Ef, nuF);
    const warnings: string[] = [];
    if (!Number.isFinite(bow)) warnings.push("The curvature is too large for a spherical cap over this diameter (|κ a| > 1), so there is no bow value.");
    if (!Number.isFinite(tc)) warnings.push("No film stress: the stored energy is zero and a film of any thickness cannot delaminate, so t_c is infinite.");
    if (nCoat * nCoat > nSub) warnings.push("n > √n_s: a quarter-wave film is a reflectance maximum, not an AR coating.");
    return {
      values: {
        R0: o.R0,
        bare: o.bare,
        meanR: o.mean,
        minR: o.min,
        maxR: o.max,
        quarterWaveR: o.quarterWave,
        halfWave: o.halfWave,
        nearestAbsentee: o.nearestAbsentee,
        curvature,
        bow,
        energy: biaxialStrainEnergy(stressMPa, thickness, Ef, nuF),
        delaminationThickness: tc,
      },
      warnings,
    };
  },
  checks: [
    {
      // n = 2 on n_s = 1.52, d = 75 nm = λ₀/(4n) for λ₀ = 600 nm: Y = n²/n_s = 4/1.52, R = ((n_s − n²)/(n_s + n²))² = (2.48/5.52)² = 6.1504/30.4704 = 0.2018483512.
      source: MACLEOD,
      basis: "computed",
      inputs: { nCoat: 2, nSub: 1.52, designWl: 600, thickness: 75 },
      expect: { R0: 20.184835118672548, quarterWaveR: 20.184835118672548, halfWave: 150 },
      tolerance: 1e-8,
    },
    {
      // Half-wave film (d = 150 nm = λ₀/(2n)) is absentee: R(λ₀) = bare = ((1 − 1.52)/2.52)² = 0.27040/6.3504 = 0.04257999496.
      source: MACLEOD,
      basis: "computed",
      inputs: { nCoat: 2, nSub: 1.52, designWl: 600, thickness: 150 },
      expect: { R0: 4.2579994960947345, bare: 4.2579994960947345, nearestAbsentee: 150 },
      tolerance: 1e-8,
    },
    {
      // Defaults: κ = 6 (−500e6)(200e-9)(1 − 0.22)/(72e9 · (1e-3)²) = −468/7.2e4 = −6.5e-3 1/m; sagitta over a = 12.5 mm:
      // κa²/2 = 5.078125e-7 m (the cap correction is 1.7e-9 relative); U = (500e6)² · 200e-9 · 0.75/150e9 = 0.25 J/m²;
      // t_c = 5 · 150e9/(0.75 · 2.5e17) = 4e-6 m.
      source: STONEY,
      basis: "computed",
      inputs: {},
      expect: { curvature: -6.5e-3, bow: 0.5078125, energy: 0.25, delaminationThickness: 4 },
      tolerance: 1e-8,
    },
  ],
});
