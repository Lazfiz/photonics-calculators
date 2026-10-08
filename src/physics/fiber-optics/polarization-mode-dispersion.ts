/**
 * First-order polarization-mode dispersion (PMD) of a long fibre link. SI units in and out: PMD coefficient in
 * s/√m (1 ps/√km = 1e-12/√1000 s/√m), lengths in m, differential group delay (DGD) in s, bit rates in 1/s.
 * Model tier: textbook approximation (statistics exact for a long, randomly coupled fibre; the 10 % rule is
 * a design rule of thumb).
 *
 * The PMD coefficient is the mean DGD per √length: ⟨Δτ⟩ = PMD·√L (ITU-T G.650.2 defines the PMD value as
 * the mean DGD over wavelength or time; some methods report the rms ⟨Δτ²⟩^½, converted with the factor below).
 * In the long-length regime the DGD is Maxwellian (C. D. Poole, Opt. Lett. 13, 687 (1988); H. Kogelnik,
 * R. M. Jopson, L. E. Nelson, "Polarization-mode dispersion", Optical Fiber Telecommunications IVB, 2002):
 * the three components of the PMD vector are independent N(0, σ²), so with u = Δτ/σ
 *   f(Δτ) = √(2/π) Δτ² /σ³ · exp(−Δτ²/2σ²),
 *   P(DGD > Δτ) = erfc(u/√2) + √(2/π) u e^(−u²/2),
 *   ⟨Δτ⟩ = 2σ√(2/π),  ⟨Δτ²⟩^½ = σ√3,  so ⟨Δτ⟩ = √(8/(3π)) ⟨Δτ²⟩^½ ≈ 0.921 ⟨Δτ²⟩^½.
 * The DGD exceeds 3⟨Δτ⟩ with probability 4.2×10⁻⁵ (M. Duelk, IEEE 802.3 HSSG, Nov. 2006, duelk_02_1106).
 *
 * Design rule of thumb (no single standard): keep ⟨Δτ⟩ ≤ 0.1 T_bit, so that the DGD stays below 0.3 T_bit
 * except for that 4.2×10⁻⁵ of the time. Not modelled: second-order PMD, PMD of components, and the penalty
 * as a function of DGD and launch polarization.
 */
import { erfc } from "../math";

/** ⟨Δτ⟩/⟨Δτ²⟩^½ for a Maxwellian distribution, √(8/(3π)). */
export const MEAN_TO_RMS = Math.sqrt(8 / (3 * Math.PI));
/** Mean DGD as a fraction of the bit period in the usual design rule. */
export const MEAN_DGD_BIT_FRACTION = 0.1;

const SQRT_2_OVER_PI = Math.sqrt(2 / Math.PI);
// Bisection on u = Δτ/σ: P(DGD > 40σ) ≈ 1e-346 underflows, and 200 halvings of [0, 40] reach machine precision.
const U_MAX = 40;
const MAX_ITER = 200;

/** Mean DGD ⟨Δτ⟩ = PMD·√L, s. */
export function meanDgd(pmdCoefficient: number, L: number): number {
  return pmdCoefficient * Math.sqrt(L);
}

/** Maxwellian scale σ (rms of one PMD-vector component) for a mean DGD: σ = ⟨Δτ⟩√(π/8), s. */
export function maxwellSigma(mean: number): number {
  return mean * Math.sqrt(Math.PI / 8);
}

/** Maxwellian probability density of the DGD, 1/s. */
export function dgdPdf(dgd: number, mean: number): number {
  if (dgd < 0) return 0;
  const sigma = maxwellSigma(mean);
  const u = dgd / sigma;
  return (SQRT_2_OVER_PI * u * u * Math.exp(-0.5 * u * u)) / sigma;
}

/** P(DGD > Δτ), computed as a sum of positive terms so the far tail keeps its relative accuracy. */
export function dgdExceedanceProbability(dgd: number, mean: number): number {
  if (dgd <= 0) return 1;
  const u = dgd / maxwellSigma(mean);
  return erfc(u / Math.SQRT2) + SQRT_2_OVER_PI * u * Math.exp(-0.5 * u * u);
}

/** The DGD exceeded with probability p (0 < p ≤ 1), s; NaN outside that range. */
export function dgdAtExceedance(p: number, mean: number): number {
  if (!(p > 0 && p <= 1)) return NaN;
  if (p === 1) return 0;
  const sigma = maxwellSigma(mean);
  const target = Math.log(p);
  let lo = 0;
  let hi = U_MAX;
  for (let i = 0; i < MAX_ITER && hi - lo > 1e-15 * hi; i++) {
    const mid = 0.5 * (lo + hi);
    if (Math.log(dgdExceedanceProbability(mid * sigma, mean)) > target) lo = mid;
    else hi = mid;
  }
  return 0.5 * (lo + hi) * sigma;
}

/** Longest link with ⟨Δτ⟩ ≤ fraction·T_bit: L = (fraction / (B·PMD))², m. */
export function pmdLimitedLength(pmdCoefficient: number, bitRate: number, fraction = MEAN_DGD_BIT_FRACTION): number {
  return (fraction / (bitRate * pmdCoefficient)) ** 2;
}
