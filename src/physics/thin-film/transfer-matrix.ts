/**
 * Optical response of a planar thin-film stack by the characteristic (transfer) matrix method.
 *
 * Model tier: Exact for monochromatic plane waves on homogeneous, isotropic, non-magnetic layers
 * with flat, parallel, abrupt interfaces, coherent across the stack. The incident medium (lossless)
 * and the substrate are semi-infinite: the substrate's back surface is ignored.
 *
 * References: H. A. Macleod, Thin-Film Optical Filters, 4th ed. (CRC Press, 2010), ch. 2:
 * characteristic matrix of a film, tilted optical admittances η_s = N cos θ and η_p = N / cos θ
 * (in units of the free-space admittance), and R, T, A from [B C]ᵀ = M [1 η_sub]ᵀ.
 * M. Born & E. Wolf, Principles of Optics, 7th ed. (Cambridge University Press, 1999), §1.6.
 *
 * Conventions: time dependence e^(−iωt) and N = n + iκ with κ ≥ 0 for absorption (Macleod uses
 * e^(+iωt) and N = n − ik, the complex conjugate). The matrix of a layer is
 *   L = [[cos δ, −i sin δ / η], [−i η sin δ, cos δ]],   δ = 2π N d cos θ / λ,
 * where N cos θ = √(N² − n₀² sin² θ₀) (Snell) is the root with Im ≥ 0, so evanescent and absorbing
 * layers decay. r = (η₀ − Y)/(η₀ + Y) with Y = C/B, so r_p = r_s at normal incidence
 * (Born & Wolf's r_p has the opposite sign; R, T and A don't depend on this choice).
 */

import { sqrt as csqrt, type Complex } from "../complex";

export type Polarization = "s" | "p";

export interface Medium {
  /** Refractive index, real part (≥ 0). */
  n: number;
  /** Extinction coefficient κ ≥ 0, the imaginary part of N = n + iκ. Default 0. */
  k?: number;
}

export interface Layer extends Medium {
  /** Physical thickness, m. */
  thickness: number;
}

export interface Stack {
  /** Refractive index of the incident medium (real, > 0). */
  incident: number;
  /** Layers in the order the light meets them. */
  layers: readonly Layer[];
  substrate: Medium;
}

export interface StackResponse {
  /** Amplitude reflection coefficient (admittance convention, see the file header). */
  r: Complex;
  /** Reflectance. */
  R: number;
  /** Transmittance into the substrate. */
  T: number;
  /** Absorptance of the layers. */
  A: number;
}

const INVALID: StackResponse = { r: { re: NaN, im: NaN }, R: NaN, T: NaN, A: NaN };

function validMedium(m: Medium): boolean {
  const k = m.k ?? 0;
  return Number.isFinite(m.n) && Number.isFinite(k) && m.n >= 0 && k >= 0 && m.n + k > 0;
}

/** N² and q = N cos θ = √(N² − β²) for the conserved tangential index β = n₀ sin θ₀. Im q ≥ 0 because κ ≥ 0. */
function normalComponent(m: Medium, beta: number) {
  const k = m.k ?? 0;
  const n2re = m.n * m.n - k * k;
  const n2im = 2 * m.n * k;
  const q = csqrt({ re: n2re - beta * beta, im: n2im });
  return { n2re, n2im, q2re: n2re - beta * beta, q2im: n2im, qre: q.re, qim: q.im };
}

const mulRe = (ar: number, ai: number, br: number, bi: number) => ar * br - ai * bi;
const mulIm = (ar: number, ai: number, br: number, bi: number) => ar * bi + ai * br;

/**
 * Reflection coefficient, reflectance, transmittance and absorptance of a stack.
 *
 * @param wavelength vacuum wavelength, m (> 0)
 * @param angle angle of incidence in the incident medium, rad, in [0, π/2)
 * @returns NaN in every field for invalid input (λ ≤ 0, angle outside [0, π/2), thickness < 0,
 *   n < 0, κ < 0, N = 0, incident index ≤ 0, or a non-finite value).
 */
export function stackResponse(
  stack: Stack,
  wavelength: number,
  angle = 0,
  polarization: Polarization = "s",
): StackResponse {
  const n0 = stack.incident;
  const validInputs =
    Number.isFinite(n0) && n0 > 0 &&
    Number.isFinite(wavelength) && wavelength > 0 &&
    angle >= 0 && angle < Math.PI / 2 &&
    validMedium(stack.substrate);
  if (!validInputs) return INVALID;

  const p = polarization === "p";
  const beta = n0 * Math.sin(angle);
  const cos0 = Math.cos(angle);
  const eta0 = p ? n0 / cos0 : n0 * cos0;
  const k0 = (2 * Math.PI) / wavelength;

  // M = L₁ L₂ … as eight reals. Each L is stored times e^(−Im δ) so that thick absorbing or
  // evanescent layers can't overflow; logScale = Σ Im δ restores the scale where it matters (T, A).
  let m11r = 1, m11i = 0, m12r = 0, m12i = 0;
  let m21r = 0, m21i = 0, m22r = 1, m22i = 0;
  let logScale = 0;

  for (const layer of stack.layers) {
    if (!validMedium(layer) || !(Number.isFinite(layer.thickness) && layer.thickness >= 0)) return INVALID;
    const { n2re, n2im, q2re, q2im, qre, qim } = normalComponent(layer, beta);
    const k0d = k0 * layer.thickness;
    const dr = k0d * qre;
    const di = k0d * qim; // ≥ 0

    // e^(−di)·cos δ and e^(−di)·sin δ, using cosh(di)e^(−di) = (1 + e^(−2di))/2 and
    // sinh(di)e^(−di) = −expm1(−2di)/2.
    const ch = (1 + Math.exp(-2 * di)) / 2;
    const sh = -Math.expm1(-2 * di) / 2;
    const cosDr = Math.cos(dr);
    const sinDr = Math.sin(dr);
    const cr = cosDr * ch, ci = -sinDr * sh; // cos δ = cos dr cosh di − i sin dr sinh di
    const sr = sinDr * ch, si = cosDr * sh; // sin δ = sin dr cosh di + i cos dr sinh di
    logScale += di;

    // S = sin δ / q stays finite when q → 0 (a layer exactly at its critical angle): S → k₀d.
    let Sr: number, Si: number;
    if (dr * dr + di * di > 1e-8) {
      const qq = qre * qre + qim * qim;
      Sr = (sr * qre + si * qim) / qq;
      Si = (si * qre - sr * qim) / qq;
    } else {
      // sin δ / q = k₀d (1 − δ²/6 + O(δ⁴)); |δ| ≤ 1e-4, so the truncation error is < 1e-17 relative.
      const e = Math.exp(-di) * k0d;
      Sr = e * (1 - (dr * dr - di * di) / 6);
      Si = e * (-(2 * dr * di) / 6);
    }

    // sin δ / η = x and η sin δ = y. s: η = q, so x = S, y = q²S. p: η = N²/q, so x = q²S/N², y = N²S.
    let xr: number, xi: number, yr: number, yi: number;
    const q2Sr = mulRe(q2re, q2im, Sr, Si);
    const q2Si = mulIm(q2re, q2im, Sr, Si);
    if (p) {
      const nn = n2re * n2re + n2im * n2im;
      xr = (q2Sr * n2re + q2Si * n2im) / nn;
      xi = (q2Si * n2re - q2Sr * n2im) / nn;
      yr = mulRe(n2re, n2im, Sr, Si);
      yi = mulIm(n2re, n2im, Sr, Si);
    } else {
      xr = Sr; xi = Si;
      yr = q2Sr; yi = q2Si;
    }
    // L₁₂ = −i x, L₂₁ = −i y.
    const l12r = xi, l12i = -xr;
    const l21r = yi, l21i = -yr;

    // M ← M · L
    const n11r = mulRe(m11r, m11i, cr, ci) + mulRe(m12r, m12i, l21r, l21i);
    const n11i = mulIm(m11r, m11i, cr, ci) + mulIm(m12r, m12i, l21r, l21i);
    const n12r = mulRe(m11r, m11i, l12r, l12i) + mulRe(m12r, m12i, cr, ci);
    const n12i = mulIm(m11r, m11i, l12r, l12i) + mulIm(m12r, m12i, cr, ci);
    const n21r = mulRe(m21r, m21i, cr, ci) + mulRe(m22r, m22i, l21r, l21i);
    const n21i = mulIm(m21r, m21i, cr, ci) + mulIm(m22r, m22i, l21r, l21i);
    const n22r = mulRe(m21r, m21i, l12r, l12i) + mulRe(m22r, m22i, cr, ci);
    const n22i = mulIm(m21r, m21i, l12r, l12i) + mulIm(m22r, m22i, cr, ci);
    m11r = n11r; m11i = n11i; m12r = n12r; m12i = n12i;
    m21r = n21r; m21i = n21i; m22r = n22r; m22i = n22i;
  }

  // [B C]ᵀ ∝ M [u v]ᵀ with v/u = η_sub: s: (1, q_s); p: (q_s/N_s², 1), finite even when q_s = 0.
  const sub = normalComponent(stack.substrate, beta);
  let ur: number, ui: number, vr: number, vi: number;
  if (p) {
    const nn = sub.n2re * sub.n2re + sub.n2im * sub.n2im;
    ur = (sub.qre * sub.n2re + sub.qim * sub.n2im) / nn;
    ui = (sub.qim * sub.n2re - sub.qre * sub.n2im) / nn;
    vr = 1; vi = 0;
  } else {
    ur = 1; ui = 0;
    vr = sub.qre; vi = sub.qim;
  }
  const Br = mulRe(m11r, m11i, ur, ui) + mulRe(m12r, m12i, vr, vi);
  const Bi = mulIm(m11r, m11i, ur, ui) + mulIm(m12r, m12i, vr, vi);
  const Cr = mulRe(m21r, m21i, ur, ui) + mulRe(m22r, m22i, vr, vi);
  const Ci = mulIm(m21r, m21i, ur, ui) + mulIm(m22r, m22i, vr, vi);

  const Dr = eta0 * Br + Cr, Di = eta0 * Bi + Ci;
  const Nr = eta0 * Br - Cr, Ni = eta0 * Bi - Ci;
  const DD = Dr * Dr + Di * Di;
  const r = { re: (Nr * Dr + Ni * Di) / DD, im: (Ni * Dr - Nr * Di) / DD };

  // Macleod: T = 4η₀ Re(η_sub) / |η₀B + C|², A = 4η₀ Re(BC* − η_sub) / |η₀B + C|².
  // Re(ū v) is Re(η_sub) in the scaled [u v] form; e^(−2·logScale) undoes the layer scaling.
  const subFlux = (ur * vr + ui * vi) * Math.exp(-2 * logScale);
  const T = (4 * eta0 * subFlux) / DD;
  const A = (4 * eta0 * (Br * Cr + Bi * Ci - subFlux)) / DD;
  return { r, R: r.re * r.re + r.im * r.im, T, A };
}

/** Response to unpolarized light: the mean of the s and p responses (r is not defined). */
export function unpolarizedResponse(stack: Stack, wavelength: number, angle = 0): Omit<StackResponse, "r"> {
  const s = stackResponse(stack, wavelength, angle, "s");
  const pp = stackResponse(stack, wavelength, angle, "p");
  return { R: (s.R + pp.R) / 2, T: (s.T + pp.T) / 2, A: (s.A + pp.A) / 2 };
}

/** Reflectance at each vacuum wavelength (m). */
export function reflectanceSpectrum(
  stack: Stack,
  wavelengths: readonly number[],
  angle = 0,
  polarization: Polarization | "unpolarized" = "s",
): number[] {
  return wavelengths.map((wl) =>
    polarization === "unpolarized"
      ? unpolarizedResponse(stack, wl, angle).R
      : stackResponse(stack, wl, angle, polarization).R,
  );
}

/** Physical thickness of a quarter-wave layer at normal incidence, d = λ/(4n), m. NaN unless n, λ > 0. */
export function quarterWaveThickness(n: number, wavelength: number): number {
  return n > 0 && wavelength > 0 ? wavelength / (4 * n) : NaN;
}

/** Lossless quarter-wave layers for the design wavelength λ₀ (m), one per index, in order. */
export function quarterWaveLayers(indices: readonly number[], lambda0: number): Layer[] {
  return indices.map((n) => ({ n, thickness: quarterWaveThickness(n, lambda0) }));
}

/**
 * Closed-form reflectance of lossless quarter-wave layers at λ₀ and normal incidence. Each layer
 * maps the admittance Y → n²/Y, starting from Y = n_sub (Macleod, ch. 2), and R = ((n₀ − Y)/(n₀ + Y))².
 * E.g. one layer: R = ((n₀n_sub − n²)/(n₀n_sub + n²))²; (HL)^N: Y = (n_H/n_L)^(2N) n_sub.
 * NaN unless every index is > 0.
 */
export function quarterWaveStackReflectance(incident: number, indices: readonly number[], substrate: number): number {
  if (!(incident > 0 && substrate > 0 && indices.every((n) => n > 0))) return NaN;
  let Y = substrate;
  for (let i = indices.length - 1; i >= 0; i--) Y = (indices[i] * indices[i]) / Y;
  return ((incident - Y) / (incident + Y)) ** 2;
}
