/**
 * Global (volume-averaged) model of a low-pressure argon discharge in a cylinder of radius R and length l:
 * the electron temperature from particle balance, the density from power balance, and the ion flux and
 * energy at the walls, where the substrate sits in plasma-assisted deposition.
 *
 * Model tier: Textbook approximation. Electropositive argon, Maxwellian electrons, ionisation from the
 * ground state only (no metastable step ionisation), cold ions, floating walls, uniform gas density, and
 * the low-pressure edge-to-centre ratios h_l, h_R. P_abs is the power absorbed by the electrons, not the
 * generator power.
 *
 * Reference: M. A. Lieberman, A. J. Lichtenberg, Principles of Plasma Discharges and Materials Processing,
 * 2nd ed. (Wiley, 2005), doi:10.1002/0471724254: Table 3.3 (argon rate constants), eq. 3.5.9 (E_c),
 * §10.2 (h_l, h_R, d_eff, particle and power balance, E_T = E_c + 2T_e + E_i).
 */
import { epsilon_0, k_B, m_e, m_u, q } from "../constants";

/** Argon atomic mass (kg), 39.948 u. */
export const M_AR = 39.948 * m_u;
/** Ionisation and lumped excitation thresholds of argon (eV), Lieberman & Lichtenberg Table 3.3. */
export const E_IZ = 15.76;
export const E_EX = 12.14;
/** Ion–neutral cross-section for the ion mean free path λ_i = 1/(n_g σ_i) (m²), L&L §10.2. */
export const SIGMA_I = 1e-18;

/** Argon ionisation rate constant (m³/s), T_e in eV. */
export function kIz(Te: number): number {
  return 2.34e-14 * Te ** 0.59 * Math.exp(-17.44 / Te);
}
/** Argon excitation rate constant (m³/s), T_e in eV. */
export function kEx(Te: number): number {
  return 2.48e-14 * Te ** 0.33 * Math.exp(-12.78 / Te);
}
/** Argon elastic-scattering rate constant (m³/s), T_e in eV. */
export function kEl(Te: number): number {
  const L = Math.log(Te);
  return 2.336e-14 * Te ** 1.609 * Math.exp(0.0618 * L * L - 0.1171 * L * L * L);
}

/** Collisional energy lost per electron–ion pair created (eV): E_iz + E_ex K_ex/K_iz + (3m/M) T_e K_el/K_iz. */
export function collisionalLoss(Te: number): number {
  if (!(Te > 0)) return NaN;
  const kiz = kIz(Te);
  return E_IZ + (E_EX * kEx(Te)) / kiz + ((3 * m_e) / M_AR) * Te * (kEl(Te) / kiz);
}

/** Bohm speed √(e T_e / M) (m/s), T_e in eV. */
export function bohmSpeed(Te: number): number {
  return Math.sqrt((q * Te) / M_AR);
}

/** Floating-wall sheath voltage T_e ln √(M / (2π m)) (V), T_e in eV: ≈ 4.68 T_e for argon. */
export function floatingSheathVoltage(Te: number): number {
  return Te * Math.log(Math.sqrt(M_AR / (2 * Math.PI * m_e)));
}

export interface Geometry {
  /** Ion mean free path (m). */
  lambdaI: number;
  /** Axial (end-wall) edge-to-centre density ratio. */
  hl: number;
  /** Radial edge-to-centre density ratio. */
  hR: number;
  /** Effective plasma size d_eff = R l / (2(R h_l + l h_R)) (m). */
  dEff: number;
  /** Effective loss area A_eff = 2πR(R h_l + l h_R) (m²). */
  aEff: number;
}

/** Low-pressure edge-to-centre ratios and effective size of a cylinder (R, l in m) at gas density n_g (m⁻³). */
export function geometry(R: number, l: number, ng: number): Geometry {
  if (!(R > 0 && l > 0 && ng > 0)) return { lambdaI: NaN, hl: NaN, hR: NaN, dEff: NaN, aEff: NaN };
  const lambdaI = 1 / (ng * SIGMA_I);
  const hl = 0.86 / Math.sqrt(3 + l / (2 * lambdaI));
  const hR = 0.8 / Math.sqrt(4 + R / lambdaI);
  return {
    lambdaI,
    hl,
    hR,
    dEff: (R * l) / (2 * (R * hl + l * hR)),
    aEff: 2 * Math.PI * R * (R * hl + l * hR),
  };
}

/**
 * True when the low-pressure (variable-mobility) h-factors hold, λ_i ≳ (T_i/T_e)·max(l, R) with cold ions
 * at the gas temperature (L&L §5.3). Past it ions diffuse at constant mobility, h falls faster with
 * pressure, and n₀ is underestimated.
 */
export function lowPressureRegime(d: Pick<Discharge, "lambdaI" | "Te">, R: number, l: number, Tg: number): boolean {
  return d.lambdaI >= ((k_B * Tg) / (q * d.Te)) * Math.max(R, l);
}

/** Lowest and highest T_e (eV) the particle-balance solve searches. */
export const TE_MIN = 0.5;
export const TE_MAX = 30;

/**
 * Electron temperature (eV) from particle balance K_iz(T_e)/u_B(T_e) = 1/(n_g d_eff), by bisection to
 * 1e-10 relative. The left side rises with T_e, so the root is unique. NaN when it lies outside
 * [TE_MIN, TE_MAX] (n_g d_eff too large or too small for this model).
 */
export function electronTemperature(ngDeff: number): number {
  if (!(ngDeff > 0)) return NaN;
  const f = (Te: number) => kIz(Te) / bohmSpeed(Te) - 1 / ngDeff;
  let lo = TE_MIN;
  let hi = TE_MAX;
  if (f(lo) > 0 || f(hi) < 0) return NaN;
  for (let i = 0; i < 200 && hi - lo > 1e-10 * hi; i++) {
    const mid = 0.5 * (lo + hi);
    if (f(mid) > 0) hi = mid;
    else lo = mid;
  }
  return 0.5 * (lo + hi);
}

export interface Discharge extends Geometry {
  /** Gas density (m⁻³). */
  ng: number;
  /** Electron temperature (eV). */
  Te: number;
  /** Bohm speed (m/s). */
  uB: number;
  /** Collisional energy per pair (eV). */
  Ec: number;
  /** Mean ion energy at a floating wall, V_s + T_e/2 (eV). */
  Ei: number;
  /** Total energy lost per ion lost, E_c + 2T_e + E_i (eV). */
  ET: number;
  /** Centre plasma density (m⁻³). */
  n0: number;
  /** Ion flux to the end walls (electrodes, substrate) h_l n0 u_B (m⁻² s⁻¹). */
  ionFluxAxial: number;
  /** Ion flux to the side wall h_R n0 u_B (m⁻² s⁻¹). */
  ionFluxRadial: number;
  /** Electron Debye length at the centre (m). */
  debye: number;
}

/**
 * Argon global model: P_abs (W) absorbed in a cylinder of radius R and length l (m) at pressure p (Pa)
 * and gas temperature T_g (K). n0 = P_abs / (e u_B A_eff E_T). All fields NaN when the inputs are out of
 * range or T_e has no root in [TE_MIN, TE_MAX].
 */
export function argonDischarge(Pabs: number, R: number, l: number, p: number, Tg: number): Discharge {
  const ng = p / (k_B * Tg);
  const g = geometry(R, l, ng);
  const Te = Pabs >= 0 && Tg > 0 ? electronTemperature(ng * g.dEff) : NaN;
  const uB = bohmSpeed(Te);
  const Ec = collisionalLoss(Te);
  const Ei = floatingSheathVoltage(Te) + Te / 2;
  const ET = Ec + 2 * Te + Ei;
  const n0 = Pabs / (q * uB * g.aEff * ET);
  return {
    ...g,
    ng,
    Te,
    uB,
    Ec,
    Ei,
    ET,
    n0,
    ionFluxAxial: g.hl * n0 * uB,
    ionFluxRadial: g.hR * n0 * uB,
    debye: Math.sqrt((epsilon_0 * Te) / (q * n0)),
  };
}
