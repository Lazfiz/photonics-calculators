import { metalDielectricStack, metalDielectricSummary } from "../../physics/thin-film/metal-dielectric";
import { defineSchema } from "../types";

const NM = 1e-9;

/** Air | dielectric overcoat | metal (constant n + ik) | substrate, transfer-matrix absorptance and penetration depths at 550 nm. */
export default defineSchema({
  href: "/thin-film/metal-dielectric",
  inputs: [
    { key: "nMetal", label: "n (metal, real part)", unit: "", toSI: 1, siUnit: "", default: 0.5, min: 0, max: 100 },
    { key: "kMetal", label: "k (metal, extinction coefficient)", unit: "", toSI: 1, siUnit: "", default: 3, min: 0.001, max: 100 },
    { key: "nDielectric", label: "n (dielectric)", unit: "", toSI: 1, siUnit: "", default: 2.1, min: 0.1, max: 10 },
    { key: "dDielectric", label: "Dielectric thickness", unit: "nm", toSI: NM, siUnit: "m", default: 50, min: 0, max: 100000 },
    { key: "dMetal", label: "Metal thickness", unit: "nm", toSI: NM, siUnit: "m", default: 10, min: 1, max: 100000 },
    { key: "nSub", label: "n (substrate)", unit: "", toSI: 1, siUnit: "", default: 1.52, min: 0.1, max: 10 },
  ],
  outputs: [
    { key: "absorptance", label: "Absorptance at 550 nm", unit: "", toSI: 1, siUnit: "" },
    { key: "epsilonReal", label: "n² − k²", unit: "", toSI: 1, siUnit: "" },
    { key: "intensityDepth", label: "Intensity penetration depth 1/α = λ/(4πk) at 550 nm", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "fieldDepth", label: "Field (amplitude) penetration depth λ/(2πk) at 550 nm", unit: "nm", toSI: NM, siUnit: "m" },
  ],
  compute({ nMetal, kMetal, nDielectric, dDielectric, dMetal, nSub }) {
    const stack = metalDielectricStack(nMetal, kMetal, nDielectric, dDielectric, dMetal, nSub);
    const s = metalDielectricSummary(stack, nMetal, kMetal, 550 * NM);
    return {
      values: { absorptance: s.absorptance, epsilonReal: s.epsilonReal, intensityDepth: s.intensityDepth, fieldDepth: s.fieldDepth },
      warnings: ["n and k are held constant: real metals are dispersive, so use the n, k measured at the wavelength of interest."],
    };
  },
  checks: [
    {
      // No overcoat and an opaque 1000 nm metal (n = 0.5, k = 3): exp(−4πkd/λ) = exp(−68.5) so T = 0 and the
      // stack is the air/metal interface. R = ((n − 1)² + k²)/((n + 1)² + k²) = 9.25/11.25 = 0.8222222, A = 1 − R = 0.1777778.
      // Depths at 550 nm: 1/α = λ/(4πk) = 550/(12π) = 14.589203 nm (intensity); the field depth is twice that, 29.178406 nm.
      source: "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., CRC Press, ch. 2 (absorbing media: Fresnel reflectance of an n + ik interface, intensity attenuation exp(−4πkd/λ)).",
      basis: "computed",
      inputs: { nMetal: 0.5, kMetal: 3, dDielectric: 0, dMetal: 1000 },
      expect: { absorptance: 0.17777778, epsilonReal: -8.75, intensityDepth: 14.589203, fieldDepth: 29.178406 },
      tolerance: 1e-7,
    },
  ],
});
