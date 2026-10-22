/**
 * χ⁽²⁾ crystals for second-harmonic generation of 1064 nm: effective coefficient d_eff of one phase-matched cut, the
 * indices it uses, and the focused-beam SHG power. Model tier: textbook (Boyd–Kleinman, undepleted pump, exact phase
 * matching Δk = 0, no walk-off, no absorption). SI units: λ in m, d in m/V, lengths in m, powers in W.
 *
 * - Type I phase matching of a negative uniaxial crystal (o + o → e, Boyd, Nonlinear Optics, 3rd ed., ch. 2):
 *   n_e(θ, 2ω) = n_o(ω), 1/n_e(θ)² = cos²θ/n_o² + sin²θ/n_e², so
 *   sin²θ = (n_o(ω)⁻² − n_o(2ω)⁻²)/(n_e(2ω)⁻² − n_o(2ω)⁻²). The e-wave walks off by
 *   tan ρ = (n_e(θ)²/2)(n_e⁻² − n_o⁻²) sin 2θ at 2ω.
 * - Wave in the XY plane of a biaxial crystal, propagating at φ from X and polarized in the plane:
 *   1/n² = sin²φ/n_x² + cos²φ/n_y².
 * - d_eff from the d_ij tensor and the cut, using each source's expression: BBO ooe d₃₁ sinθ − d₂₂ cosθ sin3φ (taken at
 *   |sin3φ| = 1 with both terms adding; the sheet gives d₃₁ as ±, and the opposite sign lowers d_eff by 3 %), LBO XY-plane ooe d₃₂ cosφ, KTP XY-plane type II d₁₅ sin²φ + d₂₄ cos²φ (EKSMA Optics data sheets for
 *   BBO, LBO and KTP: d_ij, indices at 1064 and 532 nm, cut angles, transparency). BiBO d_eff, cut and Sellmeier from
 *   CASTECH's BiBO sheet. LiNbO₃: d₃₁ = 4.4 and d₃₃ = 25.0 pm/V of 5 % MgO:LiNbO₃ at 1064 nm (I. Shoji et al., J. Opt.
 *   Soc. Am. B 14, 2268 (1997), doi 10.1364/JOSAB.14.002268, Table 10); first-order QPM d_eff = 2d₃₃/π; indices of
 *   congruent LiNbO₃ (Zelmon et al. 1997) and the 420–5200 nm window of Raicol's PPLN sheet.
 * - SHG power P_2ω = K P_ω², K = 16π² d_eff² L h(σ, ξ)/(ε₀ c n_ω n_2ω λ³), ξ = L/b, b = 2πn_ω w₀²/λ
 *   (G. D. Boyd & D. A. Kleinman, J. Appl. Phys. 39, 3597 (1968); `boydKleinmanH` in imaging/second-harmonic-generation.ts).
 *   At Δk = 0, h = arctan²ξ/ξ, largest (0.646) at ξ = 1.39 (2ξ/(1 + ξ²) = arctan ξ); detuning Δk to σ = 0.57 raises it to 1.068 at ξ = 2.84.
 *   For type II, n_ω is the mean of the two fundamental indices and the input is polarized at 45°.
 */

import { c, epsilon_0 } from "../constants";
import { boydKleinmanH, confocalParameter } from "../imaging/second-harmonic-generation";
import { crystalIndices } from "./uniaxial-data";

/** Fundamental wavelength of the tabulated process (1064 → 532 nm), m. */
export const SHG_LAMBDA = 1064e-9;
/** Boyd–Kleinman optimum: h = 1.068 at ξ = 2.84 (σ = 0.57). */
export const BK_OPTIMUM = { h: 1.068, xi: 2.84 } as const;

const deg = Math.PI / 180;

/** Type I (o + o → e) phase-matching angle of a negative uniaxial crystal, rad. NaN if it can't phase-match. */
export function typeIPhaseMatchingAngle(noOmega: number, no2Omega: number, ne2Omega: number): number {
  if (!(noOmega > 0 && no2Omega > 0 && ne2Omega > 0)) return NaN;
  const s2 = (noOmega ** -2 - no2Omega ** -2) / (ne2Omega ** -2 - no2Omega ** -2);
  return s2 >= 0 && s2 <= 1 ? Math.asin(Math.sqrt(s2)) : NaN;
}

/** Walk-off angle of an e-wave at θ in a uniaxial crystal, rad. */
export function uniaxialWalkOff(no: number, ne: number, theta: number): number {
  if (!(no > 0 && ne > 0) || !Number.isFinite(theta)) return NaN;
  const neTheta2 = 1 / (Math.cos(theta) ** 2 / no ** 2 + Math.sin(theta) ** 2 / ne ** 2);
  return Math.atan((neTheta2 / 2) * (ne ** -2 - no ** -2) * Math.sin(2 * theta));
}

/** Index of a wave in the XY plane of a biaxial crystal at φ from X, polarized in that plane. */
export function xyPlaneIndex(nx: number, ny: number, phi: number): number {
  if (!(nx > 0 && ny > 0) || !Number.isFinite(phi)) return NaN;
  return 1 / Math.sqrt(Math.sin(phi) ** 2 / nx ** 2 + Math.cos(phi) ** 2 / ny ** 2);
}

export type ShgCrystalId = "bbo" | "lbo" | "ktp" | "bibo" | "mgo-ln" | "ppln";

export interface ShgCrystal {
  name: string;
  /** Phase-matched cut for 1064 → 532 nm. */
  cut: string;
  /** Effective coefficient, m/V. */
  deff: number;
  /** Fundamental index (mean of the two for type II) and SH index of the interacting waves. */
  nOmega: number;
  n2Omega: number;
  /** Transparency window, m. */
  transparency: [number, number];
  source: string;
}

// EKSMA data-sheet values (pm/V and indices at 1064 / 532 nm).
const BBO = { d22: 2.2, d31: 0.08, no1064: 1.6551, no532: 1.675, ne532: 1.5555 };
const LBO = { d32: 0.98, phi: 11.6 * deg, nz1064: 1.6055, nx532: 1.5785, ny532: 1.6065 };
const KTP = { d15: 1.95, d24: 3.9, phi: 23.5 * deg, nx1064: 1.7404, ny1064: 1.7479, nz1064: 1.8296, nx532: 1.7797, ny532: 1.7897 };
// CASTECH BiBO Sellmeier n_x² = 3.0740 + 0.0323/(λ² − 0.0316) − 0.01337λ² (λ in µm): the e-polarized fundamental in
// the YZ plane is matched to n_x(532 nm), so n_ω = n_2ω = n_x(532 nm).
const BIBO_N = Math.sqrt(3.074 + 0.0323 / (0.532 ** 2 - 0.0316) - 0.01337 * 0.532 ** 2);
const LN = { d31: 4.4, d33: 25.0, o1064: crystalIndices("linbo3", 1064e-9), e532: crystalIndices("linbo3", 532e-9) };

export const BBO_THETA = typeIPhaseMatchingAngle(BBO.no1064, BBO.no532, BBO.ne532);
const ktpN = (KTP.nz1064 + xyPlaneIndex(KTP.nx1064, KTP.ny1064, KTP.phi)) / 2;

export const SHG_CRYSTALS: Record<ShgCrystalId, ShgCrystal> = {
  bbo: {
    name: "β-BBO", cut: `type I (ooe), θ = ${(BBO_THETA / deg).toFixed(1)}°`,
    deff: (BBO.d31 * Math.sin(BBO_THETA) + BBO.d22 * Math.cos(BBO_THETA)) * 1e-12,
    nOmega: BBO.no1064, n2Omega: BBO.no1064, transparency: [189e-9, 3500e-9],
    source: "EKSMA BBO sheet (d₂₂, d₃₁, indices); θ from the indices",
  },
  lbo: {
    name: "LBO", cut: "type I (ooe), XY plane, φ = 11.6°", deff: LBO.d32 * Math.cos(LBO.phi) * 1e-12,
    nOmega: LBO.nz1064, n2Omega: xyPlaneIndex(LBO.nx532, LBO.ny532, LBO.phi), transparency: [155e-9, 3200e-9],
    source: "EKSMA LBO sheet",
  },
  ktp: {
    name: "KTP", cut: "type II, XY plane, φ = 23.5°",
    deff: (KTP.d15 * Math.sin(KTP.phi) ** 2 + KTP.d24 * Math.cos(KTP.phi) ** 2) * 1e-12,
    nOmega: ktpN, n2Omega: xyPlaneIndex(KTP.nx532, KTP.ny532, KTP.phi), transparency: [350e-9, 4400e-9],
    source: "EKSMA KTP sheet",
  },
  bibo: {
    name: "BiBO", cut: "type I, YZ plane, θ = 168.9°", deff: 3.0e-12, nOmega: BIBO_N, n2Omega: BIBO_N,
    transparency: [286e-9, 2500e-9], source: "CASTECH BiBO sheet",
  },
  "mgo-ln": {
    name: "MgO:LiNbO₃ (bulk)", cut: "type I (ooe), θ = 90°, temperature-tuned", deff: LN.d31 * 1e-12,
    nOmega: LN.o1064.no, n2Omega: LN.o1064.no, transparency: [420e-9, 5200e-9],
    source: "d₃₁ Shoji et al. 1997; n_o Zelmon et al. 1997",
  },
  ppln: {
    name: "MgO:PPLN (QPM)", cut: "first-order QPM, eee", deff: ((2 * LN.d33) / Math.PI) * 1e-12,
    nOmega: crystalIndices("linbo3", 1064e-9).ne, n2Omega: LN.e532.ne, transparency: [420e-9, 5200e-9],
    source: "d₃₃ Shoji et al. 1997, d_eff = 2d₃₃/π; n_e Zelmon et al. 1997",
  },
};

export interface FocusedShgInput {
  lambda: number;
  length: number;
  deff: number;
  nOmega: number;
  n2Omega: number;
  /** 1/e² radius of the focus at the crystal centre, m. */
  w0: number;
}

export interface FocusedShg {
  /** P_2ω = K P_ω², 1/W. */
  K: number;
  h: number;
  xi: number;
  /** Confocal parameter, m. */
  b: number;
}

/** Boyd–Kleinman SHG coefficient at exact phase matching (Δk = 0, σ = 0). */
export function focusedShg({ lambda, length, deff, nOmega, n2Omega, w0 }: FocusedShgInput): FocusedShg {
  const b = confocalParameter(lambda, nOmega, w0);
  if (!(Number.isFinite(b) && length > 0 && Number.isFinite(deff) && nOmega >= 1 && n2Omega >= 1)) {
    return { K: NaN, h: NaN, xi: NaN, b: NaN };
  }
  const xi = length / b;
  const h = boydKleinmanH(0, xi);
  return { K: shgPrefactor(lambda, length, deff, nOmega, n2Omega) * h, h, xi, b };
}

/** 16π² d² L/(ε₀ c n_ω n_2ω λ³), 1/W: K per unit h. */
export function shgPrefactor(lambda: number, length: number, deff: number, nOmega: number, n2Omega: number): number {
  if (!(lambda > 0 && length > 0 && nOmega >= 1 && n2Omega >= 1) || !Number.isFinite(deff)) return NaN;
  return (16 * Math.PI ** 2 * deff ** 2 * length) / (epsilon_0 * c * nOmega * n2Omega * lambda ** 3);
}

/** Waist that puts ξ = L/b at `xi`, w₀ = √(Lλ/(2π n ξ)), m. */
export function waistForXi(lambda: number, n: number, length: number, xi: number): number {
  if (!(lambda > 0 && n > 0 && length > 0 && xi > 0)) return NaN;
  return Math.sqrt((length * lambda) / (2 * Math.PI * n * xi));
}

/** Figure of merit d_eff²/(n_ω² n_2ω), m²/V² (plane-wave SHG efficiency ∝ it). */
export function shgFigureOfMerit(deff: number, nOmega: number, n2Omega: number): number {
  if (!(nOmega > 0 && n2Omega > 0) || !Number.isFinite(deff)) return NaN;
  return deff ** 2 / (nOmega ** 2 * n2Omega);
}
