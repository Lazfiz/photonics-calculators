import { absorptionCoefficient, absorptionDepth } from "../spectroscopy/depth";
import { stackResponse, type Stack } from "./transfer-matrix";

/** Air | dielectric overcoat | metal (n + ik) | substrate, thicknesses in m. */
export function metalDielectricStack(
  nMetal: number,
  kMetal: number,
  nDielectric: number,
  dDielectric: number,
  dMetal: number,
  nSub: number,
): Stack {
  return {
    incident: 1,
    layers: [
      { n: nDielectric, thickness: dDielectric },
      { n: nMetal, k: kMetal, thickness: dMetal },
    ],
    substrate: { n: nSub },
  };
}

export interface MetalDielectricSummary {
  /** Absorptance A = 1 − R − T of the stack at `wavelength`. */
  absorptance: number;
  /** n² − k² (the real part of the permittivity). */
  epsilonReal: number;
  /** Depth 1/α = λ/(4πk) (m) at which the intensity falls to 1/e. */
  intensityDepth: number;
  /** Depth λ/(2πk) (m) at which the field amplitude falls to 1/e: twice the intensity depth. */
  fieldDepth: number;
}

/** Single-wavelength summary of the metal-dielectric page (SI in, SI out). */
export function metalDielectricSummary(stack: Stack, nMetal: number, kMetal: number, wavelength: number): MetalDielectricSummary {
  const intensityDepth = absorptionDepth(absorptionCoefficient(kMetal, wavelength));
  return {
    absorptance: stackResponse(stack, wavelength).A,
    epsilonReal: nMetal * nMetal - kMetal * kMetal,
    intensityDepth,
    fieldDepth: 2 * intensityDepth,
  };
}
