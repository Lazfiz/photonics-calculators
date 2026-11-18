/**
 * Spectral-unmixing page: the endmember matrix E of a detector with B equal spectral bands, one noisy simulated pixel
 * (seeded), its unmixed abundances, and the noise-propagation figures that do not depend on the noise draw
 * (κ(E), the share standard deviations and the relative errors). Wavelengths in nm (the page's unit), photon counts as
 * photoelectrons (e⁻). Model tier: textbook (linear mixing, Gaussian limit of shot noise). The estimators and their
 * sources (Zimmermann et al. 2003, Lawson & Hanson 1974, Heinz & Chang 2001, Kay 1993 §4.3) are in `linear-unmixing.ts`;
 * the endmember spectra are the FPbase emission spectra of `fluorophores.ts`.
 *
 * Determinism: the noisy pixel comes from `createRng(seed)`, so the same inputs and seed always give the same
 * estimate; κ(E), the ±σ of the shares and σ/x do not depend on the seed.
 */

import { type Fluorophore, integrateSpectrum, spectrumAt } from "./fluorophores";
import {
  bandVariance, conditionNumber, fcls, nnls, ols, olsCovariance, reconstruct, shareStdDev, simulateMixture,
} from "./linear-unmixing";
import { createRng } from "../random";

export type UnmixMethod = "ols" | "nnls" | "fcls";

/** Upper limit of the detected range, nm (the largest "Range end" the page accepts). */
export const RANGE_LIMIT_NM = 1000;

/** Below this many photons per band the Gaussian shot-noise approximation is crude (Poisson counts are skewed). */
export const LOW_PHOTONS_PER_BAND = 20;

/**
 * The detected range [start, end] nm for B bands: the start at most RANGE_LIMIT_NM − B, the end at least 1 nm per band
 * above it. `rewritten` when an input was moved.
 */
export function unmixingRange(start: number, end: number, bands: number): { start: number; end: number; rewritten: boolean } {
  const s = Math.min(start, RANGE_LIMIT_NM - bands);
  const e = Math.max(s + bands, end);
  return { start: s, end: e, rewritten: s !== start || e !== end };
}

export const rangeRewrittenMessage = (start: number, end: number) =>
  `The range was adjusted to ${start.toFixed(0)}–${end.toFixed(0)} nm (the end must be at least one nm per band above the start); this range is used.`;
export const lowPhotonsMessage = (perBand: number) =>
  `Only ${perBand.toFixed(1)} photons per band: below about ${LOW_PHOTONS_PER_BAND} the Gaussian shot-noise approximation is crude (Poisson counts are skewed), so the ±σ and the simulated noise are unreliable.`;
export const missingEmissionMessage = (names: readonly string[]) =>
  `No emission of ${names.join(", ")} falls in the detected range: widen the range or drop the dye.`;
export const DUPLICATE_MESSAGE = "Two endmembers are the same dye: E is rank deficient and the abundances are not identifiable.";

/** Shares a_j/Σa of the photons; equal shares when every input is 0. */
export function normalisedShares(abundances: readonly number[]): number[] {
  const sum = abundances.reduce((s, v) => s + v, 0);
  return sum > 0 ? abundances.map((v) => v / sum) : abundances.map(() => 1 / abundances.length);
}

export interface EndmemberMatrix {
  /** E[b][j]: fraction of dye j's detected photons that fall in band b (columns sum to 1). */
  E: number[][];
  /** Band centres and width, nm. */
  centres: number[];
  step: number;
  /** Emission of each dye integrated over the range (peak-normalised units·m); 0 when none falls in it. */
  inRange: number[];
}

/** Endmember matrix of `bands` equal bands between `start` and `end` (nm). */
export function endmemberMatrix(dyes: readonly Fluorophore[], start: number, end: number, bands: number): EndmemberMatrix {
  const step = (end - start) / bands;
  const centres = Array.from({ length: bands }, (_, b) => start + (b + 0.5) * step);
  const shapes = dyes.map((f) => (l: number) => spectrumAt(f.em, l));
  const inRange = shapes.map((s) => integrateSpectrum(s, start * 1e-9, end * 1e-9));
  const E = centres.map((c) => shapes.map((s, j) => integrateSpectrum(s, (c - step / 2) * 1e-9, (c + step / 2) * 1e-9) / inRange[j]));
  return { E, centres, step, inRange };
}

/**
 * Relative error σ_j/x_j, fraction, of the OLS abundance of endmember j for N photons in total: band variance
 * (E·x)_b + σ_r² with x = N·shares. NaN when the share of dye j is 0.
 */
export function relativeError(E: readonly (readonly number[])[], shares: readonly number[], j: number, photons: number, readNoise: number): number {
  if (!(shares[j] > 0)) return NaN;
  const mean = reconstruct(E, shares.map((a) => a * photons));
  const cov = olsCovariance(E, mean.map((m) => bandVariance(m, readNoise)));
  return Math.sqrt(cov[j][j]) / (shares[j] * photons);
}

export interface UnmixingInputs {
  /** The selected endmembers (2 to 4) and their photon shares (any non-negative weights; normalised here). */
  dyes: readonly Fluorophore[];
  abundances: readonly number[];
  bands: number;
  /** Requested range, nm (see `unmixingRange`). */
  start: number;
  end: number;
  /** Detected photons per pixel and read noise per band (e⁻ rms). */
  photons: number;
  readNoise: number;
  method: UnmixMethod;
  /** Seed of the noise draw. */
  seed: number;
}

export interface UnmixingSummary extends EndmemberMatrix {
  start: number;
  end: number;
  rewritten: boolean;
  /** True shares a_j/Σa and true photon counts. */
  shares: number[];
  /** Simulated measurement, its band variances, the unmixed counts, shares of them, and the fit E·x̂, e⁻. */
  y: number[];
  variance: number[];
  xHat: number[];
  estimate: number[];
  fit: number[];
  /** ± σ of the shares (delta method, OLS covariance), fraction. */
  shareSigma: number[];
  /** σ_j/x_j at the given photon budget, fraction. */
  relError: number[];
  /** κ(E); ∞ when E is rank deficient. */
  kappa: number;
  /** Residual rms (e⁻/band) and χ²/(B − K). */
  residualRms: number;
  chi2: number;
  /** All abundances finite. */
  solved: boolean;
  /** Names of dyes with no emission in the range, and whether two endmembers are the same dye. */
  missing: string[];
  duplicate: boolean;
  /** Photons per band below LOW_PHOTONS_PER_BAND. */
  lowPhotons: boolean;
}

export function unmixingSummary(i: UnmixingInputs): UnmixingSummary {
  const bands = i.bands;
  const range = unmixingRange(i.start, i.end, bands);
  const matrix = endmemberMatrix(i.dyes, range.start, range.end, bands);
  const shares = normalisedShares(i.abundances);
  const xTrue = shares.map((a) => a * i.photons);
  const { variance, y } = simulateMixture(matrix.E, xTrue, i.readNoise, createRng(i.seed));
  const xHat = i.method === "ols" ? ols(matrix.E, y) : i.method === "fcls" ? fcls(matrix.E, y, y.reduce((s, v) => s + v, 0)) : nnls(matrix.E, y);
  const xSum = xHat.reduce((s, v) => s + v, 0);
  const fit = reconstruct(matrix.E, xHat);
  const resid = y.map((v, b) => v - fit[b]);
  return {
    ...matrix,
    ...range,
    shares,
    y,
    variance,
    xHat,
    estimate: xHat.map((v) => v / xSum),
    fit,
    shareSigma: shareStdDev(xTrue, olsCovariance(matrix.E, variance)),
    relError: i.dyes.map((_, j) => relativeError(matrix.E, shares, j, i.photons, i.readNoise)),
    kappa: conditionNumber(matrix.E),
    residualRms: Math.sqrt(resid.reduce((s, r) => s + r * r, 0) / bands),
    chi2: resid.reduce((s, r, b) => s + (r * r) / variance[b], 0) / Math.max(1, bands - i.dyes.length),
    solved: xHat.every(Number.isFinite),
    missing: i.dyes.filter((_, j) => !(matrix.inRange[j] > 0)).map((f) => f.name),
    duplicate: new Set(i.dyes.map((f) => f.name)).size < i.dyes.length,
    lowPhotons: i.photons / bands < LOW_PHOTONS_PER_BAND,
  };
}
