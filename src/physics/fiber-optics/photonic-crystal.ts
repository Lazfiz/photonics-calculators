/**
 * Index-guiding photonic crystal fibre (solid silica core, one missing hole in a triangular lattice of air holes of
 * diameter d and pitch Λ) from the Saitoh–Koshiba empirical relations. Lengths in m.
 * Model tier: textbook approximation (fits to full-vector finite-element results).
 *
 *   V = (2π a_eff/λ) √(n_co² − n_FSM²),  W = (2π a_eff/λ) √(n_eff² − n_FSM²),  a_eff = Λ/√3
 *   V(λ/Λ, d/Λ) = A₁ + A₂ / (1 + A₃ exp(A₄ λ/Λ)),  A_i = a_i0 + a_i1 (d/Λ)^b_i1 + a_i2 (d/Λ)^b_i2 + a_i3 (d/Λ)^b_i3
 *   W(λ/Λ, d/Λ) = B₁ + B₂ / (1 + B₃ exp(B₄ λ/Λ)),  B_i likewise with c_ij, d_ij
 *   K. Saitoh, M. Koshiba, Opt. Express 13, 267 (2005), Eqs. (1)–(4) and Tables 1–2, doi 10.1364/OPEX.13.000267.
 *   The coefficient tables are as reproduced by Ouahab & Belkacem (arXiv:1307.8379, Tables 1–2); they reproduce
 *   the per-d/Λ fits of Rahmani et al. (arXiv:1908.01575, Tables I–II) to 4 digits. The fits cover
 *   0.2 ≤ d/Λ ≤ 0.8 and λ/Λ ≤ 2.
 *
 * Then n_eff² = n_co² − U²/(k a_eff)² with U² = V² − W², and n_co(λ) is fused silica (Malitson 1965), so
 * D = −(λ/c) d²n_eff/dλ² includes material and waveguide dispersion together. Single-mode while V < 2.405, with
 * a_eff = Λ/√3 (Koshiba & Saitoh, Opt. Lett. 29, 1739 (2004); Saitoh et al., Opt. Express 13, 10833 (2005),
 * which finds the endlessly single-mode limit d/Λ = 0.424 by FEM). The mode-field radius uses Marcuse's
 * step-index fit w/a_eff = 0.65 + 1.619 V^−1.5 + 2.879 V^−6 (Bell Syst. Tech. J. 56, 703 (1977)) and the
 * Gaussian area A_eff = πw². Confinement loss depends on the number of hole rings and is not modelled.
 */
import { c } from "../constants";
import { refractiveIndex, dispersionParameter } from "../materials/sellmeier";
import { MATERIALS } from "../materials/sellmeier-data";

/** Rows i = 1..4: [x_i0, x_i1, x_i2, x_i3] and the exponents [e_i1, e_i2, e_i3]. */
type Fit = readonly (readonly [readonly [number, number, number, number], readonly [number, number, number]])[];

const V_FIT: Fit = [
  [[0.54808, 5.00401, -10.43248, 8.22992], [5, 7, 9]],
  [[0.71041, 9.73491, 47.41496, -437.50962], [1.8, 7.32, 22.8]],
  [[0.16904, 1.85765, 18.96849, -42.4318], [1.7, 10, 14]],
  [[-1.52736, 1.06745, 1.93229, 3.89], [-0.84, 1.02, 13.4]],
];

const W_FIT: Fit = [
  [[-0.0973, -16.70566, 67.13845, -50.25518], [7, 9, 10]],
  [[0.53193, 6.70858, 52.04855, -540.66947], [1.49, 6.58, 24.8]],
  [[0.24876, 2.72423, 13.28649, -36.80372], [3.85, 10, 15]],
  [[5.29801, 0.05142, -5.18302, 2.7641], [-2, 0.41, 6]],
];

/** Cut-off of the second mode in the step-index analogy. */
export const V_CUTOFF = 2.405;
export const FIT_D_OVER_PITCH: readonly [number, number] = [0.2, 0.8];
export const FIT_MAX_LAMBDA_OVER_PITCH = 2;
/** Below this V Marcuse's spot-size fit is no longer accurate (≈ 1 % for 1.2 ≤ V ≤ 2.4 in step-index fibre). */
export const MARCUSE_MIN_V = 1.2;

const inDRange = (r: number) => r >= FIT_D_OVER_PITCH[0] && r <= FIT_D_OVER_PITCH[1];
/** The fitted W is physical only for 0 < W < V (n_FSM < n_eff < n_co); it dips below 0 for d/Λ < 0.4 at large λ/Λ. */
const physicalVW = (V: number, W: number) => W > 0 && W < V;

function coefficients(fit: Fit, dOverPitch: number): [number, number, number, number] {
  const r = dOverPitch;
  const A = fit.map(([x, e]) => x[0] + x[1] * r ** e[0] + x[2] * r ** e[1] + x[3] * r ** e[2]);
  return [A[0], A[1], A[2], A[3]];
}

function sigmoid(fit: Fit, lambdaOverPitch: number, dOverPitch: number): number {
  if (!(dOverPitch > 0 && dOverPitch < 1) || !(lambdaOverPitch > 0)) return NaN;
  const [A1, A2, A3, A4] = coefficients(fit, dOverPitch);
  return A1 + A2 / (1 + A3 * Math.exp(Math.min(A4 * lambdaOverPitch, 700)));
}

/** Saitoh–Koshiba V(λ/Λ, d/Λ). NaN outside 0 < d/Λ < 1 or for λ/Λ ≤ 0. */
export function saitohKoshibaV(lambdaOverPitch: number, dOverPitch: number): number {
  return sigmoid(V_FIT, lambdaOverPitch, dOverPitch);
}

/** Saitoh–Koshiba W(λ/Λ, d/Λ). NaN outside 0 < d/Λ < 1 or for λ/Λ ≤ 0. */
export function saitohKoshibaW(lambdaOverPitch: number, dOverPitch: number): number {
  return sigmoid(W_FIT, lambdaOverPitch, dOverPitch);
}

/** V in the short-wavelength limit λ/Λ → 0, A₁ + A₂/(1 + A₃): the largest V the fibre reaches. */
export function shortWavelengthV(dOverPitch: number): number {
  if (!(dOverPitch > 0 && dOverPitch < 1)) return NaN;
  const [A1, A2, A3] = coefficients(V_FIT, dOverPitch);
  return A1 + A2 / (1 + A3);
}

/** Endlessly single-mode: V stays below 2.405 at every wavelength. */
export function isEndlesslySingleMode(dOverPitch: number): boolean {
  return shortWavelengthV(dOverPitch) < V_CUTOFF;
}

/** d/Λ at which the fit's short-wavelength V equals 2.405 (bisection on [0.2, 0.8], 60 halvings). */
export function endlesslySingleModeLimit(): number {
  let lo = FIT_D_OVER_PITCH[0];
  let hi = FIT_D_OVER_PITCH[1];
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (shortWavelengthV(mid) < V_CUTOFF) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Second-mode cut-off wavelength λ_c (V(λ_c/Λ) = 2.405), m. V falls monotonically with λ/Λ. Returns 0 for an
 * endlessly single-mode fibre, NaN outside 0.2 ≤ d/Λ ≤ 0.8 or when V stays above 2.405 out to λ/Λ = 50.
 */
export function cutoffWavelength(pitch: number, dOverPitch: number): number {
  if (!(pitch > 0) || !inDRange(dOverPitch)) return NaN;
  if (isEndlesslySingleMode(dOverPitch)) return 0;
  let lo = 1e-9;
  let hi = 50;
  if (saitohKoshibaV(hi, dOverPitch) > V_CUTOFF) return NaN;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (saitohKoshibaV(mid, dOverPitch) > V_CUTOFF) lo = mid;
    else hi = mid;
  }
  return ((lo + hi) / 2) * pitch;
}

const SILICA = MATERIALS.fusedSilica.model;

/**
 * Fundamental-mode effective index n_eff = √(n_co² − U²/(k a_eff)²), with n_co of fused silica. NaN outside
 * 0.2 ≤ d/Λ ≤ 0.8 (the fit polynomials diverge beyond it) and where the fitted W is not in (0, V).
 */
export function effectiveIndex(pitch: number, holeDiameter: number, lambda: number): number {
  if (!(pitch > 0) || !(lambda > 0)) return NaN;
  const r = holeDiameter / pitch;
  if (!inDRange(r)) return NaN;
  const V = saitohKoshibaV(lambda / pitch, r);
  const W = saitohKoshibaW(lambda / pitch, r);
  if (!physicalVW(V, W)) return NaN;
  const nco = refractiveIndex(SILICA, lambda);
  const ka = (2 * Math.PI * pitch) / (Math.sqrt(3) * lambda);
  const n2 = nco * nco - (V * V - W * W) / (ka * ka);
  return n2 > 0 ? Math.sqrt(n2) : NaN;
}

/** Dispersion parameter D = −(λ/c) n_eff″ by a central difference with h = λ/500, s/m². */
export function pcfDispersion(pitch: number, holeDiameter: number, lambda: number): number {
  const h = lambda / 500;
  const nm = effectiveIndex(pitch, holeDiameter, lambda - h);
  const n0 = effectiveIndex(pitch, holeDiameter, lambda);
  const np = effectiveIndex(pitch, holeDiameter, lambda + h);
  return (-lambda / c) * ((np - 2 * n0 + nm) / (h * h));
}

export interface PcfMode {
  dOverPitch: number;
  lambdaOverPitch: number;
  /** Effective core radius Λ/√3, m. */
  aEff: number;
  V: number;
  W: number;
  U: number;
  /** Fused-silica core index at λ. */
  nCore: number;
  /** Fundamental space-filling-mode index of the cladding. */
  nFsm: number;
  nEff: number;
  /** Effective cladding NA √(n_co² − n_FSM²). */
  na: number;
  singleMode: boolean;
  endlesslySingleMode: boolean;
  /** Second-mode cut-off wavelength, m (0 when endlessly single-mode). */
  cutoffWavelength: number;
  /** Marcuse mode-field diameter 2w, m (NaN for V < 1.2). */
  mfd: number;
  /** Gaussian effective area πw², m². */
  effectiveArea: number;
  /** Total, material (bulk silica) and waveguide (difference) dispersion, s/m². */
  dispersion: number;
  materialDispersion: number;
  waveguideDispersion: number;
  /** Whether (d/Λ, λ/Λ) lies inside the range the fits were made over. */
  inFitRange: boolean;
  /** 0.2 ≤ d/Λ ≤ 0.8 and 0 < W < V; otherwise n_eff, n_FSM, NA, MFD and D are NaN. */
  physical: boolean;
}

/** All mode properties at (Λ, d, λ). Fields are NaN when the inputs are invalid (Λ, λ ≤ 0 or d/Λ ∉ (0, 1)). */
export function pcfMode(pitch: number, holeDiameter: number, lambda: number): PcfMode {
  const r = holeDiameter / pitch;
  const x = lambda / pitch;
  const aEff = pitch / Math.sqrt(3);
  const V = saitohKoshibaV(x, r);
  const W = saitohKoshibaW(x, r);
  const U = Math.sqrt(Math.max(V * V - W * W, 0));
  const nCore = refractiveIndex(SILICA, lambda);
  const ka = (2 * Math.PI * aEff) / lambda;
  const fsm2 = nCore * nCore - (V / ka) ** 2;
  const ok = inDRange(r) && physicalVW(V, W);
  const nFsm = ok && fsm2 >= 1 ? Math.sqrt(fsm2) : NaN;
  const nEff = effectiveIndex(pitch, holeDiameter, lambda);
  const w = !ok || V < MARCUSE_MIN_V ? NaN : aEff * (0.65 + 1.619 * V ** -1.5 + 2.879 * V ** -6);
  const dispersion = pcfDispersion(pitch, holeDiameter, lambda);
  const materialDispersion = dispersionParameter(SILICA, lambda);
  return {
    dOverPitch: r,
    lambdaOverPitch: x,
    aEff,
    V,
    W,
    U,
    nCore,
    nFsm,
    nEff,
    na: Number.isFinite(nFsm) ? V / ka : NaN,
    singleMode: V < V_CUTOFF,
    endlesslySingleMode: isEndlesslySingleMode(r),
    cutoffWavelength: cutoffWavelength(pitch, r),
    mfd: 2 * w,
    effectiveArea: Math.PI * w * w,
    dispersion,
    materialDispersion,
    waveguideDispersion: dispersion - materialDispersion,
    inFitRange: inDRange(r) && x > 0 && x <= FIT_MAX_LAMBDA_OVER_PITCH * (1 + 1e-9),
    physical: ok,
  };
}
