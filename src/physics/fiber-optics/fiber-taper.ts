/**
 * Heat-and-pull fibre tapers: shape and adiabaticity. SI units (m) in and out.
 *
 * Shape (Birks & Li, J. Lightwave Technol. 10, 432 (1992), doi 10.1109/50.134196). The fibre (radius r₀) is
 * stretched by an elongation x while a hot zone of length L = L₀ + αx softens it; volume conservation gives
 *   waist radius   r_w = r₀ (1 + αx/L₀)^(−1/(2α))    → r₀ e^(−x/(2L₀)) for a constant hot zone (α = 0),
 *   waist length   L_w = L₀ + αx,   each transition z₀ = (1 − α) x/2,
 *   profile        r(z) = r₀ (1 + 2αz/((1 − α)L₀))^(−1/(2α))   → r₀ e^(−z/L₀), 0 ≤ z ≤ z₀,
 * valid for −1 < α < 1 with L₀ + αx > 0. Along the transition the local taper angle is a function of r only:
 *   Ω(r) = |dr/dz| = r (r/r₀)^(2α) / ((1 − α) L₀).
 *
 * Modes along the taper: the core (radius a = r a₀/r₀) and cladding (radius ρ = r) shrink together inside a
 * surround of index n₃. The circularly symmetric LP0m modes of this three-layer step profile solve the scalar
 * wave equation, with J₀ in the core, I₀/K₀ (n_eff > n₂) or J₀/Y₀ (n_eff < n₂) in the cladding and K₀ outside;
 * ψ and ψ' are continuous at r = a and r = ρ. The scalar (weak-guidance) equation is exact at the core boundary
 * and approximate at the cladding–surround one (silica–air is strongly guiding): β differences are good while
 * V_clad = kρ√(n₂² − n₃²) ≫ 1, i.e. for waists well above the wavelength; sub-micron waists need vector modes.
 *
 * Adiabaticity (Love et al., IEE Proc. J 138, 343 (1991), doi 10.1049/ip-j.1991.0060): a circularly symmetric
 * taper couples LP01 only to LP0m, mostly LP02. Coupling is weak where the local taper length ρ/Ω exceeds the
 * LP01–LP02 beat length 2π/(β₁ − β₂), i.e. below the delineation curve Ω_d(ρ) = ρ(β₁ − β₂)/(2π). Where LP02 is
 * not guided β₂ is the radiation edge kn₃. The criterion is approximate (a factor of order one either way).
 *
 * Core–cladding transition: LP01 leaves the core where n_eff falls to n₂. At β = kn₂ the cladding field is
 * A + B ln r, and matching J₀ inside and K₀ outside gives
 *   J₀(V)/(V J₁(V)) = ln S + K₀(W)/(W K₁(W)),   V = ka√(n₁² − n₂²), W = kρ√(n₂² − n₃²), S = ρ/a,
 * whose small-V, large-W limit is V_cc ≈ √(2/ln S).
 */
import { besselIScaled01, besselJ, besselKScaled, besselKScaled01, besselY, BESSEL_Y_MAX_X } from "../math";

export interface TaperPull {
  /** Untapered cladding radius r₀, m. */
  r0: number;
  /** Initial hot-zone length L₀, m. */
  L0: number;
  /** Elongation x, m, ≥ 0. */
  x: number;
  /** Hot-zone growth rate α = dL/dx, −1 < α < 1 (0: constant hot zone). */
  alpha: number;
}

export interface TaperShape {
  waistRadius: number;
  waistLength: number;
  /** Length of each transition, m. */
  transitionLength: number;
  /** Both transitions plus the waist, m. */
  totalLength: number;
}

const validPull = ({ r0, L0, x, alpha }: TaperPull) =>
  r0 > 0 && L0 > 0 && x >= 0 && Number.isFinite(x) && alpha > -1 && alpha < 1 && L0 + alpha * x > 0;

/** r/r₀ after an elongation e (the waist when e = x), via log1p so that α → 0 tends smoothly to e^(−e/2L₀). */
const radiusRatio = (L0: number, alpha: number, e: number) =>
  alpha === 0 ? Math.exp(-e / (2 * L0)) : Math.exp(-Math.log1p((alpha * e) / L0) / (2 * alpha));

/** Birks–Li taper shape. NaN fields outside the domain. */
export function taperShape(p: TaperPull): TaperShape {
  if (!validPull(p)) return { waistRadius: NaN, waistLength: NaN, transitionLength: NaN, totalLength: NaN };
  const waistLength = p.L0 + p.alpha * p.x;
  const transitionLength = ((1 - p.alpha) * p.x) / 2;
  return {
    waistRadius: p.r0 * radiusRatio(p.L0, p.alpha, p.x),
    waistLength,
    transitionLength,
    totalLength: waistLength + 2 * transitionLength,
  };
}

/**
 * Cladding radius a distance z from the start of a transition: r₀ for z ≤ 0, the waist radius for z ≥ z₀.
 * The point z on the transition was pulled out of the hot zone after an elongation e = 2z/(1 − α).
 */
export function taperRadiusAt(p: TaperPull, z: number): number {
  if (!validPull(p) || Number.isNaN(z)) return NaN;
  const e = Math.min(Math.max((2 * z) / (1 - p.alpha), 0), p.x);
  return p.r0 * radiusRatio(p.L0, p.alpha, e);
}

/** Local taper angle Ω = |dr/dz|, rad, where the transition has radius r (waist ≤ r ≤ r₀). */
export function taperAngle(p: TaperPull, r: number): number {
  if (!validPull(p) || !(r > 0) || r > p.r0) return NaN;
  return (r * Math.pow(r / p.r0, 2 * p.alpha)) / ((1 - p.alpha) * p.L0);
}

export interface ThreeLayerFibre {
  /** Core radius a, m. */
  a: number;
  /** Cladding radius ρ > a, m. */
  rho: number;
  /** Core, cladding and surround indices, n₁ > n₂ > n₃ ≥ 1. */
  n1: number;
  n2: number;
  n3: number;
}

const validFibre = ({ a, rho, n1, n2, n3 }: ThreeLayerFibre, lambda: number) =>
  a > 0 && rho > a && n1 > n2 && n2 > n3 && n3 >= 1 && lambda > 0 && Number.isFinite(rho) && Number.isFinite(n1);

/**
 * Characteristic function of the three-layer LP0m problem, as a function of s:
 * s > 0 is w₂ρ with w₂ = √(β² − k²n₂²) (n_eff > n₂); s < 0 is −u₂ρ with u₂ = √(k²n₂² − β²).
 * Zero at a guided mode. Only its sign matters, so the n_eff > n₂ branch is scaled by e^(−w₂(ρ − a)) > 0.
 */
function dispersion(f: ThreeLayerFibre, k: number, s: number): number {
  const beta2 = k * k * f.n2 * f.n2 + (Math.sign(s) * s * s) / (f.rho * f.rho);
  const u1 = Math.sqrt(Math.max(k * k * f.n1 * f.n1 - beta2, 0));
  const w3 = Math.sqrt(beta2 - k * k * f.n3 * f.n3);
  const psiA = besselJ(0, u1 * f.a);
  const dPsiA = -u1 * besselJ(1, u1 * f.a);
  const [K0o, K1o] = besselKScaled01(w3 * f.rho);
  const outer = (w3 * K1o) / K0o; // −ψ'/ψ outside
  let psiR: number;
  let dPsiR: number;
  if (s > 0) {
    const w2 = s / f.rho;
    const xa = w2 * f.a;
    const xr = s;
    // ψ = A I₀ + B K₀ with A = a(w₂K₁ψ + K₀ψ'), B = a(w₂I₁ψ − I₀ψ') at r = a (Wronskian 1/x), scaled.
    const [K0a, K1a] = besselKScaled01(xa);
    const [I0a, I1a] = besselIScaled01(xa);
    const [K0r, K1r] = besselKScaled01(xr);
    const [I0r, I1r] = besselIScaled01(xr);
    const A = f.a * (w2 * K1a * psiA + K0a * dPsiA);
    const B = f.a * (w2 * I1a * psiA - I0a * dPsiA);
    const decay = Math.exp(-2 * (xr - xa));
    psiR = A * I0r + B * K0r * decay;
    dPsiR = w2 * (A * I1r - B * K1r * decay);
  } else {
    const u2 = -s / f.rho;
    const xa = u2 * f.a;
    const xr = -s;
    // ψ = A J₀ + B Y₀; Wronskian J₁Y₀ − J₀Y₁ = 2/(πx) gives det = 2/(πa).
    const det = 2 / (Math.PI * f.a);
    const A = (-u2 * besselY(1, xa) * psiA - besselY(0, xa) * dPsiA) / det;
    const B = (besselJ(0, xa) * dPsiA + u2 * besselJ(1, xa) * psiA) / det;
    psiR = A * besselJ(0, xr) + B * besselY(0, xr);
    dPsiR = -u2 * (A * besselJ(1, xr) + B * besselY(1, xr));
  }
  return dPsiR + outer * psiR;
}

/** Largest −s searched below n₂ (cladding modes): LP02 of a bare cladding sits at u₂ρ ≈ 5.52. */
const MAX_CLADDING_U = 15;
const SCAN_POINTS = 60;
/** Largest step in the core phase u₁a on the guided branch; adjacent LP0m roots there are ≈ π apart in u₁a. */
const MAX_CORE_U_STEP = 0.2;

/** Root of F in [a, b] given F(a)·F(b) ≤ 0: Illinois regula falsi, |step| < 1e-12·max(1, |s|), ≤ 100 steps. */
function illinois(F: (s: number) => number, a: number, fa: number, b: number, fb: number): number {
  if (fa === 0) return a;
  if (fb === 0) return b;
  let c = a;
  let side = 0;
  for (let it = 0; it < 100; it++) {
    const cNew = (a * fb - b * fa) / (fb - fa);
    const done = Math.abs(cNew - c) < 1e-12 * Math.max(1, Math.abs(cNew));
    c = cNew;
    if (done) break;
    const fc = F(c);
    if (fc === 0) break;
    if (fc * fb > 0) {
      b = c;
      fb = fc;
      if (side === -1) fa /= 2;
      side = -1;
    } else {
      a = c;
      fa = fc;
      if (side === 1) fb /= 2;
      side = 1;
    }
  }
  return c;
}

/**
 * Effective indices of the first `count` (1–3) guided LP0m modes, highest first; fewer if fewer are guided.
 * The guided branch (n_eff > n₂) is sampled evenly in the core phase u₁a, step ≤ MAX_CORE_U_STEP and at least
 * SCAN_POINTS points, with s = S√(V² − (u₁a)²): LP0m roots are ≈ π apart in u₁a, whereas in s they crowd together
 * near the top for large V. The cladding branch takes SCAN_POINTS points, ≈ 0.25 in u₂ρ. Each sign change is
 * refined by the Illinois variant of regula falsi to 1e-12 in s (at most 100 steps). Empty outside the domain.
 */
export function lp0Modes(f: ThreeLayerFibre, lambda: number, count = 2): number[] {
  if (!validFibre(f, lambda) || !(count >= 1 && count <= 3)) return [];
  const k = (2 * Math.PI) / lambda;
  const V = k * f.a * Math.sqrt(f.n1 * f.n1 - f.n2 * f.n2);
  const S = f.rho / f.a;
  const sBottom = -Math.min(k * f.rho * Math.sqrt(f.n2 * f.n2 - f.n3 * f.n3), MAX_CLADDING_U, BESSEL_Y_MAX_X);
  const eps = 1e-9;
  const grid: number[] = [];
  const nGuided = Math.max(SCAN_POINTS, Math.ceil(V / MAX_CORE_U_STEP));
  for (let i = 0; i < nGuided; i++) {
    const u = V * (eps + (1 - eps) * (i / nGuided));
    grid.push(S * Math.sqrt(V * V - u * u));
  }
  for (let i = 0; i < SCAN_POINTS; i++) grid.push(-eps + (sBottom * (1 - eps) + eps) * (i / (SCAN_POINTS - 1)));
  const F = (s: number) => dispersion(f, k, s);
  const nEff = (s: number) => Math.sqrt(f.n2 * f.n2 + (Math.sign(s) * s * s) / (k * k * f.rho * f.rho));
  const out: number[] = [];
  let sPrev = grid[0];
  let fPrev = F(sPrev);
  for (let i = 1; i < grid.length && out.length < count; i++) {
    const s = grid[i];
    const fs = F(s);
    if (Number.isFinite(fPrev) && Number.isFinite(fs) && fPrev * fs <= 0) {
      out.push(nEff(illinois(F, sPrev, fPrev, s, fs)));
    }
    sPrev = s;
    fPrev = fs;
  }
  return out;
}

/**
 * Love's delineation angle Ω_d = ρ(β₁ − β₂)/(2π) at cladding radius ρ, rad, with β₂ = kn₃ if LP02 is not
 * guided. NaN outside the domain.
 */
export function delineationAngle(f: ThreeLayerFibre, lambda: number): number {
  const [n01, n02] = lp0Modes(f, lambda, 2);
  if (n01 === undefined) return NaN;
  return (f.rho * (n01 - (n02 ?? f.n3))) / lambda;
}

/**
 * Taper ratio ρ/ρ₀ at which LP01 crosses n_eff = n₂ (the core–cladding transition), for an untapered fibre
 * f; 1 if the untapered LP01 is already below n₂, NaN outside the domain. Bisection in the ratio (100 halvings).
 */
export function coreCladdingTransitionRatio(f: ThreeLayerFibre, lambda: number): number {
  if (!validFibre(f, lambda)) return NaN;
  const k = (2 * Math.PI) / lambda;
  const V0 = k * f.a * Math.sqrt(f.n1 * f.n1 - f.n2 * f.n2);
  const W0 = k * f.rho * Math.sqrt(f.n2 * f.n2 - f.n3 * f.n3);
  const lnS = Math.log(f.rho / f.a);
  // g > 0 while LP01 is below n₂ (left of the transition); J₀/(VJ₁) falls from ∞ at V → 0.
  const g = (t: number) => {
    const V = V0 * t;
    const W = W0 * t;
    return besselJ(0, V) / (V * besselJ(1, V)) - lnS - besselKScaled(0, W) / (W * besselKScaled(1, W));
  };
  // Beyond the first zero of J₁·… the left side is ≤ 0: cap V below 2.4048 (J₀'s first zero).
  let hi = Math.min(1, 2.4048 / V0);
  if (g(hi) > 0) return 1;
  let lo = 1e-6;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    if (g(mid) > 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Small-V, large-W estimate of the transition V, S = cladding/core radius: J₀(V)/(VJ₁(V)) = 2/V² − 1/4 + O(V²)
 * and K₀(W)/(WK₁(W)) → 0 turn the exact condition into V_cc ≈ √(2/(ln S + 1/4)).
 */
export function transitionVEstimate(S: number): number {
  return S > 1 ? Math.sqrt(2 / (Math.log(S) + 0.25)) : NaN;
}

export interface AdiabaticitySample {
  /** Cladding radius, m. */
  r: number;
  /** Taper angle Ω there, rad. */
  angle: number;
  /** Love's delineation angle Ω_d there, rad. */
  delineation: number;
}

/**
 * Taper angle and delineation angle at `points` radii spaced geometrically from r₀ down to the waist, for a
 * taper pulled from the untapered fibre f0 (f0.rho = r₀). The taper is locally adiabatic where angle < delineation.
 * Empty outside the domain.
 */
export function adiabaticityScan(p: TaperPull, f0: ThreeLayerFibre, lambda: number, points = 40): AdiabaticitySample[] {
  const { waistRadius } = taperShape(p);
  if (!(waistRadius > 0) || !validFibre(f0, lambda) || Math.abs(f0.rho - p.r0) > 1e-9 * p.r0) return [];
  const n = waistRadius < p.r0 ? Math.max(2, Math.round(points)) : 1;
  const out: AdiabaticitySample[] = [];
  for (let i = 0; i < n; i++) {
    const r = n === 1 ? p.r0 : p.r0 * Math.pow(waistRadius / p.r0, i / (n - 1));
    const t = r / p.r0;
    out.push({ r, angle: taperAngle(p, r), delineation: delineationAngle({ ...f0, a: f0.a * t, rho: r }, lambda) });
  }
  return out;
}
