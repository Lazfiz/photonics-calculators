/**
 * Photodiode speed at 1 mm²: depletion width, transit and RC limits, their combination and the diffusion tail. SI units
 * (F/m², m, m/s, Ω, m²/s, Hz). C_j = C''·A, W = ε₀ε_r/C'', f_RC = 1/(2πRC), f_tr = 0.443·v/W, 1/f² = 1/f_RC² + 1/f_tr²
 * (J. E. Bowers, C. A. Burrus, J. Lightwave Technol. 5, 1339 (1987), doi:10.1109/JLT.1987.1075419); drift share and
 * diffusion response after W. W. Gärtner, Phys. Rev. 116, 84 (1959). Composition of `photodiode-rc.ts`, `noise.ts` and
 * the silicon absorption table; kept apart so the pages that import those modules do not ship it.
 */

import { siliconAbsorption } from "../materials/silicon-absorption";
import { responsivity as responsivityOf } from "./responsivity";
import {
  combinedBandwidth, depletionWidth, diffusionBandwidth, driftFraction, photodiodeBandwidth, rcBandwidth, transitBandwidth,
  type PhotodiodeResponseInputs,
} from "./photodiode-rc";

/** The reference area of the summary, m² (1 mm²). */
export const REFERENCE_AREA = 1 * 1e-6;

export interface PhotodiodeSpeedParams {
  wavelength_nm: number;
  qe: number;
  /** C'', F/m². */
  capacitanceDensity: number;
  epsR: number;
  /** Slower-carrier velocity, m/s. */
  velocity: number;
  loadResistance: number;
  /** 1/α in µm; 0 takes silicon at λ. */
  absorptionDepth_um: number;
  /** m. */
  diffusionLength: number;
  /** m²/s. */
  diffusivity: number;
}

export interface PhotodiodeSpeedSummary {
  /** A/W. */
  responsivity: number;
  /** α, 1/m (NaN for silicon outside its table). */
  alpha: number;
  /** m. */
  W: number;
  fTransit: number;
  /** C at the reference area, F. */
  capacitance1: number;
  fRC1: number;
  /** Combined RC and transit −3 dB at 1 mm², Hz. */
  f1: number;
  driftShare: number;
  /** Intrinsic diffusion −3 dB, Hz; Infinity when the drift share is ≥ 1/√2. */
  fDiffusion: number;
  /** Drift share below 1/√2. */
  diffusionLimited: boolean;
  /** Inputs of the full response model at 1 mm². */
  response1: PhotodiodeResponseInputs;
  /** Total −3 dB at 1 mm² (drift + diffusion × transit × RC), Hz. */
  fTotal: number;
}

export function photodiodeSpeedSummary(p: PhotodiodeSpeedParams): PhotodiodeSpeedSummary {
  const responsivity = responsivityOf(p.qe, p.wavelength_nm * 1e-9);
  const W = depletionWidth(p.capacitanceDensity, p.epsR);
  const fTransit = transitBandwidth(p.velocity, W);
  const capacitance1 = p.capacitanceDensity * REFERENCE_AREA;
  const fRC1 = rcBandwidth(p.loadResistance, capacitance1);
  const f1 = combinedBandwidth(fRC1, fTransit);
  const alpha = p.absorptionDepth_um > 0 ? 1e6 / p.absorptionDepth_um : siliconAbsorption(p.wavelength_nm * 1e-9);
  const driftShare = driftFraction(alpha, W, p.diffusionLength);
  const fDiffusion = diffusionBandwidth(alpha, W, p.diffusionLength, p.diffusivity);
  const response1: PhotodiodeResponseInputs = {
    alpha, width: W, diffusionLength: p.diffusionLength, diffusivity: p.diffusivity, fTransit, fRC: fRC1,
  };
  return {
    responsivity, alpha, W, fTransit, capacitance1, fRC1, f1, driftShare, fDiffusion,
    diffusionLimited: driftShare < Math.SQRT1_2,
    response1,
    fTotal: photodiodeBandwidth(response1),
  };
}
