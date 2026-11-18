/**
 * Inter-core crosstalk of a multi-core fibre with identical step-index cores, in the page's units (µm, nm, km, mm,
 * rad/m; crosstalk as linear power ratios). Model tier: textbook approximation (see coupled-mode.ts for κ, h̄ and
 * XT = tanh(h̄L); first-order sum over the nearest neighbours).
 */
import {
  averagePowerCoupling, couplingCoefficient, criticalBendRadius, pairCrosstalk,
} from "./coupled-mode";
import { lp01Mode, vNumber } from "./macro-bending-loss";
import { effectiveIndex, numericalAperture } from "./step-index-modes";

/** Core layouts: nearest neighbours of the worst core, and the outer-core centre radius in pitches. */
export const CORE_LAYOUTS: Record<number, { neighbours: number; outerRadius: number; name: string }> = {
  1: { neighbours: 0, outerRadius: 0, name: "single core" },
  3: { neighbours: 2, outerRadius: 1 / Math.sqrt(3), name: "triangle" },
  7: { neighbours: 6, outerRadius: 1, name: "hexagonal, centre core" },
  12: { neighbours: 2, outerRadius: 1 / (2 * Math.sin(Math.PI / 12)), name: "ring of 12" },
  19: { neighbours: 6, outerRadius: 2, name: "hexagonal, two rings" },
};

/** Weak guidance (LP modes): Δ = (n₁² − n₂²)/(2n₁²) above this (3 %) is outside the model. */
export const WEAK_GUIDANCE_DELTA = 0.03;
/** Pair crosstalk above this (0.1, −10 dB) means the neighbour sum overestimates the worst core. */
export const WEAK_COUPLING_XT = 0.1;

export interface MultiCoreParams {
  numCores: number;
  corePitch_um: number;
  coreRadius_um: number;
  coreIndex: number;
  claddingIndex: number;
  wavelength_nm: number;
  fiberLength_km: number;
  /** Core-to-core mismatch Δβ, rad/m. */
  deltaBeta: number;
  bendRadius_mm: number;
  /** Correlation length d, m. */
  correlationLength: number;
  /** Outer core centre to cladding edge, µm. */
  outerCladding_um: number;
}

export interface MultiCoreSummary {
  /** The layout actually used: numCores if it is one of CORE_LAYOUTS, else 7. */
  cores: number;
  layout: (typeof CORE_LAYOUTS)[number];
  V: number;
  /** LP01 propagation constant, rad/m. */
  beta: number;
  /** Coupling coefficient κ, 1/m. */
  kappa: number;
  /** Bend-averaged power coupling h̄, 1/m. */
  h: number;
  /** One-neighbour crosstalk tanh(h̄L), linear. */
  pair: number;
  /** First-order sum over the nearest neighbours, linear. */
  worst: number;
  /** Critical bend radius R_pk, m (Infinity for Δβ = 0). */
  rpk: number;
  /** Cladding diameter, µm. */
  claddingDiameter: number;
  /** κ, h̄ and the one-neighbour crosstalk at another pitch (µm). */
  xtAt: (pitch_um: number) => { kappa: number; h: number; pair: number };
}

/** Layout for `numCores`; a value that isn't a layout falls back to 7 cores. */
export function coreLayout(numCores: number) {
  const cores = CORE_LAYOUTS[numCores] ? numCores : 7;
  return { cores, layout: CORE_LAYOUTS[cores] };
}

export function multiCoreSummary(p: MultiCoreParams): MultiCoreSummary {
  const { cores, layout } = coreLayout(p.numCores);
  const fiber = { a: p.coreRadius_um * 1e-6, n1: p.coreIndex, NA: numericalAperture(p.coreIndex, p.claddingIndex) };
  const lambda = p.wavelength_nm * 1e-9;
  const V = vNumber(fiber, lambda);
  const mode = lp01Mode(V);
  const beta = (2 * Math.PI * effectiveIndex(fiber, lambda, mode)) / lambda;
  const L = p.fiberLength_km * 1e3;
  const xtAt = (pitch_um: number) => {
    const kappa = couplingCoefficient(fiber, lambda, pitch_um * 1e-6, mode);
    const h = averagePowerCoupling({
      kappa, beta, pitch: pitch_um * 1e-6, bendRadius: p.bendRadius_mm * 1e-3,
      correlationLength: p.correlationLength, deltaBeta: p.deltaBeta,
    });
    return { kappa, h, pair: pairCrosstalk(h, L) };
  };
  const { kappa, h, pair } = xtAt(p.corePitch_um);
  return {
    cores, layout, V, beta, kappa, h, pair, xtAt,
    worst: layout.neighbours * pair,
    rpk: p.deltaBeta !== 0 ? criticalBendRadius(beta, p.corePitch_um * 1e-6, p.deltaBeta) : Infinity,
    claddingDiameter: 2 * (layout.outerRadius * p.corePitch_um + p.outerCladding_um),
  };
}
