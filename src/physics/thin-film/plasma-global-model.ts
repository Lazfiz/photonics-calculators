/**
 * Global (volume-averaged) model of an argon discharge in a cylinder of radius R and length l: the electron
 * temperature from particle balance, the density from power balance, and the ion flux and energy at the
 * walls, where the substrate sits in plasma-assisted deposition.
 *
 * Model tier: Textbook approximation. Electropositive argon, Maxwellian electrons, ionisation from the
 * ground state only (no metastable step ionisation), cold ions at the gas temperature, floating walls with
 * a collisionless sheath, uniform gas density, and Lieberman & Lichtenberg's edge-to-centre ratios h_l, h_R,
 * which join the low-pressure (variable-mobility) and the high-pressure (ambipolar-diffusion) solutions.
 * P_abs is the power absorbed by the electrons, not the generator power.
 *
 * Reference: M. A. Lieberman, A. J. Lichtenberg, Principles of Plasma Discharges and Materials Processing,
 * 2nd ed. (Wiley, 2005), doi:10.1002/0471724254: Table 3.3 (argon rate constants), eq. 3.5.9 (E_c),
 * §5.1–5.2 (ion mobility, ambipolar diffusion), §10.2 (h_l, h_R, d_eff, particle and power balance,
 * E_T = E_c + 2T_e + E_i). The h_R with its diffusion term and D_a = D_i(1 + T_e/T_i) as reproduced in
 * E. Kemaneci et al., J. Phys. D 50, 245203 (2017), doi:10.1088/1361-6463/aa7093 (preprint arXiv:1612.07268v1,
 * eqs. (2) and (7)).
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
  /** Ambipolar diffusion coefficient D_a (m²/s). */
  Da: number;
}

/** First zero of J₀ and J₁ there. */
const CHI01 = 2.404825557695773;
const J1_CHI01 = 0.5191474972894669;

/**
 * Ambipolar diffusion coefficient (m²/s) of argon ions at gas temperature T_g (K) with electrons at T_e (eV):
 * D_a = D_i (1 + T_e/T_i), D_i = e T_i / (M ν_i), ν_i = v̄_i / λ_i, v̄_i = √(8 e T_i / (π M)), T_i = k_B T_g / e
 * (L&L §5.1–5.2, cold ions at the gas temperature).
 */
export function ambipolarDiffusion(Te: number, Tg: number, lambdaI: number): number {
  if (!(Te > 0 && Tg > 0 && lambdaI > 0)) return NaN;
  const Ti = (k_B * Tg) / q;
  const vi = Math.sqrt((8 * q * Ti) / (Math.PI * M_AR));
  const Di = (q * Ti * lambdaI) / (M_AR * vi);
  return Di * (1 + Te / Ti);
}

/**
 * Edge-to-centre ratios and effective size of a cylinder (R, l in m) at gas density n_g (m⁻³), electron
 * temperature T_e (eV) and gas temperature T_g (K), L&L eqs. (10.2.1)–(10.2.2):
 *   h_l = 0.86 [3 + l/(2λ_i) + (0.86 l u_B / (π D_a))²]^(−1/2),
 *   h_R = 0.80 [4 + R/λ_i + (0.80 R u_B / (χ₀₁ J₁(χ₀₁) D_a))²]^(−1/2).
 * The last term is the diffusion solution (cosine and J₀ profiles, h → π D_a/(l u_B), χ₀₁J₁(χ₀₁) D_a/(R u_B)),
 * the first two the low-pressure one; at low pressure the last term is small.
 */
export function geometry(R: number, l: number, ng: number, Te: number, Tg: number): Geometry {
  if (!(R > 0 && l > 0 && ng > 0 && Te > 0 && Tg > 0)) {
    return { lambdaI: NaN, hl: NaN, hR: NaN, dEff: NaN, aEff: NaN, Da: NaN };
  }
  const lambdaI = 1 / (ng * SIGMA_I);
  const Da = ambipolarDiffusion(Te, Tg, lambdaI);
  const uB = bohmSpeed(Te);
  const xl = (0.86 * l * uB) / (Math.PI * Da);
  const xR = (0.8 * R * uB) / (CHI01 * J1_CHI01 * Da);
  const hl = 0.86 / Math.sqrt(3 + l / (2 * lambdaI) + xl * xl);
  const hR = 0.8 / Math.sqrt(4 + R / lambdaI + xR * xR);
  return {
    lambdaI,
    hl,
    hR,
    dEff: (R * l) / (2 * (R * hl + l * hR)),
    aEff: 2 * Math.PI * R * (R * hl + l * hR),
    Da,
  };
}

/**
 * True in the low-pressure (variable-mobility) regime, λ_i ≳ (T_i/T_e)·max(l, R) with cold ions at the gas
 * temperature (L&L §5.3). Past it the ions diffuse at constant mobility and the diffusion term of h_l, h_R
 * takes over.
 */
export function lowPressureRegime(d: Pick<Discharge, "lambdaI" | "Te">, R: number, l: number, Tg: number): boolean {
  return d.lambdaI >= ((k_B * Tg) / (q * d.Te)) * Math.max(R, l);
}

/** Lowest and highest T_e (eV) the particle-balance solve searches. */
export const TE_MIN = 0.5;
export const TE_MAX = 30;

/** T_e range (eV) of Gudmundsson's rate-constant fits, "1 < T_e ≤ 7 V" (Lieberman & Lichtenberg, Table 3.3, note a). */
export const TE_FIT_MIN = 1;
export const TE_FIT_MAX = 7;

/**
 * Electron temperature (eV) from particle balance K_iz(T_e)/u_B(T_e) = 1/(n_g d_eff), by bisection to
 * 1e-10 relative. n_g d_eff (m⁻²) is a number or a function of T_e (d_eff depends on T_e through the
 * diffusion term of h). K_iz n_g d_eff / u_B rises with T_e: K_iz grows faster than T_e^1.17 up to 30 eV,
 * while u_B/d_eff ∝ u_B h grows at most ∝ T_e (√T_e at low pressure, D_a ∝ T_e + T_i at high), so the
 * root is unique. NaN when it lies outside [TE_MIN, TE_MAX] (n_g d_eff too large or too small).
 */
export function electronTemperature(ngDeff: number | ((Te: number) => number)): number {
  const nd = typeof ngDeff === "number" ? () => ngDeff : ngDeff;
  const f = (Te: number) => (kIz(Te) * nd(Te)) / bohmSpeed(Te) - 1;
  let lo = TE_MIN;
  let hi = TE_MAX;
  if (!(f(lo) <= 0 && f(hi) >= 0)) return NaN;
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
 * and gas temperature T_g (K). T_e and h_l, h_R are solved together; n0 = P_abs / (e u_B A_eff E_T).
 * All fields NaN when the inputs are out of range or T_e has no root in [TE_MIN, TE_MAX].
 */
export function argonDischarge(Pabs: number, R: number, l: number, p: number, Tg: number): Discharge {
  const ng = p / (k_B * Tg);
  const Te = Pabs >= 0 && Tg > 0 && ng > 0 ? electronTemperature((t) => ng * geometry(R, l, ng, t, Tg).dEff) : NaN;
  const g = geometry(R, l, ng, Te, Tg);
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
