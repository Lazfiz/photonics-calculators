import { gradedStack, gradedSublayersResolved, type GradedProfile } from "../../physics/thin-film/graded-index";
import { stackResponse } from "../../physics/thin-film/transfer-matrix";
import { defineSchema } from "../types";

const NM = 1e-9;

export default defineSchema({
  href: "/thin-film/gradient-index",
  inputs: [
    { key: "nSub", label: "Substrate index", unit: "", toSI: 1, siUnit: "", default: 1.52, min: 0.1, max: 10 },
    { key: "nInc", label: "Incident medium index", unit: "", toSI: 1, siUnit: "", default: 1.0, min: 0.1, max: 10 },
    { key: "nSurface", label: "Surface index of the graded layer", unit: "", toSI: 1, siUnit: "", default: 1.1, min: 0.1, max: 10 },
    { key: "thickness", label: "Graded layer thickness", unit: "nm", toSI: NM, siUnit: "m", default: 500, min: 1, max: 1e6 },
    { key: "designWl", label: "Design wavelength", unit: "nm", toSI: NM, siUnit: "m", default: 550, min: 1, max: 20000 },
  ],
  choices: [
    {
      key: "profile",
      label: "Index profile",
      options: [
        { value: "linear", label: "Linear" },
        { value: "cosine", label: "Cosine" },
        { value: "exponential", label: "Exponential" },
      ],
      default: "cosine",
    },
  ],
  outputs: [
    { key: "reflectance", label: "Reflectance at the design wavelength", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "transmittance", label: "Transmittance at the design wavelength", unit: "%", toSI: 0.01, siUnit: "" },
  ],
  compute({ nSub, nInc, nSurface, thickness, designWl, profile }) {
    const stack = gradedStack(profile as GradedProfile, nInc, nSub, nSurface, thickness, designWl);
    const response = stack.layers.length > 0 ? stackResponse(stack, designWl) : { R: NaN, T: NaN };
    const resolved = gradedSublayersResolved(thickness, 0.5 * designWl, Math.max(nSub, nSurface));
    return {
      values: { reflectance: response.R, transmittance: response.T },
      warnings: resolved
        ? []
        : ["The layer is too thick for 4000 sublayers: the equal staircase steps act as a grating and add a false Bragg reflection at short wavelengths."],
    };
  },
  checks: [
    {
      // A profile from n_s to n_t = n_s is a homogeneous half-space: R = ((1 − 1.52)/(1 + 1.52))² = (0.52/2.52)².
      source: "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., ch. 2 (normal-incidence Fresnel reflectance). CRC Press.",
      basis: "computed",
      inputs: { nSub: 1.52, nInc: 1, nSurface: 1.52, thickness: 500, designWl: 550, profile: "cosine" },
      expect: { reflectance: 4.257999496, transmittance: 95.742000504 },
      tolerance: 1e-8,
    },
    {
      // Uniform 2.0 layer on 2.0 substrate from air: R = (1/3)² = 0.1111111, T = 8/9.
      source: "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., ch. 2. CRC Press.",
      basis: "computed",
      inputs: { nSub: 2, nInc: 1, nSurface: 2, thickness: 300, profile: "linear" },
      expect: { reflectance: 11.11111111, transmittance: 88.88888889 },
      tolerance: 1e-8,
    },
  ],
});
