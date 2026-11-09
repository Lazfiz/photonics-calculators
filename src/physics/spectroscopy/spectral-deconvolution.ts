import { hc_eV_nm } from "../constants";
import {
  bandStats,
  bandSum,
  fitHeights,
  franckCondonWeights,
  gaussianNoise,
  peakArea,
  vibronicSpectrum,
  vibronicSpectrumNm,
  type BandStats,
  type HeightFit,
  type Peak,
  type Profile,
  type VibronicBand,
} from "./peak-model";

/**
 * Model logic of the spectral-deconvolution page: the overlapping-band simulation (sum of peaks plus seeded noise, heights
 * refitted by linear least squares) and the vibronic absorption/emission band. The peak shapes and statistics live in
 * peak-model.ts. Positions and widths of the band model share one unit; the vibronic model takes λ in nm and wavenumbers
 * in cm⁻¹.
 */

export const DEFAULT_PEAKS = "480:25:0.7,520:35:1,570:30:0.5";
export const MAX_PEAKS = 5, X_LIM = 1e6, W_MIN = 1e-6, N_SAMPLES = 600, LINE_MIN = 100;

export const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

/** Parses "centre:fwhm:height,…" (at most MAX_PEAKS, values clamped); falls back to DEFAULT_PEAKS when nothing parses. */
export function parsePeaks(s: string): Peak[] {
  const peaks = s
    .split(",")
    .map((t) => t.split(":").map(Number))
    .filter((v) => v.length === 3 && v.every(Number.isFinite))
    .slice(0, MAX_PEAKS)
    .map(([c, w, h]) => ({ center: clamp(c, -X_LIM, X_LIM, 0), fwhm: clamp(w, W_MIN, X_LIM, 1), height: clamp(h, 0, X_LIM, 1) }));
  return peaks.length > 0 ? peaks : parsePeaks(DEFAULT_PEAKS);
}

export interface BandModelInput {
  peaks: readonly Peak[];
  profile: Profile;
  /** Lorentzian fraction (pseudo-Voigt), 0–1. */
  eta: number;
  /** Noise σ as a fraction of the tallest peak. */
  noise: number;
  seed: number;
  xMin: number;
  xMax: number;
}

export interface BandModelResult {
  validWindow: boolean;
  step: number;
  xs: number[];
  data: number[];
  total: (x: number) => number;
  fit: HeightFit | null;
  areas: number[];
  sumArea: number;
  stats: BandStats | null;
  narrow: boolean;
  outside: boolean;
}

/** Simulates the sum of the peaks on N_SAMPLES + 1 points of [xMin, xMax] plus seeded noise, and fits the heights. */
export function bandModel({ peaks, profile, eta, noise, seed, xMin, xMax }: BandModelInput): BandModelResult {
  const validWindow = xMax > xMin;
  const step = (xMax - xMin) / N_SAMPLES;
  const xs = validWindow ? Array.from({ length: N_SAMPLES + 1 }, (_, i) => xMin + i * step) : [];
  const total = (x: number) => bandSum(x, peaks, profile, eta);
  const sigma = noise * Math.max(...peaks.map((p) => p.height));
  const draw = gaussianNoise(xs.length, seed);
  const data = xs.map((x, i) => total(x) + sigma * draw[i]);
  const fit = validWindow ? fitHeights(xs, data, peaks, profile, eta) : null;
  const areas = peaks.map((p) => peakArea(p.height, p.fwhm, profile, eta));
  const sumArea = areas.reduce((s, a) => s + a, 0);
  const stats = validWindow ? bandStats(total, xMin, xMax) : null;
  const narrow = peaks.some((p) => p.fwhm < 3 * step);
  const outside = peaks.some((p) => p.center < xMin || p.center > xMax);
  return { validWindow, step, xs, data, total, fit, areas, sumArea, stats, narrow, outside };
}

export interface VibronicResult {
  nu00: number;
  band: VibronicBand;
  weights: number[];
  nuLo: number;
  nuHi: number;
  lamLo: number;
  lamHi: number;
  lamEmLo: number;
  /** Absorption maximum in wavenumber (per cm⁻¹ spectrum). */
  abs: BandStats;
  /** Emission maximum in wavenumber (photons per cm⁻¹). */
  emNu: BandStats;
  /** Emission maximum in wavelength (photons per nm). */
  emNm: BandStats;
  /** Reorganisation energy S ν̃_v, cm⁻¹. */
  reorg: number;
  /** Energy of the reorganisation, eV. */
  reorg_eV: number;
}

/**
 * Vibronic absorption/emission band from λ₀₀ (nm), ν̃_v (cm⁻¹), Huang–Rhys S and the line FWHM (cm⁻¹). The window is the
 * progression out to S + 4√S + 2 quanta either side plus two line widths, with the red end kept above ν̃₀₀/10; sample counts
 * give ≥ 10 samples per line width (fewer only past the 40000 cap).
 */
export function vibronicModel(lambda00: number, nuVib: number, S: number, lineFwhm: number): VibronicResult {
  const nu00 = 1e7 / lambda00;
  const band: VibronicBand = { nu00, nuVib, S, fwhm: lineFwhm };
  const weights = franckCondonWeights(S);
  const span = (S + 4 * Math.sqrt(S) + 2) * nuVib + 2 * lineFwhm;
  const nuLo = Math.max(nu00 - span, nu00 / 10), nuHi = nu00 + span;
  const lamLo = 1e7 / nuHi, lamHi = 1e7 / nuLo, lamEmLo = 1e7 / (nu00 + 3 * lineFwhm);
  const samplesFor = (range: number, width: number) => Math.min(40000, Math.max(2000, Math.ceil((10 * range) / width)));
  const nuSamples = samplesFor(nuHi - nuLo, lineFwhm);
  const abs = bandStats((n) => vibronicSpectrum(n, band, "absorption", weights), nuLo, nuHi, nuSamples);
  const emNu = bandStats((n) => vibronicSpectrum(n, band, "emission", weights), nuLo, nuHi, nuSamples);
  const emNm = bandStats((l) => vibronicSpectrumNm(l, band, "emission", weights), lamEmLo, lamHi, samplesFor(lamHi - lamEmLo, (lamEmLo ** 2 * lineFwhm) / 1e7));
  const reorg = S * nuVib;
  return { nu00, band, weights, nuLo, nuHi, lamLo, lamHi, lamEmLo, abs, emNu, emNm, reorg, reorg_eV: (hc_eV_nm * reorg) / 1e7 };
}
