/**
 * Higher-order paraxial Gaussian modes at a plane of beam radius w (1/e² radius of the TEM₀₀ mode with the same q).
 * SI units. Model tier: exact solutions of the paraxial wave equation; the fields are normalised to unit power,
 * ∫|u|² dA = 1, so |u|² is the intensity per watt (W/m² per W).
 *   Hermite–Gaussian TEMmn: u = √(2/π)/w · H_m(√2 x/w) H_n(√2 y/w) e^(−(x²+y²)/w²) / √(2^(m+n) m! n!),
 *   Laguerre–Gaussian LG_p^l: u = √(2 p!/(π (p+|l|)!))/w · (√2 r/w)^|l| L_p^|l|(2r²/w²) e^(−r²/w²) e^(ilφ),
 *   with H_n the physicists' Hermite and L_p^|l| the generalised Laguerre polynomials (DLMF 18.9.1, 18.9.13).
 *   Mode order N = m + n or 2p + |l|; Gouy phase (N + 1) arctan(z/z_R); the same z_R and w(z) as TEM₀₀.
 *   Second-moment (D4σ/2) radius W_x = w √(2m + 1) (Carter 1980), W = w √(2p + |l| + 1) (Phillips & Andrews 1983),
 *   so M²_x = 2m + 1, M²_y = 2n + 1 and M² = 2p + |l| + 1. An LG mode carries l ħ of orbital angular momentum per
 *   photon (Allen et al. 1992).
 * H. Kogelnik & T. Li, Appl. Opt. 5, 1550 (1966), doi 10.1364/AO.5.001550; W. H. Carter, Appl. Opt. 19, 1027 (1980),
 * doi 10.1364/AO.19.001027; R. L. Phillips & L. C. Andrews, Appl. Opt. 22, 643 (1983), doi 10.1364/AO.22.000643;
 * L. Allen et al., Phys. Rev. A 45, 8185 (1992), doi 10.1103/PhysRevA.45.8185.
 */

import { lnFactorial } from "../math";

/** Physicists' Hermite polynomial H_n(x) by the recurrence H_{k+1} = 2x H_k − 2k H_{k−1}; n a whole number. */
export function hermiteH(n: number, x: number): number {
  if (!Number.isInteger(n) || n < 0) return NaN;
  if (n === 0) return 1;
  let h0 = 1;
  let h1 = 2 * x;
  for (let k = 1; k < n; k++) {
    const h2 = 2 * x * h1 - 2 * k * h0;
    h0 = h1;
    h1 = h2;
  }
  return h1;
}

/** Generalised Laguerre polynomial L_p^α(x), (k + 1) L_{k+1} = (2k + 1 + α − x) L_k − (k + α) L_{k−1}; p whole. */
export function laguerreL(p: number, alpha: number, x: number): number {
  if (!Number.isInteger(p) || p < 0 || !(alpha > -1)) return NaN;
  if (p === 0) return 1;
  let l0 = 1;
  let l1 = 1 + alpha - x;
  for (let k = 1; k < p; k++) {
    const l2 = ((2 * k + 1 + alpha - x) * l1 - (k + alpha) * l0) / (k + 1);
    l0 = l1;
    l1 = l2;
  }
  return l1;
}

const wholeIndex = (n: number) => Number.isInteger(n) && n >= 0;

/** One-dimensional unit-power Hermite–Gaussian amplitude (2/π)^¼ H_m(√2 x/w) e^(−x²/w²) / √(2^m m! w), m^(−½). */
export function hgAmplitude1D(m: number, x: number, w: number): number {
  if (!wholeIndex(m) || !(w > 0) || !Number.isFinite(x)) return NaN;
  const u = (Math.SQRT2 * x) / w;
  const lnNorm = 0.25 * Math.log(2 / Math.PI) - 0.5 * (m * Math.LN2 + lnFactorial(m) + Math.log(w));
  return Math.exp(lnNorm - (u * u) / 2) * hermiteH(m, u);
}

/** Unit-power TEMmn intensity |u_mn(x, y)|², W/m² per W. */
export function hgIntensity(m: number, n: number, x: number, y: number, w: number): number {
  const a = hgAmplitude1D(m, x, w) * hgAmplitude1D(n, y, w);
  return a * a;
}

/** Unit-power LG_p^l intensity |u_pl(r)|², W/m² per W; independent of the azimuth. */
export function lgIntensity(p: number, l: number, r: number, w: number): number {
  if (!wholeIndex(p) || !Number.isInteger(l) || !(w > 0) || !(r >= 0) || !Number.isFinite(r)) return NaN;
  const L = Math.abs(l);
  const rho2 = (2 * r * r) / (w * w);
  const lnNorm = 0.5 * (Math.LN2 + lnFactorial(p) - Math.log(Math.PI) - lnFactorial(p + L)) - Math.log(w);
  const radial = rho2 === 0 ? (L === 0 ? 1 : 0) : Math.exp(0.5 * L * Math.log(rho2) - rho2 / 2);
  const a = Math.exp(lnNorm) * radial * laguerreL(p, L, rho2);
  return a * a;
}

/** Second-moment radius W = w √(2N + 1) of one Hermite–Gaussian axis with index N (Carter 1980), m. */
export function hgSecondMomentRadius(m: number, w: number): number {
  if (!wholeIndex(m) || !(w > 0)) return NaN;
  return w * Math.sqrt(2 * m + 1);
}

/** Second-moment radius W = w √(2p + |l| + 1) of LG_p^l (Phillips & Andrews 1983), m. */
export function lgSecondMomentRadius(p: number, l: number, w: number): number {
  if (!wholeIndex(p) || !Number.isInteger(l) || !(w > 0)) return NaN;
  return w * Math.sqrt(2 * p + Math.abs(l) + 1);
}

/** Radius of the bright ring of LG_0^l: r = w √(|l|/2), m (0 for l = 0). */
export function lgRingRadius(l: number, w: number): number {
  if (!Number.isInteger(l) || !(w > 0)) return NaN;
  return w * Math.sqrt(Math.abs(l) / 2);
}

/** Gouy phase (N + 1) arctan(z/z_R) of a mode of order N, rad. */
export function modeGouyPhase(order: number, z: number, zR: number): number {
  if (!wholeIndex(order) || !(zR > 0) || !Number.isFinite(z)) return NaN;
  return (order + 1) * Math.atan(z / zR);
}
