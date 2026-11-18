import { SPECKLE_MIN_PHASE_RMS, SPECKLE_WIDE_ANGLE_RATIO, speckleSummary } from "../../physics/imaging/speckle-imaging";
import { defineSchema } from "../types";

const GOODMAN = "Goodman J. W. (2020). Speckle Phenomena in Optics: Theory and Applications, 2nd ed. SPIE Press " +
  "(objective speckle λz/D, first zero 1.22 λz/D, subjective speckle λ(1 + M)N, averaging of N patterns C/√N; contrast C = √(1 + 2r)/(1 + r) " +
  "of a constant phasor plus a random phasor sum of relative power r). " +
  "https://doi.org/10.1117/3.2548484";
const FUJII = "Fujii H., Asakura T. (1974). Effect of surface roughness on the statistical distribution of image speckle intensity. " +
  "Opt. Commun. 11, 35–38 (r as a function of the surface phase rms σ_φ = 4πσ_h/λ and the number of correlation cells N_c). " +
  "https://doi.org/10.1016/0030-4018(74)90327-7";

export default defineSchema({
  href: "/imaging/speckle-imaging",
  inputs: [
    { key: "wavelengthNm", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 532, min: 200, max: 20000 },
    { key: "beamDiameterMm", label: "Illuminated spot diameter D", unit: "mm", toSI: 1e-3, siUnit: "m", default: 5, min: 0.01, max: 1000 },
    { key: "propagationDistMm", label: "Observation distance z", unit: "mm", toSI: 1e-3, siUnit: "m", default: 200, min: 1, max: 1e6 },
    { key: "fNumber", label: "Imaging lens f-number N", unit: "", toSI: 1, siUnit: "", default: 8, min: 0.5, max: 64 },
    { key: "magnification", label: "Magnification M (image/object)", unit: "", toSI: 1, siUnit: "", default: 0.5, min: 0, max: 100 },
    { key: "surfaceRoughnessUm", label: "Surface roughness σ_h, rms", unit: "µm", toSI: 1e-6, siUnit: "m", default: 0.08, min: 0, max: 100 },
    { key: "correlationCells", label: "Surface correlation cells per resolution cell N_c", unit: "", toSI: 1, siUnit: "", default: 100, min: 1, max: 1e8 },
    { key: "numAverages", label: "Uncorrelated patterns averaged N", unit: "", toSI: 1, siUnit: "", default: 10, min: 1, max: 10000 },
  ],
  outputs: [
    { key: "objective", label: "Objective speckle λz/D", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "objectiveFirstZero", label: "Objective speckle, first zero 1.22λz/D", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "subjective", label: "Subjective speckle λ(1 + M)N", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "subjectiveFirstZero", label: "Subjective speckle, first zero", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "phaseRms", label: "Surface phase σ_φ = 4πσ_h/λ", unit: "rad", toSI: 1, siUnit: "rad" },
    { key: "contrast", label: "Contrast, one pattern", unit: "", toSI: 1, siUnit: "" },
    { key: "averagedContrast", label: "Contrast, N patterns averaged", unit: "", toSI: 1, siUnit: "" },
  ],
  compute(si) {
    const r = speckleSummary(
      si.wavelengthNm, si.beamDiameterMm, si.propagationDistMm, si.fNumber, si.magnification, si.surfaceRoughnessUm,
      si.correlationCells, si.numAverages,
    );
    const warnings: string[] = [];
    if (r.wideAngle) {
      warnings.push(`D/z = ${r.spotRatio.toFixed(2)} is above ${SPECKLE_WIDE_ANGLE_RATIO}: λz/D is a paraxial estimate and loses accuracy at this angle.`);
    }
    if (r.lowPhase) {
      warnings.push(`σ_φ is below ${SPECKLE_MIN_PHASE_RMS} rad: the diffuse part is not circular Gaussian yet, and the Rician form overestimates the contrast.`);
    }
    return {
      values: {
        objective: r.objective,
        objectiveFirstZero: r.objectiveFirstZero,
        subjective: r.subjective,
        subjectiveFirstZero: r.subjectiveFirstZero,
        phaseRms: r.phaseRms,
        contrast: r.contrast,
        averagedContrast: r.averagedContrast,
      },
      warnings,
    };
  },
  checks: [
    {
      // 532 nm, D = 5 mm, z = 200 mm: λz/D = 532e-9 · 0.2/5e-3 = 21.28 µm; first zero (j₁,₁/π = 3.8317059702075125/π = 1.2196698912665045) · 21.28 = 25.95457528615122 µm;
      // subjective, N = 8, M = 0.5: 532e-9 · 1.5 · 8 = 6.384 µm.
      source: GOODMAN,
      basis: "computed",
      inputs: { wavelengthNm: 532, beamDiameterMm: 5, propagationDistMm: 200, fNumber: 8, magnification: 0.5 },
      expect: { objective: 21.28, objectiveFirstZero: 25.95457528615122, subjective: 6.384 },
      tolerance: 1e-8,
    },
    {
      // σ_h = 80 nm at 532 nm: σ_φ = 4π · 80/532 = 1.8896797916329582 rad, e^(−σ_φ²) = 0.02813081413826879, N_c = 100: r = N_c e^(−σ_φ²)/(1 − e^(−σ_φ²)) = 2.894506230622584,
      // C = √(1 + 2r)/(1 + r) = 0.6690381762610538; averaged over N = 10: C/√10 = 0.21156844785901247.
      source: FUJII,
      basis: "computed",
      inputs: { wavelengthNm: 532, surfaceRoughnessUm: 0.08, correlationCells: 100, numAverages: 10 },
      expect: { phaseRms: 1.8896797916329582, contrast: 0.6690381762610538, averagedContrast: 0.21156844785901247 },
      tolerance: 1e-8,
    },
    {
      // 633 nm, σ_h = 60 nm, N_c = 100: σ_φ = 4π · 60/633 = 1.1911251767165092 rad, e^(−σ_φ²) = 0.24200928480274894, r = 31.92773736545983,
      // C = √(1 + 2r)/(1 + r) = 0.24457464521173797; N = 4 patterns: 0.12228732260586898.
      source: FUJII,
      basis: "computed",
      inputs: { wavelengthNm: 633, surfaceRoughnessUm: 0.06, correlationCells: 100, numAverages: 4 },
      expect: { contrast: 0.24457464521173797, averagedContrast: 0.12228732260586898 },
      tolerance: 1e-8,
    },
  ],
});
