/**
 * Terahertz time-domain spectroscopy (THz-TDS) of a free-standing slab at normal incidence: dielectric models, the
 * complex transmission against an empty-path reference, the usual parameter extraction and the dynamic-range limit on
 * the measurable absorption. SI units (Hz, m, m⁻¹); ε = ε′ + iε″ with ε″ ≥ 0 for loss (fields ∝ e^(−iωt)).
 * Model tier: textbook.
 *
 *   T(ω) = E_sample / E_ref = [4ñ/(ñ+1)²] · exp(i(ñ − 1)ωd/c),  ñ = √ε = n + iκ,  α = 2ωκ/c (power),
 * the Fabry–Pérot echoes being time-windowed out (Duvillaret, Garet, Coutaz, IEEE J. Sel. Top. Quantum Electron. 2,
 * 739 (1996), doi 10.1109/2944.571775). With φ the unwrapped phase of T and a real Fresnel factor,
 *   n = 1 + cφ/(ωd),  α = −(2/d) ln[|T|(n+1)²/(4n)]
 * (Withayachumnankul & Naftaly, J. Infrared Millim. Terahertz Waves 35, 610 (2014), doi 10.1007/s10762-013-0042-z).
 * The largest α a spectrometer with field dynamic range DR can measure is
 *   α_max = (2/d) ln[DR · 4n/(n+1)²]   (Jepsen & Fischer, Opt. Lett. 30, 29 (2005), doi 10.1364/OL.30.000029).
 */
import { type Complex, add, complex, div, exp, mul, scale, sqrt } from "../complex";
import { c } from "../constants";

/**
 * Pure liquid water, double Debye model of Liebe, Hufford & Manabe (Int. J. Infrared Millim. Waves 12, 659 (1991),
 * doi 10.1007/BF01008897), eqs. (1) and (4): θ = 1 − 300/T,
 *   ε₀ = 77.66 − 103.3θ, ε₁ = 0.0671ε₀, ε₂ = 3.52 + 7.52θ, γ₁ = 20.20 + 146.4θ + 316θ² GHz, γ₂ = 39.8γ₁,
 *   ε = (ε₀ − ε₁)/(1 − if/γ₁) + (ε₁ − ε₂)/(1 − if/γ₂) + ε₂.
 * Fitted to data up to 1 THz; the Table I data span −4 to 40 °C, so colder or warmer water is extrapolation (with the
 * printed + sign of the ε₂ θ term, which fits Table I better than −). NaN unless f ≥ 0 and T > 0.
 */
export function waterPermittivity(f: number, T: number): Complex {
  if (!(f >= 0 && T > 0)) return complex(NaN, NaN);
  const th = 1 - 300 / T;
  const e0 = 77.66 - 103.3 * th, e1 = 0.0671 * e0, e2 = 3.52 + 7.52 * th;
  const g1 = (20.2 + 146.4 * th + 316 * th * th) * 1e9, g2 = 39.8 * g1;
  const debye = (de: number, g: number) => div(complex(de), complex(1, -f / g));
  return add(add(debye(e0 - e1, g1), debye(e1 - e2, g2)), complex(e2));
}

/** Single Lorentz oscillator ε = ε∞ + Δε f₀²/(f₀² − f² − iγf); frequencies in Hz. */
export function lorentzPermittivity(f: number, epsInf: number, dEps: number, f0: number, gamma: number): Complex {
  return add(complex(epsInf), div(complex(dEps * f0 * f0), complex(f0 * f0 - f * f, -gamma * f)));
}

/** ε for a non-dispersive medium of index n and power absorption coefficient α (m⁻¹) at frequency f (Hz). */
export function constantPermittivity(f: number, n: number, alpha: number): Complex {
  const kappa = f > 0 ? (alpha * c) / (4 * Math.PI * f) : 0;
  return complex(n * n - kappa * kappa, 2 * n * kappa);
}

/** Complex refractive index ñ = n + iκ = √ε, the root with κ ≥ 0. */
export function complexIndex(eps: Complex): Complex {
  const r = sqrt(eps);
  return r.im < 0 ? scale(r, -1) : r;
}

/** Power absorption coefficient α = 4πfκ/c in m⁻¹. */
export function absorptionCoefficient(nk: Complex, f: number): number {
  return (4 * Math.PI * f * nk.im) / c;
}

/** Sample/reference field transmission T(ω) of a slab of thickness d (m) in air, echoes windowed out. */
export function slabTransmission(nk: Complex, f: number, d: number): Complex {
  const fresnel = div(scale(nk, 4), mul(add(nk, complex(1)), add(nk, complex(1))));
  const k0d = (2 * Math.PI * f * d) / c;
  return mul(fresnel, exp(mul(complex(0, k0d), add(nk, complex(-1)))));
}

/**
 * |T| and its unwrapped phase arg[4ñ/(ñ+1)²] + (n − 1)ωd/c, as a measurement unwrapped continuously from zero
 * frequency would give.
 */
export function slabTransmissionPolar(nk: Complex, f: number, d: number): { magnitude: number; phase: number } {
  const fresnel = div(scale(nk, 4), mul(add(nk, complex(1)), add(nk, complex(1))));
  const k0d = (2 * Math.PI * f * d) / c;
  return {
    magnitude: Math.hypot(fresnel.re, fresnel.im) * Math.exp(-nk.im * k0d),
    phase: Math.atan2(fresnel.im, fresnel.re) + (nk.re - 1) * k0d,
  };
}

/** n and α (m⁻¹) from the amplitude |T| and unwrapped phase φ of T, with a real Fresnel factor. NaN on bad input. */
export function extractIndex(magnitude: number, phase: number, f: number, d: number): { n: number; alpha: number } {
  if (!(f > 0 && d > 0 && magnitude > 0)) return { n: NaN, alpha: NaN };
  const n = 1 + (c * phase) / (2 * Math.PI * f * d);
  if (!(n > 0)) return { n, alpha: NaN };
  return { n, alpha: (-2 / d) * Math.log((magnitude * (n + 1) ** 2) / (4 * n)) };
}

/**
 * Jepsen–Fischer limit α_max (m⁻¹) for a field dynamic range DR (≥ 1), index n and thickness d; 0 when the Fresnel
 * loss alone uses up the dynamic range (DR·4n/(n+1)² ≤ 1).
 */
export function maxAbsorption(dynamicRange: number, n: number, d: number): number {
  if (!(dynamicRange >= 1 && n > 0 && d > 0)) return NaN;
  return Math.max(0, (2 / d) * Math.log((dynamicRange * 4 * n) / (n + 1) ** 2));
}
