/**
 * Rare-earth-doped fibre amplifiers and lasers. SI units: wavelengths in m, powers in W, cross-sections in m²,
 * densities in m⁻³, lengths in m, lifetimes in s.
 * Model tier: textbook (homogeneously broadened two-level system, co-propagating pump and signals, no ASE
 * self-saturation, no excited-state absorption or clustering; the intensity is taken as uniform over the doped area,
 * the overlap Γ scaling each beam's cross-sections).
 *
 * Sources:
 * - Two-level rate equations: C. R. Giles, E. Desurvire, J. Lightwave Technol. 9, 271 (1991), doi:10.1109/50.65886,
 *   eqs. (6)–(9): n₂/N = Σ_k Γ_kσ_akP_k/(hν_kA) / (1/τ + Σ_k Γ_k(σ_ak + σ_ek)P_k/(hν_kA)),
 *   dP_k/dz = Γ_k(σ_ek n₂ − σ_ak n₁)P_k. The intrinsic saturation power is hνA/(Γ(σ_a + σ_e)τ).
 * - Closed form of those equations: A. A. M. Saleh, R. M. Jopson, J. D. Evankow, J. Aspell, IEEE Photon. Technol.
 *   Lett. 2, 714 (1990), doi:10.1109/68.60769. With photon fluxes Q_k = P_k/(hν_k), α_k = Γ_kσ_akN, g_k = Γ_kσ_ekN
 *   and ζ = NA/τ, every beam obeys Q_k(L) = Q_k(0)·exp((α_k + g_k)(Q_in − Q_out)/ζ − α_kL), a single equation for the
 *   total output flux Q_out.
 * - Noise figure: NF = (1 + 2n_ASE)/G with n_ASE = G∫₀ᴸ Γσ_e n₂(z)/G(z) dz photons per mode, which is
 *   1/G + 2n_sp(G − 1)/G for a uniform inversion (Desurvire, Erbium-Doped Fiber Amplifiers, Wiley 1994, ch. 2).
 * - Laser output coupling: W. W. Rigrod, J. Appl. Phys. 36, 2487 (1965), doi:10.1063/1.1714517 (standing wave,
 *   homogeneous gain of any size, mirror reflectances R₁ and R₂).
 */

import { c, h, N_A } from "../constants";
import { besselK } from "../math";
import { DB_PER_NEPER, lp01Mode, vNumber, type StepIndexFiber } from "./macro-bending-loss";

/** Silica density (kg/m³) for converting a weight fraction into an ion density. */
export const SILICA_DENSITY = 2201;

/** Cross-sections at one wavelength. */
export interface CrossSection {
  /** Wavelength, m. */
  readonly lambda: number;
  /** Absorption cross-section, m². */
  readonly sigmaA: number;
  /** Emission cross-section, m². */
  readonly sigmaE: number;
}

export interface DopantPreset {
  readonly id: "Er" | "Yb";
  readonly name: string;
  readonly host: string;
  /** Where the cross-sections and lifetime come from. */
  readonly source: string;
  /** Molar mass of the ion, kg/mol. */
  readonly molarMass: number;
  /** Upper-state (metastable) lifetime, s. */
  readonly tau: number;
  readonly pumps: readonly CrossSection[];
  readonly signals: readonly CrossSection[];
}

/**
 * Measured cross-sections for the two ions a two-level model describes (Er pumped at 980 nm, where the ⁴I₁₁/₂ level
 * empties in µs, or in band at 1480 nm; Yb). Real fibres vary with the host glass by tens of percent: use the fibre's
 * own data where there is any.
 * - Er³⁺ in GeO₂–Al₂O₃–SiO₂: W. L. Barnes, R. I. Laming, E. J. Tarbox, P. R. Morkel, IEEE J. Quantum Electron. 27, 1004
 *   (1991), doi:10.1109/3.83335. σ_a(980) 1.7 ± 0.3e-25 m² (Table V); 1480 and 1550 nm read from Fig. 6(c), ±0.15e-25 m² reading
 *   error on an absolute scale good to ±20 % (Table VI);
 *   τ 10.2 ms (p. 1005: the same as their Al₂O₃–SiO₂ fibre). No σ_e is given at 980 nm, where it is negligible.
 * - Yb³⁺ in aluminosilicate: M. A. Melkumov, I. A. Bufetov, K. S. Kravtsov, A. V. Shubin, E. M. Dianov, Quantum Electron.
 *   34, 843 (2004), doi:10.1070/QE2004v034n09ABEH002688; values from the authors' full report, arXiv:1502.02885,
 *   Appendix 2 (pm² = 1e-24 m²) and τ 0.83 ms (Table 1).
 */
export const DOPANT_PRESETS: readonly DopantPreset[] = [
  {
    id: "Er", name: "Erbium (Er³⁺)", host: "alumino-germanosilicate", source: "Barnes et al. 1991", molarMass: 0.167259, tau: 10.2e-3,
    pumps: [
      { lambda: 980e-9, sigmaA: 1.7e-25, sigmaE: 0 },
      { lambda: 1480e-9, sigmaA: 1.7e-25, sigmaE: 0.5e-25 },
    ],
    signals: [{ lambda: 1550e-9, sigmaA: 2.2e-25, sigmaE: 3.0e-25 }],
  },
  {
    id: "Yb", name: "Ytterbium (Yb³⁺)", host: "aluminosilicate", source: "Melkumov et al. 2004", molarMass: 0.173045, tau: 0.83e-3,
    pumps: [{ lambda: 976e-9, sigmaA: 2.69e-24, sigmaE: 2.97e-24 }],
    signals: [{ lambda: 1064e-9, sigmaA: 4.6e-27, sigmaE: 3.0e-25 }],
  },
];

export const photonEnergy = (lambda: number) => (h * c) / lambda;

/**
 * Fraction of the LP01 power inside the core, which is the overlap Γ of a core doped uniformly to its edge (weakly
 * guiding): Γ = 1 − (U²/V²)(1 − K₀²(W)/K₁²(W)) (D. Gloge, Appl. Opt. 10, 2252 (1971), doi:10.1364/AO.10.002252).
 * NaN below V = 0.5 (see MIN_V).
 */
export function coreOverlap(f: StepIndexFiber, lambda: number): number {
  const { U, V, W } = lp01Mode(vNumber(f, lambda));
  if (!Number.isFinite(U) || !Number.isFinite(W)) return NaN;
  const k = besselK(0, W) / besselK(1, W);
  return 1 - ((U * U) / (V * V)) * (1 - k * k);
}

/** Ion density (m⁻³) from a weight fraction in ppm of the ion in silica: ppm·10⁻⁶·ρ·N_A/M. */
export function ionDensityFromWtPpm(ppm: number, molarMass: number, density = SILICA_DENSITY): number {
  return ppm >= 0 && molarMass > 0 ? (ppm * 1e-6 * density * N_A) / molarMass : NaN;
}

/** Small-signal (unpumped) absorption Γσ_aN in dB/m. */
export function absorptionDbPerM(overlap: number, sigmaA: number, N: number): number {
  return DB_PER_NEPER * overlap * sigmaA * N;
}

/** Gain Γσ_eNL in dB at full inversion: an upper bound no pump reaches with σ_a > 0 at the pump. */
export function fullInversionGainDb(overlap: number, sigmaE: number, N: number, L: number): number {
  return DB_PER_NEPER * overlap * sigmaE * N * L;
}

/** Intrinsic saturation power hνA/(Γ(σ_a + σ_e)τ), W (Giles & Desurvire). */
export function intrinsicSaturationPower(
  lambda: number, area: number, overlap: number, sigmaA: number, sigmaE: number, tau: number,
): number {
  const denom = overlap * (sigmaA + sigmaE) * tau;
  return area > 0 && denom > 0 ? (photonEnergy(lambda) * area) / denom : NaN;
}

/** Doped fibre: ion density N (m⁻³), doped area A (m²), lifetime τ (s). */
export interface DopedFiber {
  readonly N: number;
  readonly area: number;
  readonly tau: number;
}

/** A co-propagating beam: its cross-sections, overlap Γ with the doping and launched power (W). */
export interface Beam extends CrossSection {
  readonly overlap: number;
  readonly power: number;
}

export interface TwoLevelSolution {
  /** Power of each beam at z, W. */
  readonly powers: readonly number[];
  /** Fraction of ions in the upper level at z. */
  readonly inversion: number;
}

const valid = (f: DopedFiber, beams: readonly Beam[], z: number) =>
  f.N >= 0 && f.area > 0 && f.tau > 0 && z >= 0 && Number.isFinite(z) &&
  beams.every((b) => b.lambda > 0 && b.sigmaA >= 0 && b.sigmaE >= 0 && b.overlap >= 0 && b.overlap <= 1 && b.power >= 0);

/**
 * Powers and inversion at z for co-propagating beams in a two-level fibre (Saleh et al. 1990). Solves
 * Σ Q_k e^{(α_k+g_k)x − α_k z} = Q_in − ζx for x = (Q_in − Q_out)/ζ ∈ [0, Q_in/ζ] by bisection (monotonic; 200 steps,
 * relative width 1e-15).
 */
export function twoLevelAt(fiber: DopedFiber, beams: readonly Beam[], z: number): TwoLevelSolution {
  if (!valid(fiber, beams, z)) return { powers: beams.map(() => NaN), inversion: NaN };
  const zeta = (fiber.N * fiber.area) / fiber.tau;
  const a = beams.map((b) => b.overlap * b.sigmaA * fiber.N);
  const g = beams.map((b) => b.overlap * b.sigmaE * fiber.N);
  const Q = beams.map((b) => b.power / photonEnergy(b.lambda));
  const Qin = Q.reduce((s, q) => s + q, 0);
  if (Qin === 0 || zeta === 0) return { powers: beams.map((b) => b.power), inversion: 0 };
  // An unlaunched beam stays at zero; skipping it avoids 0·∞ when its exponent overflows.
  const flux = (q: number, k: number, x: number) => (q === 0 ? 0 : q * Math.exp((a[k] + g[k]) * x - a[k] * z));
  const sum = (x: number) => Q.reduce((s, q, k) => s + flux(q, k, x), 0);
  let lo = 0;
  let hi = Qin / zeta;
  for (let i = 0; i < 200 && hi - lo > 1e-15 * hi; i++) {
    const mid = 0.5 * (lo + hi);
    if (sum(mid) - (Qin - zeta * mid) > 0) hi = mid;
    else lo = mid;
  }
  const x = 0.5 * (lo + hi);
  const Qz = Q.map((q, k) => flux(q, k, x));
  const num = Qz.reduce((s, q, k) => s + a[k] * q, 0);
  const den = zeta + Qz.reduce((s, q, k) => s + (a[k] + g[k]) * q, 0);
  return { powers: Qz.map((q, k) => q * photonEnergy(beams[k].lambda)), inversion: num / den };
}

export interface AmplifierResult {
  /** Output power of each beam, W. */
  readonly powers: readonly number[];
  /** Signal gain P_out/P_in (linear) of the beam at `signalIndex`. */
  readonly gain: number;
  /** Noise figure (linear) of that beam: (1 + 2n_ASE)/G, signal–spontaneous beat limit. */
  readonly noiseFigure: number;
}

/**
 * Amplifier of length L: output powers, the gain of beam `signalIndex`, and its noise figure from the inversion
 * profile (Simpson's rule over `steps` intervals, even).
 */
export function amplifier(fiber: DopedFiber, beams: readonly Beam[], L: number, signalIndex: number, steps = 200): AmplifierResult {
  const out = twoLevelAt(fiber, beams, L);
  const s = beams[signalIndex];
  if (!s || !(s.power > 0) || out.powers.some((p) => Number.isNaN(p))) return { powers: out.powers, gain: NaN, noiseFigure: NaN };
  const G = out.powers[signalIndex] / s.power;
  if (L === 0) return { powers: out.powers, gain: 1, noiseFigure: 1 };
  // Signal absorbed to below 1e-300 of its input: the gain is ~0 and the noise figure undefined.
  if (!(G > 1e-300)) return { powers: out.powers, gain: G, noiseFigure: NaN };
  const n = Math.max(2, steps + (steps % 2));
  const dz = L / n;
  let integral = 0;
  for (let i = 0; i <= n; i++) {
    const at = twoLevelAt(fiber, beams, i * dz);
    const f = (s.overlap * s.sigmaE * fiber.N * at.inversion) / (at.powers[signalIndex] / s.power);
    integral += f * (i === 0 || i === n ? 1 : i % 2 ? 4 : 2);
  }
  integral *= dz / 3;
  const nAse = G * integral;
  return { powers: out.powers, gain: G, noiseFigure: (1 + 2 * nAse) / G };
}

/** Stokes efficiency λ_p/λ_l. */
export const stokesEfficiency = (lambdaPump: number, lambdaLaser: number) =>
  lambdaPump > 0 && lambdaLaser > 0 ? lambdaPump / lambdaLaser : NaN;

/** Efficiency left after the quantum defect: slope efficiency ÷ Stokes efficiency (≤ 1 for a physical laser). */
export const efficiencyBeyondStokes = (slope: number, lambdaPump: number, lambdaLaser: number) =>
  slope / stokesEfficiency(lambdaPump, lambdaLaser);

/**
 * Rigrod output power ÷ saturation power (I_sat·A) of a standing-wave laser: single-pass small-signal gain g₀L
 * (nepers), reflectances R₁ (rear, with any internal loss folded in) and R₂ (output coupler),
 * P/P_sat = (1 − R₂)√R₁ (g₀L + ln√(R₁R₂)) / ((√R₁ + √R₂)(1 − √(R₁R₂))); 0 below threshold.
 */
export function rigrodOutput(g0L: number, R1: number, R2: number): number {
  if (!(g0L >= 0) || !(R1 > 0 && R1 <= 1) || !(R2 > 0 && R2 < 1)) return NaN;
  const r = Math.sqrt(R1 * R2);
  const net = g0L + Math.log(r);
  if (net <= 0) return 0;
  return ((1 - R2) * Math.sqrt(R1) * net) / ((Math.sqrt(R1) + Math.sqrt(R2)) * (1 - r));
}

/**
 * Output-coupler reflectance R₂ that maximises the Rigrod output: golden-section search between threshold,
 * R₂ = e^{−2g₀L}/R₁, and 1, where the output is unimodal (to 1e-10 in R₂).
 */
export function optimumOutputCoupler(g0L: number, R1: number): { R2: number; output: number } {
  if (!(g0L > 0) || !(R1 > 0 && R1 <= 1)) return { R2: NaN, output: NaN };
  if (R1 === 1) return { R2: 1, output: g0L }; // lossless rear: any small transmission extracts everything
  const threshold = Math.exp(-2 * g0L) / R1;
  if (threshold >= 1) return { R2: NaN, output: 0 }; // the rear loss alone exceeds the gain
  const phi = (Math.sqrt(5) - 1) / 2;
  let lo = threshold;
  let hi = 1 - 1e-12;
  for (let i = 0; i < 200 && hi - lo > 1e-10; i++) {
    const m1 = hi - phi * (hi - lo);
    const m2 = lo + phi * (hi - lo);
    if (rigrodOutput(g0L, R1, m1) < rigrodOutput(g0L, R1, m2)) lo = m1;
    else hi = m2;
  }
  const R2 = 0.5 * (lo + hi);
  return { R2, output: rigrodOutput(g0L, R1, R2) };
}
