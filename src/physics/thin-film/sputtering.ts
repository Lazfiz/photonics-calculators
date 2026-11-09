/**
 * DC magnetron sputtering of an elemental target in argon: the ion current to the target, the sputtered
 * atom rate from a measured yield, the on-axis growth rate from a cosine-emitting disk, the most probable
 * energy of the sputtered atoms, and the distance over which the argon thermalises them (Westwood 1978).
 *
 * Model tier: Textbook approximation. Yields are measured values at 500 eV Ar⁺ (normal incidence), so the
 * rate is right only near a 500 V discharge unless a measured yield is entered. The target emits
 * uniformly over a disk with a cosine distribution (a real racetrack erodes a ring), every arriving atom
 * sticks, and the film has bulk density. The rate ignores gas scattering, so it is an upper bound; Westwood's
 * thermalisation distance says where the atoms stop arriving ballistic and start to diffuse.
 *
 * References: N. Laegreid, G. K. Wehner, J. Appl. Phys. 32, 365 (1961), doi:10.1063/1.1736012 (yields), as
 * tabulated in M. Ohring, The Materials Science of Thin Films (1992), Table 3-4. A. V. Phelps, Z. Lj. Petrović,
 * Plasma Sources Sci. Technol. 8, R21 (1999), doi:10.1088/0963-0252/8/3/201 (γ ≈ 0.07 for Ar⁺ on clean metal).
 * M. W. Thompson, Philos. Mag. 18, 377 (1968), doi:10.1080/14786436808227358 (energy distribution, peak at
 * U_s/2). M. Ohring, Materials Science of Thin Films, 2nd ed. (2002), ch. 2 (mean free path), ch. 3
 * (cosine-source deposition), ch. 5 (sputtering). C. Kittel, Introduction to Solid State Physics, 8th ed.,
 * Table 3.1 (cohesive energies used as U_s). CRC Handbook (densities, melting points). W. D. Westwood,
 * J. Vac. Sci. Technol. 15, 1 (1978), doi:10.1116/1.569429 (sputtered-atom mean free path and thermalisation).
 */
import { N_A, k_B, q } from "../constants";
import { structureZone } from "./thermal-evaporation";
import { M_AR } from "./plasma-global-model";

export interface SputterTarget {
  name: string;
  /** Molar mass (kg/mol). */
  M: number;
  /** Bulk density (kg/m³). */
  rho: number;
  /** Surface binding energy taken as the cohesive energy (eV/atom). */
  Us: number;
  /** Sputter yield at 500 eV Ar⁺, normal incidence (atoms/ion). */
  Y500: number;
  /** Melting point (K). */
  Tm: number;
}

/**
 * Y500: Laegreid & Wehner via Ohring (1992) Table 3-4 (Maissel & Glang ch. 4 Table 2 gives 0–17 % more at
 * 600 eV). U_s: Kittel Table 3.1. M: IUPAC. ρ (20 °C) and T_m: CRC Handbook.
 */
export const SPUTTER_TARGETS = {
  Al: { name: "Al", M: 26.982e-3, rho: 2700, Us: 3.39, Y500: 1.05, Tm: 933.47 },
  Si: { name: "Si", M: 28.085e-3, rho: 2329, Us: 4.63, Y500: 0.5, Tm: 1687 },
  Ti: { name: "Ti", M: 47.867e-3, rho: 4506, Us: 4.85, Y500: 0.51, Tm: 1941 },
  Cu: { name: "Cu", M: 63.546e-3, rho: 8960, Us: 3.49, Y500: 2.35, Tm: 1357.77 },
  Mo: { name: "Mo", M: 95.95e-3, rho: 10280, Us: 6.82, Y500: 0.8, Tm: 2896 },
  Ag: { name: "Ag", M: 107.868e-3, rho: 10490, Us: 2.95, Y500: 3.12, Tm: 1234.93 },
  Ta: { name: "Ta", M: 180.948e-3, rho: 16690, Us: 8.1, Y500: 0.57, Tm: 3290 },
  W: { name: "W", M: 183.84e-3, rho: 19250, Us: 8.9, Y500: 0.57, Tm: 3695 },
  Pt: { name: "Pt", M: 195.084e-3, rho: 21450, Us: 5.84, Y500: 1.4, Tm: 2041.4 },
  Au: { name: "Au", M: 196.967e-3, rho: 19300, Us: 3.81, Y500: 2.4, Tm: 1337.33 },
} as const satisfies Record<string, SputterTarget>;

export type SputterTargetId = keyof typeof SPUTTER_TARGETS;

/** Ion current (A) to the target: I/(1 + γ) with I = P/V, γ the ion-induced secondary-electron yield. */
export function targetIonCurrent(P: number, V: number, gamma: number): number {
  if (!(P >= 0 && V > 0 && gamma >= 0)) return NaN;
  return P / V / (1 + gamma);
}

/** Sputtered atoms per second from an ion current I_i (A) and yield Y: (I_i/e) Y. */
export function sputteredAtomRate(Ii: number, Y: number): number {
  if (!(Ii >= 0 && Y >= 0)) return NaN;
  return (Ii / q) * Y;
}

/**
 * On-axis flux (m⁻² s⁻¹) at distance d from a disk of radius a emitting Φ atoms/s uniformly with a cosine
 * distribution, onto a parallel plane: Φ / (π (a² + d²)). It tends to the point-source Φ/(π d²) for a ≪ d.
 */
export function diskOnAxisFlux(Phi: number, a: number, d: number): number {
  if (!(Phi >= 0 && a >= 0 && d > 0)) return NaN;
  return Phi / (Math.PI * (a * a + d * d));
}

/** Growth rate (m/s) of a film of molar mass M and density ρ from an atom flux F: F M / (ρ N_A). */
export function growthRate(F: number, M: number, rho: number): number {
  if (!(F >= 0 && M > 0 && rho > 0)) return NaN;
  return (F * M) / (rho * N_A);
}

/** Most probable energy (eV) of the Thompson distribution E/(E + U_s)³: U_s/2. */
export function thompsonPeakEnergy(Us: number): number {
  return Us > 0 ? Us / 2 : NaN;
}

/**
 * Hard-sphere diameter of argon (m) from its viscosity at 273 K, 21.0 µPa·s (CRC Handbook), through the
 * Chapman–Enskog hard-sphere relation η = (5/16) √(π m k_B T) / (π d²). It falls slowly with temperature
 * (3.59 Å from 22.7 µPa·s at 300 K).
 */
export const D_AR = 3.64e-10;

/** Mean free path of argon atoms (m) at pressure p (Pa) and temperature T (K): k_B T / (√2 π d² p). */
export function argonMeanFreePath(p: number, T: number): number {
  if (!(p > 0 && T > 0)) return NaN;
  return (k_B * T) / (Math.SQRT2 * Math.PI * D_AR * D_AR * p);
}

/** Argon diameter σ_g (m) that Westwood uses with his eq. (2): 0.29 nm. */
export const SIGMA_AR_WESTWOOD = 0.29e-9;

/**
 * Diameter σ_s (m) of a sputtered atom of mass m_s (u). Westwood (1978) gives only the end points, about 0.3 nm at
 * 20 u and 0.45 nm at 150 u; this reads them as linear in m_s and holds them constant outside. It reproduces his
 * values within about 10 % at 80 u (abstract: 42 cm at 0.1 Pa, 0.44 cm at 10 Pa) and
 * 1 % at 400 u (Fig. 5).
 */
export function sputteredAtomDiameter(msU: number): number {
  if (!(msU > 0)) return NaN;
  return (0.3 + (0.15 * (Math.min(Math.max(msU, 20), 150) - 20)) / 130) * 1e-9;
}

/**
 * Mean free path (m) of a sputtered atom (mass m_s, diameter σ_s) in a gas (m_g, σ_g) at pressure p (Pa) and
 * temperature T (K), with far fewer sputtered than gas atoms: λ = k_B T / (π ((σ_s + σ_g)/2)² p √(1 + m_s/m_g)).
 * W. D. Westwood, J. Vac. Sci. Technol. 15, 1 (1978), doi:10.1116/1.569429, eqs. (1)–(2); his prefactor
 * 8.34 × 10¹⁴ cm⁻¹ Pa⁻¹ is π/(k_B · 272.8 K) with σ in cm.
 */
export function sputteredMeanFreePath(
  p: number, T: number, ms: number, sigmaS: number, mg: number = M_AR, sigmaG: number = SIGMA_AR_WESTWOOD,
): number {
  if (!(p > 0 && T > 0 && ms > 0 && mg > 0 && sigmaS > 0 && sigmaG >= 0)) return NaN;
  const r = (sigmaS + sigmaG) / 2;
  return (k_B * T) / (Math.PI * r * r * p * Math.sqrt(1 + ms / mg));
}

/**
 * Jeans' persistence of velocities: the mean fraction ν′/ν of a hard-sphere atom's velocity kept along its
 * direction after one collision with a gas atom, for M = m_g/m_s (Westwood eq. (7), after Jeans). It is averaged
 * over the gas Maxwellian (Westwood's approximation); a fast atom hitting gas at rest keeps 1/(1 + M), so D from
 * eq. (13) is about 25–30 % shorter than with that limit:
 * (1 − M)/(1 + M) + 2M/(1 + M) · [ln(√(1 + M) + √M)/(4M^{3/2}√(1 + M)) + (2M⁴ + 5M³ + 3M² − M − 1)/(4M(1 + M)³)].
 * 0.406 for like atoms; → 1 as M → 0 (heavy atom) and → 0 as M → ∞. The bracket's two terms cancel to O(1) as
 * M → 0, so M is held ≥ 1e-4 (double precision keeps ≈ 1e-8 there).
 */
export function velocityPersistence(M: number): number {
  if (!(M >= 1e-4 && Number.isFinite(M))) return NaN;
  const s = Math.sqrt(M);
  const bracket =
    Math.asinh(s) / (4 * M * s * Math.sqrt(1 + M)) + (2 * M ** 4 + 5 * M ** 3 + 3 * M * M - M - 1) / (4 * M * (1 + M) ** 3);
  return (1 - M) / (1 + M) + ((2 * M) / (1 + M)) * bracket;
}

export interface Thermalisation {
  /** Mean free path of the sputtered atom (m), eq. (2). */
  lambda: number;
  /** ν′/ν per collision, eq. (7). */
  persistence: number;
  /** Collisions η′ along the ejection direction to reach thermal speed, eq. (8). */
  collisions: number;
  /** Distance travelled normal to the target before thermalising (m), eq. (13). */
  distance: number;
}

/**
 * Distance a sputtered atom ejected normal to the target with energy E0 (eV) travels before it slows to the
 * thermal energy of the gas: Westwood (1978) eqs. (8) and (13), η′ = ln(v_g/v₀)/ln(ν′/ν) and D = 1.25 η′ λ (the
 * 1.25 averages Jeans' λ_ν, which rises to 1.414 λ for fast atoms). D ∝ 1/p. The thermal end point is
 * v_g/v₀ = √(k_B T/E₀); E_g = k_B T reproduces the intercepts of his Fig. 3, and his eq. (2) prefactor uses T ≈ 273 K.
 * Beyond D the transport is diffusive. An atom at or below thermal energy has D = 0.
 */
export function thermalisationDistance(
  E0: number, p: number, T: number, ms: number, sigmaS: number, mg: number = M_AR, sigmaG: number = SIGMA_AR_WESTWOOD,
): Thermalisation {
  const lambda = sputteredMeanFreePath(p, T, ms, sigmaS, mg, sigmaG);
  const persistence = velocityPersistence(mg / ms);
  if (!(E0 > 0 && Number.isFinite(lambda) && persistence > 0 && persistence < 1)) {
    return { lambda, persistence, collisions: NaN, distance: NaN };
  }
  const collisions = Math.max(0, (0.5 * Math.log((E0 * q) / (k_B * T))) / -Math.log(persistence));
  return { lambda, persistence, collisions, distance: 1.25 * collisions * lambda };
}

/**
 * Ejection energy E* (eV) whose thermalisation distance equals d (m): eq. (13) inverted,
 * E* = k_B T · (ν′/ν)^(−2d/(1.25 λ)). Atoms ejected (normally) below E* are thermalised before reaching d.
 */
export function thermalisationEnergy(
  d: number, p: number, T: number, ms: number, sigmaS: number, mg: number = M_AR, sigmaG: number = SIGMA_AR_WESTWOOD,
): number {
  const lambda = sputteredMeanFreePath(p, T, ms, sigmaS, mg, sigmaG);
  const f = velocityPersistence(mg / ms);
  if (!(d >= 0 && Number.isFinite(lambda) && f > 0 && f < 1)) return NaN;
  return ((k_B * T) / q) * Math.exp((-2 * d * Math.log(f)) / (1.25 * lambda));
}

/**
 * Fraction of sputtered atoms ejected below energy E (eV) for the Thompson distribution 2U_s E/(E + U_s)³:
 * (E/(E + U_s))². The median is (1 + √2) U_s, so 89 % of atoms are faster than the U_s/2 peak.
 */
export function thompsonFractionBelow(E: number, Us: number): number {
  if (!(E >= 0 && Us > 0)) return NaN;
  if (E === Infinity) return 1;
  return (E / (E + Us)) ** 2;
}

/** Argon gas temperature (K) the sputtering page assumes for the thermalisation. */
export const SPUTTER_GAS_T = 300;

/** Sputter yield (atoms/ion) the sputtering page uses: the entered value, or the 500 eV table value when it is 0. */
export function sputterYield(target: SputterTarget, yieldParam: number): number {
  return yieldParam === 0 ? target.Y500 : yieldParam;
}

export interface SputteringDepositionInput {
  /** Discharge power (W). */
  power: number;
  /** Discharge voltage (V). */
  voltage: number;
  /** Ion-induced secondary-electron yield γ. */
  gamma: number;
  /** Sputter yield Y (atoms/ion), already resolved with `sputterYield`. */
  Y: number;
  /** Erosion-zone radius of the target (m). */
  targetRadius: number;
  /** Target–substrate distance (m). */
  distance: number;
  /** Argon pressure (Pa). */
  pressure: number;
  /** Substrate temperature (K). */
  substrateTemp: number;
}

/**
 * The sputtering page's whole chain, SI in and out: discharge current I = P/V, target ion current, sputtered atom
 * rate, on-axis flux and growth rate (m/s), Thompson peak energy, Westwood thermalisation at the peak energy,
 * thermalisation energy E* at the substrate distance, the thermalised share of the Thompson distribution and the
 * Movchan–Demchishin zone of the substrate (NaN at or above T_m).
 */
export function sputteringDeposition(t: SputterTarget, inp: SputteringDepositionInput) {
  const { power, voltage, gamma, Y, targetRadius: a, distance: d, pressure: p, substrateTemp: Ts } = inp;
  const I = power / voltage;
  const Ii = targetIonCurrent(power, voltage, gamma);
  const Phi = sputteredAtomRate(Ii, Y);
  const F = diskOnAxisFlux(Phi, a, d);
  const rate = growthRate(F, t.M, t.rho);
  const ms = t.M / N_A;
  const sigma = sputteredAtomDiameter(t.M * 1e3);
  const peak = thompsonPeakEnergy(t.Us);
  const th = thermalisationDistance(peak, p, SPUTTER_GAS_T, ms, sigma);
  const Es = thermalisationEnergy(d, p, SPUTTER_GAS_T, ms, sigma);
  const thermalised = thompsonFractionBelow(Es, t.Us);
  return { I, Ii, Phi, F, rate, th, Es, thermalised, d, Ts, zone: structureZone(Ts, t.Tm), peak };
}
