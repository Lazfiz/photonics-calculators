import {
  type CompensatorKind, chainTransmissionSlope, compensatorPlate, retarderChainTransmission, sampleChain, senarmontReading,
} from "../../physics/polarization/interference-colours";
import { C_NBK7_TPA, kirschMaxRetardance } from "../../physics/polarization/photoelasticity";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;

const COLLETT = "Collett E. (2005). Field Guide to Polarization, SPIE Press, FG05 (Jones and Mueller matrices of a retarder " +
  "between polarizers; same convention as Goldstein D. H. (2011), Polarized Light, 3rd ed., CRC Press, https://doi.org/10.1201/b10436). " +
  "Single plate: T = cos²(A − P) − sin 2(φ − P) sin 2(φ − A) sin²(Γ/2), Γ = 2πR/λ. https://doi.org/10.1117/3.626141";
const DALLY = "Dally J. W., Riley W. F. (2005). Experimental Stress Analysis, 4th ed., ch. Theory of photoelasticity: " +
  "R = C d (σ₁ − σ₂); Kirsch (1898) infinite plate with a hole under tension S, σ₁ − σ₂ = 3S on the hole edge " +
  "(Timoshenko S., Goodier J. N., Theory of Elasticity, 3rd ed., art. 35).";

export default defineSchema({
  href: "/polarization/birefringence-imaging",
  choices: [
    {
      key: "compensator",
      label: "Compensator",
      options: [
        { value: "none", label: "None" },
        { value: "qwp", label: "λ/4 at λ, axis ∥ polarizer (Sénarmont)" },
        { value: "full", label: "Full wave 550 nm, axis P + 45°" },
        { value: "custom", label: "Custom" },
      ],
      default: "none",
    },
    {
      key: "light",
      label: "Light of the image (only the image uses it)",
      options: [{ value: "mono", label: "Monochromatic" }, { value: "white", label: "White (D65)" }],
      default: "mono",
    },
  ],
  inputs: [
    { key: "polarizer", label: "Polarizer angle P", unit: "°", toSI: DEG, siUnit: "rad", default: 0, min: 0, max: 180 },
    { key: "analyzer", label: "Analyzer angle A", unit: "°", toSI: DEG, siUnit: "rad", default: 90, min: 0, max: 180 },
    { key: "axis", label: "Sample slow axis φ", unit: "°", toSI: DEG, siUnit: "rad", default: 45, min: 0, max: 180 },
    { key: "retardance", label: "Sample retardance R_s", unit: "nm", toSI: 1e-9, siUnit: "m", default: 100, min: 0, max: 2000 },
    { key: "wavelength", label: "Wavelength λ", unit: "nm", toSI: 1e-9, siUnit: "m", default: 546, min: 200, max: 2000 },
    { key: "compRetardance", label: "Custom compensator retardance", unit: "nm", toSI: 1e-9, siUnit: "m", default: 137.5, min: 0, max: 2000 },
    { key: "compAxis", label: "Custom compensator slow axis", unit: "°", toSI: DEG, siUnit: "rad", default: 0, min: 0, max: 180 },
    { key: "hole", label: "Hole radius a (Kirsch example; only the image uses it)", unit: "mm", toSI: 1e-3, siUnit: "m", default: 1, min: 0.1, max: 100 },
    { key: "stress", label: "Remote stress S (Kirsch example)", unit: "MPa", toSI: 1e6, siUnit: "Pa", default: 10, min: 0.1, max: 1000 },
    { key: "thickness", label: "Plate thickness d (Kirsch example)", unit: "mm", toSI: 1e-3, siUnit: "m", default: 10, min: 0.1, max: 100 },
    { key: "stressOptic", label: "Stress-optic coefficient C", unit: "TPa⁻¹", toSI: 1e-12, siUnit: "Pa⁻¹", default: C_NBK7_TPA, min: 0.01, max: 100 },
  ],
  outputs: [
    { key: "transmission", label: "Transmitted intensity (fraction behind the polarizer)", unit: "", toSI: 1, siUnit: "" },
    { key: "slope", label: "Sensitivity dI/dΓ", unit: "/rad", toSI: 1, siUnit: "/rad" },
    { key: "slopePerNm", label: "Sensitivity per nm of sample retardance", unit: "/nm", toSI: 1e9, siUnit: "/m" },
    { key: "senarmontAngle", label: "Sénarmont: analyzer angle of minimum", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "senarmontRetardance", label: "Sénarmont: retardance read (mod λ)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "kirschMaxRetardance", label: "Largest retardance on the hole edge 3SCd", unit: "nm", toSI: 1e-9, siUnit: "m" },
  ],
  compute({ polarizer, analyzer, axis, retardance, wavelength, compRetardance, compAxis, stress, thickness, stressOptic, compensator }) {
    const comp = compensatorPlate(compensator as CompensatorKind, polarizer, wavelength, compRetardance, compAxis);
    const chain = sampleChain(wavelength, retardance, axis, comp);
    const slope = chainTransmissionSlope(polarizer, analyzer, chain, 0);
    const warnings: string[] = [];
    let senA = NaN, senR = NaN;
    if (compensator === "qwp") {
      const r = senarmontReading(polarizer, axis, retardance, wavelength);
      senA = r.A;
      senR = r.R;
      if (!Number.isFinite(senA)) warnings.push("No Sénarmont minimum: the light behind the λ/4 plate is circular.");
      else if (!Number.isFinite(senR)) warnings.push("Not a Sénarmont setting: it needs the sample axis φ = P ± 45°.");
    } else warnings.push("The Sénarmont outputs need the λ/4 compensator.");
    return {
      values: {
        transmission: retarderChainTransmission(polarizer, analyzer, chain),
        slope,
        slopePerNm: (slope * 2 * Math.PI) / wavelength,
        senarmontAngle: senA,
        senarmontRetardance: senR,
        kirschMaxRetardance: kirschMaxRetardance(stress, stressOptic, thickness),
      },
      warnings,
    };
  },
  checks: [
    {
      // P = 0, A = 90°, φ = 45°, no compensator: T = sin²(Γ/2) = sin²(π · 100/546) = sin²(0.575398) = 0.2961062.
      source: COLLETT,
      basis: "computed",
      inputs: { polarizer: 0, analyzer: 90, axis: 45, retardance: 100, wavelength: 546, compensator: "none" },
      expect: { transmission: 0.2961061745 },
      tolerance: 1e-8,
    },
    {
      // Sénarmont: the analyzer turned by Δθ = Γ/2 reads R = λΔθ/180° = 100 nm for the sample's 100 nm.
      source: COLLETT,
      basis: "computed",
      inputs: { polarizer: 0, axis: 45, retardance: 100, wavelength: 546, compensator: "qwp" },
      expect: { senarmontRetardance: 100 },
      tolerance: 1e-8,
    },
    {
      // Kirsch hole edge: R = C d (σ₁ − σ₂) = 2.77e-12 Pa⁻¹ × 0.01 m × 3 × 10e6 Pa = 8.31e-7 m = 831 nm.
      source: DALLY,
      basis: "computed",
      inputs: { stress: 10, thickness: 10, stressOptic: 2.77 },
      expect: { kirschMaxRetardance: 831 },
      tolerance: 1e-8,
    },
  ],
});
