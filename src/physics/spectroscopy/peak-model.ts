import { firstCrossing, integrateSimpson, poissonPmf } from "../math";

/**
 * Band models for overlapping spectral peaks, and vibronic band shapes. Positions and widths share one unit (nm, cm⁻¹,
 * eV, …) except where a name says otherwise.
 *
 * Peaks are height-normalised (value 1 at the centre) so that a peak's "height" is its maximum:
 *   Gaussian    G(x) = exp(−4 ln 2 (x/w)²),     area = w √(π / (4 ln 2)) ≈ 1.064 467 w
 *   Lorentzian  L(x) = 1 / (1 + 4 (x/w)²),      area = (π/2) w
 *   pseudo-Voigt  η L + (1 − η) G, one FWHM w for both (the usual peak-fitting form, e.g. Thompson, Cox & Hastings,
 *   J. Appl. Cryst. 20, 79 (1987), doi 10.1107/S0021889887087090).
 * The Lorentzian area is the integral over the whole line, wings outside any plotted window included.
 */

export const PROFILES = ["gaussian", "lorentzian", "pseudo-voigt"] as const;
export type Profile = (typeof PROFILES)[number];
export interface Peak {
  center: number;
  fwhm: number;
  height: number;
}

const FOUR_LN2 = 4 * Math.LN2;
const GAUSS_AREA = Math.sqrt(Math.PI / FOUR_LN2);

/** Height-normalised peak shape at offset x from the centre; η (pseudo-Voigt only) is the Lorentzian fraction, 0–1. */
export function peakShape(x: number, fwhm: number, profile: Profile, eta = 0.5): number {
  if (!(fwhm > 0) || !(eta >= 0 && eta <= 1)) return NaN;
  const u = x / fwhm;
  const g = Math.exp(-FOUR_LN2 * u * u);
  const l = 1 / (1 + 4 * u * u);
  return profile === "gaussian" ? g : profile === "lorentzian" ? l : eta * l + (1 - eta) * g;
}

/** Integrated area of a peak of height h and FWHM w over the whole line. */
export function peakArea(height: number, fwhm: number, profile: Profile, eta = 0.5): number {
  if (!(fwhm > 0) || !(eta >= 0 && eta <= 1)) return NaN;
  const k = profile === "gaussian" ? GAUSS_AREA : profile === "lorentzian" ? Math.PI / 2 : eta * (Math.PI / 2) + (1 - eta) * GAUSS_AREA;
  return height * fwhm * k;
}

/** Sum of the peaks at x. */
export function bandSum(x: number, peaks: readonly Peak[], profile: Profile, eta = 0.5): number {
  let s = 0;
  for (const p of peaks) s += p.height * peakShape(x - p.center, p.fwhm, profile, eta);
  return s;
}

/**
 * Seeded Gaussian noise (zero mean, unit variance): mulberry32 uniforms through the Box–Muller transform. The same
 * seed gives the same sequence on the server and the client.
 */
export function gaussianNoise(n: number, seed: number): number[] {
  let a = seed >>> 0;
  const uniform = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out: number[] = [];
  while (out.length < n) {
    const u1 = 1 - uniform(); // (0, 1], so the log is finite
    const u2 = uniform();
    const r = Math.sqrt(-2 * Math.log(u1));
    out.push(r * Math.cos(2 * Math.PI * u2));
    if (out.length < n) out.push(r * Math.sin(2 * Math.PI * u2));
  }
  return out;
}

/** Cholesky factor L (lower, row-major) of a symmetric positive-definite n×n matrix; null if a pivot is ≤ tol·max diag. */
function cholesky(A: readonly number[][], tol = 1e-12): number[][] | null {
  const n = A.length;
  const maxDiag = Math.max(...A.map((row, i) => row[i]));
  if (!(maxDiag > 0)) return null;
  const L = A.map(() => new Array<number>(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let s = A[i][j];
      for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
      if (i === j) {
        if (!(s > tol * maxDiag)) return null;
        L[i][i] = Math.sqrt(s);
      } else L[i][j] = s / L[j][j];
    }
  }
  return L;
}

function choleskySolve(L: readonly number[][], b: readonly number[]): number[] {
  const n = L.length;
  const y = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) {
    let s = b[i];
    for (let k = 0; k < i; k++) s -= L[i][k] * y[k];
    y[i] = s / L[i][i];
  }
  const x = new Array<number>(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = y[i];
    for (let k = i + 1; k < n; k++) s -= L[k][i] * x[k];
    x[i] = s / L[i][i];
  }
  return x;
}

export interface HeightFit {
  heights: number[];
  /** Standard errors of the heights, s·√((BᵀB)⁻¹)ᵢᵢ with s² = RSS/(n − N). */
  stdErrors: number[];
  /** Correlation matrix of the fitted heights. */
  correlation: number[][];
  residualRms: number;
}

/**
 * Linear least-squares fit of the peak heights to data (xs, ys) with every centre and FWHM held fixed: the model is
 * y = Σ h_j shape_j(x), so the heights solve the normal equations (BᵀB) h = Bᵀy exactly (Cholesky). The covariance is
 * s²(BᵀB)⁻¹ (Press et al., Numerical Recipes 3rd ed., ch. 15, general linear least squares). Returns null for an ill-conditioned basis (two
 * identical peaks, or a peak with no samples under it) or fewer points than peaks + 1.
 */
export function fitHeights(xs: readonly number[], ys: readonly number[], shapes: readonly Omit<Peak, "height">[], profile: Profile, eta = 0.5): HeightFit | null {
  const n = xs.length, m = shapes.length;
  if (m === 0 || n !== ys.length || n <= m) return null;
  const B = xs.map((x) => shapes.map((p) => peakShape(x - p.center, p.fwhm, profile, eta)));
  if (B.some((row) => row.some((v) => !Number.isFinite(v)))) return null;
  const M = shapes.map((_, i) => shapes.map((__, j) => B.reduce((s, row) => s + row[i] * row[j], 0)));
  const L = cholesky(M);
  if (!L) return null;
  const heights = choleskySolve(L, shapes.map((_, i) => B.reduce((s, row, k) => s + row[i] * ys[k], 0)));
  const rss = B.reduce((s, row, k) => s + (ys[k] - row.reduce((t, v, j) => t + v * heights[j], 0)) ** 2, 0);
  const s2 = rss / (n - m);
  const inv = shapes.map((_, j) => choleskySolve(L, shapes.map((__, i) => (i === j ? 1 : 0)))); // columns of M⁻¹ (symmetric)
  const stdErrors = inv.map((col, i) => Math.sqrt(s2 * col[i]));
  const correlation = inv.map((col, i) => col.map((v, j) => v / Math.sqrt(inv[i][i] * inv[j][j])));
  return { heights, stdErrors, correlation, residualRms: Math.sqrt(rss / n) };
}

/**
 * Depth of the deepest dip in f between two peak centres a < b, from f sampled at `intervals` + 1 points: the largest
 * 1 − f(x) / min(max of f left of x, max of f right of x). 0 when f has no interior minimum (the two peaks merge into one
 * band, Sparrow's limit). For two equal Gaussians the dip appears at a separation of 2σ = w/√(2 ln 2) ≈ 0.849 w, for two
 * equal Lorentzians at w/√3 ≈ 0.577 w (where f″ at the midpoint changes sign).
 */
export function dipDepth(f: (x: number) => number, a: number, b: number, intervals = 400): number {
  if (!(b > a)) return NaN;
  const ys = Array.from({ length: intervals + 1 }, (_, i) => f(a + ((b - a) * i) / intervals));
  if (ys.some((y) => !Number.isFinite(y))) return NaN;
  const rightMax = [...ys];
  for (let i = intervals - 1; i >= 0; i--) rightMax[i] = Math.max(ys[i], rightMax[i + 1]);
  let leftMax = -Infinity, depth = 0;
  for (let i = 0; i <= intervals; i++) {
    leftMax = Math.max(leftMax, ys[i]);
    const level = Math.min(leftMax, rightMax[i]);
    if (level > 0) depth = Math.max(depth, 1 - ys[i] / level);
  }
  return depth;
}

export interface BandStats {
  /** Position of the maximum. */
  peak: number;
  max: number;
  /** Full width at half maximum around the main maximum; NaN if the band doesn't fall to half within [a, b]. */
  fwhm: number;
  /** First moment ∫x f dx / ∫f dx over [a, b]. */
  centroid: number;
}

/**
 * Maximum, FWHM and centroid of a band f ≥ 0 on [a, b]: the maximum from `samples` + 1 samples refined by a parabola
 * through the best three, the half-maximum crossings by bisection (firstCrossing, samples/2 intervals on each side), the
 * centroid by Simpson's rule on 2·samples intervals. Give at least a few samples per FWHM of the narrowest feature.
 */
export function bandStats(f: (x: number) => number, a: number, b: number, samples = 2000): BandStats {
  const nan = { peak: NaN, max: NaN, fwhm: NaN, centroid: NaN };
  if (!(b > a)) return nan;
  const dx = (b - a) / samples;
  let iMax = 0, yMax = -Infinity;
  for (let i = 0; i <= samples; i++) {
    const y = f(a + i * dx);
    if (Number.isNaN(y)) return nan;
    if (y > yMax) (yMax = y), (iMax = i);
  }
  if (!(yMax > 0)) return nan;
  let peak = a + iMax * dx;
  if (iMax > 0 && iMax < samples) {
    const y0 = f(peak - dx), y2 = f(peak + dx);
    const den = y0 - 2 * yMax + y2;
    if (den < 0) peak += (0.5 * dx * (y0 - y2)) / den;
  }
  const max = f(peak);
  const half = Math.max(1000, Math.ceil(samples / 2));
  const lo = firstCrossing(f, peak, a, max / 2, half);
  const hi = firstCrossing(f, peak, b, max / 2, half);
  const n = 2 * samples;
  const area = integrateSimpson(f, a, b, n);
  const centroid = area > 0 ? integrateSimpson((x) => x * f(x), a, b, n) / area : NaN;
  return { peak, max, fwhm: hi - lo, centroid };
}

/*
 * Vibronic band of a molecule whose ground and excited states are harmonic potentials of one vibrational mode
 * (wavenumber ν̃_v), displaced from each other, with the excited molecule relaxed to its v' = 0 level and T ≈ 0 (Huang
 * & Rhys, Proc. R. Soc. A 204, 406 (1950), doi 10.1098/rspa.1950.0184). The 0–n Franck–Condon factors are Poisson,
 * P_n = e^(−S) Sⁿ / n!, with S the Huang–Rhys factor. Absorption lines lie at ν̃₀₀ + n ν̃_v, emission lines at
 * ν̃₀₀ − n ν̃_v, so the two line-shape functions are mirror images about ν̃₀₀ and their centroids are S ν̃_v away from
 * it on each side: a Stokes shift of 2 S ν̃_v (twice the reorganisation energy). Each line is given one Gaussian
 * width (inhomogeneous plus unresolved low-frequency modes). The spectra carry the frequency factors of Strickler &
 * Berg, J. Chem. Phys. 37, 814 (1962), doi 10.1063/1.1733166: ε(ν̃) ∝ ν̃ × line shape for absorption, and photons per
 * unit wavenumber ∝ ν̃³ × line shape for emission.
 */

/** Franck–Condon factors P_0 … P_N, up to the first n ≥ S where the remaining tail is below tol (at most 400 terms). */
export function franckCondonWeights(S: number, tol = 1e-9): number[] {
  if (!(S >= 0 && S <= 100)) return [];
  const w: number[] = [];
  let cum = 0;
  for (let n = 0; n < 400; n++) {
    const p = poissonPmf(n, S);
    w.push(p);
    cum += p;
    if (n >= S && 1 - cum < tol) break;
  }
  return w;
}

export interface VibronicBand {
  /** 0–0 transition wavenumber, cm⁻¹. */
  nu00: number;
  /** Vibrational wavenumber of the progression-forming mode, cm⁻¹. */
  nuVib: number;
  /** Huang–Rhys factor. */
  S: number;
  /** Gaussian FWHM of each vibronic line, cm⁻¹. */
  fwhm: number;
}

/** Vibronic line-shape sum Σ P_n G(ν̃ − ν̃_n), with ν̃_n = ν̃₀₀ ± n ν̃_v (+ for absorption), per cm⁻¹, no frequency factor. */
export function vibronicLineShape(nu: number, band: VibronicBand, kind: "absorption" | "emission", weights = franckCondonWeights(band.S)): number {
  if (!(band.fwhm > 0 && band.nuVib > 0 && band.nu00 > 0) || weights.length === 0) return NaN;
  const sign = kind === "absorption" ? 1 : -1;
  let s = 0;
  for (let n = 0; n < weights.length; n++) {
    const u = (nu - band.nu00 - sign * n * band.nuVib) / band.fwhm;
    s += weights[n] * Math.exp(-FOUR_LN2 * u * u);
  }
  return s;
}

/** Absorption spectrum ε(ν̃) ∝ ν̃ × line shape, or emission photons per cm⁻¹ ∝ ν̃³ × line shape; 0 for ν̃ ≤ 0. */
export function vibronicSpectrum(nu: number, band: VibronicBand, kind: "absorption" | "emission", weights = franckCondonWeights(band.S)): number {
  if (!(nu > 0)) return 0;
  return (kind === "absorption" ? nu : nu ** 3) * vibronicLineShape(nu, band, kind, weights);
}

/**
 * The same spectra against wavelength λ (nm). ε is a property at each wavelength and carries over unchanged; the
 * emission is a spectral density, so photons per nm = photons per cm⁻¹ × |dν̃/dλ| = × 10⁷/λ² (Mooney & Kambhampati,
 * J. Phys. Chem. Lett. 4, 3316 (2013), doi 10.1021/jz401508t).
 */
export function vibronicSpectrumNm(lambda_nm: number, band: VibronicBand, kind: "absorption" | "emission", weights = franckCondonWeights(band.S)): number {
  if (!(lambda_nm > 0)) return NaN;
  const nu = 1e7 / lambda_nm;
  const y = vibronicSpectrum(nu, band, kind, weights);
  return kind === "absorption" ? y : (y * 1e7) / (lambda_nm * lambda_nm);
}
