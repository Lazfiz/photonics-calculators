/**
 * Free-space optical link budget: Friis transmission with optical-antenna gains, and geometric (beam-spreading)
 * loss. SI units: lengths in m, angles in rad, powers in W; gains and losses are linear unless named `…Db`.
 * Model tier: textbook far-field (Fraunhofer) formulas, vacuum propagation (atmospheric loss is added separately).
 *
 * Friis (H. T. Friis, Proc. IRE 34, 254 (1946), doi:10.1109/JRPROC.1946.234568): P_r = P_t G_t G_r (λ/(4πR))². The
 * free-space path loss (4πR/λ)² is not an absorption: it is the isotropic-antenna bookkeeping that the antenna gains
 * cancel. It holds for R ≫ 2D²/λ and while the receiver catches a small part of the beam; it is capped here so that
 * P_r never exceeds P_t times the optics' efficiency.
 *
 * Gains:
 * - A receiving aperture of diameter D with a central obscuration ratio ε collects a plane wave over A = πD²(1 − ε²)/4,
 *   so G_r = 4πA/λ² · η = (πD/λ)² (1 − ε²) η (J. J. Degnan, B. J. Klein, Appl. Opt. 13, 2397 (1974),
 *   doi:10.1364/AO.13.002397). (πD/λ)² is the directivity limit of a uniformly lit unobscured aperture.
 * - A Gaussian beam of far-field 1/e² half-angle θ has on-axis intensity 2P/(πθ²R²), so G_t = 8/θ².
 * - A Gaussian beam of 1/e² radius w truncated by an aperture of radius a with obscuration ratio γ has on-axis
 *   far-field gain G_t = (πD/λ)² g(α, γ), g = (2/α²)[exp(−α²) − exp(−γ²α²)]², α = a/w (B. J. Klein, J. J. Degnan,
 *   Appl. Opt. 13, 2134 (1974), doi:10.1364/AO.13.002134). For γ = 0 the optimum is α = 1.121, g = 0.8145.
 *
 * Geometric loss of a divergent beam, top-hat form: the beam of exit diameter d_t and full divergence θ fills a
 * disc of diameter d_t + θR, of which the receiver catches (d_r/(d_t + θR))² (S. Sheikh Muhammad, P. Köhldorfer, E. Leitgeb,
 * ICTON 2005, Tu.B3.5, eq. (1), doi:10.1109/ICTON.2005.1505832, θ "the opening angle of the beam"; the area form
 * SA_R/(SA_T + π(θR)²/4) is I. I. Kim et al., Opt. Eng. 37, 3143 (1998), eq. (1), doi:10.1117/1.601981: 20.00 against
 * 20.04 dB for 5 mm, 1 mrad, 1 km, 10 cm). A Gaussian beam with the same 1/e² footprint is twice as bright on axis, so a
 * small receiver catches 2× (3.01 dB) more. The Gaussian of `gaussianGeometricCapture` leaves the exit aperture with
 * w₀ = max(d_t/2, λ/(π θ/2)): an embedded Gaussian (M² ≥ 1) whose radius w(R)² = w₀² + (θR/2)² starts at the
 * aperture and ends at the far-field half-angle θ/2 (A. E. Siegman, "New developments in laser resonators",
 * Proc. SPIE 1224, 2 (1990), doi:10.1117/12.18425). The TEM₀₀ limit w₀ = λ/(π θ/2) is the same formula with z_R = w₀/(θ/2).
 *
 * Beam width of a truncated Gaussian: in the Fraunhofer zone the field of the beam over the annulus γa ≤ r ≤ a is
 * E(u) ∝ ∫_γ^1 exp(−α²ρ²) J₀(uρ) ρ dρ, u = k a sin θ (Hankel transform; J. W. Goodman, Introduction to Fourier
 * Optics, 3rd ed., ch. 4). Cutting the beam at its 1/e² radius (α = 1) widens the 1/e² lobe from 2α to u = 2.87,
 * 1.44× the untruncated λ/(πw); for α ≳ 2 the two agree.
 */

import { besselI0ScaledFast, besselJ, besselJ0Fast, firstCrossing, integrateGaussLegendre8 } from "../math";

/** Decibels of a linear power ratio. */
export const toDb = (ratio: number): number => 10 * Math.log10(ratio);

/** Free-space path loss (4πR/λ)², linear. */
export function freeSpacePathLoss(range: number, lambda: number): number {
  return ((4 * Math.PI * range) / lambda) ** 2;
}

/** Receive gain of a circular aperture, (πD/λ)² (1 − ε²) η, linear; ε = obscuration diameter ratio. */
export function apertureGain(diameter: number, lambda: number, obscuration = 0, efficiency = 1): number {
  const eps = Math.min(1, Math.max(0, obscuration));
  return ((Math.PI * diameter) / lambda) ** 2 * (1 - eps * eps) * efficiency;
}

/** On-axis gain 8/θ² of an untruncated Gaussian beam with far-field 1/e² half-angle θ (rad). */
export function gaussianTxGain(halfAngle: number): number {
  return halfAngle > 0 ? 8 / (halfAngle * halfAngle) : NaN;
}

/**
 * Klein–Degnan transmit efficiency g(α, γ) = (2/α²)[exp(−α²) − exp(−γ²α²)]², α = a/w (aperture radius over beam
 * 1/e² radius), γ = obscuration ratio. Multiply by (πD/λ)² for the on-axis gain.
 */
export function kleinDegnanEfficiency(alpha: number, gamma = 0): number {
  if (!(alpha > 0)) return NaN;
  const a2 = alpha * alpha;
  return (2 / a2) * (Math.exp(-a2) - Math.exp(-gamma * gamma * a2)) ** 2;
}

/**
 * The α = a/w that maximises g(α, γ), by golden-section search on [0.3, 3] (g is unimodal there for 0 ≤ γ ≤ 0.5;
 * 60 steps shrink the bracket to 1e-12).
 */
export function optimumTruncation(gamma = 0): { alpha: number; efficiency: number } {
  const r = (Math.sqrt(5) - 1) / 2;
  let lo = 0.3, hi = 3;
  let x1 = hi - r * (hi - lo), x2 = lo + r * (hi - lo);
  let f1 = kleinDegnanEfficiency(x1, gamma), f2 = kleinDegnanEfficiency(x2, gamma);
  for (let i = 0; i < 60; i++) {
    if (f1 > f2) {
      hi = x2; x2 = x1; f2 = f1; x1 = hi - r * (hi - lo); f1 = kleinDegnanEfficiency(x1, gamma);
    } else {
      lo = x1; x1 = x2; f1 = f2; x2 = lo + r * (hi - lo); f2 = kleinDegnanEfficiency(x2, gamma);
    }
  }
  const alpha = (lo + hi) / 2;
  return { alpha, efficiency: kleinDegnanEfficiency(alpha, gamma) };
}

/** Fraunhofer distance 2D²/λ beyond which an aperture of diameter D is in its far field. */
export function fraunhoferDistance(diameter: number, lambda: number): number {
  return (2 * diameter * diameter) / lambda;
}

export interface FriisResult {
  /** Received power, W (capped at P_t · maxFraction). */
  power: number;
  /** G_t G_r / FSPL, the uncapped fraction of P_t that Friis predicts. */
  fraction: number;
  /** True when the Friis value exceeded the cap. */
  capped: boolean;
}

/**
 * Friis received power P_t G_t G_r / (4πR/λ)², capped at P_t · maxFraction (the optics' total efficiency): a
 * receiver can't collect more than the whole beam.
 */
export function friisReceivedPower(
  txPower: number, txGain: number, rxGain: number, range: number, lambda: number, maxFraction = 1,
): FriisResult {
  const fraction = (txGain * rxGain) / freeSpacePathLoss(range, lambda);
  const capped = fraction > maxFraction;
  return { power: txPower * (capped ? maxFraction : fraction), fraction, capped };
}

/**
 * Top-hat geometric loss 20 log₁₀((d_t + θR)/d_r) in dB, θ the full divergence angle; 0 dB once the beam is no wider
 * than the receiver.
 */
export function topHatGeometricLoss(txDiameter: number, fullDivergence: number, range: number, rxDiameter: number): number {
  const beam = txDiameter + fullDivergence * range;
  return beam > rxDiameter ? 20 * Math.log10(beam / rxDiameter) : 0;
}

/**
 * Gaussian geometric capture: the fraction 1 − exp(−2(d_r/2)²/w²) of a beam of exit 1/e² diameter d_t and full 1/e²
 * divergence θ caught by a receiver of diameter d_r at range R, with w² = w₀² + (θR/2)² and w₀ = max(d_t/2, λ/(πθ/2)).
 * `diffractionLimited` is true when θ is below the TEM₀₀ divergence of a d_t/2 waist (the beam can't leave the aperture).
 */
export function gaussianGeometricCapture(
  txDiameter: number, fullDivergence: number, range: number, rxDiameter: number, lambda: number,
): { waist: number; beamRadius: number; fraction: number; diffractionLimited: boolean } {
  if (!(txDiameter > 0) || !(fullDivergence > 0) || !(range >= 0) || !(rxDiameter >= 0) || !(lambda > 0)) {
    return { waist: NaN, beamRadius: NaN, fraction: NaN, diffractionLimited: false };
  }
  const tem00 = lambda / (Math.PI * (fullDivergence / 2));
  const waist = Math.max(txDiameter / 2, tem00);
  const beamRadius = Math.hypot(waist, (fullDivergence * range) / 2);
  const fraction = -Math.expm1((-2 * (rxDiameter / 2) ** 2) / beamRadius ** 2);
  return { waist, beamRadius, fraction, diffractionLimited: tem00 > txDiameter / 2 };
}

/**
 * Far-field intensity I(u)/I(0) of a Gaussian beam (α = a/w) passed by an annular aperture γ ≤ r/a ≤ 1, at
 * u = k a sin θ. Simpson's rule with 200 intervals on ρ (error < 1e-8 for u ≤ 12 in the tests).
 */
export function truncatedGaussianFarField(u: number, alpha: number, gamma = 0): number {
  const a2 = alpha * alpha, g = Math.min(Math.max(gamma, 0), 1);
  if (!(alpha >= 0) || g >= 1) return NaN;
  const n = 200, h = (1 - g) / n;
  let sum = 0;
  for (let i = 0; i <= n; i++) {
    const r = g + i * h;
    sum += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * Math.exp(-a2 * r * r) * besselJ(0, u * r) * r;
  }
  // ∫_γ^1 exp(−α²ρ²) ρ dρ = e^(−α²) expm1(α²(1 − γ²))/(2α²), without cancellation as α → 0.
  const e0 = a2 > 0 ? (Math.exp(-a2) * Math.expm1(a2 * (1 - g * g))) / (2 * a2) : (1 - g * g) / 2;
  return ((sum * h) / 3 / e0) ** 2;
}

/**
 * u = k a sin θ at which the far-field intensity of the truncated Gaussian first falls to 1/e² of its peak. The
 * 1/e² half-angle is then θ = u λ/(2π a). Searched on [0, 2α + 6], which holds the main lobe for α ≤ 3, γ ≤ 0.5.
 */
export function truncatedGaussianWidth(alpha: number, gamma = 0): number {
  return firstCrossing((u) => truncatedGaussianFarField(u, alpha, gamma), 0, 2 * alpha + 6, Math.exp(-2), 400);
}

/**
 * Far field of a Gaussian Schell-model (GSM) beam, 1/e² intensity radius w = a/α and beam quality M² (before clipping),
 * passed by an annular aperture γ ≤ r/a ≤ 1. The GSM cross-spectral density √I(r₁)√I(r₂) exp(−|r₁ − r₂|²/(2σ_g²)) has
 * M² = √(1 + w²/σ_g²) (F. Gori, Opt. Commun. 34, 301 (1980); Mandel & Wolf, Optical Coherence and Quantum Optics, §5.6.4),
 * so σ_g = w/√(M⁴ − 1). Its Gaussian degree of coherence makes it an incoherent sum of coherent copies tilted with a
 * Gaussian spread of spatial frequencies q, p(q) = (σ_g²/2π) exp(−σ_g²q²/2); the far field is the coherent clipped
 * pattern |A(Q)|², A(Q) = ∫_γ^1 e^(−α²r²) J₀(Qr) r dr (r in units of a), averaged over the tilts. With the angle
 * integral done in closed form (DLMF 10.32.1), at u = k a sin θ:
 *   F(u) = σ² ∫₀^∞ |A(Q)|² exp(−σ²(Q − u)²/2) e^(−σ²uQ) I₀(σ²uQ) Q dQ,   σ = σ_g/a = 1/(α√(M⁴ − 1)),
 * and the on-axis efficiency (the Klein–Degnan g for M² = 1) is g = 8α² F(0): G_tx = (πD/λ)² g. Without clipping this
 * is the GSM's Gaussian far field, g = 2/(α²M⁴) and the 1/e² half-angle M²λ/(πw), u = 2M²α (tests). Quadrature:
 * A on a Q grid of step min(0.05, 0.2/σ) (Simpson error ≈ 1e-6 relative) up to u_max + 8/σ, each by 8-point Gauss–Legendre panels half a period π/Q wide;
 * F by Simpson's rule on that grid. The width u is the first 1/e² crossing of F(u)/F(0) on [0, 3M²α + 6]. M² ≤ 10.
 */
export function gsmFarField(alpha: number, gamma: number, m2: number): { efficiency: number; width: number; intensity: (u: number) => number } {
  const bad = { efficiency: NaN, width: NaN, intensity: () => NaN };
  if (!(alpha > 0 && gamma >= 0 && gamma < 1 && m2 >= 1 && m2 <= 10)) return bad;
  const a2 = alpha * alpha;
  const coherent = m2 - 1 < 1e-6; // g differs from Klein–Degnan by ≈ 3(M² − 1)·…; the Q grid would grow as (M² − 1)^(−½)
  const sigma = coherent ? Infinity : 1 / (alpha * Math.sqrt(m2 * m2 - 1)); // m2 is M², so M⁴ = m2²
  const uMax = 3 * m2 * alpha + 6;
  const amplitude = (Q: number) => {
    const f = (r: number) => Math.exp(-a2 * r * r) * besselJ0Fast(Q * r) * r;
    const n = Math.max(4, Math.ceil(((1 - gamma) * Q) / Math.PI));
    const h = (1 - gamma) / n;
    let s = 0;
    for (let i = 0; i < n; i++) s += integrateGaussLegendre8(f, gamma + i * h, gamma + (i + 1) * h);
    return s;
  };
  let F: (u: number) => number;
  if (coherent) {
    F = (u) => amplitude(u) ** 2;
  } else {
    const step0 = Math.min(0.05, 0.2 / sigma);
    const n = 2 * Math.ceil((uMax + 8 / sigma) / step0 / 2);
    const h = (uMax + 8 / sigma) / n;
    const A2 = Array.from({ length: n + 1 }, (_, i) => amplitude(i * h) ** 2);
    const s2 = sigma * sigma;
    F = (u) => {
      let s = 0;
      for (let i = 0; i <= n; i++) {
        const Q = i * h;
        const d = Q - u;
        const w = s2 * d * d < 80 ? Math.exp(-0.5 * s2 * d * d) * besselI0ScaledFast(s2 * u * Q) * Q : 0;
        s += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * A2[i] * w;
      }
      return (s2 * s * h) / 3;
    };
  }
  const f0 = F(0);
  const intensity = (u: number) => F(u) / f0;
  return { efficiency: 8 * a2 * f0, width: firstCrossing(intensity, 0, uMax, Math.exp(-2), 100), intensity };
}
