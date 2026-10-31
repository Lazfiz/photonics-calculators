/**
 * χ⁽²⁾ crystals for second-harmonic generation of 1064 nm: effective coefficient d_eff of one phase-matched cut, the
 * indices it uses, and the focused-beam SHG power. Model tier: textbook (Boyd–Kleinman with walk-off, undepleted pump,
 * focus at the crystal centre, no absorption). SI units: λ in m, d in m/V, lengths in m, powers in W.
 *
 * - Type I phase matching of a negative uniaxial crystal (o + o → e, Boyd, Nonlinear Optics, 3rd ed., ch. 2):
 *   n_e(θ, 2ω) = n_o(ω), 1/n_e(θ)² = cos²θ/n_o² + sin²θ/n_e², so
 *   sin²θ = (n_o(ω)⁻² − n_o(2ω)⁻²)/(n_e(2ω)⁻² − n_o(2ω)⁻²). The e-wave walks off by
 *   tan ρ = (n_e(θ)²/2)(n_e⁻² − n_o⁻²) sin 2θ at 2ω.
 * - Wave in the XY plane of a biaxial crystal, propagating at φ from X and polarized in the plane:
 *   1/n² = sin²φ/n_x² + cos²φ/n_y².
 * - d_eff from the d_ij tensor and the cut, using each source's expression: BBO ooe d₃₁ sinθ − d₂₂ cosθ sin3φ (taken at
 *   |sin3φ| = 1 with both terms adding; the sheet gives d₃₁ as ±, and the opposite sign lowers d_eff by 3 %), LBO XY-plane ooe d₃₂ cosφ, KTP XY-plane type II d₁₅ sin²φ + d₂₄ cos²φ (EKSMA Optics data sheets for
 *   BBO, LBO and KTP: d_ij, indices at 1064 and 532 nm, cut angles, transparency). BiBO d_eff and transparency from
 *   CASTECH's BiBO sheet; its type I (ee → o) cut in the YZ plane from the Umemura 2007 Sellmeier fits (`biaxial-data.ts`):
 *   the in-plane fundamental at θ from Z, 1/n² = cos²θ/n_y² + sin²θ/n_z², matches n_x(2ω) at 11.2° from Z; it is quoted as
 *   180° − 11.2° = 168.8° (CASTECH: 168.9°), because in point group 2 the d₁₄ term makes d_eff differ between θ and 180° − θ
 *   and CASTECH's 3.0 pm/V belongs to 168.9°. LiNbO₃: d₃₁ = 4.4 and d₃₃ = 25.0 pm/V of 5 % MgO:LiNbO₃ at 1064 nm (I. Shoji et al., J. Opt.
 *   Soc. Am. B 14, 2268 (1997), doi 10.1364/JOSAB.14.002268, Table 10); first-order QPM d_eff = 2d₃₃/π; indices of
 *   congruent LiNbO₃ (Zelmon et al. 1997) and the 420–5200 nm window of Raicol's PPLN sheet.
 * - SHG power P_2ω = K P_ω², K = 16π² d_eff² L h(σ, ξ)/(ε₀ c n_ω n_2ω λ³), ξ = L/b, b = 2πn_ω w₀²/λ
 *   (G. D. Boyd & D. A. Kleinman, J. Appl. Phys. 39, 3597 (1968); `boydKleinmanH` in imaging/second-harmonic-generation.ts).
 *   At Δk = 0, h = arctan²ξ/ξ, largest (0.646) at ξ = 1.39 (2ξ/(1 + ξ²) = arctan ξ); detuning Δk to σ = 0.57 raises it to 1.068 at ξ = 2.84.
 *   For type II, n_ω is the mean of the two fundamental indices and the input is polarized at 45°.
 * - Walk-off (BK 1968 §II): B = ρ√(L k_ω)/2, k_ω = 2πn_ω/λ, and
 *   h(σ, B, ξ) = (1/4ξ) ∫∫_{−ξ}^{ξ} dτ dτ′ e^{iσ(τ−τ′) − (B²/ξ)(τ−τ′)²}/((1 + iτ)(1 − iτ′)).
 *   ρ is the walk-off of the e-wave (or in-plane wave) of the cut: the SH of BBO and LBO, the in-plane fundamental of KTP
 *   and BiBO (for type II the BK form with one walking wave is approximate); the 90° and QPM cuts have none.
 */

import { c, epsilon_0 } from "../constants";
import { boydKleinmanH, confocalParameter } from "../imaging/second-harmonic-generation";
import { biaxialIndices } from "./biaxial-data";
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

/**
 * Type I angle θ from Z in the YZ plane of a biaxial crystal where the in-plane wave of index
 * 1/n² = cos²θ/n_y² + sin²θ/n_z² equals `target`, rad. NaN if no angle in [0, 90°] does.
 */
export function yzPlaneMatchingAngle(ny: number, nz: number, target: number): number {
  if (!(ny > 0 && nz > 0 && target > 0) || ny === nz) return NaN;
  const s2 = (ny ** -2 - target ** -2) / (ny ** -2 - nz ** -2);
  return s2 >= 0 && s2 <= 1 ? Math.asin(Math.sqrt(s2)) : NaN;
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
  /** Poynting walk-off angle between the interacting waves, rad. */
  walkOff: number;
  source: string;
}

// EKSMA data-sheet values (pm/V and indices at 1064 / 532 nm).
const BBO = { d22: 2.2, d31: 0.08, no1064: 1.6551, no532: 1.675, ne532: 1.5555 };
/** BBO d₂₂ and d₃₁ from the EKSMA sheet, pm/V. */
export const BBO_D = { d22: BBO.d22, d31: BBO.d31 } as const;
const LBO = { d32: 0.98, phi: 11.6 * deg, nz1064: 1.6055, nx532: 1.5785, ny532: 1.6065 };
const KTP = { d15: 1.95, d24: 3.9, phi: 23.5 * deg, nx1064: 1.7404, ny1064: 1.7479, nz1064: 1.8296, nx532: 1.7797, ny532: 1.7897 };
// BiBO (Umemura 2007): the in-plane fundamental in the YZ plane is matched to n_x(532 nm), so n_ω = n_2ω = n_x(532 nm).
const BIBO = { o1064: biaxialIndices("bibo", SHG_LAMBDA), e532: biaxialIndices("bibo", SHG_LAMBDA / 2) };
export const BIBO_THETA = yzPlaneMatchingAngle(BIBO.o1064.ny, BIBO.o1064.nz, BIBO.e532.nx);
const BIBO_N = BIBO.e532.nx;
const LN = { d31: 4.4, d33: 25.0, o1064: crystalIndices("linbo3", 1064e-9), e532: crystalIndices("linbo3", 532e-9) };

export const BBO_THETA = typeIPhaseMatchingAngle(BBO.no1064, BBO.no532, BBO.ne532);
const ktpN = (KTP.nz1064 + xyPlaneIndex(KTP.nx1064, KTP.ny1064, KTP.phi)) / 2;

export const SHG_CRYSTALS: Record<ShgCrystalId, ShgCrystal> = {
  bbo: {
    name: "β-BBO", cut: `type I (ooe), θ = ${(BBO_THETA / deg).toFixed(1)}°`,
    deff: (BBO.d31 * Math.sin(BBO_THETA) + BBO.d22 * Math.cos(BBO_THETA)) * 1e-12,
    nOmega: BBO.no1064, n2Omega: BBO.no1064, transparency: [189e-9, 3500e-9],
    walkOff: Math.abs(uniaxialWalkOff(BBO.no532, BBO.ne532, BBO_THETA)),
    source: "EKSMA BBO sheet (d₂₂, d₃₁, indices); θ from the indices",
  },
  lbo: {
    name: "LBO", cut: "type I (ooe), XY plane, φ = 11.6°", deff: LBO.d32 * Math.cos(LBO.phi) * 1e-12,
    nOmega: LBO.nz1064, n2Omega: xyPlaneIndex(LBO.nx532, LBO.ny532, LBO.phi), transparency: [155e-9, 3200e-9],
    // XY plane: 1/n² = sin²φ/n_x² + cos²φ/n_y² is the uniaxial form with n_o → n_y, n_e → n_x, θ → φ.
    walkOff: Math.abs(uniaxialWalkOff(LBO.ny532, LBO.nx532, LBO.phi)),
    source: "EKSMA LBO sheet",
  },
  ktp: {
    name: "KTP", cut: "type II, XY plane, φ = 23.5°",
    deff: (KTP.d15 * Math.sin(KTP.phi) ** 2 + KTP.d24 * Math.cos(KTP.phi) ** 2) * 1e-12,
    nOmega: ktpN, n2Omega: xyPlaneIndex(KTP.nx532, KTP.ny532, KTP.phi), transparency: [350e-9, 4400e-9],
    walkOff: Math.abs(uniaxialWalkOff(KTP.ny1064, KTP.nx1064, KTP.phi)),
    source: "EKSMA KTP sheet",
  },
  bibo: {
    name: "BiBO", cut: `type I (ee → o), YZ plane, θ = ${(180 - BIBO_THETA / deg).toFixed(1)}°`, deff: 3.0e-12, nOmega: BIBO_N, n2Omega: BIBO_N,
    transparency: [286e-9, 2500e-9],
    // YZ plane: 1/n² = cos²θ/n_y² + sin²θ/n_z² is the uniaxial form with n_o → n_y, n_e → n_z.
    walkOff: Math.abs(uniaxialWalkOff(BIBO.o1064.ny, BIBO.o1064.nz, BIBO_THETA)), source: "CASTECH BiBO sheet (d_eff); n and θ from Umemura et al. 2007",
  },
  "mgo-ln": {
    name: "MgO:LiNbO₃ (bulk)", cut: "type I (ooe), θ = 90°, temperature-tuned", deff: LN.d31 * 1e-12,
    nOmega: LN.o1064.no, n2Omega: LN.o1064.no, transparency: [420e-9, 5200e-9], walkOff: 0,
    source: "d₃₁ Shoji et al. 1997; n_o Zelmon et al. 1997",
  },
  ppln: {
    name: "MgO:PPLN (QPM)", cut: "first-order QPM, eee", deff: ((2 * LN.d33) / Math.PI) * 1e-12,
    nOmega: crystalIndices("linbo3", 1064e-9).ne, n2Omega: LN.e532.ne, transparency: [420e-9, 5200e-9], walkOff: 0,
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
  /** Walk-off angle ρ, rad (default 0). */
  walkOff?: number;
}

export interface FocusedShg {
  /** P_2ω = K P_ω², 1/W. */
  K: number;
  h: number;
  xi: number;
  /** Confocal parameter, m. */
  b: number;
  /** Walk-off parameter B. */
  B: number;
}

/** Boyd–Kleinman SHG coefficient at exact phase matching (Δk = 0, σ = 0), with walk-off. */
export function focusedShg({ lambda, length, deff, nOmega, n2Omega, w0, walkOff = 0 }: FocusedShgInput): FocusedShg {
  const b = confocalParameter(lambda, nOmega, w0);
  const B = walkOffParameter(walkOff, length, lambda, nOmega);
  if (!(Number.isFinite(b) && length > 0 && Number.isFinite(deff) && nOmega >= 1 && n2Omega >= 1 && B >= 0)) {
    return { K: NaN, h: NaN, xi: NaN, b: NaN, B: NaN };
  }
  const xi = length / b;
  const h = B > 0 ? boydKleinmanHWalkOff(0, B, xi) : boydKleinmanH(0, xi);
  return { K: shgPrefactor(lambda, length, deff, nOmega, n2Omega) * h, h, xi, b, B };
}

/** Walk-off parameter B = ρ√(L k_ω)/2 with k_ω = 2πn_ω/λ (Boyd & Kleinman 1968). */
export function walkOffParameter(walkOff: number, length: number, lambda: number, nOmega: number): number {
  if (!(walkOff >= 0 && length > 0 && lambda > 0 && nOmega > 0)) return NaN;
  return (walkOff * Math.sqrt((length * 2 * Math.PI * nOmega) / lambda)) / 2;
}

/**
 * Boyd–Kleinman h(σ, B, ξ) with walk-off, focus at the crystal centre, no absorption:
 *   h = (1/4ξ) ∫∫_{−ξ}^{ξ} dτ dτ′ e^{iσ(τ−τ′) − (B²/ξ)(τ−τ′)²}/((1 + iτ)(1 − iτ′)).
 * With u = τ − τ′ the inner integral is closed: 1/((1 + iu + iτ′)(1 − iτ′)) = [1/(1 + iu + iτ′) + 1/(1 − iτ′)]/(2 + iu),
 * with antiderivative i[ln(1 − iτ′) − ln(1 + iu + iτ′)]/(2 + iu) (both arguments have real part 1, so the principal logs
 * are continuous) over τ′ ∈ [max(−ξ, −ξ − u), min(ξ, ξ − u)]. The u integral over [−2ξ, 2ξ] is Simpson's rule, cut where
 * e^{−(B²/ξ)u²} < 1e-12. The integrand is Hermitian, so h is the real part. B = 0 gives `boydKleinmanH`.
 */
export function boydKleinmanHWalkOff(sigma: number, B: number, xi: number): number {
  if (!Number.isFinite(sigma) || !(B >= 0 && Number.isFinite(B)) || !(Number.isFinite(xi) && xi > 0)) return NaN;
  const a = (B * B) / xi;
  const uMax = a > 0 ? Math.min(2 * xi, Math.sqrt(27.6 / a)) : 2 * xi;
  // ≥ 10 points per unit u (the 1/(1 + iτ) scale) and per radian of e^{iσu}; capped for very thick slabs.
  let n = Math.min(400_000, Math.max(400, Math.ceil(2 * uMax * 10 * Math.max(1, Math.abs(sigma)))));
  if (n % 2) n += 1;
  const step = (2 * uMax) / n;
  let sum = 0;
  for (let i = 0; i <= n; i++) {
    const u = -uMax + i * step;
    const lo = Math.max(-xi, -xi - u), hi = Math.min(xi, xi - u);
    // ΔF = [ln(1 − iτ′) − ln(1 + iu + iτ′)] from lo to hi: log-modulus (real) and argument (imaginary) parts.
    const dr = 0.5 * Math.log(((1 + hi * hi) * (1 + (u + lo) ** 2)) / ((1 + lo * lo) * (1 + (u + hi) ** 2)));
    const di = Math.atan(lo) - Math.atan(hi) - Math.atan(u + hi) + Math.atan(u + lo);
    // C = iΔF/(2 + iu)
    const den = 4 + u * u;
    const cr = (dr * u - 2 * di) / den, ci = (di * u + 2 * dr) / den;
    const weight = i === 0 || i === n ? 1 : i % 2 ? 4 : 2;
    sum += weight * Math.exp(-a * u * u) * (Math.cos(sigma * u) * cr - Math.sin(sigma * u) * ci);
  }
  return (sum * step) / 3 / (4 * xi);
}

/** Coarse scan, then golden-section refinement around the best scan point: the argument of the maximum of f on [lo, hi]. */
function maximize(f: (x: number) => number, lo: number, hi: number, scan: number): number {
  let best = lo, fBest = -Infinity;
  const dx = (hi - lo) / scan;
  for (let k = 0; k <= scan; k++) {
    const v = f(lo + k * dx);
    if (v > fBest) { fBest = v; best = lo + k * dx; }
  }
  const g = (Math.sqrt(5) - 1) / 2;
  let a = Math.max(lo, best - dx), b = Math.min(hi, best + dx);
  let x1 = b - g * (b - a), x2 = a + g * (b - a), f1 = f(x1), f2 = f(x2);
  // 20 steps shrink the bracket to 0.618²⁰ ≈ 7e-5 of 2dx; h is flat at its maximum.
  for (let it = 0; it < 20; it++) {
    if (f1 > f2) { b = x2; x2 = x1; f2 = f1; x1 = b - g * (b - a); f1 = f(x1); }
    else { a = x1; x1 = x2; f1 = f2; x2 = a + g * (b - a); f2 = f(x2); }
  }
  return (a + b) / 2;
}

/**
 * Best focus for walk-off B: the ξ (0.2–20) that maximizes h at σ = 0, or, with `tuneSigma`, h maximized over σ
 * (−0.5 to 2) at each ξ as well: the Boyd–Kleinman optimum, h = 1.068 at ξ = 2.84 and
 * σ = 0.57 for B = 0. Walk-off moves the optimum to ξ ≈ 1.4–1.8 and σ ≈ 0.6–0.75, well inside these ranges.
 */
const bestFocusCache = new Map<string, { h: number; xi: number; sigma: number }>();

export function bestFocus(B: number, tuneSigma = false): { h: number; xi: number; sigma: number } {
  if (!(B >= 0 && Number.isFinite(B))) return { h: NaN, xi: NaN, sigma: NaN };
  const key = `${B}|${tuneSigma}`;
  const cached = bestFocusCache.get(key);
  if (cached) return cached;
  if (bestFocusCache.size > 1000) bestFocusCache.clear();
  const result = searchBestFocus(B, tuneSigma);
  bestFocusCache.set(key, result);
  return result;
}

function searchBestFocus(B: number, tuneSigma: boolean): { h: number; xi: number; sigma: number } {
  const sigmaAt = (xi: number) => (tuneSigma ? maximize((s) => boydKleinmanHWalkOff(s, B, xi), -0.5, 2, 10) : 0);
  const xi = Math.exp(maximize((x) => boydKleinmanHWalkOff(sigmaAt(Math.exp(x)), B, Math.exp(x)), Math.log(0.2), Math.log(20), 12));
  const sigma = sigmaAt(xi);
  return { h: boydKleinmanHWalkOff(sigma, B, xi), xi, sigma };
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
