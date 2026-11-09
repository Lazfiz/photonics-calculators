/**
 * Metal mirrors with dielectric overcoats: protected and reflection-enhanced Al and Ag. SI units (m).
 * Model tier: exact for the stack (transfer matrix, normal incidence); metal n, k as in ./low-emissivity.ts (Ag:
 * Yang et al. 2015 data; Al, Cr: Rakić et al. 1998 Lorentz–Drude), the dielectrics constant real indices.
 *
 * Enhanced mirror: N quarter-wave pairs at λ₀ on the metal, low index next to the metal and high index outermost
 * (Macleod, Thin-Film Optical Filters, 4th ed., ch. 5, reflection-enhancing layers). A quarter wave turns an
 * admittance Y into n²/Y, so a pair (L then H, seen from the metal) multiplies it by (n_H/n_L)²; on an opaque
 * metal with N = n + iκ (admittance N, in units of the free-space admittance),
 *   Y = (n_H/n_L)^(2N) · N,   R(λ₀) = |(n₀ − Y)/(n₀ + Y)|².
 * The metal's phase shift means a slightly thinner first layer would do a little better; the pages use quarter waves.
 */
import { intervalStats } from "../math";
import { rakicIndex } from "../materials/lorentz-drude";
import { quarterWaveThickness } from "./transfer-matrix";
import { coatingResponse, type CoatingLayer, type Metal } from "./low-emissivity";

/** Layers of an enhanced metal mirror, from the incident side: (H L)^pairs, metal, optional adhesion layer. */
export function enhancedMirrorLayers(opts: {
  metal: Metal;
  metalThickness: number;
  nL: number;
  nH: number;
  pairs: number;
  lambda0: number;
  adhesion?: CoatingLayer;
}): CoatingLayer[] {
  const layers: CoatingLayer[] = [];
  for (let i = 0; i < opts.pairs; i++) {
    layers.push({ material: "dielectric", n: opts.nH, thickness: quarterWaveThickness(opts.nH, opts.lambda0) });
    layers.push({ material: "dielectric", n: opts.nL, thickness: quarterWaveThickness(opts.nL, opts.lambda0) });
  }
  layers.push({ material: opts.metal, thickness: opts.metalThickness });
  if (opts.adhesion && opts.adhesion.thickness > 0) layers.push(opts.adhesion);
  return layers;
}

/** R at λ₀ of N quarter-wave pairs on an opaque metal of index n + iκ, in an incident medium n₀ (see header). */
export function enhancedMetalReflectance(metal: { n: number; k: number }, nL: number, nH: number, pairs: number, incident = 1): number {
  if (!(nL > 0 && nH > 0 && incident > 0 && pairs >= 0 && metal.n >= 0 && metal.k >= 0)) return NaN;
  const g = (nH / nL) ** (2 * pairs);
  const yr = g * metal.n;
  const yi = g * metal.k;
  return ((incident - yr) ** 2 + yi * yi) / ((incident + yr) ** 2 + yi * yi);
}

export interface EnhancedAluminumResult {
  /** R and T of the enhanced mirror at λ₀, and R of the bare Al (same Cr adhesion layer) there. */
  R0: number;
  T0: number;
  bareR0: number;
  /** Mean (trapezoid, 300 intervals), minimum and maximum R over 400–700 nm, enhanced and bare. */
  vis: { mean: number; min: number; max: number };
  bareVis: { mean: number; min: number; max: number };
  /** Opaque-Al quarter-wave limit R(λ₀) of enhancedMetalReflectance. */
  qw: number;
}

/**
 * The enhanced-aluminium page's results: Al (thickness m) with an optional Cr adhesion layer under it, N quarter-wave
 * (H L) pairs at λ₀ on top, on a lossless substrate of index nSub, each R from the exact transfer matrix.
 */
export function enhancedAluminumResults(opts: {
  lambda0: number;
  pairs: number;
  nL: number;
  nH: number;
  alThickness: number;
  adhesionThickness: number;
  nSub: number;
}): EnhancedAluminumResult {
  const { lambda0, pairs, nL, nH } = opts;
  const substrate = { material: "dielectric" as const, n: opts.nSub };
  const adhesion = { material: "Cr" as const, thickness: opts.adhesionThickness };
  const make = (p: number) => enhancedMirrorLayers({ metal: "Al", metalThickness: opts.alThickness, nL, nH, pairs: p, lambda0, adhesion });
  const enhanced = make(pairs);
  const bare = make(0);
  const R = (layers: CoatingLayer[]) => (lam: number) => coatingResponse(layers, substrate, lam).R;
  const at0 = coatingResponse(enhanced, substrate, lambda0);
  return {
    R0: at0.R,
    T0: at0.T,
    bareR0: R(bare)(lambda0),
    vis: intervalStats(R(enhanced), 400e-9, 700e-9, 300),
    bareVis: intervalStats(R(bare), 400e-9, 700e-9, 300),
    qw: enhancedMetalReflectance(rakicIndex("Al", lambda0), nL, nH, pairs),
  };
}
