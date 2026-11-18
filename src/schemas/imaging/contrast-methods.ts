import { BLACK_BACKGROUND, contrastMethodsSummary, type Ring } from "../../physics/imaging/contrast-methods";
import { defineSchema } from "../types";

const ZERNIKE = "Zernike F. (1942). Phase contrast, a new method for the microscopic observation of transparent objects. " +
  "Physica 9, 686–698 (direct and diffracted waves, quarter-wave phase ring). https://doi.org/10.1016/S0031-8914(42)80035-X";
const SALMON = "Salmon E. D., Tran P. (2007). High-resolution video-enhanced differential interference contrast light " +
  "microscopy. Methods Cell Biol. 81, 335–364 (DIC intensity sin² of bias plus specimen retardation). " +
  "https://doi.org/10.1016/S0091-679X(06)81016-2";

export default defineSchema({
  href: "/imaging/contrast-methods",
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 550, min: 300, max: 1100 },
    { key: "na", label: "Objective NA", unit: "", toSI: 1, siUnit: "", default: 1.4, min: 0.05, max: 1.5 },
    { key: "sampleThickness", label: "Object thickness t", unit: "µm", toSI: 1e-6, siUnit: "m", default: 5, min: 0, max: 50 },
    { key: "dnSample", label: "Index step Δn (object − medium)", unit: "", toSI: 1, siUnit: "", default: 0.005, min: -0.2, max: 0.2 },
    { key: "ringTransmission", label: "Ring transmission", unit: "%", toSI: 0.01, siUnit: "", default: 25, min: 1, max: 100 },
    { key: "shearNm", label: "DIC shear s", unit: "nm", toSI: 1e-9, siUnit: "m", default: 150, min: 0, max: 2000 },
    { key: "edgeNm", label: "DIC edge width w", unit: "nm", toSI: 1e-9, siUnit: "m", default: 500, min: 10, max: 10000 },
    { key: "biasWaves", label: "DIC bias retardation Γ", unit: "waves", toSI: 1, siUnit: "", default: 0.1, min: 0, max: 0.5 },
    { key: "strayPct", label: "DIC stray light I_c (% of parallel polarisers)", unit: "%", toSI: 0.01, siUnit: "", default: 0.1, min: 0, max: 10 },
  ],
  choices: [
    {
      key: "ring", label: "Phase ring",
      options: [
        { value: "positive", label: "Positive: direct light advanced λ/4 (denser objects dark)" },
        { value: "negative", label: "Negative: direct light retarded λ/4 (denser objects bright)" },
      ],
      default: "positive",
    },
  ],
  outputs: [
    { key: "opticalPathDifference", label: "Optical path difference Δn·t", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "phi", label: "Object phase φ", unit: "rad", toSI: 1, siUnit: "rad" },
    { key: "resolution", label: "Lateral resolution 0.61λ/NA", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "phaseContrast", label: "Phase contrast (I − I_bg)/I_bg", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "phaseContrastLinear", label: "Small-φ limit 2φ sin δ/a", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "shearPhase", label: "Phase difference across the shear Δφ", unit: "rad", toSI: 1, siUnit: "rad" },
    { key: "dicPlus", label: "DIC contrast, +Δφ edge", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "dicMinus", label: "DIC contrast, −Δφ edge", unit: "%", toSI: 0.01, siUnit: "" },
  ],
  compute({ wavelength, na, sampleThickness, dnSample, ring, ringTransmission, shearNm, edgeNm, biasWaves, strayPct }) {
    const r = contrastMethodsSummary({
      lambda: wavelength, na, thickness: sampleThickness, dn: dnSample, ring: ring as Ring, ringTransmission,
      shear: shearNm, edge: edgeNm, bias: biasWaves, stray: strayPct,
    });
    return {
      values: {
        opticalPathDifference: r.opticalPathDifference,
        phi: r.phi,
        resolution: r.resolution,
        phaseContrast: r.phaseContrast,
        phaseContrastLinear: r.phaseContrastLinear,
        shearPhase: r.shearPhase,
        dicPlus: r.dicPlus,
        dicMinus: r.dicMinus,
      },
      warnings: r.warnings,
      reasons: { dicPlus: BLACK_BACKGROUND, dicMinus: BLACK_BACKGROUND },
    };
  },
  checks: [
    {
      // λ = 600 nm, NA 1.4, t = 2 µm, Δn = 0.002, positive ring (δ = −π/2), ring 25 % (a = 0.5), s = 150 nm, w = 500 nm, Γ = 0.1 wave, I_c = 0.1 %.
      // OPD = 4 nm, φ = 2π·4/600 = 0.0418879 rad; U = a e^(iδ) + e^(iφ) − 1 = (cos φ − 1) + i(sin φ − 0.5),
      // C = (|U|² − a²)/a² = −0.1604853, small-φ limit 2φ sin δ/a = −0.1675516; Δφ = φ·150/500 = 0.0125664 rad;
      // I(x) = sin²((2π·0.1 + x)/2) + 0.001: C± = [I(±Δφ) − I(0)]/I(0) = +3.86045 % and −3.79425 %.
      source: ZERNIKE + "; " + SALMON,
      basis: "computed",
      inputs: { wavelength: 600, na: 1.4, sampleThickness: 2, dnSample: 0.002, ring: "positive", ringTransmission: 25, shearNm: 150, edgeNm: 500, biasWaves: 0.1, strayPct: 0.1 },
      expect: {
        opticalPathDifference: 4, phi: 0.04188790204786391, resolution: 261.42857142857144,
        phaseContrast: -16.048525570766536, phaseContrastLinear: -16.755160819145565,
        shearPhase: 0.012566370614359173, dicPlus: 3.8604484783211955, dicMinus: -3.794249301134311,
      },
      tolerance: 1e-8,
    },
    {
      // λ = 500 nm, NA 1.0, t = 4 µm, Δn = 0.001, negative ring (δ = +π/2), ring 50 % (a = 0.7071068), s = 100 nm, w = 400 nm, Γ = 0.25 wave, I_c = 0.5 %.
      // OPD = 4 nm, φ = 2π·4/500 = 0.0502655 rad; C = (|U|² − a²)/a² = +14.71646 %, small-φ limit 2φ/a = 14.21723 %;
      // Δφ = φ·100/400 = 0.0125664 rad; C± = [I(±Δφ) − I(0)]/I(0) with I(x) = sin²((π/2 + x)/2) + 0.005: ±1.24416 %.
      source: ZERNIKE + "; " + SALMON,
      basis: "computed",
      inputs: { wavelength: 500, na: 1, sampleThickness: 4, dnSample: 0.001, ring: "negative", ringTransmission: 50, shearNm: 100, edgeNm: 400, biasWaves: 0.25, strayPct: 0.5 },
      expect: {
        resolution: 305, phi: 0.05026548245743669, phaseContrast: 14.71645659799685, phaseContrastLinear: 14.21722540210677,
        shearPhase: 0.012566370614359173, dicPlus: 1.2441623646884082,
      },
      tolerance: 1e-8,
    },
  ],
});
