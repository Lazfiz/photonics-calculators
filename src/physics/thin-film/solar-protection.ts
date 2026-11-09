/**
 * Solar-protection pane: UV-reflecting long-pass stacks on the outer face, near-IR-reflecting short-pass stacks
 * on the inner face (edge filters in series, `staggeredDesignWavelengths`), the faces added in intensity,
 * T = T₁T₂/(1 − R₁R₂). The solar-weighted means come from the caller (`mean`), so this module does not
 * import the ASTM G173 table and a page can load that table after hydration.
 *
 * Model tier: Exact for T(λ) of the lossless, non-dispersive design; Textbook for the solar weighting (the
 * ASTM G173 global-tilt spectrum, trapezoidal rule on its grid).
 *
 * References: H. A. Macleod, Thin-Film Optical Filters, 4th ed. (CRC Press, 2010), ch. 2 (incoherent
 * reflection) and ch. 7 (edge filters); ASTM G173-03, Standard Tables for Reference Solar Spectral
 * Irradiances.
 */
import {
  edgeFilterLayers,
  incoherentLosslessFaces,
  MAX_TOTAL_PERIODS,
  staggeredDesignWavelengths,
} from "./edge-filter";
import { stopBandHalfWidth } from "./quarter-wave-stack";
import { stackResponse, type Stack } from "./transfer-matrix";

export interface SolarProtectionInput {
  nH: number;
  nL: number;
  nSub: number;
  /** UV reflector band (m). */
  uvFrom: number;
  uvTo: number;
  /** Near-IR reflector band (m). */
  irFrom: number;
  irTo: number;
  /** Periods per stack, integers ≥ 1. */
  uvPairs: number;
  irPairs: number;
}

export interface SolarProtectionDesign {
  valid: boolean;
  /** Design wavelengths (m) of the stacks on the outer (long-pass) and inner (short-pass) faces. */
  uvCentres: number[];
  irCentres: number[];
  tooBig: boolean;
  /** valid, both faces have stacks and the layer count is computable. */
  ready: boolean;
  /** T(λ) of the pane, λ in m; each wavelength is computed once. */
  transmittance: (wavelength: number) => number;
}

export function solarProtectionDesign(d: SolarProtectionInput): SolarProtectionDesign {
  const { nH, nL, nSub, uvFrom, uvTo, irFrom, irTo, uvPairs, irPairs } = d;
  const valid = nH > nL && nL > 0 && nSub > 0 && uvFrom > 0 && uvTo > uvFrom && irFrom > 0 && irTo > irFrom;
  const uvCentres = valid ? staggeredDesignWavelengths("long-pass", uvFrom, uvTo, nH, nL) : [];
  const irCentres = valid ? staggeredDesignWavelengths("short-pass", irFrom, irTo, nH, nL) : [];
  const tooBig = uvCentres.length * uvPairs + irCentres.length * irPairs > MAX_TOTAL_PERIODS;
  const ready = valid && uvCentres.length > 0 && irCentres.length > 0 && !tooBig;
  const face = (layers: Stack["layers"]): Stack => ({ incident: 1, layers, substrate: { n: nSub } });
  const outer = face(edgeFilterLayers("long-pass", uvCentres, nH, nL, uvPairs));
  const inner = face(edgeFilterLayers("short-pass", irCentres, nH, nL, irPairs));
  const cache = new Map<number, number>();
  const transmittance = (wl: number) => {
    let t = cache.get(wl);
    if (t === undefined) {
      t = incoherentLosslessFaces(stackResponse(outer, wl).R, stackResponse(inner, wl).R).T;
      cache.set(wl, t);
    }
    return t;
  };
  return { valid, uvCentres, irCentres, tooBig, ready, transmittance };
}

/** Solar-weighted mean T over all of 280–4000 nm and the UV (280–400), visible (400–700) and near-IR (700–4000) parts. */
export function solarProtectionMeans(
  transmittance: (wavelength: number) => number,
  mean: (f: (wavelength: number) => number, from?: number, to?: number) => number,
): { total: number; uv: number; vis: number; nir: number } {
  return {
    total: mean(transmittance),
    uv: mean(transmittance, 280, 400),
    vis: mean(transmittance, 400, 700),
    nir: mean(transmittance, 700, 4000),
  };
}

/** Two uncoated faces of a thick pane, multiple reflections added in intensity: 2n/(n² + 1). */
export function bareGlassTransmittance(nSub: number): number {
  return (2 * nSub) / (nSub * nSub + 1);
}

/** Third-order zones (m) of stacks with design wavelengths `centres`, g = λ₀/λ in 3 ± Δg, as {from, to}. */
export function thirdOrderZones(centres: readonly number[], nH: number, nL: number): { from: number; to: number }[] {
  const dg = stopBandHalfWidth(nH, nL);
  return centres.map((c) => ({ from: c / (3 + dg), to: c / (3 - dg) }));
}
