import { slabPath } from "../../physics/spectroscopy/optical-path-length";
import { SLAB_GLASSES, slabIndices } from "../../physics/spectroscopy/slab-medium";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;

const SLAB = "Geometric ray through a plane-parallel slab entered from air: Snell's law n₀ sin θ = n sin θ_t, path L = N d/cos θ_t, " +
  "OPL = nL, phase delay OPL/c, group delay n_g L/c with n_g = n − λ dn/dλ (E. Hecht, Optics, 5th ed., Pearson 2017, " +
  "ch. 4 and 7; B. E. A. Saleh, M. C. Teich, Fundamentals of Photonics, 2nd ed., Wiley 2007, ch. 5).";
const MALITSON = "I. H. Malitson (1965). Interspecimen comparison of the refractive index of fused silica. J. Opt. Soc. Am. 55, 1205–1209, " +
  "doi:10.1364/JOSA.55.001205 (Sellmeier fit, 0.21–6.7 µm, 20 °C): n² − 1 = Σ Bᵢλ²/(λ² − Cᵢ²) with B = 0.6961663, 0.4079426, 0.8974794 " +
  "and C = 0.0684043, 0.1162414, 9.896161 µm.";

export default defineSchema({
  href: "/spectroscopy/optical-path-length",
  choices: [
    {
      key: "material", label: "Medium", default: "custom",
      options: [
        { value: "custom", label: "Custom n and n_g" },
        ...Object.entries(SLAB_GLASSES).map(([value, g]) => ({ value, label: g.name })),
      ],
    },
  ],
  inputs: [
    { key: "wavelength", label: "Vacuum wavelength λ", unit: "nm", toSI: 1e-9, siUnit: "m", default: 800, min: 100, max: 20000 },
    { key: "refractiveIndex", label: "Phase index n (custom medium only)", unit: "", toSI: 1, siUnit: "", default: 1.5, min: 1, max: 5 },
    { key: "groupIndex", label: "Group index n_g (custom medium only)", unit: "", toSI: 1, siUnit: "", default: 1.5, min: 1, max: 5 },
    { key: "physicalLength", label: "Slab thickness d", unit: "cm", toSI: 0.01, siUnit: "m", default: 1, min: 0, max: 1e5 },
    { key: "numPasses", label: "Number of passes N (rounded to an integer)", unit: "", toSI: 1, siUnit: "", default: 1, min: 1, max: 1000 },
    { key: "angleDeg", label: "Angle of incidence in air", unit: "°", toSI: DEG, siUnit: "rad", default: 0, min: 0, max: 89 },
  ],
  outputs: [
    { key: "opl", label: "Optical path length nL", unit: "cm", toSI: 0.01, siUnit: "m" },
    { key: "geometric", label: "Geometric path L", unit: "cm", toSI: 0.01, siUnit: "m" },
    { key: "waves", label: "OPL in waves at λ", unit: "", toSI: 1, siUnit: "" },
    { key: "phaseDelay", label: "Phase delay OPL/c", unit: "ns", toSI: 1e-9, siUnit: "s" },
    { key: "groupDelay", label: "Group delay n_g L/c", unit: "ns", toSI: 1e-9, siUnit: "s" },
    { key: "extraGroupDelay", label: "Extra delay vs vacuum (n_g − 1)L/c", unit: "ns", toSI: 1e-9, siUnit: "s" },
    { key: "opdVacuum", label: "OPD vs vacuum (n − 1)L", unit: "cm", toSI: 0.01, siUnit: "m" },
    { key: "thetaT", label: "Internal angle θ_t", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "n", label: "Phase index n used", unit: "", toSI: 1, siUnit: "" },
    { key: "ng", label: "Group index n_g used", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ material, wavelength, refractiveIndex, groupIndex, physicalLength, numPasses, angleDeg }) {
    const idx = slabIndices(material, wavelength, refractiveIndex, groupIndex);
    const p = slabPath(physicalLength, idx.n, idx.ng, Math.round(numPasses), angleDeg);
    const warnings: string[] = [];
    if (!idx.inRange) warnings.push("The wavelength is outside the glass's Sellmeier formula range: no index, so no result.");
    return {
      values: {
        opl: p.opl, geometric: p.geometric, waves: p.opl / wavelength, phaseDelay: p.phaseDelay, groupDelay: p.groupDelay,
        extraGroupDelay: p.extraGroupDelay, opdVacuum: p.opdVacuum, thetaT: p.thetaT, n: idx.n, ng: idx.ng,
      },
      warnings,
    };
  },
  checks: [
    {
      // n = 1.5, n_g = 1.6, d = 1 cm, N = 1, normal incidence: OPL = 1.5 cm; waves = 0.015/800e-9 = 18750;
      // τ_φ = 0.015/c = 0.0500346143 ns; τ_g = 0.016/c = 0.0533702552 ns; (n_g − 1)L/c = 0.006/c = 0.0200138457 ns; OPD = 0.5 cm.
      source: SLAB,
      basis: "computed",
      inputs: { material: "custom", refractiveIndex: 1.5, groupIndex: 1.6, physicalLength: 1, numPasses: 1, angleDeg: 0, wavelength: 800 },
      expect: { opl: 1.5, waves: 18750, phaseDelay: 0.05003461427972, groupDelay: 0.05337025523170, extraGroupDelay: 0.02001384571189, opdVacuum: 0.5 },
      tolerance: 1e-8,
    },
    {
      // n = 1.5 at 30°: sin θ_t = 0.5/1.5 = 1/3, cos θ_t = √8/3, θ_t = 19.4712206°, L = 3/√8 = 1.06066017 cm, OPL = 1.5 L = 1.59099026 cm,
      // τ_g = n_g L/c = 1.6 · 0.0106066017 m / c = 0.0566077041 ns.
      source: SLAB,
      basis: "computed",
      inputs: { material: "custom", refractiveIndex: 1.5, groupIndex: 1.6, physicalLength: 1, numPasses: 1, angleDeg: 30, wavelength: 800 },
      expect: { geometric: 1.0606601717798, opl: 1.5909902576697, thetaT: 19.47122063449, groupDelay: 0.05660770408 },
      tolerance: 1e-8,
    },
    {
      // Fused silica at 0.8 µm: n² − 1 = Σ Bᵢ λ²/(λ² − Cᵢ²) gives n = 1.45331725486; d = 1 cm, N = 1, normal incidence:
      // OPL = 1.45331725486 cm, τ_φ = 0.0145331725/c = 0.0484774455 ns, waves = OPL/800 nm = 18166.4657.
      source: MALITSON,
      basis: "computed",
      inputs: { material: "fusedSilica", wavelength: 800, physicalLength: 1, numPasses: 1, angleDeg: 0 },
      expect: { n: 1.4533172548587, opl: 1.4533172548587, phaseDelay: 0.04847744551528, waves: 18166.46568573 },
      tolerance: 1e-8,
    },
  ],
});
