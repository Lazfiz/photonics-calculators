/**
 * Three-paddle fibre polarization controller: the page's summary (retardance of each paddle, Stokes vector after
 * each paddle, output ellipse, loop diameters for λ/4 and λ/2) and the two limits of its warnings. SI in and out
 * (m, rad). Kept apart from fiber-birefringence.ts, which other pages import. Model tier: textbook approximation
 * (bend birefringence B = 0.133 (d/D)², Ulrich, Rashleigh and Eickhoff, Opt. Lett. 5, 273 (1980); Lefèvre,
 * Electron. Lett. 16(20), 778 (1980), doi:10.1049/el:19800552).
 */
import { ellipseAngles, handedness, stokesFromEllipse, type Stokes } from "../polarization/stokes";
import { bendBirefringence, loopDiameterFor, loopRetardance, paddleStates } from "./fiber-birefringence";

/** Bend strain d/D above which the fibre may break (≈ 1 % proof-test strain of standard fibre). */
export const MAX_BEND_STRAIN = 0.01;
/** Loop diameter, m, below which the bend loss of standard single-mode fibre at 1550 nm rises steeply. */
export const LOW_LOSS_LOOP_DIAMETER = 0.03;

export interface PolarizationControllerParams {
  /** Wavelength, m. */
  lambda: number;
  /** Cladding diameter d, m. */
  claddingDiameter: number;
  /** Loop diameter D, m. */
  loopDiameter: number;
  /** Loops on paddles 1–3 (rounded to whole loops). */
  loops: readonly [number, number, number];
  /** Paddle angles (loop-plane tilt from x), rad. */
  angles: readonly [number, number, number];
  /** Input azimuth ψ, rad. */
  psi: number;
  /** Input ellipticity χ, rad. */
  chi: number;
}

export interface PolarizationControllerSummary {
  perLoop: number;
  Bbend: number;
  paddles: { retardance: number; fastAxis: number }[];
  states: Stokes[];
  out: Stokes;
  ell: { psi: number; chi: number };
  hand: ReturnType<typeof handedness>;
  dQuarter: number;
  dHalf: number;
}

export function polarizationControllerSummary(p: PolarizationControllerParams): PolarizationControllerSummary {
  const [L1, L2, L3] = p.loops.map((n) => Math.round(n));
  const perLoop = loopRetardance(p.claddingDiameter, p.loopDiameter, p.lambda);
  const paddles = [L1, L2, L3].map((N, i) => ({ retardance: N * perLoop, fastAxis: p.angles[i] }));
  const states = paddleStates(stokesFromEllipse(1, p.psi, p.chi), paddles);
  const out = states[3];
  return {
    perLoop,
    Bbend: bendBirefringence(p.claddingDiameter, p.loopDiameter / 2),
    paddles,
    states,
    out,
    ell: ellipseAngles(out),
    hand: handedness(out),
    dQuarter: loopDiameterFor(Math.PI / 2, p.claddingDiameter, p.lambda, Math.max(L1, 1)),
    dHalf: loopDiameterFor(Math.PI, p.claddingDiameter, p.lambda, Math.max(L2, 1)),
  };
}
