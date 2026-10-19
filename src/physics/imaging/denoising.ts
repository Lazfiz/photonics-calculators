/*
 * Noise gain and detail cost of classic image-denoising filters on additive white Gaussian noise of std σ.
 *
 * A linear filter with weights w (Σw = 1) leaves the output noise variance σ²·Σw² (white input noise, no edge
 * effects): a k × k box gives σ/k, a separable Gaussian gives σ·(Σg²)/(Σg)² per axis squared (Gonzalez & Woods,
 * Digital Image Processing, 4th ed.). Its transfer function along one axis is the DTFT of the 1-D kernel.
 * A k × k median is nonlinear; its output variance is that of the median of n = k² independent normals, found here by
 * integrating the order-statistic density (David & Nagaraja, Order Statistics, 3rd ed., Wiley 2003); it tends to
 * πσ²/(2n) for large n.
 */

import { firstCrossing, integrateSimpson, lnGamma, normalCdf } from "../math";

const finitePositive = (x: number) => Number.isFinite(x) && x > 0;
const oddWindow = (k: number) => Number.isInteger(k) && k >= 1 && k % 2 === 1;

/** Output-to-input noise std of a k × k box (mean) filter: 1/k. */
export function boxNoiseRatio(k: number): number {
  return oddWindow(k) ? 1 / k : NaN;
}

/** Half-width of the sampled Gaussian kernel: ⌈3σ_s⌉ pixels (it keeps 99.7 % of the 1-D weight). */
export function gaussianRadius(sigma: number): number {
  return finitePositive(sigma) ? Math.ceil(3 * sigma) : NaN;
}

/** Normalised 1-D Gaussian taps g_i ∝ exp(−i²/(2σ_s²)) for i = −r … r, with r = ⌈3σ_s⌉. */
export function gaussianKernel(sigma: number): number[] {
  const r = gaussianRadius(sigma);
  if (!Number.isFinite(r)) return [];
  const g = Array.from({ length: 2 * r + 1 }, (_, j) => Math.exp(-((j - r) ** 2) / (2 * sigma * sigma)));
  const sum = g.reduce((a, b) => a + b, 0);
  return g.map((v) => v / sum);
}

/**
 * Output-to-input noise std of the separable 2-D Gaussian: √(Σw²) = Σg² over the normalised 1-D taps. The continuous
 * limit is 1/(2√π σ_s).
 */
export function gaussianNoiseRatio(sigma: number): number {
  const g = gaussianKernel(sigma);
  return g.length ? g.reduce((a, v) => a + v * v, 0) : NaN;
}

/** Variance of the median of n = 2m + 1 independent standard normals (exact, by quadrature). */
export function medianVarianceFactor(n: number): number {
  if (!oddWindow(n)) return NaN;
  if (n === 1) return 1;
  const m = (n - 1) / 2;
  const lnC = lnGamma(n + 1) - 2 * lnGamma(m + 1) - 0.5 * Math.log(2 * Math.PI);
  // Density of the middle order statistic: n!/(m!)² Φ^m (1 − Φ)^m φ; symmetric, so integrate x ≥ 0 and double.
  const density = (x: number) => Math.exp(lnC + m * Math.log(normalCdf(x)) + m * Math.log(normalCdf(-x)) - (x * x) / 2);
  const upper = Math.min(10, 12 / Math.sqrt(n) + 1);
  return 2 * integrateSimpson((x) => x * x * density(x), 0, upper, 4000);
}

/** Output-to-input noise std of a k × k median filter on white Gaussian noise: √var(median of k² normals). */
export function medianNoiseRatio(k: number): number {
  return oddWindow(k) ? Math.sqrt(medianVarianceFactor(k * k)) : NaN;
}

/** SNR gain of a filter with output-to-input noise std ratio r, dB: 20 log₁₀(1/r). */
export function snrGainDb(ratio: number): number {
  return finitePositive(ratio) ? -20 * Math.log10(ratio) : NaN;
}

/** Transfer function of a k-tap box along one axis at f cycles/pixel: sin(πkf)/(k sin πf), 1 at f = 0. */
export function boxTransfer(k: number, f: number): number {
  if (!oddWindow(k) || !(f >= 0 && f <= 0.5)) return NaN;
  const s = Math.sin(Math.PI * f);
  return s === 0 ? 1 : Math.sin(Math.PI * k * f) / (k * s);
}

/** Transfer function of the sampled Gaussian along one axis at f cycles/pixel: Σ g_i cos(2πf i). */
export function gaussianTransfer(sigma: number, f: number): number {
  const g = gaussianKernel(sigma);
  if (!g.length || !(f >= 0 && f <= 0.5)) return NaN;
  const r = (g.length - 1) / 2;
  return g.reduce((a, v, j) => a + v * Math.cos(2 * Math.PI * f * (j - r)), 0);
}

/** First frequency (cycles/pixel, ≤ 0.5) where |H| falls to 0.5; NaN when it stays above 0.5 up to Nyquist. */
export function halfResponseFrequency(transfer: (f: number) => number): number {
  return firstCrossing((f) => Math.abs(transfer(f)), 0, 0.5, 0.5, 500);
}

/** VisuShrink universal threshold σ√(2 ln N) for N wavelet coefficients (Donoho & Johnstone 1994). */
export function visuShrinkThreshold(sigma: number, N: number): number {
  return finitePositive(sigma) && Number.isFinite(N) && N > 1 ? sigma * Math.sqrt(2 * Math.log(N)) : NaN;
}
