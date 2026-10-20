/**
 * High-gain (SASE) free-electron laser with a planar undulator.
 * SI units: lengths in m, current in A, power in W; energies as the Lorentz factor γ; emittance in m rad.
 * Model tier: textbook (Ming Xie's fit is within about 10 % of numerical eigenmode solutions).
 *
 * Huang Z., Kim K.-J. (2007), Review of x-ray free-electron laser theory, Phys. Rev. ST Accel. Beams 10, 034801:
 * - resonance λ₁ = λ_u(1 + K²/2)/(2γ²) (eq. 4); [JJ] = J₀(ξ) − J₁(ξ), ξ = K²/(4 + 2K²);
 * - Pierce parameter ρ = [(1/16)(I/I_A) K²[JJ]²/(γ³σ_x²k_u²)]^(1/3) (eq. 5), I_A = 4πε₀mc³/e ≈ 17.045 kA;
 * - 1D power gain length L_G0 = λ_u/(4π√3 ρ); Xie's scaled parameters (eq. 79) η_d = L_G0/(2k₁σ_x²),
 *   η_ε = (L_G0/β)(4πε/λ₁), η_γ = 4π(L_G0/λ_u)σ_δ and L_G = L_G0(1 + Λ) with the 19-coefficient Λ of eqs. 80–81.
 * Xie M. (1995), Design optimization for an X-ray free electron laser driven by SLAC linac, Proc. PAC 1995, 183:
 *   P(z) = (P_n/9) exp(z/L_G) < P_sat with the 1D noise P_n = ρ²cγmc²/λ₁, P_sat ≈ 1.6ρ(L_G0/L_G)²P_beam,
 *   L_sat = L_G ln(9P_sat/P_n), P_beam = γmc²I/e.
 * Not modelled: helical undulators ([JJ] = 1), tapering, harmonics, wakefields, quantum recoil.
 */

import { besselJ } from "../math";
import { c, epsilon_0, m_e, q } from "../constants";

/** Alfvén current I_A = 4πε₀ m_e c³/e, A (≈ 17 045 A). */
export const ALFVEN_CURRENT = (4 * Math.PI * epsilon_0 * m_e * c ** 3) / q;

/** Electron rest energy m_e c², J. */
export const ELECTRON_REST_ENERGY = m_e * c ** 2;

/** Lorentz factor of an electron of kinetic energy T (J). NaN for T < 0. */
export function lorentzFactor(kineticEnergy: number): number {
  if (!(kineticEnergy >= 0 && Number.isFinite(kineticEnergy))) return NaN;
  return 1 + kineticEnergy / ELECTRON_REST_ENERGY;
}

/** Resonance wavelength λ₁ = λ_u(1 + K²/2)/(2γ²), m. NaN for λ_u ≤ 0, K < 0 or γ < 1. */
export function resonanceWavelength(lambdaU: number, K: number, gamma: number): number {
  if (!(lambdaU > 0 && K >= 0 && gamma >= 1)) return NaN;
  return (lambdaU * (1 + (K * K) / 2)) / (2 * gamma * gamma);
}

/** Planar-undulator coupling factor [JJ] = J₀(ξ) − J₁(ξ), ξ = K²/(4 + 2K²). NaN for K < 0. */
export function besselFactor(K: number): number {
  if (!(K >= 0 && Number.isFinite(K))) return NaN;
  const xi = (K * K) / (4 + 2 * K * K);
  return besselJ(0, xi) - besselJ(1, xi);
}

/** rms beam size σ_x = √(βε_n/γ), m, from the average β function (m) and normalized emittance (m rad). */
export function beamSize(beta: number, normEmittance: number, gamma: number): number {
  if (!(beta > 0 && normEmittance > 0 && gamma >= 1)) return NaN;
  return Math.sqrt((beta * normEmittance) / gamma);
}

/** Pierce parameter ρ (Huang–Kim eq. 5) for peak current I (A), γ, K, λ_u (m) and rms beam size σ_x (m). */
export function pierceParameter(current: number, gamma: number, K: number, lambdaU: number, sigmaX: number): number {
  if (!(current > 0 && gamma >= 1 && K > 0 && lambdaU > 0 && sigmaX > 0)) return NaN;
  const ku = (2 * Math.PI) / lambdaU;
  const KJJ = K * besselFactor(K);
  return Math.cbrt(((current / ALFVEN_CURRENT) * KJJ * KJJ) / (16 * gamma ** 3 * sigmaX ** 2 * ku ** 2));
}

/** 1D power gain length L_G0 = λ_u/(4π√3 ρ), m. */
export function gainLength1D(lambdaU: number, rho: number): number {
  if (!(lambdaU > 0 && rho > 0)) return NaN;
  return lambdaU / (4 * Math.PI * Math.sqrt(3) * rho);
}

const XIE = [0.45, 0.57, 0.55, 1.6, 3, 2, 0.35, 2.9, 2.4, 51, 0.95, 3, 5.4, 0.7, 1.9, 1140, 2.2, 2.9, 3.2] as const;

/** Xie's gain-length degradation Λ(η_d, η_ε, η_γ) ≥ 0, L_G = L_G0(1 + Λ) (Huang–Kim eqs. 80–81). */
export function xieDegradation(etaD: number, etaE: number, etaG: number): number {
  if (!(etaD >= 0 && etaE >= 0 && etaG >= 0)) return NaN;
  const a = (i: number) => XIE[i - 1];
  return a(1) * etaD ** a(2) + a(3) * etaE ** a(4) + a(5) * etaG ** a(6)
    + a(7) * etaE ** a(8) * etaG ** a(9) + a(10) * etaD ** a(11) * etaG ** a(12)
    + a(13) * etaD ** a(14) * etaE ** a(15) + a(16) * etaD ** a(17) * etaE ** a(18) * etaG ** a(19);
}

export interface FelInput {
  /** Kinetic energy, J. */
  readonly kineticEnergy: number;
  /** Undulator period, m. */
  readonly lambdaU: number;
  /** Undulator parameter K (peak, planar). */
  readonly K: number;
  /** Peak current, A. */
  readonly current: number;
  /** Normalized rms emittance, m rad. */
  readonly normEmittance: number;
  /** Average β function, m. */
  readonly beta: number;
  /** Relative rms energy spread σ_δ. */
  readonly energySpread: number;
}

export interface FelResult {
  readonly gamma: number;
  readonly wavelength: number;
  readonly jj: number;
  readonly sigmaX: number;
  readonly rho: number;
  readonly gainLength1D: number;
  readonly etaD: number;
  readonly etaE: number;
  readonly etaG: number;
  /** 3D power gain length L_G0(1 + Λ), m. */
  readonly gainLength: number;
  /** Electron beam power γmc²I/e, W. */
  readonly beamPower: number;
  /** 1D effective shot-noise power ρ²cγmc²/λ₁, W. */
  readonly noisePower: number;
  /** Saturation power 1.6ρ(L_G0/L_G)²P_beam, W. */
  readonly saturationPower: number;
  /** Saturation length L_G ln(9P_sat/P_n), m. */
  readonly saturationLength: number;
}

/** All FEL quantities above; every field NaN when an input is out of its domain. */
export function freeElectronLaser(p: FelInput): FelResult {
  const gamma = lorentzFactor(p.kineticEnergy);
  const wavelength = resonanceWavelength(p.lambdaU, p.K, gamma);
  const jj = besselFactor(p.K);
  const sigmaX = beamSize(p.beta, p.normEmittance, gamma);
  const rho = pierceParameter(p.current, gamma, p.K, p.lambdaU, sigmaX);
  const lg0 = gainLength1D(p.lambdaU, rho);
  const k1 = (2 * Math.PI) / wavelength;
  const etaD = lg0 / (2 * k1 * sigmaX ** 2);
  const etaE = (lg0 / p.beta) * ((4 * Math.PI * p.normEmittance) / gamma / wavelength);
  const etaG = p.energySpread >= 0 ? 4 * Math.PI * (lg0 / p.lambdaU) * p.energySpread : NaN;
  const gainLength = lg0 * (1 + xieDegradation(etaD, etaE, etaG));
  const beamPower = (gamma * ELECTRON_REST_ENERGY * p.current) / q;
  const noisePower = (rho * rho * c * gamma * ELECTRON_REST_ENERGY) / wavelength;
  const saturationPower = 1.6 * rho * (lg0 / gainLength) ** 2 * beamPower;
  const saturationLength = gainLength * Math.log((9 * saturationPower) / noisePower);
  return {
    gamma, wavelength, jj, sigmaX, rho, gainLength1D: lg0, etaD, etaE, etaG, gainLength,
    beamPower, noisePower, saturationPower, saturationLength,
  };
}

/** Exponential-gain power (P_n/9) exp(z/L_G), W, capped at P_sat (the saturation dynamics are not modelled). */
export function felPower(z: number, r: FelResult): number {
  if (!(z >= 0)) return NaN;
  return Math.min(r.saturationPower, (r.noisePower / 9) * Math.exp(z / r.gainLength));
}
