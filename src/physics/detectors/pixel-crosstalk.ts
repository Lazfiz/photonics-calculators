/**
 * Pixel crosstalk page summary: Seib charge-diffusion crosstalk of a silicon image sensor followed by a nearest-neighbour
 * kernel, and the MTF terms at one frequency. SI units (m, 1/m, cycles/m). The physics is in `sensor-mtf.ts` (Seib 1974;
 * Holst and Lomheim 2011) and `../materials/silicon-absorption.ts` (Green 2008); this module only combines it.
 */

import { siliconAbsorption } from "../materials/silicon-absorption";
import {
  columnShares,
  crosstalkKernelMtf,
  neighbourFraction,
  pixelApertureMtf,
  seibCollection,
  seibDiffusionFloor,
  seibDiffusionMtf,
} from "./sensor-mtf";

export interface CrosstalkGeometry {
  /** Pixel pitch p, m. */
  pitch: number;
  /** Depletion depth W, m. */
  depletion: number;
  /** Diffusion length L₀ in the field-free region, m. */
  diffusionLength: number;
  /** Kernel crosstalk X sent to both neighbours together. */
  kernel: number;
}

export interface CrosstalkAtWavelength {
  /** Absorption coefficient, 1/m. */
  alpha: number;
  /** Charge shares [C₀, C₁, C₂] of the lit column and its neighbours on one side after diffusion. */
  shares: [number, number, number];
  /** Fraction of the charge that diffusion sends to the two neighbouring columns, 2·C₁. */
  diffusionCrosstalk: number;
  /** Fraction in the two neighbours after diffusion and the kernel. */
  total: number;
}

/** Diffusion and total neighbour crosstalk at wavelength λ (m). */
export function crosstalkAtWavelength(wavelength: number, g: CrosstalkGeometry): CrosstalkAtWavelength {
  const alpha = siliconAbsorption(wavelength);
  const floor = seibDiffusionFloor(alpha, g.depletion, g.diffusionLength);
  const shares = columnShares((f) => seibDiffusionMtf(f, alpha, g.depletion, g.diffusionLength), g.pitch, floor);
  return { alpha, shares, diffusionCrosstalk: 2 * shares[1], total: neighbourFraction(shares, g.kernel) };
}

/** MTF terms at spatial frequency f (cycles/m) for absorption coefficient α (1/m). */
export function crosstalkMtfAt(f: number, alpha: number, g: CrosstalkGeometry): { pixel: number; seib: number; total: number } {
  const pixel = pixelApertureMtf(f, g.pitch);
  const seib = seibDiffusionMtf(f, alpha, g.depletion, g.diffusionLength);
  return { pixel, seib, total: pixel * seib * crosstalkKernelMtf(f, g.pitch, g.kernel) };
}

export interface PixelCrosstalkSummary extends CrosstalkAtWavelength {
  /** Nyquist frequency 1/(2p), cycles/m. */
  nyquist: number;
  /** Absorption depth 1/α, m. */
  absorptionDepth: number;
  /** Fraction of the light absorbed below the depletion layer, e^(−αW). */
  belowDepletion: number;
  /** Collected fraction of the absorbed charge at zero frequency. */
  collected: number;
  /** Fraction of the charge that lands beyond the first neighbours. */
  beyond: number;
  /** MTF terms at the Nyquist frequency. */
  atNyquist: { pixel: number; seib: number; total: number };
}

export function pixelCrosstalkSummary(g: CrosstalkGeometry & { wavelength: number }): PixelCrosstalkSummary {
  const here = crosstalkAtWavelength(g.wavelength, g);
  const nyquist = 1 / (2 * g.pitch);
  return {
    ...here,
    nyquist,
    absorptionDepth: 1 / here.alpha,
    belowDepletion: Math.exp(-here.alpha * g.depletion),
    collected: seibCollection(0, here.alpha, g.depletion, g.diffusionLength),
    beyond: 1 - here.shares[0] - 2 * here.shares[1],
    atNyquist: crosstalkMtfAt(nyquist, here.alpha, g),
  };
}
