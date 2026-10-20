import { c, c2_radiation } from "../constants";
import { faddeeva, voigtProfile } from "./line-broadening";

/**
 * Absorptive 2D electronic spectrum of a coupled dimer (two two-level chromophores). SI units: wavenumbers in m⁻¹,
 * times in s, temperature in K, angles in rad. Model tier: textbook.
 *
 * Excitons: site energies ν₀ ∓ Δ/2 and coupling J give E∓ = ν₀ ∓ ½√(Δ² + 4J²), mixing angle tan 2θ = 2J/Δ,
 * |−⟩ = cos θ|1⟩ − sin θ|2⟩, |+⟩ = sin θ|1⟩ + cos θ|2⟩, and the doubly excited state |12⟩ at E_f = 2ν₀ = E₋ + E₊.
 * Transition dipoles (unit monomer dipoles at angle φ): μ₀ₐ = Σᵢ cₐᵢ μᵢ and μₐf = cₐ₁ μ₂ + cₐ₂ μ₁.
 * Third-order pathways with populations during the waiting time T (inter-exciton coherences taken as dephased):
 *   GSB  (Eₐ, E_b)        +⟨μ₀ₐ μ₀ₐ μ₀b μ₀b⟩        for all a, b
 *   SE   (Eₐ, E_b)        +⟨μ₀ₐ μ₀ₐ μ₀b μ₀b⟩ P(b|a)
 *   ESA  (Eₐ, E_f − E_b)  −⟨μ₀ₐ μ₀ₐ μ_bf μ_bf⟩ P(b|a)
 * with P(b|a) the probability that the exciton created in a is in b after T (downhill relaxation time τ, uphill rate
 * from detailed balance at temperature T_K; ground-state recovery neglected). For uncoupled chromophores (J = 0) the
 * cross-peak GSB and ESA cancel exactly. Isotropic sample, all-parallel (ZZZZ) polarisation:
 *   ⟨(a·Z)(b·Z)(c·Z)(d·Z)⟩ = [(a·b)(c·d) + (a·c)(b·d) + (a·d)(b·c)]/15.
 * Lineshape: homogeneous Lorentzian (HWHM γ = 1/(2πcT₂)) and static, fully correlated Gaussian inhomogeneity (σ),
 * which shifts every transition by the same u: the absorptive (rephasing + non-rephasing) spectrum of one peak is
 *   S(x₁, x₃) = ∫ G_σ(u) L(x₁ − u) L(x₃ − u) du,  L(x) = γ/(x² + γ²),
 * stretched along the diagonal with an anti-diagonal width set by γ. It is evaluated in closed form with the Faddeeva
 * function: L(x) = Re[i/(x + iγ)], Re A Re B = ½ Re(AB + AB̄), and partial fractions reduce each term to
 * V(z) = ∫ G_σ(u)/(z − u) du = −i √(π/2)/σ · w(z/(σ√2)).
 * P. Hamm, M. Zanni, Concepts and Methods of 2D Infrared Spectroscopy (Cambridge University Press, 2011), chs. 4–7;
 * D. M. Jonas, "Two-dimensional femtosecond spectroscopy", Annu. Rev. Phys. Chem. 54, 425 (2003),
 * doi 10.1146/annurev.physchem.54.011002.103907.
 */

type Vec2 = [number, number];

const dot = (a: Vec2, b: Vec2) => a[0] * b[0] + a[1] * b[1];

/** ZZZZ isotropic orientational average of four transition dipoles. */
export function orientationalAverage(a: Vec2, b: Vec2, cc: Vec2, d: Vec2): number {
  return (dot(a, b) * dot(cc, d) + dot(a, cc) * dot(b, d) + dot(a, d) * dot(b, cc)) / 15;
}

/** Homogeneous (Lorentzian) FWHM 1/(πcT₂) in m⁻¹ for the dephasing time T₂ (s). */
export function homogeneousFwhm(t2: number): number {
  return t2 > 0 ? 1 / (Math.PI * c * t2) : NaN;
}

export interface Dimer {
  /** Exciton energies [E₋, E₊], m⁻¹. */
  energies: [number, number];
  /** E₊ − E₋ = √(Δ² + 4J²), m⁻¹. */
  splitting: number;
  /** Mixing angle θ, rad. */
  theta: number;
  /** Ground → exciton dipoles [μ₀₋, μ₀₊] in units of the monomer dipole. */
  mu0: [Vec2, Vec2];
  /** Exciton → doubly excited dipoles [μ₋f, μ₊f]. */
  muF: [Vec2, Vec2];
  /** Doubly excited energy E_f, m⁻¹. */
  doubleEnergy: number;
}

/** Excitons of a dimer with mean site energy ν₀, site difference Δ = ε₂ − ε₁, coupling J (m⁻¹) and dipole angle φ. */
export function dimer(nu0: number, delta: number, coupling: number, phi: number): Dimer {
  const splitting = Math.hypot(delta, 2 * coupling);
  const theta = splitting > 0 ? 0.5 * Math.atan2(2 * coupling, delta) : 0;
  const ct = Math.cos(theta), st = Math.sin(theta);
  const m1: Vec2 = [1, 0], m2: Vec2 = [Math.cos(phi), Math.sin(phi)];
  const comb = (a: number, u: Vec2, b: number, v: Vec2): Vec2 => [a * u[0] + b * v[0], a * u[1] + b * v[1]];
  return {
    energies: [nu0 - splitting / 2, nu0 + splitting / 2],
    splitting,
    theta,
    mu0: [comb(ct, m1, -st, m2), comb(st, m1, ct, m2)],
    muF: [comb(ct, m2, -st, m1), comb(st, m2, ct, m1)],
    doubleEnergy: 2 * nu0,
  };
}

/**
 * P(b|a) after waiting time T for downhill time τ (+ → −) and temperature T_K (uphill rate k↓ e^(−hc(E₊−E₋)/k_BT)).
 * Returned as [[P(−|−), P(+|−)], [P(−|+), P(+|+)]]. T = 0 gives the identity.
 */
export function transferMatrix(d: Dimer, waiting: number, tauDown: number, temperature: number): [[number, number], [number, number]] {
  if (!(waiting > 0) || !(tauDown > 0)) return [[1, 0], [0, 1]];
  const kDown = 1 / tauDown;
  const kUp = temperature > 0 ? kDown * Math.exp(-(c2_radiation * d.splitting) / temperature) : 0;
  const K = kDown + kUp;
  const pUpEq = kUp / K, pDownEq = kDown / K;
  const decay = Math.exp(-K * waiting);
  const stayDown = pDownEq + (1 - pDownEq) * decay;
  const stayUp = pUpEq + (1 - pUpEq) * decay;
  return [[stayDown, 1 - stayDown], [1 - stayUp, stayUp]];
}

export interface Peak2D {
  /** Excitation and detection wavenumbers, m⁻¹. */
  w1: number;
  w3: number;
  /** Signed weight (GSB and SE positive, ESA negative). */
  amplitude: number;
  kind: "GSB" | "SE" | "ESA";
}

/** The GSB, SE and ESA peaks of the dimer after waiting time T (see the module comment). */
export function dimerPeaks(d: Dimer, waiting = 0, tauDown = Infinity, temperature = 0): Peak2D[] {
  const P = transferMatrix(d, waiting, tauDown, temperature);
  const peaks: Peak2D[] = [];
  for (let a = 0; a < 2; a++) {
    for (let b = 0; b < 2; b++) {
      const pumpProbe = orientationalAverage(d.mu0[a], d.mu0[a], d.mu0[b], d.mu0[b]);
      peaks.push({ w1: d.energies[a], w3: d.energies[b], amplitude: pumpProbe, kind: "GSB" });
      if (P[a][b] > 0) {
        peaks.push({ w1: d.energies[a], w3: d.energies[b], amplitude: pumpProbe * P[a][b], kind: "SE" });
        const esa = orientationalAverage(d.mu0[a], d.mu0[a], d.muF[b], d.muF[b]);
        peaks.push({ w1: d.energies[a], w3: d.doubleEnergy - d.energies[b], amplitude: -esa * P[a][b], kind: "ESA" });
      }
    }
  }
  return peaks;
}

type Cplx = [number, number];

/** V(z) = ∫ G_σ(u)/(z − u) du for Im z > 0 and its derivative, from w(ζ), ζ = z/(σ√2). */
function vFunction(zr: number, zi: number, sigma: number): { v: Cplx; dv: Cplx } {
  const s = sigma * Math.SQRT2;
  const xr = zr / s, xi = zi / s;
  const [wr, wi] = faddeeva(xr, xi);
  const k = Math.sqrt(Math.PI / 2) / sigma;
  // V = −i k w.
  const v: Cplx = [k * wi, -k * wr];
  // w′ = −2ζw + 2i/√π; V′ = −i k w′ / s.
  const dwr = -2 * (xr * wr - xi * wi), dwi = -2 * (xr * wi + xi * wr) + 2 / Math.sqrt(Math.PI);
  const dv: Cplx = [(k * dwi) / s, (-k * dwr) / s];
  return { v, dv };
}

/**
 * Absorptive 2D lineshape S(x₁, x₃) = ∫ G_σ(u) L(x₁ − u) L(x₃ − u) du with L(x) = γ/(x² + γ²): peak value 1/γ² for
 * σ = 0. x, σ and γ in one unit. For σ < 10⁻⁴ γ the Lorentzian product is used (error 2(σ/γ)² < 2·10⁻⁸ relative; the
 * Faddeeva partial fractions cancel there). Near the diagonal (|x₃ − x₁| < 10⁻⁵(σ + γ)) the divided difference of V is
 * replaced by V′ at the midpoint (error ≈ 10⁻¹⁰ relative).
 */
export function absorptiveLineshape(x1: number, x3: number, sigma: number, gamma: number): number {
  if (!(gamma > 0) || !(sigma >= 0)) return NaN;
  if (sigma < 1e-4 * gamma) return (gamma / (x1 * x1 + gamma * gamma)) * (gamma / (x3 * x3 + gamma * gamma));
  return lineshapeFromV(vFunction(x1, gamma, sigma).v, vFunction(x3, gamma, sigma).v, x1, x3, sigma, gamma);
}

function lineshapeFromV(V1: Cplx, V3: Cplx, x1: number, x3: number, sigma: number, gamma: number): number {
  // ⟨AB⟩ = −[V(z₁) − V(z₃)]/(z₃ − z₁), z₃ − z₁ = x₃ − x₁ (real).
  const dx = x3 - x1;
  const abRe = Math.abs(dx) < 1e-5 * (sigma + gamma) ? vFunction((x1 + x3) / 2, gamma, sigma).dv[0] : -(V1[0] - V3[0]) / dx;
  // ⟨AB̄⟩ = [V(z₁) − conj V(z₃)]/(z̄₃ − z₁), z̄₃ − z₁ = dx − 2iγ.
  const nr = V1[0] - V3[0], ni = V1[1] + V3[1];
  const dr = dx, di = -2 * gamma;
  const abbRe = (nr * dr + ni * di) / (dr * dr + di * di);
  return 0.5 * (abRe + abbRe);
}

/**
 * S(ω₁, ω₃) = Σ peaks · lineshape on the grids (rows: ω₃, columns: ω₁) for inhomogeneous and homogeneous FWHMs (m⁻¹).
 * Peaks at the same position are summed first, and V is computed once per axis point and peak.
 */
export function spectrum2D(axis1: number[], axis3: number[], peaks: Peak2D[], fwhmInh: number, fwhmHom: number): number[][] {
  const sigma = fwhmInh / (2 * Math.sqrt(2 * Math.LN2));
  const gamma = fwhmHom / 2;
  const merged = new Map<string, { w1: number; w3: number; amplitude: number }>();
  for (const p of peaks) {
    const key = `${p.w1.toPrecision(12)},${p.w3.toPrecision(12)}`;
    const m = merged.get(key);
    if (m) m.amplitude += p.amplitude;
    else merged.set(key, { w1: p.w1, w3: p.w3, amplitude: p.amplitude });
  }
  const list = [...merged.values()].filter((p) => p.amplitude !== 0);
  if (!(gamma > 0) || !(sigma >= 0)) return axis3.map(() => axis1.map(() => NaN));
  if (sigma < 1e-4 * gamma) {
    return axis3.map((w3) => axis1.map((w1) => list.reduce((s, p) => s + p.amplitude * absorptiveLineshape(w1 - p.w1, w3 - p.w3, sigma, gamma), 0)));
  }
  const v1 = list.map((p) => axis1.map((w1) => vFunction(w1 - p.w1, gamma, sigma).v));
  const v3 = list.map((p) => axis3.map((w3) => vFunction(w3 - p.w3, gamma, sigma).v));
  return axis3.map((w3, j) =>
    axis1.map((w1, i) => list.reduce((s, p, k) => s + p.amplitude * lineshapeFromV(v1[k][i], v3[k][j], w1 - p.w1, w3 - p.w3, sigma, gamma), 0)));
}

/** Linear absorption Σₐ |μ₀ₐ|² V(ν − Eₐ) (area-normalised Voigt per exciton; total area = 2 monomer dipole strengths). */
export function linearAbsorption(nu: number, d: Dimer, fwhmInh: number, fwhmHom: number): number {
  return d.mu0.reduce((s, m, a) => s + dot(m, m) * voigtProfile(nu - d.energies[a], fwhmInh, fwhmHom), 0);
}
