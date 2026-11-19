import { clearedTissueSummary } from "../../physics/imaging/cleared-tissue";
import { defineSchema } from "../types";

const JACQUES = "Jacques S. L. (2013). Optical properties of biological tissues: a review. Phys. Med. Biol. 58, R37–R61. " +
  "https://doi.org/10.1088/0031-9155/58/11/R37 (Beer–Lambert attenuation with µ_t = µ_a + µ_s).";
const HELL = "Hell S., Reiner G., Cremer C., Stelzer E. H. K. (1993). Aberrations in confocal fluorescence microscopy induced by " +
  "mismatches in refractive index. J. Microsc. 169, 391–405. https://doi.org/10.1111/j.1365-2818.1993.tb03315.x " +
  "(paraxial focal shift n_s/n_imm; marginal-ray tan α_imm/tan α_s).";
const BORN_WOLF = "Born M., Wolf E. (2019). Principles of Optics, 7th ed., Cambridge University Press, https://doi.org/10.1017/9781108769914, " +
  "§8.8 (axial PSF); axial FWHM 0.886 λ/(n − √(n² − NA²)), where 0.886 = 2·1.39156/π from the sinc² half maximum (Born & Wolf §8.8; Wilhelm et al. print 0.88). " +
  "Lateral resolution limit λ/(2NA): Abbe E. (1873), Beiträge zur Theorie des Mikroskops und der mikroskopischen Wahrnehmung, " +
  "Arch. mikrosk. Anat. 9, 413–468, https://doi.org/10.1007/BF02956173 (a resolution limit, not a FWHM).";
const NO_SCATTERING = "The scattering coefficient is zero: the scattering length is infinite.";
const NO_ATTENUATION = "The attenuation µ_a + µ_s is zero: the ballistic fraction never falls, so there is no depth to report.";

export default defineSchema({
  href: "/imaging/cleared-tissue",
  inputs: [
    { key: "na", label: "Objective NA", unit: "", toSI: 1, siUnit: "", default: 1.2, min: 0.05, max: 1.7 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 680, min: 300, max: 2000 },
    { key: "nMedium", label: "Sample (clearing medium) index n_s", unit: "", toSI: 1, siUnit: "", default: 1.52, min: 1, max: 1.8 },
    { key: "nImm", label: "Objective immersion index n_imm", unit: "", toSI: 1, siUnit: "", default: 1.52, min: 1, max: 1.8 },
    { key: "tissueThickness", label: "Depth in the tissue", unit: "µm", toSI: 1e-6, siUnit: "m", default: 1000, min: 0, max: 20000 },
    { key: "muA", label: "Absorption µ_a", unit: "mm⁻¹", toSI: 1e3, siUnit: "m⁻¹", default: 0.01, min: 0, max: 100 },
    { key: "muS", label: "Scattering µ_s", unit: "mm⁻¹", toSI: 1e3, siUnit: "m⁻¹", default: 0.5, min: 0, max: 100 },
  ],
  outputs: [
    { key: "lateral", label: "Lateral resolution λ/(2NA)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "axial", label: "Axial FWHM, widefield PSF (index-matched)", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "ballistic", label: "Ballistic fraction at depth", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "lossDb", label: "Ballistic loss", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "scatteringLength", label: "Scattering length 1/µ_s", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "depth1e", label: "Depth to 1/e (1/µ_t)", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "depth1pc", label: "Depth to 1 %", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "paraxialShift", label: "Focal shift factor, paraxial n_s/n_imm", unit: "×", toSI: 1, siUnit: "" },
    { key: "marginalShift", label: "Focal shift factor, marginal ray", unit: "×", toSI: 1, siUnit: "" },
  ],
  compute({ na, wavelength, nMedium, nImm, tissueThickness, muA, muS }) {
    const s = clearedTissueSummary(na, wavelength, nMedium, nImm, tissueThickness, muA, muS);
    return {
      values: {
        lateral: s.lateral,
        axial: s.axial,
        ballistic: s.ballistic,
        lossDb: s.lossDb,
        scatteringLength: s.scatteringLength,
        depth1e: s.depth1e,
        depth1pc: s.depth1pc,
        paraxialShift: s.paraxialShift,
        marginalShift: s.marginalShift,
      },
      reasons: {
        scatteringLength: NO_SCATTERING, depth1e: NO_ATTENUATION, depth1pc: NO_ATTENUATION,
        ...(s.problem ? { lateral: s.problem, axial: s.problem, paraxialShift: s.problem, marginalShift: s.problem } : {}),
      },
    };
  },
  checks: [
    {
      // µ_a 0.02 mm⁻¹, µ_s 1.0 mm⁻¹, z 500 µm: µ_t = 1020 m⁻¹ · 5e-4 m = 0.51; exp(−0.51) = 60.0495579 %; loss 10 log₁₀(e) · 0.51 = 2.2149019 dB;
      // depth to 1/e = 1/µ_t = 0.98039216 mm; to 1 % = ln(100)/µ_t = 4.51487273 mm; scattering length 1/µ_s = 1 mm.
      source: JACQUES,
      basis: "computed",
      inputs: { tissueThickness: 500, muA: 0.02, muS: 1 },
      expect: { ballistic: 60.04955788122659, lossDb: 2.2149018577065847, depth1e: 0.9803921568627451, depth1pc: 4.514872731360874, scatteringLength: 1 },
      tolerance: 1e-8,
    },
    {
      // n_s 1.45, n_imm 1.33, NA 0.8: n_s/n_imm = 1.0902255639; tan α_imm/tan α_s = √(n_s² − NA²)/√(n_imm² − NA²) = 1.1382042446.
      source: HELL,
      basis: "computed",
      inputs: { na: 0.8, nMedium: 1.45, nImm: 1.33 },
      expect: { paraxialShift: 1.0902255639097744, marginalShift: 1.1382042446201965 },
      tolerance: 1e-8,
    },
    {
      // 700 nm, NA 0.8, n_s 1.45: lateral λ/(2NA) = 437.5 nm; axial (2·1.391557/π = 0.88589) λ/(n_s − √(n_s² − NA²)) = 2.5767539761 µm.
      source: BORN_WOLF,
      basis: "computed",
      inputs: { na: 0.8, wavelength: 700, nMedium: 1.45, nImm: 1.33 },
      expect: { lateral: 437.5, axial: 2.5767539761454223 },
      tolerance: 1e-8,
    },
  ],
});
