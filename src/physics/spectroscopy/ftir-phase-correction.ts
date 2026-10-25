/**
 * FTIR phase correction on a simulated interferogram. Wavenumbers σ in cm⁻¹, OPD in cm. Model tier: exact (the
 * algorithms run on synthetic data; the instrument is ideal apart from the phase error and white noise).
 *
 * Measured interferogram I(x) = 2∫₀^∞ B(σ) cos(2πσx + φ(σ)) dσ, so its transform C(σ) = ∫ I e^(−2πiσx) dx = B e^(iφ).
 * The record is short on one side of the zero path difference (ZPD) and long on the other (−M … N − 1 samples).
 * P. R. Griffiths, J. A. de Haseth, Fourier Transform Infrared Spectrometry, 2nd ed. (Wiley, 2007), ch. 4:
 *   phase φ̂ from the double-sided part ±M (triangular apodization), low resolution 1/(2MΔx);
 *   Mertz: weight the record with a ramp 0 → 1 over −M … M (each ±x pair sums to 1), transform, B = 2 Re(C e^(−iφ̂))
 *     (L. Mertz, Infrared Phys. 7, 17 (1967));
 *   Forman: convolve the record with the kernel IFT[e^(−iφ̂)], which symmetrizes it, then cosine-transform the
 *     symmetric half (M. L. Forman, W. H. Steel, G. A. Vanasse, J. Opt. Soc. Am. 56, 59 (1966));
 *   magnitude: |C| of a double-sided scan to ±L, no phase needed, but noise is rectified to a positive bias.
 */
import { fftRadix2, nextPow2 } from "../fft";
import { cosineTransform } from "./ftir";

/** Interferogram samples I(nΔx), n = −nNeg … nPos − 1, of B(σ)e^(iφ(σ)) synthesized on a P-point grid (P ≥ 2(nNeg + nPos)). */
export function synthesizeInterferogram(
  B: (sigma: number) => number,
  phi: (sigma: number) => number,
  dx: number,
  nNeg: number,
  nPos: number,
): number[] {
  const P = 4 * nextPow2(nNeg + nPos);
  const re = new Array<number>(P).fill(0);
  const im = new Array<number>(P).fill(0);
  for (let k = 1; k < P / 2; k++) {
    const s = k / (P * dx);
    const b = B(s);
    const p = phi(s);
    re[k] = re[P - k] = b * Math.cos(p);
    im[k] = b * Math.sin(p);
    im[P - k] = -im[k];
  }
  fftRadix2(re, im, true);
  // I(nΔx) = Δσ Σ_k C_k e^(2πikn/P) = (P·IFFT)/(PΔx)
  return Array.from({ length: nNeg + nPos }, (_, i) => re[(i - nNeg + P) % P] / dx);
}

export interface Record1 {
  I: readonly number[]; // samples
  zero: number; // array index of OPD sample 0
  dx: number;
}

/** Array index of the largest |I| within ±window of `zero`: the ZPD estimate. */
export function findZpd(r: Record1, window = 8): number {
  let best = r.zero;
  for (let i = Math.max(0, r.zero - window); i <= Math.min(r.I.length - 1, r.zero + window); i++)
    if (Math.abs(r.I[i]) > Math.abs(r.I[best])) best = i;
  return best;
}

/** FFT of samples I[z + j]·w(j), j = −m … n − 1, on a P-point grid with j < 0 wrapped. */
function transform(I: readonly number[], z: number, m: number, n: number, P: number, w: (j: number) => number) {
  const re = new Array<number>(P).fill(0);
  const im = new Array<number>(P).fill(0);
  for (let j = -m; j < n; j++) re[(j + P) % P] = I[z + j] * w(j);
  fftRadix2(re, im);
  return { re, im };
}

export interface LowResPhase {
  sigma: number[]; // 0 … σ_Nyquist in steps 1/(2MΔx)
  cos: number[];
  sin: number[];
}

/** Phase from the double-sided part ±M about array index z, triangular apodization. */
export function lowResolutionPhase(r: Record1, z: number, M: number): LowResPhase {
  const P = 2 * M;
  const { re, im } = transform(r.I, z, M, M, P, (j) => 1 - Math.abs(j) / M);
  const sigma: number[] = [], c: number[] = [], s: number[] = [];
  for (let l = 0; l <= M; l++) {
    const a = Math.hypot(re[l], im[l]);
    sigma.push(l / (P * r.dx));
    c.push(a > 0 ? re[l] / a : 1);
    s.push(a > 0 ? im[l] / a : 0);
  }
  return { sigma, cos: c, sin: s };
}

/** Phase angle of the low-resolution phasor at σ, interpolating its cosine and sine linearly. */
export function phaseAt(p: LowResPhase, sigma: number): number {
  const h = p.sigma[1];
  const t = Math.min(Math.max(sigma / h, 0), p.sigma.length - 1);
  const l = Math.min(Math.floor(t), p.sigma.length - 2);
  const f = t - l;
  return Math.atan2(p.sin[l] * (1 - f) + p.sin[l + 1] * f, p.cos[l] * (1 - f) + p.cos[l + 1] * f);
}

export interface Spectrum {
  sigma: number[];
  B: number[];
}

/** Ramp-weighted single-sided transform 2Δx·C(σ_k) of samples z − M … end; grid 1/(PΔx), P = nextPow2(2(n + M)). */
function rampTransform(r: Record1, z: number, M: number) {
  const n = r.I.length - z;
  const P = nextPow2(2 * (n + M));
  const { re, im } = transform(r.I, z, M, n, P, (j) => (j < M ? (j + M) / (2 * M) : 1));
  const sigma = Array.from({ length: P / 2 + 1 }, (_, k) => k / (P * r.dx));
  return { sigma, re: sigma.map((_, k) => 2 * r.dx * re[k]), im: sigma.map((_, k) => 2 * r.dx * im[k]) };
}

/** No correction: the real part of the ramp-weighted transform (the phase error leaks into it). */
export function uncorrectedSpectrum(r: Record1, z: number, M: number): Spectrum {
  const t = rampTransform(r, z, M);
  return { sigma: t.sigma, B: t.re };
}

/** Mertz: B = 2Δx Re(C e^(−iφ̂)). */
export function mertz(r: Record1, z: number, M: number): Spectrum {
  const t = rampTransform(r, z, M);
  const p = lowResolutionPhase(r, z, M);
  return {
    sigma: t.sigma,
    B: t.sigma.map((s, k) => {
      const ph = phaseAt(p, s);
      return t.re[k] * Math.cos(ph) + t.im[k] * Math.sin(ph);
    }),
  };
}

/**
 * Forman: s_j = Σ_m κ_m I[z + j − m], κ = IFFT₂M[e^(−iφ̂)], for j = 0 … end − M (where the kernel stays inside the record),
 * then the cosine transform of s.
 */
export function forman(r: Record1, z: number, M: number): Spectrum {
  const p = lowResolutionPhase(r, z, M);
  const P = 2 * M;
  const re = new Array<number>(P).fill(0);
  const im = new Array<number>(P).fill(0);
  for (let l = 0; l <= M; l++) {
    re[l] = p.cos[l];
    im[l] = -p.sin[l];
    if (l > 0 && l < M) { re[P - l] = p.cos[l]; im[P - l] = p.sin[l]; }
  }
  im[M] = 0; // Nyquist bin of a real kernel
  fftRadix2(re, im, true);
  const J = r.I.length - z - M;
  if (J < 2) return { sigma: [], B: [] };
  const s = Array.from({ length: J }, (_, j) => {
    let acc = 0;
    for (let m = -M; m < M; m++) acc += re[(m + P) % P] * r.I[z + j - m];
    return acc;
  });
  return cosineTransform(s, r.dx);
}

/** Magnitude 2Δx|C| of a double-sided record ±n about array index z (boxcar). */
export function magnitudeSpectrum(r: Record1, z: number, n: number): Spectrum {
  const P = nextPow2(2 * n);
  const { re, im } = transform(r.I, z, n, n, P, () => 1);
  const sigma = Array.from({ length: P / 2 + 1 }, (_, k) => k / (P * r.dx));
  return { sigma, B: sigma.map((_, k) => r.dx * Math.hypot(re[k], im[k])) };
}

/** RMS of (estimate − truth) over the bins where truth ≥ `floor`·max(truth), relative to max(truth). */
export function relativeRmsError(est: Spectrum, truth: (sigma: number) => number, floor = 0.05): number {
  const t = est.sigma.map(truth);
  const peak = Math.max(...t);
  let sum = 0;
  let count = 0;
  t.forEach((v, k) => {
    if (v >= floor * peak) { sum += (est.B[k] - v) ** 2; count++; }
  });
  return count > 0 && peak > 0 ? Math.sqrt(sum / count) / peak : NaN;
}

/** Gaussian line exp(−4 ln 2 ((σ − σ₀)/w)²) of unit peak and full width at half maximum w (cm⁻¹). */
export function gaussianLine(sigma: number, centre: number, fwhm: number): number {
  return fwhm > 0 ? Math.exp(-4 * Math.LN2 * ((sigma - centre) / fwhm) ** 2) : NaN;
}

/** Absorption bands of the demo sample: centre and FWHM (cm⁻¹), peak absorbance. Illustrative, not a real compound. */
export const DEMO_BANDS: readonly (readonly [number, number, number])[] = [
  [1450, 20, 0.3], [1700, 25, 0.5], [2350, 30, 0.8], [2900, 40, 0.4],
];

/** Demo single-beam spectrum: a Gaussian source envelope (centre 2000, FWHM 1600 cm⁻¹) times the transmittance 10^(−Σ A g). */
export function demoSingleBeam(sigma: number, bands = DEMO_BANDS): number {
  const absorbance = bands.reduce((a, [c, w, A]) => a + A * gaussianLine(sigma, c, w), 0);
  return gaussianLine(sigma, 2000, 1600) * 10 ** -absorbance;
}
