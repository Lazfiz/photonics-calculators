/**
 * Wavelength separation by two (HL)^N quarter-wave stacks: stack A reflects λ₁ and passes the longer λ₂,
 * stack B reflects λ₂; the combined coating is A on top of B. The zones separate if
 * λ₂/λ₁ ≥ (1 + Δg)/(1 − Δg) (`nonOverlappingRatio`).
 *
 * Model tier: Exact for the spectra (transfer matrix, lossless non-dispersive layers, normal incidence).
 *
 * References: H. A. Macleod, Thin-Film Optical Filters, 4th ed. (CRC Press, 2010), ch. 2 and ch. 6
 * (high-reflectance zone width).
 */
import { nonOverlappingRatio } from "./quarter-wave-stack";
import { quarterWaveLayers, stackResponse, type Layer } from "./transfer-matrix";

/** The layers of one (HL)^N stack, quarter waves at lambda0 (m), H first from the incident side. */
export function separationStackLayers(nH: number, nL: number, pairs: number, lambda0: number): Layer[] {
  const indices = Array.from({ length: pairs * 2 }, (_, j) => (j % 2 === 0 ? nH : nL));
  return quarterWaveLayers(indices, lambda0);
}

export interface SeparationSummary {
  /** Reflectance of stack A alone at λ₁. */
  RA1: number;
  /** Transmittance 1 − R of stack A alone at λ₂. */
  TA2: number;
  /** Smallest λ₂/λ₁ with separate stop bands. */
  minRatio: number;
  /** True if the requested ratio is below minRatio. */
  overlap: boolean;
  /** Layers of the combined coating. */
  layerCount: number;
}

/** Stack A's response at λ₁ and λ₂ (m), the separation limit and the layer count. */
export function wavelengthSeparationSummary(d: {
  nH: number;
  nL: number;
  nSub: number;
  nInc: number;
  pairs: number;
  lambda1: number;
  lambda2: number;
}): SeparationSummary {
  const { nH, nL, nSub, nInc, pairs, lambda1, lambda2 } = d;
  const stackA = { incident: nInc, layers: separationStackLayers(nH, nL, pairs, lambda1), substrate: { n: nSub } };
  const minRatio = nonOverlappingRatio(nH, nL);
  return {
    RA1: stackResponse(stackA, lambda1).R,
    TA2: 1 - stackResponse(stackA, lambda2).R,
    minRatio,
    overlap: Number.isFinite(minRatio) && lambda2 / lambda1 < minRatio,
    layerCount: pairs * 4,
  };
}
