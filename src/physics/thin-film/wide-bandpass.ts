/**
 * Wide band-pass filter on a thick substrate: a long-pass edge stack (H/2 L H/2)^N on the front face sets
 * the cut-on, a short-pass stack (L/2 H L/2)^N on the back face the cut-off. Both faces are lossless and
 * their multiple reflections add in intensity, T = T₁T₂/(1 − R₁R₂).
 *
 * Model tier: Exact for the spectrum of the lossless, non-dispersive design (transfer matrix); the
 * design wavelengths put the infinite stacks' zone edges at the requested edges, so the finite filter's 50 %
 * points lie a little toward the pass band. Textbook design: no blocking stacks outside the two zones.
 *
 * References: H. A. Macleod, Thin-Film Optical Filters, 4th ed. (CRC Press, 2010), ch. 7 (edge filters)
 * and ch. 2 (incoherent reflection at two surfaces).
 */
import { firstCrossing, intervalStats } from "../math";
import { edgeDesignWavelength, edgeFilterLayers, incoherentLosslessFaces } from "./edge-filter";
import { stackResponse, type Stack } from "./transfer-matrix";

export interface WideBandpassInput {
  nH: number;
  nL: number;
  nSub: number;
  /** Cut-on edge (m), front face long-pass. */
  cutOn: number;
  /** Cut-off edge (m), back face short-pass. */
  cutOff: number;
  /** Periods per stack, an integer ≥ 1. */
  periods: number;
}

export interface WideBandpassDesign {
  valid: boolean;
  /** Design wavelengths (m) of the long-pass and short-pass stacks; NaN if not valid. */
  lpLambda0: number;
  spLambda0: number;
  front: Stack;
  back: Stack;
}

/** The two faces, in air on a substrate of index nSub. */
export function wideBandpassDesign(d: WideBandpassInput): WideBandpassDesign {
  const { nH, nL, nSub, cutOn, cutOff, periods } = d;
  const valid = nH > nL && nL > 0 && nSub > 0 && cutOn > 0 && cutOff > cutOn;
  const lpLambda0 = valid ? edgeDesignWavelength("long-pass", cutOn, nH, nL) : NaN;
  const spLambda0 = valid ? edgeDesignWavelength("short-pass", cutOff, nH, nL) : NaN;
  const face = (layers: Stack["layers"]): Stack => ({ incident: 1, layers, substrate: { n: nSub } });
  return {
    valid,
    lpLambda0,
    spLambda0,
    front: face(edgeFilterLayers("long-pass", lpLambda0, nH, nL, periods)),
    back: face(edgeFilterLayers("short-pass", spLambda0, nH, nL, periods)),
  };
}

/** T of the filter at a vacuum wavelength (m). */
export function wideBandpassTransmittance(design: WideBandpassDesign, wavelength: number): number {
  return incoherentLosslessFaces(
    stackResponse(design.front, wavelength).R,
    stackResponse(design.back, wavelength).R,
  ).T;
}

/**
 * The 50 % points (m) between the two reflection zones, found by scanning from inside each zone (λ₀ of
 * each stack) toward the pass band (800 steps, then bisection), and T statistics between them (1000
 * intervals). NaN everywhere if the design isn't valid or either zone centre transmits ≥ 50 %.
 */
export function wideBandpassPassBand(design: WideBandpassDesign): {
  on: number;
  off: number;
  pass: { mean: number; min: number; max: number };
} {
  const nan = { on: NaN, off: NaN, pass: { mean: NaN, min: NaN, max: NaN } };
  if (!design.valid) return nan;
  const Tc = (wl: number) => wideBandpassTransmittance(design, wl);
  const lo = design.lpLambda0;
  const hi = design.spLambda0;
  const zonesBlock = Tc(lo) < 0.5 && Tc(hi) < 0.5;
  const on = zonesBlock ? firstCrossing(Tc, lo, hi, 0.5, 800) : NaN;
  const off = zonesBlock ? firstCrossing(Tc, hi, lo, 0.5, 800) : NaN;
  return { on, off, pass: intervalStats(Tc, on, off, 1000) };
}
