/**
 * Sampled-signal spectrum: one-sided amplitude spectrum of a windowed record, aliasing, bin spacing and the white-noise
 * floor. Frequencies in Hz, times in s. Model tier: exact.
 *
 * Record xₙ = x(nΔt), n = 0 … N − 1, f_s = 1/Δt, bins f_k = k·f_s/N up to the Nyquist frequency f_s/2. With window wₙ the
 * amplitude estimate is 2|X_k|/Σwₙ (1× at DC and at the Nyquist bin, which have no mirror), so a sinusoid of amplitude A
 * on a bin reads A for every window (coherent-gain correction). White noise of standard deviation σ gives
 * E|X_k|² = σ²Σwₙ², so its RMS on the amplitude scale is 2σ√(Σwₙ²)/Σwₙ = 2σ√(ENBW/N).
 * F. J. Harris, Proc. IEEE 66, 51 (1978), sections II–IV; A. V. Oppenheim, R. W. Schafer, Discrete-Time Signal Processing,
 * 3rd ed. (Pearson, 2010), ch. 4 (sampling, aliasing) and ch. 10 (spectral analysis with windows).
 */
import { dft } from "../fft";
import { createRng, gaussian } from "../random";
import { windowSamples, type WindowName } from "./apodization-comparison";

/** One-sided amplitude spectrum, bins k = 0 … ⌊N/2⌋. `w` defaults to the boxcar. */
export function amplitudeSpectrum(x: readonly number[], fs: number, w?: readonly number[]): { f: number[]; amplitude: number[] } {
  const N = x.length;
  if (N < 2 || !(fs > 0) || (w && w.length !== N)) return { f: [], amplitude: [] };
  const win = w ?? new Array<number>(N).fill(1);
  const gain = win.reduce((s, v) => s + v, 0);
  const X = dft(x.map((v, n) => v * win[n]));
  const half = Math.floor(N / 2);
  return {
    f: Array.from({ length: half + 1 }, (_, k) => (k * fs) / N),
    amplitude: Array.from({ length: half + 1 }, (_, k) => {
      const mirror = k === 0 || (N % 2 === 0 && k === half) ? 1 : 2;
      return (mirror * Math.hypot(X.re[k], X.im[k])) / gain;
    }),
  };
}

/** Frequency at which a tone f appears after sampling at f_s: |f − f_s·round(f/f_s)|, in 0 … f_s/2. */
export const aliasedFrequency = (f: number, fs: number): number => Math.abs(f - fs * Math.round(f / fs));

/** RMS of white noise (standard deviation σ) on the one-sided amplitude scale: 2σ√(Σw²)/Σw. */
export function noiseFloorRms(sigma: number, w: readonly number[]): number {
  const s1 = w.reduce((s, v) => s + v, 0);
  const s2 = w.reduce((s, v) => s + v * v, 0);
  return s1 > 0 ? (2 * sigma * Math.sqrt(s2)) / s1 : NaN;
}

export interface ToneReading {
  /** True frequency and amplitude, Hz and signal units. */
  f: number;
  a: number;
  /** Frequency after sampling (aliased), Hz, and its position in bins. */
  fa: number;
  bin: number;
  /** Largest spectrum amplitude within ±1 bin of the tone. */
  read: number;
}

/**
 * Two sinusoids plus Gaussian white noise (σ, fixed seed 1, so server, client and API agree), sampled N times at f_s,
 * windowed by `win` and transformed. Frequencies in Hz, all else in signal units. N ≥ 4, f_s > 0.
 */
export function twoToneAnalysis(
  p: { f1: number; a1: number; f2: number; a2: number; sigma: number; N: number; fs: number; win: WindowName },
) {
  const { f1, a1, f2, a2, sigma, N, fs, win } = p;
  const rng = createRng(1);
  const time = Array.from({ length: N }, (_, n) => n / fs);
  const signal = time.map((t) => a1 * Math.sin(2 * Math.PI * f1 * t) + a2 * Math.sin(2 * Math.PI * f2 * t) + sigma * gaussian(rng));
  const w = windowSamples(win, N);
  const spec = amplitudeSpectrum(signal, fs, w);
  const df = fs / N;
  const floor = noiseFloorRms(sigma, w);
  const tones: ToneReading[] = [
    { f: f1, a: a1 },
    { f: f2, a: a2 },
  ].map(({ f, a }) => {
    const fa = aliasedFrequency(f, fs);
    const k = Math.round(fa / df);
    const near = spec.amplitude.slice(Math.max(0, k - 1), Math.min(spec.amplitude.length, k + 2));
    return { f, a, fa, bin: fa / df, read: Math.max(...near) };
  });
  return { time, signal, spec, df, floor, tones };
}
