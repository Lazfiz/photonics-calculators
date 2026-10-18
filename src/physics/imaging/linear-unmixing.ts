/**
 * Linear spectral unmixing y = E·x + noise, with E the B×K matrix of endmember spectra (rows = spectral bands,
 * columns = endmembers) and x the K abundances. Matrices are small (K ≤ 6), so the least-squares steps solve the
 * normal equations by Cholesky. Invalid or rank-deficient inputs give NaN.
 *
 * - OLS: x = (EᵀE)⁻¹Eᵀy, unconstrained (T. Zimmermann, J. Rietdorf, R. Pepperkok, FEBS Lett. 546, 87 (2003),
 *   doi:10.1016/S0014-5793(03)00521-0, for its use in fluorescence microscopy).
 * - NNLS: the active-set algorithm of C. L. Lawson, R. J. Hanson, Solving Least Squares Problems (Prentice-Hall 1974;
 *   SIAM 1995, doi:10.1137/1.9781611971217), ch. 23, x ≥ 0.
 * - FCLS: x ≥ 0 and Σx = s, by appending the row w·1ᵀ (target w·s) to E and solving NNLS (D. C. Heinz, C.-I Chang,
 *   IEEE Trans. Geosci. Remote Sens. 39, 529 (2001), doi:10.1109/36.911111). w = 10³·max|E| keeps |Σx − s| below
 *   ~10⁻⁶ s.
 * - Covariance of the OLS estimate for independent band noise of variances v_b: (EᵀE)⁻¹ Eᵀ diag(v) E (EᵀE)⁻¹, which is
 *   σ²(EᵀE)⁻¹ when every band has the same variance σ² (S. M. Kay, Fundamentals of Statistical Signal Processing:
 *   Estimation Theory, Prentice Hall 1993, §4.3). It holds for NNLS while no bound is active; the FCLS sum constraint
 *   is always active and removes the variance of Σx, so for FCLS it overstates the errors.
 * - Shares p_j = x_j/Σx: by the delta method Var p_j = gᵀ·Cov·g with g_k = (δ_jk − p_j)/Σx.
 * - Condition number κ(E) = √(λ_max/λ_min) of EᵀE: how much band noise is amplified in the abundances.
 */

import { symmetricEigenvalues } from "../math";
import { gaussian, type Rng } from "../random";

export type Matrix = readonly (readonly number[])[];

/** EᵀE, K×K. */
export function gram(E: Matrix): number[][] {
  const k = E[0]?.length ?? 0;
  const G = Array.from({ length: k }, () => Array<number>(k).fill(0));
  for (const row of E) for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) G[i][j] += row[i] * row[j];
  return G;
}

/** Eᵀy. */
export function transposeTimes(E: Matrix, y: readonly number[]): number[] {
  const k = E[0]?.length ?? 0;
  const out = Array<number>(k).fill(0);
  E.forEach((row, b) => row.forEach((e, i) => (out[i] += e * y[b])));
  return out;
}

/** E·x. */
export function reconstruct(E: Matrix, x: readonly number[]): number[] {
  return E.map((row) => row.reduce((s, e, i) => s + e * x[i], 0));
}

/** Solves A·z = b for symmetric positive-definite A by Cholesky; NaN entries if A is not positive definite. */
export function choleskySolve(A: Matrix, b: readonly number[]): number[] {
  const n = A.length;
  const L = Array.from({ length: n }, () => Array<number>(n).fill(0));
  const scale = Math.max(...A.map((r, i) => Math.abs(r[i])), 0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let s = A[i][j];
      for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
      if (i === j) {
        if (!(s > 1e-13 * scale)) return Array<number>(n).fill(NaN);
        L[i][i] = Math.sqrt(s);
      } else L[i][j] = s / L[j][j];
    }
  }
  const z = Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) {
    let s = b[i];
    for (let k = 0; k < i; k++) s -= L[i][k] * z[k];
    z[i] = s / L[i][i];
  }
  for (let i = n - 1; i >= 0; i--) {
    let s = z[i];
    for (let k = i + 1; k < n; k++) s -= L[k][i] * z[k];
    z[i] = s / L[i][i];
  }
  return z;
}

/** Inverse of a symmetric positive-definite matrix, column by column. */
export function invertSpd(A: Matrix): number[][] {
  const n = A.length;
  const cols = Array.from({ length: n }, (_, j) => choleskySolve(A, Array.from({ length: n }, (_, i) => (i === j ? 1 : 0))));
  return Array.from({ length: n }, (_, i) => cols.map((c) => c[i]));
}

/** Ordinary least squares x = (EᵀE)⁻¹Eᵀy. */
const finite = (E: Matrix, y: readonly number[]) => E.length === y.length && E.every((r) => r.every(Number.isFinite)) && y.every(Number.isFinite);

export function ols(E: Matrix, y: readonly number[]): number[] {
  if (!finite(E, y)) return Array<number>(E[0]?.length ?? 0).fill(NaN);
  return choleskySolve(gram(E), transposeTimes(E, y));
}

/** Least squares restricted to the columns in `set`; the other entries are 0. */
function subsetLeastSquares(E: Matrix, y: readonly number[], set: readonly number[], k: number): number[] {
  const sub = E.map((row) => set.map((j) => row[j]));
  const s = ols(sub, y);
  const full = Array<number>(k).fill(0);
  set.forEach((j, i) => (full[j] = s[i]));
  return full;
}

/** Non-negative least squares, Lawson & Hanson (1974) ch. 23; at most 3K outer iterations. */
export function nnls(E: Matrix, y: readonly number[]): number[] {
  const k = E[0]?.length ?? 0;
  if (!finite(E, y)) return Array<number>(k).fill(NaN);
  let x = Array<number>(k).fill(0);
  const passive = new Set<number>();
  const gradient = () => {
    const fit = reconstruct(E, x);
    return transposeTimes(E, y.map((v, b) => v - fit[b]));
  };
  const tol = 1e-12 * Math.max(1, ...transposeTimes(E, y).map(Math.abs));
  for (let iter = 0; iter < 3 * k; iter++) {
    const w = gradient();
    let t = -1;
    for (let j = 0; j < k; j++) if (!passive.has(j) && w[j] > tol && (t < 0 || w[j] > w[t])) t = j;
    if (t < 0) break;
    passive.add(t);
    for (let inner = 0; inner < 3 * k; inner++) {
      const s = subsetLeastSquares(E, y, [...passive], k);
      if (s.some((v) => Number.isNaN(v))) return Array<number>(k).fill(NaN);
      const negative = [...passive].filter((j) => s[j] <= 0 && x[j] - s[j] > 0);
      if (negative.length === 0) {
        x = s;
        break;
      }
      const alpha = Math.min(...negative.map((j) => x[j] / (x[j] - s[j])));
      x = x.map((v, j) => v + alpha * (s[j] - v));
      for (const j of [...passive]) if (x[j] <= tol) {
        passive.delete(j);
        x[j] = 0;
      }
    }
  }
  return x;
}

/** Fully constrained least squares: x ≥ 0 and Σx = total (Heinz & Chang 2001). */
export function fcls(E: Matrix, y: readonly number[], total: number): number[] {
  const w = 1e3 * Math.max(...E.flat().map(Math.abs));
  if (!(w > 0) || !Number.isFinite(total)) return Array<number>(E[0]?.length ?? 0).fill(NaN);
  return nnls([...E, E[0].map(() => w)], [...y, w * total]);
}

/** Covariance (EᵀE)⁻¹ Eᵀ diag(v) E (EᵀE)⁻¹ of the OLS abundances for band variances v. */
export function olsCovariance(E: Matrix, variances: readonly number[]): number[][] {
  const Ginv = invertSpd(gram(E));
  const k = Ginv.length;
  const M = Array.from({ length: k }, () => Array<number>(k).fill(0));
  E.forEach((row, b) => {
    for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) M[i][j] += row[i] * variances[b] * row[j];
  });
  const GM = Ginv.map((r) => M[0].map((_, j) => r.reduce((s, g, l) => s + g * M[l][j], 0)));
  return GM.map((r) => Ginv[0].map((_, j) => r.reduce((s, g, l) => s + g * Ginv[l][j], 0)));
}

/** Standard deviations of the shares x_j/Σx from the covariance of x (delta method). */
export function shareStdDev(x: readonly number[], cov: Matrix): number[] {
  const total = x.reduce((s, v) => s + v, 0);
  if (!(total > 0)) return x.map(() => NaN);
  const p = x.map((v) => v / total);
  return p.map((pj, j) => {
    const g = p.map((_, k) => ((k === j ? 1 : 0) - pj) / total);
    const v = g.reduce((s, gi, i) => s + gi * g.reduce((t, gk, k) => t + cov[i][k] * gk, 0), 0);
    return Math.sqrt(Math.max(0, v));
  });
}

/** κ(E) = √(λ_max/λ_min) of EᵀE; ∞ when E is rank deficient. */
export function conditionNumber(E: Matrix): number {
  const ev = symmetricEigenvalues(gram(E));
  const lo = ev[0];
  const hi = ev[ev.length - 1];
  if (!(hi > 0)) return NaN;
  return lo > 1e-14 * hi ? Math.sqrt(hi / lo) : Infinity;
}

/**
 * One noisy measurement of y = E·x: band b has mean m_b = (E·x)_b photoelectrons and variance m_b + σ_r² (shot noise
 * in the Gaussian limit of Poisson, plus read noise), drawn from `rng`.
 */
export function simulateMixture(E: Matrix, x: readonly number[], readNoise: number, rng: Rng): { mean: number[]; variance: number[]; y: number[] } {
  const mean = reconstruct(E, x);
  const variance = mean.map((m) => Math.max(0, m) + readNoise * readNoise);
  const y = mean.map((m, b) => m + Math.sqrt(variance[b]) * gaussian(rng));
  return { mean, variance, y };
}
