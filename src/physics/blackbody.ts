/**
 * Blackbody radiation: spectral exitance, the fraction of σT⁴ in a band, and Planck-weighted means (for total
 * emittance from a spectral one). SI units: wavelengths in m, temperatures in K, exitance in W m⁻² per m.
 * Model tier: exact.
 *
 * Planck's law for the hemispherical spectral exitance M_λ = c₁ λ⁻⁵ / (e^(c₂/λT) − 1), c₁ = 2πhc², c₂ = hc/k_B.
 * Fraction of the total exitance σT⁴ emitted below λ, with x = c₂/(λT) (Siegel & Howell, Thermal Radiation Heat
 * Transfer, blackbody functions; Modest, Radiative Heat Transfer, §1.6):
 *   F(0 → λ) = (15/π⁴) ∫ₓ^∞ t³/(eᵗ − 1) dt,
 *   ∫ₓ^∞ t³/(eᵗ − 1) dt = Σₙ e^(−nx) (x³/n + 3x²/n² + 6x/n³ + 6/n⁴)        (used for x ≥ 1),
 *   ∫₀ˣ t³/(eᵗ − 1) dt = Σₖ Bₖ x^(k+3) / (k! (k + 3))  (Bernoulli numbers Bₖ; used for x < 1),
 * and ∫₀^∞ = π⁴/15.
 */
import { c1_radiation, c2_radiation } from "./constants";

const PI4_15 = Math.PI ** 4 / 15;

/** Bₖ/(k!(k + 3)) for k = 0, 1, 2, 4, …, 12 (odd k > 1 vanish), with the power of x each multiplies. */
const HEAD_TERMS: readonly (readonly [number, number])[] = [
  [3, 1 / 3],
  [4, -1 / 8],
  [5, 1 / 60],
  [7, -1 / 5040],
  [9, 1 / 272160],
  [11, -1 / 13305600],
  [13, 1 / 622702080],
  [15, -691 / (2730 * 479001600 * 15)],
];

/** ∫ₓ^∞ t³/(eᵗ − 1) dt for x ≥ 0. Relative error < 1e-12. */
function tailIntegral(x: number): number {
  if (x < 1) {
    let head = 0;
    for (const [p, a] of HEAD_TERMS) head += a * x ** p;
    return PI4_15 - head;
  }
  let sum = 0;
  for (let n = 1; n <= 200; n++) {
    const term = Math.exp(-n * x) * (x ** 3 / n + (3 * x * x) / n ** 2 + (6 * x) / n ** 3 + 6 / n ** 4);
    sum += term;
    if (term < 1e-17 * sum) break;
  }
  return sum;
}

/** Spectral exitance M_λ of a blackbody, W m⁻² m⁻¹. NaN for λ ≤ 0 or T ≤ 0. */
export function planckExitance(wavelength: number, temperature: number): number {
  if (!(wavelength > 0 && temperature > 0)) return NaN;
  const x = c2_radiation / (wavelength * temperature);
  if (x > 700) return 0;
  return c1_radiation / (wavelength ** 5 * Math.expm1(x));
}

/** Fraction of σT⁴ emitted at wavelengths below λ, in [0, 1]. NaN for T ≤ 0 or λ < 0. */
export function blackbodyFractionBelow(wavelength: number, temperature: number): number {
  if (!(temperature > 0 && wavelength >= 0)) return NaN;
  if (wavelength === 0) return 0;
  if (wavelength === Infinity) return 1;
  return tailIntegral(c2_radiation / (wavelength * temperature)) / PI4_15;
}

/** Fraction of σT⁴ emitted between λ₁ and λ₂ (m). NaN unless 0 ≤ λ₁ ≤ λ₂ and T > 0. */
export function blackbodyBandFraction(lambda1: number, lambda2: number, temperature: number): number {
  if (!(lambda1 >= 0 && lambda2 >= lambda1)) return NaN;
  return blackbodyFractionBelow(lambda2, temperature) - blackbodyFractionBelow(lambda1, temperature);
}

/**
 * Planck-weighted mean ∫ f M_λ dλ / ∫ M_λ dλ over [λ₁, λ₂] (m), trapezoidal rule on `intervals` + 1
 * log-spaced wavelengths. f takes a vacuum wavelength in m. NaN for an invalid band or T, or if f returns NaN.
 */
export function planckWeightedMean(
  f: (wavelength: number) => number,
  temperature: number,
  lambda1: number,
  lambda2: number,
  intervals = 400,
): number {
  if (!(temperature > 0 && lambda1 > 0 && lambda2 > lambda1 && Number.isFinite(lambda2) && intervals >= 1)) return NaN;
  const n = Math.ceil(intervals);
  const step = Math.log(lambda2 / lambda1) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i <= n; i++) {
    const lam = lambda1 * Math.exp(i * step);
    // dλ = λ d(ln λ)
    const w = planckExitance(lam, temperature) * lam * (i === 0 || i === n ? 0.5 : 1);
    num += w * f(lam);
    den += w;
  }
  return den > 0 ? num / den : NaN;
}
