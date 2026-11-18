/**
 * Stitching page: what it assembles from `registration.ts` (which the registration page also imports): the mosaic
 * geometry of a C × R tile grid, the position error of the worst tile for chained and globally optimised placement,
 * and the seam gradient of a gain mismatch spread over the blend. Lengths in pixels (px); the gain step in %.
 * Model tier: textbook. The formulas and their sources (Preibisch et al. 2009, Barooah & Hespanha 2007) are in
 * `registration.ts`.
 */

import {
  type BlendProfile,
  type StitchErrorResult,
  type TileGridResult,
  globalStitchError,
  sequentialStitchError,
  tileGrid,
} from "./registration";

export interface StitchingInputs {
  /** Grid columns C and rows R (integers). */
  cols: number;
  rows: number;
  /** Tile size, px. */
  tileWidth: number;
  tileHeight: number;
  /** Overlap between neighbours, % of the tile. */
  overlapPercent: number;
  /** Requested blend width, px; the blend can't be wider than the overlap. */
  blendWidth: number;
  profile: BlendProfile;
  /** Gain mismatch between neighbouring tiles, % (a step spread over the blend). */
  gain: number;
}

export interface StitchingSummary {
  grid: TileGridResult;
  /** A seam axis (more than one tile along it) has an overlap of 0 px (0 %, or it rounds to 0): the tiles can't be registered. */
  noOverlap: boolean;
  /** Blend width actually used, min(requested, overlaps of the axes that have seams), px. */
  blend: number;
  /** Peak gradient of the blended seam for a gain step of `gain` %, %/px; NaN when the blend width is 0. */
  seamSlope: number;
  /** Per-axis position error in σ units: chained from the anchor tile and the global least-squares solution. */
  chain: StitchErrorResult;
  global: StitchErrorResult;
}

/** Peak slope of the cos² weight 1 − α(t) relative to the linear ramp: d/dt cos²(πt/2) = −(π/2) sin(πt), peak π/2 at t = ½. */
export const COSINE_PEAK_SLOPE = Math.PI / 2;

/**
 * Stitching summary. `global` computes the global solution (a caller that evaluates it often can pass a cached
 * version).
 */
export function stitchingSummary(i: StitchingInputs, global: (cols: number, rows: number) => StitchErrorResult = globalStitchError): StitchingSummary {
  const grid = tileGrid({ cols: i.cols, rows: i.rows, tileWidth: i.tileWidth, tileHeight: i.tileHeight, overlap: i.overlapPercent / 100 });
  // Only axes with more than one tile have seams: a 1 × R grid has no x seam and a C × 1 grid no y seam.
  const seamOverlaps = [...(i.cols > 1 ? [grid.overlapX] : []), ...(i.rows > 1 ? [grid.overlapY] : [])];
  const blend = Math.min(i.blendWidth, ...(seamOverlaps.length > 0 ? seamOverlaps : [grid.overlapX]));
  return {
    grid,
    noOverlap: (i.cols > 1 && grid.overlapX === 0) || (i.rows > 1 && grid.overlapY === 0),
    blend,
    seamSlope: blend > 0 ? ((i.profile === "cosine" ? COSINE_PEAK_SLOPE : 1) * i.gain) / blend : NaN,
    chain: sequentialStitchError(i.cols, i.rows),
    global: global(i.cols, i.rows),
  };
}
