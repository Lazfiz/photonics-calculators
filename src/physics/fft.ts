/**
 * Discrete Fourier transform. Dimensionless. Model tier: exact (to rounding).
 *
 * Forward X_k = Σ_n x_n e^(−2πikn/N); inverse x_n = (1/N) Σ_k X_k e^(+2πikn/N).
 * Power-of-two lengths use the iterative radix-2 Cooley–Tukey algorithm (J. W. Cooley, J. W. Tukey, Math. Comput.
 * 19, 297 (1965)); any other length uses Bluestein's chirp-z identity nk = (n² + k² − (k − n)²)/2, which turns the
 * DFT into a circular convolution done with radix-2 transforms (L. I. Bluestein, IEEE Trans. Audio Electroacoust.
 * 18, 451 (1970)). Both are O(N log N).
 */

/** Smallest power of two ≥ n (1 for n ≤ 1). */
export function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

/** In-place radix-2 transform of (re, im); the length must be a power of two. `inverse` includes the 1/N. */
export function fftRadix2(re: number[], im: number[], inverse = false): void {
  const N = re.length;
  if (N !== im.length || N !== nextPow2(N)) throw new Error("fftRadix2: length must be a power of two");
  for (let i = 1, j = 0; i < N; i++) {
    let bit = N >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  const sign = inverse ? 1 : -1;
  for (let len = 2; len <= N; len *= 2) {
    const half = len / 2;
    const step = (sign * 2 * Math.PI) / len;
    for (let k = 0; k < half; k++) {
      const wr = Math.cos(step * k);
      const wi = Math.sin(step * k);
      for (let s = k; s < N; s += len) {
        const t = s + half;
        const xr = re[t] * wr - im[t] * wi;
        const xi = re[t] * wi + im[t] * wr;
        re[t] = re[s] - xr;
        im[t] = im[s] - xi;
        re[s] += xr;
        im[s] += xi;
      }
    }
  }
  if (inverse) for (let i = 0; i < N; i++) { re[i] /= N; im[i] /= N; }
}

/** DFT of any length N ≥ 1 (new arrays; the input is untouched). `im` defaults to zeros. */
export function dft(re: readonly number[], im?: readonly number[], inverse = false): { re: number[]; im: number[] } {
  const N = re.length;
  const xr = [...re];
  const xi = im ? [...im] : new Array<number>(N).fill(0);
  if (N === 0) return { re: xr, im: xi };
  if (N === nextPow2(N)) {
    fftRadix2(xr, xi, inverse);
    return { re: xr, im: xi };
  }
  // Bluestein: X_k = w_k Σ_n (x_n w_n) conj(w_{k−n}), w_n = e^(∓iπn²/N); n² taken mod 2N to keep the angle small.
  const sign = inverse ? 1 : -1;
  const M = nextPow2(2 * N - 1);
  const wr = new Array<number>(N);
  const wi = new Array<number>(N);
  for (let n = 0; n < N; n++) {
    const a = (sign * Math.PI * ((n * n) % (2 * N))) / N;
    wr[n] = Math.cos(a);
    wi[n] = Math.sin(a);
  }
  const ar = new Array<number>(M).fill(0);
  const ai = new Array<number>(M).fill(0);
  const br = new Array<number>(M).fill(0);
  const bi = new Array<number>(M).fill(0);
  for (let n = 0; n < N; n++) {
    ar[n] = xr[n] * wr[n] - xi[n] * wi[n];
    ai[n] = xr[n] * wi[n] + xi[n] * wr[n];
    br[n] = wr[n];
    bi[n] = -wi[n];
    if (n > 0) { br[M - n] = wr[n]; bi[M - n] = -wi[n]; }
  }
  fftRadix2(ar, ai);
  fftRadix2(br, bi);
  for (let k = 0; k < M; k++) {
    const r = ar[k] * br[k] - ai[k] * bi[k];
    ai[k] = ar[k] * bi[k] + ai[k] * br[k];
    ar[k] = r;
  }
  fftRadix2(ar, ai, true);
  for (let k = 0; k < N; k++) {
    xr[k] = ar[k] * wr[k] - ai[k] * wi[k];
    xi[k] = ar[k] * wi[k] + ai[k] * wr[k];
    if (inverse) { xr[k] /= N; xi[k] /= N; }
  }
  return { re: xr, im: xi };
}
