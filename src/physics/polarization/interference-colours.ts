/**
 * Interference colours of a birefringent plate between polarizers (the Michel-Lévy chart), from first principles:
 * the spectral transmission of polarizer → plate → analyzer, weighted by D65 and the CIE 1931 observer
 * (cie-colour.ts). Model tier: exact for ideal polarizers and a plate at normal incidence; the retardance R(λ) may
 * carry the plate's dispersion.
 *
 * Transmission with the polarizer at P, the plate's slow (or fast) axis at φ, the analyzer at A and the retardance
 * Γ = 2πR/λ (Jones calculus; Born & Wolf, Principles of Optics, 7th ed., ch. 15 "Optics of crystals",
 * doi:10.1017/CBO9781139644181.024):
 *   T = cos²(A − P) − sin 2(φ − P) · sin 2(φ − A) · sin²(Γ/2),
 * so crossed polars at 45° give sin²(πR/λ) and parallel polars 1 − sin²(πR/λ).
 *
 * Each 5 nm sample stands for its 5 nm bin: sin²(Γ/2) = ½(1 − cos Γ) is replaced by its bin average
 * ½(1 − sinc(πRΔσ) cos Γ), Δσ = 5 nm/λ² (spectral-depolarization.ts). Without it the grid aliases above R ≈ 10 µm;
 * with it thick plates fade smoothly to the high-order white of the chart.
 *
 * The chart: Sørensen, "A revised Michel-Lévy interference colour chart based on first-principles calculations",
 * Eur. J. Mineral. 25, 5–10 (2013), doi:10.1127/0935-1221/2013/0025-2252.
 */
import { type RGB, type XYZ, COLOUR_WAVELENGTHS, srgbFromXyz, xyzFromSamples } from "../cie-colour";
import { sinc } from "./spectral-depolarization";

/** Wavelength step of the colour grid, m. */
const BIN = 5e-9;

/**
 * Polarizer → retarder (axis φ, retardance Γ) → analyzer transmission for light already polarized at P. The optional
 * visibility V (0…1) is the band average of cos Γ over the detected spectrum; V = 1 is monochromatic.
 */
export function polariscopeTransmission(P: number, phi: number, A: number, gamma: number, V = 1): number {
  return Math.cos(A - P) ** 2 - Math.sin(2 * (phi - P)) * Math.sin(2 * (phi - A)) * 0.5 * (1 - V * Math.cos(gamma));
}

/** Retardance at wavelength λ, both in m, with i the index on the colour grid (a constant without dispersion). */
export type RetardanceOf = (lambda: number, i: number) => number;

/** An extra visibility factor at wavelength λ (m), grid index i; e.g. the average of cos Γ over an image pixel. */
export type VisibilityOf = (lambda: number, i: number) => number;

/**
 * Spectral transmission on the colour grid (5 nm bins) for retardance R(λ) and the polariscope angles. The optional
 * V multiplies the bin visibility, for retardance that also varies across the area seen (a pixel of an image).
 */
export function interferenceSpectrum(R: RetardanceOf, P: number, phi: number, A: number, V?: VisibilityOf): number[] {
  return COLOUR_WAVELENGTHS.map((l, i) => {
    const r = R(l, i);
    const v = sinc((Math.PI * r * BIN) / (l * l)) * (V ? V(l, i) : 1);
    return polariscopeTransmission(P, phi, A, (2 * Math.PI * r) / l, v);
  });
}

/** XYZ (D65, clear = Y 1) of the plate between polarizers. */
export function interferenceXyz(R: RetardanceOf, P: number, phi: number, A: number, V?: VisibilityOf): XYZ {
  return xyzFromSamples(interferenceSpectrum(R, P, phi, A, V));
}

/** Display sRGB of the interference colour. */
export function interferenceColour(R: RetardanceOf, P: number, phi: number, A: number, V?: VisibilityOf): RGB {
  return srgbFromXyz(interferenceXyz(R, P, phi, A, V));
}

/**
 * Average of e^(iΓ) over a square pixel across which the path difference changes linearly by ΔRx and ΔRy (m):
 * sinc(πΔRx/λ)·sinc(πΔRy/λ). Fringes finer than a pixel then fade to their mean instead of aliasing.
 */
export function pixelVisibility(dRx: number, dRy: number, lambda: number): number {
  return sinc((Math.PI * dRx) / lambda) * sinc((Math.PI * dRy) / lambda);
}

/** Michel-Lévy chart colour: crossed polars, plate at 45°, constant retardance R (m). */
export function michelLevyColour(R: number, setting: "crossed" | "parallel" = "crossed"): RGB {
  const A = setting === "crossed" ? Math.PI / 2 : 0;
  return interferenceColour(() => R, 0, Math.PI / 4, A);
}


/**
 * A linear retarder in a chain: retardance Γ (rad) and fast-axis azimuth (rad), as in mueller.ts. Between linear
 * polarizers T is unchanged by Γ → −Γ on every plate, so giving all slow axes instead gives the same result.
 */
export interface ChainRetarder {
  gamma: number;
  axis: number;
}

/**
 * Normalised Stokes vector (S₁, S₂, S₃) behind the retarders (first listed first) for light polarized at P: the vector
 * (1, cos 2P, sin 2P, 0) is turned by each retarder (mueller.ts convention, R(−θ)·M·R(θ)).
 */
export function retarderChainStokes(P: number, chain: readonly ChainRetarder[]): [number, number, number] {
  let s1 = Math.cos(2 * P), s2 = Math.sin(2 * P), s3 = 0;
  for (const { gamma, axis } of chain) {
    const c2 = Math.cos(2 * axis), s2a = Math.sin(2 * axis), cg = Math.cos(gamma), sg = Math.sin(gamma);
    // Into the retarder frame: S₁' = c S₁ + s S₂, S₂' = −s S₁ + c S₂.
    const a1 = c2 * s1 + s2a * s2, a2 = -s2a * s1 + c2 * s2;
    // Retarder at 0: S₂'' = cos Γ S₂' + sin Γ S₃, S₃'' = −sin Γ S₂' + cos Γ S₃.
    const b2 = cg * a2 + sg * s3, b3 = -sg * a2 + cg * s3;
    s1 = c2 * a1 - s2a * b2;
    s2 = s2a * a1 + c2 * b2;
    s3 = b3;
  }
  return [s1, s2, s3];
}

/**
 * Polarizer at P → retarders → analyzer at A, ideal polarizers, light already polarized at P:
 * T = ½(1 + S₁ cos 2A + S₂ sin 2A) with S from retarderChainStokes. Equals polariscopeTransmission for one retarder.
 */
export function retarderChainTransmission(P: number, A: number, chain: readonly ChainRetarder[]): number {
  const [s1, s2] = retarderChainStokes(P, chain);
  return 0.5 * (1 + s1 * Math.cos(2 * A) + s2 * Math.sin(2 * A));
}

/**
 * Analyzer azimuth of least transmission behind the chain, in [0, π): the analyzer crosses the major axis of the
 * output ellipse, 2A = atan2(−S₂, −S₁), and T_min = ½(1 − √(S₁² + S₂²)). A is NaN for circular output.
 */
export function analyzerOfMinimum(P: number, chain: readonly ChainRetarder[]): { A: number; T: number } {
  const [s1, s2] = retarderChainStokes(P, chain);
  const lin = Math.hypot(s1, s2);
  if (!(lin > 1e-12)) return { A: NaN, T: 0.5 };
  const A = 0.5 * Math.atan2(-s2, -s1);
  return { A: A < 0 ? A + Math.PI : A, T: 0.5 * (1 - Math.min(1, lin)) };
}

/**
 * Sénarmont compensator: polarizer P, sample with its slow axis at P + 45° (or P + 135°), λ/4 plate with its slow
 * axis along P, analyzer. The light behind the λ/4 plate is linear at P + 90° ± Γ/2, so the analyzer turned by Δθ
 * from crossed extinguishes it and R = λΔθ/π, unambiguous for 0 ≤ R < λ (Δθ taken in [0, π)). Returns NaN unless
 * φ − P ≡ 45° or 135° (mod 180°) within 10⁻⁶ rad. Angles in rad, λ and R in m.
 */
export function senarmontRetardance(P: number, phi: number, Amin: number, lambda: number): number {
  const mod = (x: number) => ((x % Math.PI) + Math.PI) % Math.PI;
  const offset = mod(phi - P);
  const sign = Math.abs(offset - Math.PI / 4) < 1e-6 ? 1 : Math.abs(offset - (3 * Math.PI) / 4) < 1e-6 ? -1 : 0;
  if (sign === 0 || !Number.isFinite(Amin)) return NaN;
  return (lambda * mod(sign * (Amin - P - Math.PI / 2))) / Math.PI;
}

/** dT/dΓ of retarder k in the chain (central difference, step 1e-6 rad). */
export function chainTransmissionSlope(P: number, A: number, chain: readonly ChainRetarder[], k: number): number {
  const h = 1e-6;
  const at = (dg: number) => retarderChainTransmission(P, A, chain.map((r, i) => (i === k ? { ...r, gamma: r.gamma + dg } : r)));
  return (at(h) - at(-h)) / (2 * h);
}

/** A retarder of the chain given by its retardance R(λ, i) in m on the colour grid. */
export interface ChainPlate {
  R: RetardanceOf;
  axis: number;
}

const MAX_SUB = 5;
const SUB_STEP = 0.1;

/**
 * Display colour of a retarder chain between polarizers under D65. Each 5 nm bin is the midpoint-rule mean of n
 * samples, n = ⌈ΔΓ/0.1 rad⌉ capped at 5, with ΔΓ = 2π Σ|R| · 5 nm/λ² the phase spread across the bin: a relative
 * error ≤ 0.1²/24 ≈ 4 × 10⁻⁴ below the cap, and colours that hold to retardances of about 50 µm (1 nm samples) above
 * it. The single-plate colour uses the exact bin average instead.
 */
export function retarderChainColour(P: number, A: number, plates: readonly ChainPlate[]): RGB {
  const T = COLOUR_WAVELENGTHS.map((l, i) => {
    const Rs = plates.map((p) => p.R(l, i));
    const spread = (2 * Math.PI * Rs.reduce((s, R) => s + Math.abs(R), 0) * BIN) / (l * l);
    const n = Math.min(MAX_SUB, Math.max(1, Math.ceil(spread / SUB_STEP)));
    let sum = 0;
    for (let j = 0; j < n; j++) {
      const lam = l + ((j + 0.5) / n - 0.5) * BIN;
      sum += retarderChainTransmission(P, A, plates.map((p, k) => ({ gamma: (2 * Math.PI * Rs[k]) / lam, axis: p.axis })));
    }
    return sum / n;
  });
  return srgbFromXyz(xyzFromSamples(T));
}
