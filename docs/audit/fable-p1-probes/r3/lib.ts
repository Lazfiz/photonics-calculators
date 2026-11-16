// Independent math helpers for the R3 free-space-comms review (no imports from src/).
export const C = 299792458, H = 6.62607015e-34, QE = 1.602176634e-19;

export function erfc(x: number): number {
  // Numerical Recipes erfcc refined: use continued fraction for large x, series otherwise (rel err ~1e-14)
  if (x < 0) return 2 - erfc(-x);
  if (x < 3) {
    // erf series
    let sum = x, term = x;
    for (let n = 1; n < 200; n++) {
      term *= -x * x / n;
      const add = term / (2 * n + 1);
      sum += add;
      if (Math.abs(add) < 1e-17 * Math.abs(sum)) break;
    }
    return 1 - (2 / Math.sqrt(Math.PI)) * sum;
  }
  // continued fraction (Lentz)
  let f = 0;
  for (let n = 60; n >= 1; n--) f = (n / 2) / (x + f);
  return Math.exp(-x * x) / Math.sqrt(Math.PI) / (x + f);
}
export const Qf = (x: number) => 0.5 * erfc(x / Math.SQRT2);
export const Phi = (x: number) => 0.5 * erfc(-x / Math.SQRT2);

export function lgamma(x: number): number {
  const g = 7, cf = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
  x -= 1;
  let a = cf[0];
  const t = x + g + 0.5;
  for (let i = 1; i < 9; i++) a += cf[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}
/** Regularised lower incomplete gamma P(a,x). */
export function gammaP(a: number, x: number): number {
  if (x <= 0) return 0;
  if (x < a + 1) {
    let sum = 1 / a, del = sum, ap = a;
    for (let n = 0; n < 10000; n++) { ap++; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-16) break; }
    return sum * Math.exp(-x + a * Math.log(x) - lgamma(a));
  }
  let b = x + 1 - a, c = 1e300, d = 1 / b, h = d;
  for (let i = 1; i < 10000; i++) {
    const an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300;
    c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; const del = d * c; h *= del;
    if (Math.abs(del - 1) < 1e-16) break;
  }
  return 1 - Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
}
/** Gamma-gamma CDF with unit mean: X~Gamma(α,1/α), Y~Gamma(β,1/β), P(XY < t). Integrate over u = ln x. */
export function ggCdf(t: number, alpha: number, beta: number): number {
  const n = 40000, lo = -40, hi = 10;
  const du = (hi - lo) / n;
  let s = 0;
  for (let i = 0; i <= n; i++) {
    const u = lo + i * du, x = Math.exp(u);
    // pdf of X times x (Jacobian)
    const lf = alpha * Math.log(alpha) + alpha * u - alpha * x - lgamma(alpha);
    const w = (i === 0 || i === n) ? 0.5 : 1;
    s += w * Math.exp(lf) * gammaP(beta, beta * t / x);
  }
  return s * du;
}
export const h2 = (p: number) => (p <= 0 || p >= 1 ? 0 : -p * Math.log2(p) - (1 - p) * Math.log2(1 - p));
export const poissonCdf = (k: number, m: number) => { // P(X<=k)
  if (k < 0) return 0; return 1 - gammaP(k + 1, m);
};
export const ratio = (a: number, b: number) => (b === 0 ? NaN : a / b);
export function row(name: string, mine: number, code: number) {
  const r = mine / code;
  const flag = Number.isFinite(r) && Math.abs(r - 1) > 0.005 ? "  <-- DIFF" : "";
  console.log(`${name.padEnd(48)} mine=${mine.toPrecision(6).padStart(12)} code=${code.toPrecision(6).padStart(12)} r=${r.toFixed(4)}${flag}`);
}
