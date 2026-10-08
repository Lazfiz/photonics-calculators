/**
 * Refractive index and its wavelength derivatives from a Sellmeier dispersion formula. SI units in and out:
 * wavelengths in m, dn/dλ in 1/m, d²n/dλ² in 1/m², β₂ in s²/m, D in s/m² (1 ps/(nm·km) = 1e-6 s/m²).
 * Model tier: exact for the fitted formula inside its stated wavelength range (the fit's own accuracy is
 * given with each data set); undefined outside it.
 *
 * Form (λ in µm, Cᵢ in µm²): n² = A + Σ Bᵢ λ²/(λ² − Cᵢ). Data sets published as resonance wavelengths λᵢ
 * have Cᵢ = λᵢ²; sets written as n² = A′ + Σ Bᵢ′/(λ² − Cᵢ) convert with Bᵢ = Bᵢ′/Cᵢ, A = A′ − Σ Bᵢ′/Cᵢ
 * (since B′/(λ² − C) = (B′/C)(λ²/(λ² − C) − 1)).
 *
 * Derivatives, with f = n²: f′ = −Σ 2BᵢCᵢλ/(λ² − Cᵢ)², f″ = Σ 2BᵢCᵢ(3λ² + Cᵢ)/(λ² − Cᵢ)³,
 * n′ = f′/(2n), n″ = (f″/2 − n′²)/n.
 * Group index n_g = n − λn′. Group-velocity dispersion β₂ = λ³ n″/(2πc²) and dispersion parameter
 * D = −(λ/c) n″ = −2πc β₂/λ² (Agrawal, Nonlinear Fiber Optics, §1.2.3; Saleh & Teich, Fundamentals of
 * Photonics, ch. 5).
 *
 * Abbe number V_d = (n_d − 1)/(n_F − n_C) with the d, F and C lines at 587.5618, 486.1327 and 656.2725 nm
 * (SCHOTT optical glass catalog). SCHOTT's temperature coefficient of the absolute index (TIE-19, 2016):
 *   dn/dT = (n² − 1)/(2n) · (D₀ + 2D₁ΔT + 3D₂ΔT² + (E₀ + 2E₁ΔT)/(λ² − λ_TK²)),  ΔT = T − 20 °C.
 */
import { c } from "../constants";

export interface SellmeierModel {
  /** Constant term A of n² (1 for the plain Sellmeier form). */
  A: number;
  /** Oscillator strengths Bᵢ. */
  B: readonly number[];
  /** Resonance terms Cᵢ, µm². */
  C: readonly number[];
  /** Wavelength range of the fit, m. */
  range: readonly [number, number];
}

/** SCHOTT thermo-optic coefficients D₀, D₁, D₂ (1/K, 1/K², 1/K³), E₀ (µm²/K), E₁ (µm²/K²), λ_TK (µm). */
export type SchottThermalCoefficients = readonly [number, number, number, number, number, number];

export const LAMBDA_D = 587.5618e-9;
export const LAMBDA_F = 486.1327e-9;
export const LAMBDA_C = 656.2725e-9;

// Zero-dispersion search: log grid over the fit range, then bisection to machine precision.
const ZD_GRID = 400;
const ZD_MAX_ITER = 200;

/** Model from resonance wavelengths λᵢ (µm): Cᵢ = λᵢ². Range in µm. */
export function fromResonanceWavelengths(
  A: number, B: readonly number[], lambdas_um: readonly number[], range_um: readonly [number, number],
): SellmeierModel {
  return { A, B, C: lambdas_um.map((l) => l * l), range: [range_um[0] * 1e-6, range_um[1] * 1e-6] };
}

/** Model from n² = A′ + Σ Bᵢ′/(λ² − Cᵢ) (λ in µm, Cᵢ in µm²). Range in µm. */
export function fromPoleForm(
  Aprime: number, Bprime: readonly number[], C: readonly number[], range_um: readonly [number, number],
): SellmeierModel {
  const B = Bprime.map((b, i) => b / C[i]);
  return { A: Aprime - B.reduce((s, b) => s + b, 0), B, C, range: [range_um[0] * 1e-6, range_um[1] * 1e-6] };
}

/** Model from coefficients as printed: n² = A + Σ Bᵢλ²/(λ² − Cᵢ) with Cᵢ in µm². Range in µm. */
export function fromSquaredForm(
  A: number, B: readonly number[], C: readonly number[], range_um: readonly [number, number],
): SellmeierModel {
  return { A, B, C, range: [range_um[0] * 1e-6, range_um[1] * 1e-6] };
}

export function inRange(model: SellmeierModel, lambda: number): boolean {
  return lambda >= model.range[0] && lambda <= model.range[1];
}

/** n², f′ and f″ at λ in µm (derivatives per µm). */
function terms(model: SellmeierModel, x: number) {
  const x2 = x * x;
  let f = model.A;
  let f1 = 0;
  let f2 = 0;
  for (let i = 0; i < model.B.length; i++) {
    const B = model.B[i];
    const C = model.C[i];
    const d = x2 - C;
    f += (B * x2) / d;
    f1 -= (2 * B * C * x) / (d * d);
    f2 += (2 * B * C * (3 * x2 + C)) / (d * d * d);
  }
  return { f, f1, f2 };
}

/** Refractive index n(λ); NaN where n² ≤ 0 (inside an absorption band of the formula) or λ ≤ 0. */
export function refractiveIndex(model: SellmeierModel, lambda: number): number {
  if (!(lambda > 0)) return NaN;
  const { f } = terms(model, lambda * 1e6);
  return f > 0 ? Math.sqrt(f) : NaN;
}

/** dn/dλ, 1/m. */
export function dnDlambda(model: SellmeierModel, lambda: number): number {
  const n = refractiveIndex(model, lambda);
  const { f1 } = terms(model, lambda * 1e6);
  return (f1 / (2 * n)) * 1e6;
}

/** d²n/dλ², 1/m². */
export function d2nDlambda2(model: SellmeierModel, lambda: number): number {
  const n = refractiveIndex(model, lambda);
  const { f1, f2 } = terms(model, lambda * 1e6);
  const n1 = f1 / (2 * n);
  return ((f2 / 2 - n1 * n1) / n) * 1e12;
}

/** Group index n − λ dn/dλ. */
export function groupIndex(model: SellmeierModel, lambda: number): number {
  return refractiveIndex(model, lambda) - lambda * dnDlambda(model, lambda);
}

/** Group-velocity dispersion β₂ = λ³ n″/(2πc²), s²/m. */
export function gvd(model: SellmeierModel, lambda: number): number {
  return (lambda ** 3 * d2nDlambda2(model, lambda)) / (2 * Math.PI * c * c);
}

/** Dispersion parameter D = −(λ/c) n″, s/m². */
export function dispersionParameter(model: SellmeierModel, lambda: number): number {
  return (-lambda / c) * d2nDlambda2(model, lambda);
}

/** Abbe number V_d = (n_d − 1)/(n_F − n_C). */
export function abbeNumber(model: SellmeierModel): number {
  const nd = refractiveIndex(model, LAMBDA_D);
  return (nd - 1) / (refractiveIndex(model, LAMBDA_F) - refractiveIndex(model, LAMBDA_C));
}

/** Wavelengths inside the fit range where d²n/dλ² = 0 (material zero-dispersion), m, ascending. */
export function zeroDispersionWavelengths(model: SellmeierModel): number[] {
  const [lo, hi] = model.range;
  const step = Math.log(hi / lo) / ZD_GRID;
  const zeros: number[] = [];
  let a = lo;
  let fa = d2nDlambda2(model, a);
  for (let i = 1; i <= ZD_GRID; i++) {
    const b = lo * Math.exp(i * step);
    const fb = d2nDlambda2(model, b);
    if (Number.isFinite(fa) && Number.isFinite(fb) && fa * fb < 0) {
      let x0 = a;
      let x1 = b;
      let f0 = fa;
      for (let k = 0; k < ZD_MAX_ITER && x1 - x0 > 1e-15 * x1; k++) {
        const mid = 0.5 * (x0 + x1);
        const fm = d2nDlambda2(model, mid);
        if (f0 * fm <= 0) x1 = mid;
        else {
          x0 = mid;
          f0 = fm;
        }
      }
      zeros.push(0.5 * (x0 + x1));
    }
    a = b;
    fa = fb;
  }
  return zeros;
}

/** SCHOTT absolute dn/dT at λ and temperature T (°C), 1/K. */
export function schottDnDt(model: SellmeierModel, k: SchottThermalCoefficients, lambda: number, T_C: number): number {
  const [D0, D1, D2, E0, E1, lambdaTK] = k;
  const n = refractiveIndex(model, lambda);
  const x = lambda * 1e6;
  const dT = T_C - 20;
  return ((n * n - 1) / (2 * n)) * (D0 + 2 * D1 * dT + 3 * D2 * dT * dT + (E0 + 2 * E1 * dT) / (x * x - lambdaTK * lambdaTK));
}
