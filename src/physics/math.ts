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
