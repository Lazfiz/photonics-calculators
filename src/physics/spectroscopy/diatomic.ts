/**
 * Diatomic molecules: rigid-rotor-plus-distortion rotational levels, anharmonic vibrational levels, pure rotational
 * (microwave) lines with absolute intensities and the rovibrational (infrared) P and R branches. All wavenumbers are
 * in m⁻¹ (SI); multiply by c for frequency. Model tier: textbook.
 *
 *   B = h / (8π² c μ r²),  B_v = B_e − α_e (v + ½),  F_v(J) = B_v J(J+1) − D J²(J+1)²,
 *   G(v) = ω_e (v + ½) − ω_e x_e (v + ½)² + ω_e y_e (v + ½)³ + ω_e z_e (v + ½)⁴,  k = μ (2π c ω_e)²
 * (Herzberg, Spectra of Diatomic Molecules, 1950, ch. III; the constants in DIATOMICS are those of the NIST WebBook,
 * after Huber & Herzberg 1979). Isotopologues share the Born–Oppenheimer potential: with ρ = √(μ/μᵢ), ω_e → ρω_e,
 * ω_e x_e → ρ²ω_e x_e, ω_e y_e → ρ³, ω_e z_e → ρ⁴, α_e → ρ³, D_e → ρ⁴, and B_e follows from the same r_e (Herzberg ch. III.2).
 *
 * Line intensity of J → J+1 in absorption (HITRAN convention, per molecule, integrated over wavenumber):
 *   S = 2π² σ μ_d² (J+1) e^(−hcF(J)/kT) (1 − e^(−hcσ/kT)) / (3 h c ε₀ Q),
 * the Gaussian-unit 8π³σμ²(J+1)/(3hc)… with μ² → μ²/(4πε₀) (Gordy & Cook, Microwave Molecular Spectra, 3rd ed.,
 * 1984, ch. 2; Pickett et al., JQSRT 60, 883 (1998), doi 10.1016/S0022-4073(98)00091-0). (J+1) is the M-summed
 * squared dipole matrix element μ²(J+1)/(2J+1) times the 2J+1 lower-state degeneracy. Infrared lines use the
 * Hönl–London factors J+1 (R) and J (P) with the same Boltzmann and stimulated-emission factors, in relative units
 * (no transition dipole or Herman–Wallis factor).
 */
import { c, epsilon_0, h, k_B, m_u } from "../constants";

/** 1 debye in C·m (10⁻²¹/c). */
export const DEBYE = 1e-21 / c;

/** Spectroscopic constants of one isotopologue, SI: masses in u, wavenumbers in m⁻¹, r_e in m, dipole in C·m. */
export interface DiatomicConstants {
  m1: number;
  m2: number;
  re: number;
  we: number;
  wexe: number;
  weye: number;
  weze: number;
  alphaE: number;
  De: number;
  dipole: number;
}

export interface DiatomicPreset extends DiatomicConstants {
  label: string;
  /** Natural abundance of this isotopologue. */
  abundance: number;
  /** The next most abundant isotopologue: its masses and abundance. */
  minor: { label: string; m1: number; m2: number; abundance: number };
}

const cm = 100; // cm⁻¹ → m⁻¹

/**
 * Ground-state constants from the NIST Chemistry WebBook (Huber & Herzberg 1979). Atomic masses: AME2020
 * (Wang et al., Chin. Phys. C 45, 030003 (2021)); abundances: IUPAC 2013 (Meija et al., Pure Appl. Chem. 88, 293).
 * Dipole moments from the JPL catalogue entries 28001 (CO, Goorvitch 1994) and 36001 (HCl, de Leeuw & Dymanus).
 */
export const DIATOMICS: Record<"co" | "hcl", DiatomicPreset> = {
  co: {
    label: "¹²C¹⁶O", m1: 12, m2: 15.994914619, re: 1.128323e-10,
    we: 2169.81358 * cm, wexe: 13.28831 * cm, weye: 0.010511 * cm, weze: 5.74e-5 * cm, alphaE: 0.01750441 * cm, De: 6.12147e-6 * cm,
    dipole: 0.11011 * DEBYE, abundance: 0.9893 * 0.99757,
    minor: { label: "¹³C¹⁶O", m1: 13.00335483507, m2: 15.994914619, abundance: 0.0107 * 0.99757 },
  },
  hcl: {
    label: "H³⁵Cl", m1: 1.00782503223, m2: 34.968852682, re: 1.27455e-10,
    we: 2990.946 * cm, wexe: 52.8186 * cm, weye: 0.2243 * cm, weze: -0.0121 * cm, alphaE: 0.30718 * cm, De: 5.3194e-4 * cm,
    dipole: 1.109 * DEBYE, abundance: 0.99988 * 0.7576,
    minor: { label: "H³⁷Cl", m1: 1.00782503223, m2: 36.965902602, abundance: 0.99988 * 0.2424 },
  },
};

/** Reduced mass in kg from atomic masses in u; NaN unless both are > 0. */
export function reducedMass(m1_u: number, m2_u: number): number {
  return m1_u > 0 && m2_u > 0 ? ((m1_u * m2_u) / (m1_u + m2_u)) * m_u : NaN;
}

/** Rotational constant B = h/(8π²cμr²) in m⁻¹; NaN unless μ, r > 0. */
export function rotationalConstant(mu: number, r: number): number {
  return mu > 0 && r > 0 ? h / (8 * Math.PI ** 2 * c * mu * r * r) : NaN;
}

/** Harmonic force constant k = μ(2πcω_e)² in N/m. */
export function forceConstant(mu: number, we: number): number {
  return mu > 0 && we > 0 ? mu * (2 * Math.PI * c * we) ** 2 : NaN;
}

/** Vibrational term G(v) in m⁻¹. */
export function vibrationalTerm(v: number, k: Pick<DiatomicConstants, "we" | "wexe" | "weye" | "weze">): number {
  const x = v + 0.5;
  return k.we * x - k.wexe * x * x + k.weye * x ** 3 + k.weze * x ** 4;
}

/** B_v = B_e − α_e(v + ½), with B_e from r_e and the masses. */
export function rotationalConstantV(k: DiatomicConstants, v: number): number {
  return rotationalConstant(reducedMass(k.m1, k.m2), k.re) - k.alphaE * (v + 0.5);
}

/** Rotational term F(J) = BJ(J+1) − DJ²(J+1)² in m⁻¹. */
export function rotationalTerm(J: number, B: number, D: number): number {
  const x = J * (J + 1);
  return B * x - D * x * x;
}

/** Constants of another isotopologue (same r_e and potential), by the mass-scaling rules in the header. */
export function isotopologue(k: DiatomicConstants, m1: number, m2: number): DiatomicConstants {
  const rho = Math.sqrt(reducedMass(k.m1, k.m2) / reducedMass(m1, m2));
  return {
    ...k, m1, m2,
    we: k.we * rho, wexe: k.wexe * rho ** 2, weye: k.weye * rho ** 3, weze: k.weze * rho ** 4, alphaE: k.alphaE * rho ** 3, De: k.De * rho ** 4,
  };
}

/** Highest J kept: below the point where centrifugal distortion turns the line series back ((J+1)² < B/6D). */
const jCap = (B: number, D: number) => Math.min(1000, D > 0 ? Math.floor(Math.sqrt(B / (6 * D))) - 1 : 1000);

/**
 * Rotational partition function Q = Σ (2J+1) e^(−hcF(J)/kT), summed until the terms fall below 10⁻¹⁴ of the sum
 * (no nuclear-spin or vibrational factor, as in the JPL catalogue for ¹²C¹⁶O). NaN unless T > 0 and B > 0, and NaN
 * when the sum has not converged at the J cap (distortion turning the levels over, or J > 1000).
 */
export function rotationalPartition(B: number, D: number, T: number): number {
  if (!(T > 0 && B > 0 && D >= 0)) return NaN;
  const beta = (h * c) / (k_B * T);
  let Q = 0;
  for (let J = 0, cap = jCap(B, D); J <= cap; J++) {
    const term = (2 * J + 1) * Math.exp(-beta * rotationalTerm(J, B, D));
    Q += term;
    if (J > 1 && term < 1e-14 * Q && beta * rotationalTerm(J, B, D) > 1) return Q;
  }
  return NaN;
}

/** Most populated level, J ≈ √(kT/2hcB) − ½ (Herzberg eq. III,159), rounded. */
export function mostPopulatedJ(B: number, T: number): number {
  return B > 0 && T > 0 ? Math.max(0, Math.round(Math.sqrt((k_B * T) / (2 * h * c * B)) - 0.5)) : NaN;
}

export interface RotationalLine {
  /** Lower level J (the line is J → J+1). */
  J: number;
  /** Wavenumber in m⁻¹. */
  sigma: number;
  /** Fraction of molecules in the lower level. */
  population: number;
  /** Intensity in m per molecule (×100 for HITRAN cm/molecule). */
  S: number;
}

/**
 * Pure rotational absorption lines J → J+1 of one vibrational level, down to 10⁻⁶ of the strongest line (judged
 * without μ_d, so μ_d = 0 gives the same lines with S = 0). S is per molecule in that level: for v ≥ 1 multiply by
 * the vibrational population, and by the abundance for a sample. Returns [] on bad input.
 */
export function rotationalLines(B: number, D: number, dipole: number, T: number): RotationalLine[] {
  const Q = rotationalPartition(B, D, T);
  if (!Number.isFinite(Q) || !(dipole >= 0)) return [];
  const beta = (h * c) / (k_B * T);
  const lines: RotationalLine[] = [];
  const prefactor = (2 * Math.PI ** 2 * dipole ** 2) / (3 * h * c * epsilon_0);
  let max = 0;
  for (let J = 0, cap = jCap(B, D); J < cap; J++) {
    const E = rotationalTerm(J, B, D);
    const sigma = rotationalTerm(J + 1, B, D) - E;
    const population = ((2 * J + 1) * Math.exp(-beta * E)) / Q;
    const reduced = sigma * (J + 1) * (Math.exp(-beta * E) / Q) * -Math.expm1(-beta * sigma); // S/prefactor
    lines.push({ J, sigma, population, S: prefactor * reduced });
    max = Math.max(max, reduced);
    if (beta * E > 2 && reduced < 1e-6 * max) break;
  }
  return lines;
}

export interface RovibrationalLine {
  branch: "P" | "R";
  /** Lower-level J″ (P(J″): J″ → J″−1, R(J″): J″ → J″+1). */
  J: number;
  /** Wavenumber in m⁻¹. */
  sigma: number;
  /** Relative intensity: σ · Hönl–London · Boltzmann · (1 − e^(−hcσ/kT)) / Q (no transition dipole). */
  strength: number;
}

/**
 * P and R branches of the band v = 0 → vUpper, down to 10⁻⁴ of the strongest line, in relative units (multiply by an
 * abundance to mix isotopologues). The Q branch is absent for a ¹Σ state (ΔJ = 0 forbidden). [] on bad input.
 */
export function rovibrationalBand(k: DiatomicConstants, vUpper: number, T: number): RovibrationalLine[] {
  const B0 = rotationalConstantV(k, 0), B1 = rotationalConstantV(k, vUpper);
  const Q = rotationalPartition(B0, k.De, T);
  if (!Number.isFinite(Q) || !(B1 > 0) || !(vUpper >= 1)) return [];
  const beta = (h * c) / (k_B * T);
  const origin = vibrationalTerm(vUpper, k) - vibrationalTerm(0, k);
  const lines: RovibrationalLine[] = [];
  let max = 0;
  for (let J = 0, cap = Math.min(jCap(B0, k.De), jCap(B1, k.De)); J < cap; J++) {
    const E = rotationalTerm(J, B0, k.De);
    const boltz = Math.exp(-beta * E) / Q;
    const add = (branch: "P" | "R", Jup: number, hl: number) => {
      const sigma = origin + rotationalTerm(Jup, B1, k.De) - E;
      const strength = sigma * hl * boltz * -Math.expm1(-beta * sigma);
      lines.push({ branch, J, sigma, strength });
      max = Math.max(max, strength);
      return strength;
    };
    const sR = add("R", J + 1, J + 1);
    if (J >= 1) add("P", J - 1, J);
    if (beta * E > 2 && sR < 1e-4 * max) break;
  }
  return lines;
}
