/**
 * Side-polished fibre: the page's summary (power beyond the polished face, overlay shift of n_eff, polished
 * coupler transfer) and the flags that drive its warnings. SI in and out (m, 1/m). Kept apart from coupled-mode.ts,
 * macro-bending-loss.ts and step-index-modes.ts, which other pages import. Model tier: textbook approximation
 * (exact LP01 mode of the unpolished fibre; first-order perturbation, Snyder and Love 1983; polished coupler,
 * Digonnet and Shaw, IEEE J. Quantum Electron. 18, 746 (1982)).
 */
import {
  NEAR_LEAK_FRACTION, PERTURBATION_FRACTION, couplingCoefficient, evanescentIntensityRatio, lp01PowerBeyondPlane,
  polishedCouplerPhase,
} from "./coupled-mode";
import { lp01Mode, vNumber, type Lp01Mode, type StepIndexFiber } from "./macro-bending-loss";
import { effectiveIndex, numericalAperture } from "./step-index-modes";

/** Remaining cladding, m, below which the twin cores almost touch and coupled-mode theory is at its limit. */
export const TOUCHING_CLADDING = 0.5e-6;
/** |n_overlay − n₂| above which a coupler gap filled with the overlay is no longer index-matched to the cladding. */
export const GAP_MATCH_TOLERANCE = 0.002;

export interface SidePolishedParams {
  /** Core boundary to polished face, m. */
  remainingClad: number;
  /** Core diameter, m. */
  coreDia: number;
  /** Wavelength, m. */
  lambda: number;
  nCore: number;
  nClad: number;
  nOverlay: number;
  /** Radius the fibre is bent to in the block, m. */
  blockRadius: number;
}

export interface SidePolishedSummary {
  fiber: StepIndexFiber;
  V: number;
  mode: Lp01Mode;
  nEff: number;
  /** Fraction of the LP01 power beyond the polished face. */
  eta: number;
  /** Overlay shift of n_eff, first order. */
  dNeff: number;
  /** Coupling coefficient at the minimum core spacing, 1/m. */
  kappa0: number;
  /** Accumulated coupling ∫κ dz, rad. */
  phi: number;
  /** Intensity at the face relative to the core boundary. */
  surface: number;
  /** Field 1/e decay length a/W, m. */
  decayLength: number;
  /** Power coupled to the twin fibre, sin²Φ. */
  coupled: number;
  /** Effective coupling length Φ/κ₀, m. */
  Leff: number;
  valid: boolean;
  leaky: boolean;
  /** n_eff − n₂. */
  margin: number;
  strong: boolean;
  nearLeak: boolean;
  mismatchedGap: boolean;
  touching: boolean;
}

export function sidePolishedSummary(p: SidePolishedParams): SidePolishedSummary {
  const fiber: StepIndexFiber = { a: p.coreDia / 2, n1: p.nCore, NA: numericalAperture(p.nCore, p.nClad) };
  const V = vNumber(fiber, p.lambda);
  const mode = lp01Mode(V);
  const nEff = effectiveIndex(fiber, p.lambda, mode);
  const rho0 = 1 + p.remainingClad / fiber.a;
  const eta = lp01PowerBeyondPlane(mode, rho0);
  // First-order perturbation: Δ(n_eff²) = η (n_ov² − n₂²) (Snyder & Love 1983), so Δn_eff ≈ η(n_ov² − n₂²)/(2 n_eff).
  const dNeff = (eta * (p.nOverlay ** 2 - p.nClad ** 2)) / (2 * nEff);
  // Two identical fibres polished face to face, gap index-matched: minimum core spacing D₀ = 2(a + d).
  const D0 = 2 * (fiber.a + p.remainingClad);
  const kappa0 = couplingCoefficient(fiber, p.lambda, D0, mode);
  const phi = polishedCouplerPhase(fiber, p.lambda, D0, p.blockRadius, mode);
  const valid = Number.isFinite(eta);
  const leaky = valid && p.nOverlay >= nEff;
  const margin = nEff - p.nClad;
  return {
    fiber, V, mode, nEff, eta, dNeff, kappa0, phi,
    surface: evanescentIntensityRatio(mode, rho0),
    decayLength: fiber.a / mode.W,
    coupled: Math.sin(phi) ** 2,
    Leff: phi / kappa0,
    valid,
    leaky,
    margin,
    strong: valid && !leaky && Math.abs(dNeff) > PERTURBATION_FRACTION * margin,
    nearLeak: valid && !leaky && nEff - p.nOverlay < NEAR_LEAK_FRACTION * margin,
    mismatchedGap: Math.abs(p.nOverlay - p.nClad) > GAP_MATCH_TOLERANCE,
    touching: valid && p.remainingClad < TOUCHING_CLADDING,
  };
}
