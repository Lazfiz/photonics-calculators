/**
 * Shared special functions and probability helpers. Pure and dimensionless.
 *
 * erf / erfc (relative error < 1e-15 for erf, < 2e-13 for erfc down to the subnormal range;
 * checked against CPython math.erf/erfc on a 0.01 grid over [−3, 26]; see tests/math.test.ts):
 *   |x| < 2: positive-term series (DLMF 7.6.2; A&S 7.1.6), no cancellation;
 *   |x| ≥ 2: Laplace continued fraction (DLMF 7.9.2; A&S 7.1.14) evaluated backwards,
 *   so erfc keeps full relative accuracy in the far tail instead of computing 1 − erf.
 */

const SQRT_PI = Math.sqrt(Math.PI);
const SERIES_LIMIT = 2;
const CF_TERMS = 120; // backward CF depth; converged to < 1e-16 for x ≥ 2

/** Unnormalised sinc, sin x / x, with the series 1 − x²/6 near 0. */
export function sinc(x: number): number {
  return Math.abs(x) < 1e-4 ? 1 - (x * x) / 6 : Math.sin(x) / x;
}

/** erf(x) for x ≥ 0 via erf x = (2/√π) e^(−x²) Σ 2ⁿ x^(2n+1) / (1·3·…·(2n+1)). */
function erfSeries(x: number): number {
  const twoX2 = 2 * x * x;
  let term = x;
  let sum = x;
  for (let n = 1; n < 200; n++) {
    term *= twoX2 / (2 * n + 1);
    sum += term;
    if (term <= 1e-17 * sum) break;
  }
  return (2 / SQRT_PI) * Math.exp(-x * x) * sum;
}

/** erfc(x) for x ≥ SERIES_LIMIT: √π e^(x²) erfc x = 1/(x + (1/2)/(x + 1/(x + (3/2)/(x + …)))). */
function erfcContinuedFraction(x: number): number {
  let f = x;
  for (let k = CF_TERMS; k >= 1; k--) f = x + k / 2 / f;
  return Math.exp(-x * x) / (SQRT_PI * f);
}

export function erf(x: number): number {
  if (Number.isNaN(x)) return NaN;
  const ax = Math.abs(x);
  const value = ax < SERIES_LIMIT ? erfSeries(ax) : 1 - erfcContinuedFraction(ax);
  return x < 0 ? -value : value;
}

export function erfc(x: number): number {
  if (Number.isNaN(x)) return NaN;
  if (x < 0) return 2 - erfc(-x);
  return x < SERIES_LIMIT ? 1 - erfSeries(x) : erfcContinuedFraction(x);
}

/**
 * Scaled complementary error function erfcx(x) = e^(x²) erfc(x) for x ≥ 0, with no overflow in the tail
 * (erfcx x → 1/(x√π)): the same series and continued fraction as erfc, without the e^(−x²) factor. NaN for x < 0.
 */
export function erfcx(x: number): number {
  if (!(x >= 0)) return NaN;
  if (x < SERIES_LIMIT) return Math.exp(x * x) * (1 - erfSeries(x));
  let f = x;
  for (let k = CF_TERMS; k >= 1; k--) f = x + k / 2 / f;
  return 1 / (SQRT_PI * f);
}

/** Gaussian tail probability Q(x) = P(Z > x) = ½ erfc(x/√2), Z ~ N(0, 1). */
export function qFunction(x: number): number {
  return 0.5 * erfc(x / Math.SQRT2);
}

/** Standard normal CDF Φ(x) = ½ erfc(−x/√2). */
export function normalCdf(x: number): number {
  return 0.5 * erfc(-x / Math.SQRT2);
}

// ln k! : exact table for small k, Stirling series beyond (DLMF 5.11.1; truncation < 1e-20 at k ≥ 256).
const LN_FACTORIAL_TABLE: number[] = [0];
for (let k = 1; k <= 256; k++) LN_FACTORIAL_TABLE.push(LN_FACTORIAL_TABLE[k - 1] + Math.log(k));

/** ln(k!) for integer k ≥ 0; NaN otherwise. */
export function lnFactorial(k: number): number {
  if (!Number.isInteger(k) || k < 0) return NaN;
  if (k < LN_FACTORIAL_TABLE.length) return LN_FACTORIAL_TABLE[k];
  const inv = 1 / k;
  const inv2 = inv * inv;
  return (
    (k + 0.5) * Math.log(k) - k + 0.5 * Math.log(2 * Math.PI) +
    inv * (1 / 12 - inv2 * (1 / 360 - inv2 * (1 / 1260 - inv2 / 1680)))
  );
}

function validMean(mu: number): boolean {
  return Number.isFinite(mu) && mu >= 0;
}

/** Poisson probability P(K = k) for mean mu ≥ 0. */
export function poissonPmf(k: number, mu: number): number {
  if (!validMean(mu) || Number.isNaN(k)) return NaN;
  if (!Number.isInteger(k) || k < 0) return 0;
  if (mu === 0) return k === 0 ? 1 : 0;
  return Math.exp(k * Math.log(mu) - mu - lnFactorial(k));
}

const TAIL_TOLERANCE = 1e-17;
const TAIL_MAX_TERMS = 10_000_000;

/** Σ_{j=0..k} P(j) for k < mu: terms shrink as j falls, so sum downward from j = k. */
function poissonLowerTail(k: number, mu: number): number {
  let term = poissonPmf(k, mu);
  let sum = term;
  for (let j = k; j > 0 && k - j < TAIL_MAX_TERMS; j--) {
    term *= j / mu;
    sum += term;
    if (term <= TAIL_TOLERANCE * sum) break;
  }
  return sum;
}

/** Σ_{j>k} P(j) for k ≥ mu: terms shrink as j rises, so sum upward from j = k + 1. */
function poissonUpperTail(k: number, mu: number): number {
  let term = poissonPmf(k + 1, mu);
  let sum = term;
  for (let j = k + 1; j - k < TAIL_MAX_TERMS; j++) {
    term *= mu / (j + 1);
    sum += term;
    if (term <= TAIL_TOLERANCE * sum) break;
  }
  return sum;
}

/**
 * Poisson CDF P(K ≤ k). The tail away from the mode is summed directly, so small tails keep
 * full relative accuracy; the other side is 1 − tail.
 */
export function poissonCdf(k: number, mu: number): number {
  if (!validMean(mu) || Number.isNaN(k)) return NaN;
  const kk = Math.floor(k);
  if (kk < 0) return 0;
  if (mu === 0 || kk === Infinity) return 1;
  return kk < mu ? poissonLowerTail(kk, mu) : 1 - poissonUpperTail(kk, mu);
}

/** Poisson survival function P(K > k), accurate in the upper tail. */
export function poissonSf(k: number, mu: number): number {
  if (!validMean(mu) || Number.isNaN(k)) return NaN;
  const kk = Math.floor(k);
  if (kk < 0) return 1;
  if (mu === 0 || kk === Infinity) return 0;
  return kk < mu ? 1 - poissonLowerTail(kk, mu) : poissonUpperTail(kk, mu);
}

/** Smallest k with P(K ≤ k) ≥ p (0 ≤ p < 1), by bisection on k; NaN for an invalid mean or p. */
export function poissonQuantile(p: number, mu: number): number {
  if (!validMean(mu) || !(p >= 0 && p < 1)) return NaN;
  let lo = -1;
  let hi = Math.ceil(mu + 10 * Math.sqrt(mu) + 10);
  while (poissonCdf(hi, mu) < p) hi *= 2;
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (poissonCdf(mid, mu) >= p) hi = mid;
    else lo = mid;
  }
  return hi;
}

/*
 * Bessel functions from their integral representations, summed with the trapezoidal rule. For these
 * integrands (periodic, or decaying double-exponentially on the real line) the rule converges
 * exponentially (Trefethen & Weideman, SIAM Rev. 56, 385 (2014)), so a fixed grid reaches ~1e-15.
 * Checked against A&S Tables 9.1 and 9.8 in tests/math.test.ts.
 */

/** J_n(x) for integer n ≥ 0: J_n(x) = (1/2π) ∫₀^{2π} cos(nτ − x sin τ) dτ (DLMF 10.9.2). */
export function besselJ(n: number, x: number): number {
  if (!Number.isInteger(n) || n < 0 || !Number.isFinite(x)) return NaN;
  if (x === 0) return n === 0 ? 1 : 0;
  // The N-point rule returns J_n + J_{N−n} ± …; with N > |x| + n + 64 the aliases are below 1e-17.
  const N = 2 * Math.ceil(Math.abs(x) + n) + 64;
  let sum = 0;
  for (let k = 0; k < N; k++) {
    const t = (2 * Math.PI * k) / N;
    sum += Math.cos(n * t - x * Math.sin(t));
  }
  return sum / N;
}

/**
 * Exponentially scaled modified Bessel function e^x K_ν(x) for real ν and x > 0:
 * ∫₀^∞ e^(−x (cosh t − 1)) cosh(νt) dt (DLMF 10.32.9). Trapezoidal rule with step min(0.05, 0.5/√x), so the
 * peak of width ~1/√x keeps ≥ 20 points at large x; the sum stops once the terms (decreasing past
 * cosh t = (1 + |ν|)/x) fall below 1e-17 of it. Finite for large x, where K_ν itself underflows (x ≳ 700).
 * K_ν(0) = ∞; negative x gives NaN.
 */
export function besselKScaled(nu: number, x: number): number {
  if (!Number.isFinite(nu) || Number.isNaN(x) || x < 0) return NaN;
  if (x === 0) return Infinity;
  if (x === Infinity) return 0;
  const h = Math.min(0.05, 0.5 / Math.sqrt(x));
  let sum = 0.5;
  for (let k = 1; k < 20000; k++) {
    const t = k * h;
    const ch = Math.cosh(t);
    const term = Math.exp(-x * (ch - 1)) * Math.cosh(nu * t);
    sum += term;
    if (term <= 1e-17 * sum && x * ch > 1 + Math.abs(nu)) break;
  }
  return h * sum;
}

/** Modified Bessel function K_ν(x) = e^(−x) · besselKScaled(ν, x). */
export function besselK(nu: number, x: number): number {
  return Math.exp(-x) * besselKScaled(nu, x);
}

/** I₀(x) = (1/2π) ∫₀^{2π} e^(x cos τ) dτ (DLMF 10.32.1), trapezoidal rule as for besselJ. */
export function besselI0(x: number): number {
  if (!Number.isFinite(x)) return Number.isNaN(x) ? NaN : Infinity;
  const N = 2 * Math.ceil(Math.abs(x)) + 64;
  let sum = 0;
  for (let k = 0; k < N; k++) sum += Math.exp(x * Math.cos((2 * Math.PI * k) / N));
  return sum / N;
}

/**
 * Exponentially scaled e^(−x) I_n(x) for integer n ≥ 0 and x ≥ 0: (1/2π) ∫₀^{2π} e^(x (cos τ − 1)) cos(nτ) dτ
 * (DLMF 10.32.3), trapezoidal rule as for besselJ. Finite for large x, where I_n overflows (x ≳ 700).
 */
export function besselIScaled(n: number, x: number): number {
  if (!Number.isInteger(n) || n < 0 || Number.isNaN(x) || x < 0) return NaN;
  if (x === Infinity) return 0;
  if (x === 0) return n === 0 ? 1 : 0;
  const N = 2 * Math.ceil(x + n) + 64;
  let sum = 0;
  for (let k = 0; k < N; k++) {
    const t = (2 * Math.PI * k) / N;
    sum += Math.exp(x * (Math.cos(t) - 1)) * Math.cos(n * t);
  }
  return sum / N;
}

/** [e^(−x) I₀(x), e^(−x) I₁(x)] in one pass of the besselIScaled rule (mode solvers need both). */
export function besselIScaled01(x: number): [number, number] {
  if (Number.isNaN(x) || x < 0) return [NaN, NaN];
  if (x === Infinity) return [0, 0];
  if (x === 0) return [1, 0];
  const N = 2 * Math.ceil(x + 1) + 64;
  let s0 = 0;
  let s1 = 0;
  for (let k = 0; k < N; k++) {
    const ct = Math.cos((2 * Math.PI * k) / N);
    const e = Math.exp(x * (ct - 1));
    s0 += e;
    s1 += e * ct;
  }
  return [s0 / N, s1 / N];
}

/** [e^x K₀(x), e^x K₁(x)] in one pass of the besselKScaled rule (step and stopping test for ν = 1). */
export function besselKScaled01(x: number): [number, number] {
  if (Number.isNaN(x) || x < 0) return [NaN, NaN];
  if (x === 0) return [Infinity, Infinity];
  if (x === Infinity) return [0, 0];
  const h = Math.min(0.05, 0.5 / Math.sqrt(x));
  let s0 = 0.5;
  let s1 = 0.5;
  for (let k = 1; k < 20000; k++) {
    const ch = Math.cosh(k * h);
    const e = Math.exp(-x * (ch - 1));
    s0 += e;
    s1 += e * ch;
    if (e * ch <= 1e-17 * s1 && x * ch > 2) break;
  }
  return [h * s0, h * s1];
}

const EULER_GAMMA = 0.5772156649015329;
/** Largest argument of besselY: the series cancels from terms of size ≈ I₀(x), so ~1e-8 absolute error at 20. */
export const BESSEL_Y_MAX_X = 20;

/**
 * Y_n(x) for n = 0, 1 and 0 < x ≤ BESSEL_Y_MAX_X, from the ascending series (DLMF 10.8.1, A&S 9.1.13):
 *   Y₀ = (2/π)(ln(x/2) + γ) J₀ + (2/π) Σ_{k≥1} (−1)^(k+1) H_k (x²/4)^k/(k!)²,
 *   Y₁ = (2/π) ln(x/2) J₁ − 2/(πx) − (x/2π) Σ_{k≥0} (ψ(k+1) + ψ(k+2)) (−x²/4)^k/(k!(k+1)!),
 * with H_k the harmonic numbers and ψ(m) = H_{m−1} − γ. NaN outside the domain.
 */
export function besselY(n: 0 | 1, x: number): number {
  if ((n !== 0 && n !== 1) || !(x > 0) || x > BESSEL_Y_MAX_X) return NaN;
  const q = (x * x) / 4;
  const lnHalf = Math.log(x / 2);
  if (n === 0) {
    let term = 1; // (x²/4)^k/(k!)²
    let H = 0;
    let sum = 0;
    for (let k = 1; k < 200; k++) {
      term *= q / (k * k);
      H += 1 / k;
      const t = (k % 2 === 1 ? 1 : -1) * H * term;
      sum += t;
      if (Math.abs(t) < 1e-17 * Math.max(1, Math.abs(sum)) && k > q) break;
    }
    return (2 / Math.PI) * ((lnHalf + EULER_GAMMA) * besselJ(0, x) + sum);
  }
  let term = 1; // (−x²/4)^k/(k!(k+1)!)
  let H = 0; // H_k
  let sum = 0;
  for (let k = 0; k < 200; k++) {
    if (k > 0) {
      term *= -q / (k * (k + 1));
      H += 1 / k;
    }
    const t = (2 * H + 1 / (k + 1) - 2 * EULER_GAMMA) * term; // ψ(k+1) + ψ(k+2)
    sum += t;
    if (Math.abs(t) < 1e-17 * Math.max(1, Math.abs(sum)) && k > q) break;
  }
  return (2 / Math.PI) * lnHalf * besselJ(1, x) - 2 / (Math.PI * x) - (x / (2 * Math.PI)) * sum;
}

/*
 * Sampled search and averages for smooth functions of one variable (spectra, transfer curves).
 */

/**
 * First x where f crosses `level`, going from a to b (a > b is allowed): f is sampled at `intervals` + 1
 * evenly spaced points and the first bracket (sign change of f − level) is bisected until it is
 * 1e-13·|b − a| wide (at most 100 halvings). A crossing narrower than one sample interval can be missed. Returns a if
 * f(a) = level, NaN if f(a) is NaN or there is no sign change before b.
 */
export function firstCrossing(f: (x: number) => number, a: number, b: number, level: number, intervals = 200): number {
  if (!(Number.isFinite(a) && Number.isFinite(b) && intervals >= 1)) return NaN;
  const fa = f(a) - level;
  if (Number.isNaN(fa)) return NaN;
  if (fa === 0) return a;
  const n = Math.ceil(intervals);
  let lo = a;
  for (let i = 1; i <= n; i++) {
    const x = a + ((b - a) * i) / n;
    const fx = f(x) - level;
    if (Number.isNaN(fx)) return NaN;
    if (fx === 0) return x;
    if (fx > 0 !== fa > 0) {
      let hi = x;
      const tol = 1e-13 * Math.abs(b - a);
      for (let k = 0; k < 100 && Math.abs(hi - lo) > tol; k++) {
        const mid = (lo + hi) / 2;
        const fm = f(mid) - level;
        if (fm === 0) return mid;
        if (fm > 0 === fa > 0) lo = mid;
        else hi = mid;
      }
      return (lo + hi) / 2;
    }
    lo = x;
  }
  return NaN;
}

/**
 * Mean (trapezoidal rule), minimum and maximum of f over [a, b] from `intervals` + 1 evenly spaced
 * samples. NaN in every field if a or b isn't finite, a ≥ b, or a sample is NaN.
 */
export function intervalStats(
  f: (x: number) => number,
  a: number,
  b: number,
  intervals = 400,
): { mean: number; min: number; max: number } {
  const nan = { mean: NaN, min: NaN, max: NaN };
  if (!(Number.isFinite(a) && Number.isFinite(b) && a < b && intervals >= 1)) return nan;
  const n = Math.ceil(intervals);
  let sum = 0;
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i <= n; i++) {
    const y = f(a + ((b - a) * i) / n);
    if (Number.isNaN(y)) return nan;
    sum += i === 0 || i === n ? y / 2 : y;
    if (y < min) min = y;
    if (y > max) max = y;
  }
  return { mean: sum / n, min, max };
}

/**
 * Phases (rad) with the 2π jumps removed: each step from the previous finite value is brought into
 * (−π, π]. Correct while the true phase changes by less than π between samples. NaN entries stay NaN
 * and don't break the chain.
 */
export function unwrapPhase(phases: readonly number[]): number[] {
  const out: number[] = [];
  let prev = NaN;
  let offset = 0;
  for (const p of phases) {
    if (!Number.isFinite(p)) {
      out.push(NaN);
      continue;
    }
    if (Number.isFinite(prev)) {
      let step = p + offset - prev;
      step -= 2 * Math.PI * Math.ceil((step - Math.PI) / (2 * Math.PI));
      offset = prev + step - p;
    }
    prev = p + offset;
    out.push(prev);
  }
  return out;
}

/**
 * Largest eigenvalue of a symmetric 3×3 matrix (row-major), trigonometric method of O. K. Smith, "Eigenvalues of a
 * symmetric 3 × 3 matrix", Commun. ACM 4, 168 (1961), doi:10.1145/355578.366316. The smallest is −λ_max(−A).
 */
export function largestSymmetricEigenvalue(A: readonly number[]): number {
  const p1 = A[1] ** 2 + A[2] ** 2 + A[5] ** 2;
  if (p1 === 0) return Math.max(A[0], A[4], A[8]);
  const q = (A[0] + A[4] + A[8]) / 3;
  const p = Math.sqrt(((A[0] - q) ** 2 + (A[4] - q) ** 2 + (A[8] - q) ** 2 + 2 * p1) / 6);
  const b = [(A[0] - q) / p, A[1] / p, A[2] / p, A[4] / p - q / p, A[5] / p, (A[8] - q) / p];
  // det of B = [[b0, b1, b2], [b1, b3, b4], [b2, b4, b5]].
  const det = b[0] * (b[3] * b[5] - b[4] * b[4]) - b[1] * (b[1] * b[5] - b[4] * b[2]) + b[2] * (b[1] * b[4] - b[3] * b[2]);
  const r = Math.min(1, Math.max(-1, det / 2));
  return q + 2 * p * Math.cos(Math.acos(r) / 3);
}

/**
 * Eigenvalues of a small symmetric n×n matrix, ascending, by cyclic Jacobi rotations (Golub & Van Loan, Matrix
 * Computations 4th ed. §8.5; rotation angle in the stable form of Numerical Recipes 3rd ed. §11.1). Stops when the
 * off-diagonal norm falls below 1e-15 of the Frobenius norm, or after 50 sweeps.
 */
export function symmetricEigenvalues(A: readonly (readonly number[])[]): number[] {
  const n = A.length;
  const a = A.map((r) => r.slice());
  const frob = Math.sqrt(a.reduce((s, r) => s + r.reduce((t, v) => t + v * v, 0), 0));
  for (let sweep = 0; sweep < 50; sweep++) {
    let off = 0;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += a[p][q] ** 2;
    if (Math.sqrt(off) <= 1e-15 * frob) break;
    for (let p = 0; p < n; p++) {
      for (let q = p + 1; q < n; q++) {
        if (a[p][q] === 0) continue;
        const theta = (a[q][q] - a[p][p]) / (2 * a[p][q]);
        const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1);
        const s = t * c;
        for (let k = 0; k < n; k++) {
          const akp = a[k][p];
          const akq = a[k][q];
          a[k][p] = c * akp - s * akq;
          a[k][q] = s * akp + c * akq;
        }
        for (let k = 0; k < n; k++) {
          const apk = a[p][k];
          const aqk = a[q][k];
          a[p][k] = c * apk - s * aqk;
          a[q][k] = s * apk + c * aqk;
        }
      }
    }
  }
  return a.map((r, i) => r[i]).sort((x, y) => x - y);
}

/*
 * Gamma function and incomplete gamma, for probability distributions with real shape parameters.
 */

// Lanczos approximation, g = 7, n = 9 (relative error < 2e-15 for x > 0.5); Numerical Recipes 3rd ed. §6.1 form.
const LANCZOS = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
  12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
];

/** ln Γ(x) for x > 0 (reflection Γ(x)Γ(1 − x) = π/sin πx below 0.5); NaN for x ≤ 0. */
export function lnGamma(x: number): number {
  if (!(x > 0)) return NaN;
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lnGamma(1 - x);
  const z = x - 1;
  let s = LANCZOS[0];
  for (let i = 1; i < LANCZOS.length; i++) s += LANCZOS[i] / (z + i);
  const t = z + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(s);
}

/**
 * Regularized lower incomplete gamma P(a, x) = γ(a, x)/Γ(a) for a > 0, x ≥ 0: the series (DLMF 8.11.4 form,
 * A&S 6.5.29) for x < a + 1, else 1 − Q with Q from the Legendre continued fraction (DLMF 8.9.2, modified Lentz).
 * The series keeps full relative accuracy for small P, so deep lower tails stay accurate. Tolerance 1e-16.
 */
export function regularizedGammaP(a: number, x: number): number {
  if (!(a > 0) || Number.isNaN(x) || x < 0) return NaN;
  if (x === 0) return 0;
  if (x === Infinity) return 1;
  if (a >= 1e5) return temmeGammaP(a, x);
  const lnPrefactor = a * Math.log(x) - x - lnGamma(a);
  const maxIter = 1000 + 20 * Math.ceil(Math.sqrt(a)); // both expansions need O(√a) terms
  if (x < a + 1) {
    let term = 1 / a;
    let sum = term;
    for (let n = 1; n < maxIter; n++) {
      term *= x / (a + n);
      sum += term;
      if (term < 1e-16 * sum) break;
    }
    return sum * Math.exp(lnPrefactor);
  }
  const tiny = 1e-300;
  let b = x + 1 - a;
  let c = 1 / tiny;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i < maxIter; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < tiny) d = tiny;
    c = b + an / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < 1e-16) break;
  }
  return 1 - Math.exp(lnPrefactor) * h;
}

/**
 * Temme's uniform asymptotic expansion for large a (DLMF 8.12.3–8.12.8), first term: with λ = x/a and
 * η = sign(λ − 1)√(2(λ − 1 − ln λ)), P(a, x) = ½ erfc(−η√(a/2)) − e^(−aη²/2)/√(2πa) · c₀(η), c₀ = 1/(λ − 1) − 1/η.
 * The neglected c₁/a term leaves a relative error ≲ 1e-7 for a ≥ 1e5.
 */
function temmeGammaP(a: number, x: number): number {
  const d = x / a - 1;
  // λ − 1 − ln λ and c₀ by their series near λ = 1, where the closed forms cancel.
  const small = Math.abs(d) < 1e-3;
  const f = small ? d * d * (1 / 2 - d * (1 / 3 - d * (1 / 4 - d * (1 / 5 - d / 6)))) : d - Math.log1p(d);
  const eta = Math.sign(d) * Math.sqrt(2 * f);
  const c0 = small ? -1 / 3 + eta * (1 / 12 - eta * (2 / 135 - eta / 864)) : 1 / d - 1 / eta;
  return 0.5 * erfc(-eta * Math.sqrt(a / 2)) - (Math.exp(-a * f) / Math.sqrt(2 * Math.PI * a)) * c0;
}

/**
 * ∫ₐᵇ f(x) dx by tanh-sinh (double-exponential) quadrature: x = (a + b)/2 + (b − a)/2 · tanh(π/2 · sinh t), step h
 * over |t| ≤ 3.5. It converges exponentially for integrands analytic inside (a, b), including integrable algebraic
 * singularities at the ends (Takahasi & Mori 1974; Trefethen & Weideman 2014). f is never evaluated at a or b.
 */
export function integrateTanhSinh(f: (x: number) => number, a: number, b: number, h = 1 / 32): number {
  const half = (b - a) / 2;
  let sum = 0;
  const n = Math.ceil(3.5 / h);
  for (let k = -n; k <= n; k++) {
    const t = k * h;
    const u = (Math.PI / 2) * Math.sinh(Math.abs(t));
    const dist = (b - a) / (1 + Math.exp(2 * u)); // distance to the nearer end, without cancellation
    const x = t < 0 ? a + dist : b - dist;
    if (x === a || x === b) continue;
    const cu = Math.cosh(u);
    sum += f(x) * (Math.cosh(t) / (cu * cu));
  }
  return half * (Math.PI / 2) * h * sum;
}

/** ∫ₐᵇ g(x) dx by the composite Simpson rule with n panels (n is rounded up to even). Error O(h⁴) for smooth g. */
export function integrateSimpson(g: (x: number) => number, a: number, b: number, n: number): number {
  const m = 2 * Math.ceil(Math.max(2, n) / 2);
  const h = (b - a) / m;
  let s = g(a) + g(b);
  for (let i = 1; i < m; i++) s += (i % 2 ? 4 : 2) * g(a + i * h);
  return (s * h) / 3;
}

/**
 * J₀(x) from the polynomial approximations of A&S 9.4.1 (|x| ≤ 3, |ε| < 5e-8) and 9.4.3 (|x| > 3: J₀ = x^(−½) f₀ cos θ₀,
 * |ε(f₀)| < 1.6e-8, |ε(θ₀)| < 7e-8), so |error| < 1e-7. About 20 flops against besselJ's 2|x| + 64 cosines: use it
 * inside quadratures where J₀ is called millions of times.
 */
export function besselJ0Fast(x: number): number {
  const ax = Math.abs(x);
  if (!Number.isFinite(ax)) return NaN;
  if (ax <= 3) {
    const t = (ax / 3) * (ax / 3);
    return 1 + t * (-2.2499997 + t * (1.2656208 + t * (-0.3163866 + t * (0.0444479 + t * (-0.0039444 + t * 0.00021)))));
  }
  const u = 3 / ax;
  const f0 = 0.79788456 + u * (-0.00000077 + u * (-0.0055274 + u * (-0.00009512 + u * (0.00137237 + u * (-0.00072805 + u * 0.00014476)))));
  const theta0 = ax - 0.78539816 + u * (-0.04166397 + u * (-0.00003954 + u * (0.00262573 + u * (-0.00054125 + u * (-0.00029333 + u * 0.00013558)))));
  return (f0 * Math.cos(theta0)) / Math.sqrt(ax);
}

/**
 * Fresnel integrals [C(x), S(x)] = ∫₀ˣ [cos, sin](π t²/2) dt (DLMF 7.2.7–8), odd in x, → ½ as x → ∞.
 * |x| ≤ 1.5: the power series (DLMF 7.6.4–5); |x| > 1.5: C + iS = ½(1 + i)(1 − e^(iπx²/2) h), h from the continued
 * fraction for erfc evaluated by the modified Lentz method (Numerical Recipes 3rd ed., §6.8). Relative error ~1e-15.
 */
export function fresnelIntegrals(x: number): [number, number] {
  if (!Number.isFinite(x)) return Number.isNaN(x) ? [NaN, NaN] : [Math.sign(x) * 0.5, Math.sign(x) * 0.5];
  const ax = Math.abs(x);
  let c: number;
  let s: number;
  if (ax < 1e-150) {
    c = ax;
    s = 0;
  } else if (ax <= 1.5) {
    // C = Σ (−1)^k (π/2)^(2k) x^(4k+1) / ((2k)! (4k+1)),  S = Σ (−1)^k (π/2)^(2k+1) x^(4k+3) / ((2k+1)! (4k+3)).
    const fact = (Math.PI / 2) * ax * ax;
    let term = ax; // (π/2 x²)^j x / j!
    c = ax;
    s = 0;
    // Term j (j = 2k → C, j = 2k + 1 → S) is (−1)^k term_j/(2j + 1): signs + + − − + + … for j = 0, 1, 2, …
    let lastC = ax;
    for (let j = 1; j < 60; j++) {
      term *= fact / j;
      const add = (Math.floor(j / 2) % 2 === 0 ? 1 : -1) * (term / (2 * j + 1));
      if (j % 2 === 0) {
        c += add;
        lastC = add;
      } else {
        s += add;
        if (Math.abs(add) < 1e-17 * Math.abs(s) && Math.abs(lastC) < 1e-17 * c) break;
      }
    }
  } else {
    const pix2 = Math.PI * ax * ax;
    // Lentz on the complex continued fraction, b = 1 − iπx², a_n = −n(n + 1), b_n = b + 4n.
    let bRe = 1;
    const bIm = -pix2;
    let ccRe = 1e300;
    let ccIm = 0;
    let dRe = bRe / (bRe * bRe + bIm * bIm);
    let dIm = -bIm / (bRe * bRe + bIm * bIm);
    let hRe = dRe;
    let hIm = dIm;
    let n = -1;
    for (let k = 2; k < 200; k++) {
      n += 2;
      const a = -n * (n + 1);
      bRe += 4;
      // d = 1/(a d + b)
      const tRe = a * dRe + bRe;
      const tIm = a * dIm + bIm;
      const tAbs2 = tRe * tRe + tIm * tIm;
      dRe = tRe / tAbs2;
      dIm = -tIm / tAbs2;
      // cc = b + a/cc
      const ccAbs2 = ccRe * ccRe + ccIm * ccIm;
      ccRe = bRe + (a * ccRe) / ccAbs2;
      ccIm = bIm - (a * ccIm) / ccAbs2;
      const delRe = ccRe * dRe - ccIm * dIm;
      const delIm = ccRe * dIm + ccIm * dRe;
      const hr = hRe * delRe - hIm * delIm;
      hIm = hRe * delIm + hIm * delRe;
      hRe = hr;
      if (Math.abs(delRe - 1) + Math.abs(delIm) < 1e-16) break;
    }
    // h ← h (x − i x); C + iS = ½(1 + i)(1 − (cos + i sin)(πx²/2) h)
    const hr = hRe * ax + hIm * ax;
    hIm = hIm * ax - hRe * ax;
    hRe = hr;
    const cs = Math.cos(pix2 / 2);
    const sn = Math.sin(pix2 / 2);
    const pRe = 1 - (cs * hRe - sn * hIm);
    const pIm = -(cs * hIm + sn * hRe);
    c = 0.5 * (pRe - pIm);
    s = 0.5 * (pRe + pIm);
  }
  return x < 0 ? [-c, -s] : [c, s];
}
