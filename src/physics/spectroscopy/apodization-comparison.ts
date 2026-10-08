/**
 * Apodization (window) functions and their instrument line shapes (ILS). Dimensionless. Model tier: exact.
 *
 * Symmetric N-point windows on x = n − M, n = 0 … N − 1, M = (N − 1)/2, so x ∈ [−M, M] and the window
 * is 1 (or its maximum) at the centre. The cosine-sum windows
 *   w(n) = Σ_k (−1)^k a_k cos(2πkn/(N − 1)) = Σ_k a_k cos(πk x/M)
 * (F. J. Harris, Proc. IEEE 66, 51 (1978), eq. 30–32) use the coefficients of Harris's Table I, and Nuttall's
 * 4-term window with a continuous first derivative (A. H. Nuttall, IEEE Trans. ASSP 29, 84 (1981)).
 * Gaussian: exp(−½(αx/M)²); Kaiser–Bessel: I₀(β√(1 − (x/M)²))/I₀(β), β = πα in Harris's notation.
 *
 * `sidelobeDb` (highest sidelobe) and `enbw` (equivalent noise bandwidth in bins, N Σw²/(Σw)²) are measured
 * from these windows at N = 512 and rounded. For the cosine-sum and triangular windows they agree with
 * Harris's Table I. His Gaussian entries don't fit his own definition (α = 3 gives an ENBW of 1.70 by direct
 * integration, not 1.64), and Nuttall (1981) corrected several others.
 * tests/spectroscopy-apodization-comparison.test.ts recomputes every entry.
 */
import { besselI0 } from "../math";

export type WindowName =
  | "boxcar" | "hanning" | "hamming" | "blackman" | "blackman-harris" | "nuttall" | "gaussian" | "triangular" | "kaiser";

/** Gaussian α and Kaiser β used by the page. */
export const GAUSSIAN_ALPHA = 3;
export const KAISER_BETA = 8;

const COSINE_SUM: Partial<Record<WindowName, number[]>> = {
  boxcar: [1],
  hanning: [0.5, 0.5],
  hamming: [0.54, 0.46],
  blackman: [0.42, 0.5, 0.08],
  "blackman-harris": [0.35875, 0.48829, 0.14128, 0.01168],
  nuttall: [0.355768, 0.487396, 0.144232, 0.012604],
};

export const WINDOWS: Record<WindowName, { label: string; sidelobeDb: number; enbw: number }> = {
  boxcar: { label: "Boxcar", sidelobeDb: -13, enbw: 1.0 },
  hanning: { label: "Hanning", sidelobeDb: -31, enbw: 1.5 },
  hamming: { label: "Hamming", sidelobeDb: -43, enbw: 1.36 },
  blackman: { label: "Blackman", sidelobeDb: -58, enbw: 1.73 },
  "blackman-harris": { label: "Blackman-Harris", sidelobeDb: -92, enbw: 2.01 },
  nuttall: { label: "Nuttall", sidelobeDb: -93, enbw: 2.02 },
  gaussian: { label: `Gaussian (α=${GAUSSIAN_ALPHA})`, sidelobeDb: -56, enbw: 1.7 },
  triangular: { label: "Triangular", sidelobeDb: -27, enbw: 1.34 },
  kaiser: { label: `Kaiser (β=${KAISER_BETA})`, sidelobeDb: -59, enbw: 1.67 },
};

/** N samples (N ≥ 2 integer) of the named window. Empty for an invalid N. */
export function windowSamples(name: WindowName, N: number): number[] {
  if (!Number.isInteger(N) || N < 2) return [];
  const M = (N - 1) / 2;
  const x = Array.from({ length: N }, (_, n) => (n - M) / M); // −1 … 1
  const coeffs = COSINE_SUM[name];
  if (coeffs) return x.map((u) => coeffs.reduce((s, a, k) => s + a * Math.cos(Math.PI * k * u), 0));
  switch (name) {
    case "gaussian":
      return x.map((u) => Math.exp(-0.5 * (GAUSSIAN_ALPHA * u) ** 2));
    case "triangular":
      return x.map((u) => 1 - Math.abs(u));
    case "kaiser": {
      const norm = besselI0(KAISER_BETA);
      return x.map((u) => besselI0(KAISER_BETA * Math.sqrt(Math.max(0, 1 - u * u))) / norm);
    }
    default:
      return [];
  }
}

/**
 * |DFT| of the window, zero-padded to `oversample`·N points, normalized to its peak and in dB (floored at
 * −240 dB). Returns bins 0 … min(N/2, maxBin) in steps of 1/oversample (in units of the unpadded bin width).
 */
export function lineShapeDb(w: number[], oversample: number, maxBin = Infinity): { bins: number[]; db: number[] } {
  const N = w.length;
  const P = N * oversample;
  const count = Math.floor(Math.min(P / 2, maxBin * oversample + 1));
  const mag = Array.from({ length: count }, (_, k) => {
    let re = 0;
    let im = 0;
    for (let n = 0; n < N; n++) {
      const phase = (2 * Math.PI * k * n) / P;
      re += w[n] * Math.cos(phase);
      im -= w[n] * Math.sin(phase);
    }
    return Math.hypot(re, im);
  });
  const peak = Math.max(...mag);
  return {
    bins: mag.map((_, k) => k / oversample),
    db: mag.map((m) => 20 * Math.log10(Math.max(m / peak, 1e-12))),
  };
}

/** Highest sidelobe, dB: the largest value after the first local minimum of the line shape. */
export function highestSidelobeDb(db: number[]): number {
  let k = 1;
  while (k < db.length - 1 && !(db[k] <= db[k - 1] && db[k] <= db[k + 1])) k++;
  return Math.max(...db.slice(k));
}

/** Equivalent noise bandwidth in bins, N Σw² / (Σw)². */
export function equivalentNoiseBandwidth(w: number[]): number {
  const sum = w.reduce((s, v) => s + v, 0);
  const sum2 = w.reduce((s, v) => s + v * v, 0);
  return (w.length * sum2) / (sum * sum);
}
