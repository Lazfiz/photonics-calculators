/**
 * Page summary for the fiber-laser page and its API schema, built on doped-fiber-gain.ts (sources there). Kept apart
 * from that module because the bundler doesn't drop unused exports: code here would ship on every page that imports
 * doped-fiber-gain. SI units.
 */
import { WEAK_GUIDANCE_MAX_DELTA } from "./fiber-coupler";
import {
  DB_PER_E_FOLD, lp11CutoffWavelength, vNumber, type StepIndexFiber,
} from "./macro-bending-loss";
import { guidedModeCount, MAX_EXACT_MODE_V, petermannIIRadius, relativeIndexDifference } from "./step-index-modes";
import {
  efficiencyBeyondStokes, optimumOutputCoupler, rigrodOutput, stokesEfficiency,
} from "./doped-fiber-gain";

/** Core index assumed for the laser page's silica fibre: V, the mode count and the LP01 field depend only on a, NA and λ. */
export const LASER_CORE_INDEX = 1.45;
/** Above this Δ the weak-guidance formulas of the laser page lose accuracy. */
export const LASER_MAX_DELTA = WEAK_GUIDANCE_MAX_DELTA;

export interface FiberLaserSpec {
  /** W, m, fractions (slope, output-coupler transmission), dB (single-pass gain, round-trip loss). */
  pumpPower: number;
  pumpLambda: number;
  laserLambda: number;
  slopeEfficiency: number;
  thresholdPower: number;
  gainDb: number;
  transmission: number;
  lossDb: number;
  coreDiameter: number;
  NA: number;
}

export interface FiberLaserSummary {
  /** η_s(P_pump − P_th), W; 0 below threshold. */
  out: number;
  optical: number;
  stokes: number;
  beyond: number;
  /** Single-pass small-signal gain g₀L (natural log) and the rear reflectance with the internal loss folded in. */
  g0L: number;
  R1: number;
  /** Optimum output transmission and the Rigrod output there, in units of P_sat (NaN / 0 below threshold). */
  Topt: number;
  optOut: number;
  /** Rigrod output at the entered coupler, in units of P_sat. */
  atT: number;
  V: number;
  /** Guided LP modes counted by `guidedModeCount`; NaN above MAX_EXACT_MODE_V. */
  modes: number;
  /** LP01 mode-field diameter (Petermann II), m. */
  mfd: number;
  /** LP11 cutoff wavelength, m. */
  cutoffWavelength: number;
  /** Core–cladding index step Δ = NA²/(2n₁²). */
  delta: number;
}

/** Fibre laser page: measured slope and threshold, Stokes limits, Rigrod optimum coupling and the fibre's modes. */
export function fiberLaserSummary(s: FiberLaserSpec): FiberLaserSummary {
  const fiber: StepIndexFiber = { a: s.coreDiameter / 2, n1: LASER_CORE_INDEX, NA: s.NA };
  const V = vNumber(fiber, s.laserLambda);
  const out = s.pumpPower > s.thresholdPower ? s.slopeEfficiency * (s.pumpPower - s.thresholdPower) : 0;
  const g0L = s.gainDb / DB_PER_E_FOLD;
  const R1 = 10 ** (-s.lossDb / 10);
  const opt = optimumOutputCoupler(g0L, R1);
  return {
    out,
    optical: s.pumpPower > 0 ? out / s.pumpPower : 0,
    stokes: stokesEfficiency(s.pumpLambda, s.laserLambda),
    beyond: efficiencyBeyondStokes(s.slopeEfficiency, s.pumpLambda, s.laserLambda),
    g0L,
    R1,
    Topt: 1 - opt.R2,
    optOut: opt.output,
    atT: rigrodOutput(g0L, R1, 1 - s.transmission),
    V,
    modes: V <= MAX_EXACT_MODE_V ? guidedModeCount(V) : NaN,
    mfd: 2 * petermannIIRadius(fiber, s.laserLambda),
    cutoffWavelength: lp11CutoffWavelength(fiber),
    delta: relativeIndexDifference(fiber),
  };
}
