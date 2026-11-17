// Own characteristic-matrix code (Born & Wolf / Macleod), e^{-iωt}, N = n + ik, layers listed from the incident side.
export type Cx = { r: number; i: number };
export const c = (r: number, i = 0): Cx => ({ r, i });
export const add = (a: Cx, b: Cx) => c(a.r + b.r, a.i + b.i), sub = (a: Cx, b: Cx) => c(a.r - b.r, a.i - b.i);
export const mul = (a: Cx, b: Cx) => c(a.r * b.r - a.i * b.i, a.r * b.i + a.i * b.r);
export const div = (a: Cx, b: Cx) => { const d = b.r * b.r + b.i * b.i; return c((a.r * b.r + a.i * b.i) / d, (a.i * b.r - a.r * b.i) / d); };
export const csqrt = (a: Cx) => { const m = Math.hypot(a.r, a.i); let re = Math.sqrt((m + a.r) / 2), im = Math.sqrt((m - a.r) / 2); if (a.i < 0) im = -im; return c(re, im); };
export const cexp = (a: Cx) => c(Math.exp(a.r) * Math.cos(a.i), Math.exp(a.r) * Math.sin(a.i));
export const abs2 = (a: Cx) => a.r * a.r + a.i * a.i;
export interface L { n: number; k?: number; d: number } // d in m
export function stack(n0: number, layers: L[], ns: number, ks: number, lam: number, theta0 = 0, pol: "s" | "p" = "s") {
  const s0 = n0 * Math.sin(theta0); // invariant
  const cosOf = (N: Cx) => { const sn = div(c(s0), N); let cs = csqrt(sub(c(1), mul(sn, sn))); if (cs.i < 0) cs = c(-cs.r, -cs.i); return cs; };
  const eta = (N: Cx) => { const cs = cosOf(N); return pol === "s" ? mul(N, cs) : div(N, cs); };
  let B: Cx = c(1), C: Cx = eta(c(ns, -ks)); // [B;C] = Π M [1; eta_s]
  for (let j = layers.length - 1; j >= 0; j--) {
    const N = c(layers[j].n, -(layers[j].k ?? 0)); const et = eta(N);
    const dl = mul(c(2 * Math.PI * layers[j].d / lam), mul(N, cosOf(N)));
    const cd = mul(add(cexp(mul(c(0, 1), dl)), cexp(mul(c(0, -1), dl))), c(0.5));
    const sd = div(sub(cexp(mul(c(0, 1), dl)), cexp(mul(c(0, -1), dl))), c(0, 2));
    const isd = mul(c(0, 1), sd);
    const B2 = add(mul(cd, B), mul(div(isd, et), C));
    const C2 = add(mul(mul(isd, et), B), mul(cd, C));
    B = B2; C = C2;
  }
  const e0 = eta(c(n0)); const es = eta(c(ns, -ks));
  const den = add(mul(e0, B), C);
  const r = div(sub(mul(e0, B), C), den);
  const R = abs2(r);
  const T = 4 * e0.r * es.r / abs2(den);
  return { R, T, A: 1 - R - T, r, phaseR: Math.atan2(r.i, r.r) * 180 / Math.PI };
}
export const qw = (n: number, lam0: number, f = 1): L => ({ n, d: f * lam0 / (4 * n) });
