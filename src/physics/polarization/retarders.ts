/**
 * Waveplate design: retardance, thickness, order, compound and achromatic plates, and the Fresnel rhomb.
 * SI units (m), retardance in rad unless named "waves". Model tier: exact for plane waves at normal incidence
 * on plates with the optic axis parallel to the faces (Born & Wolf, Principles of Optics, 7th ed., ch. 15;
 * Hecht, Optics, ch. 8 "Retarders"); oblique incidence is in `uniaxial.ts`.
 *
 * - Retardance Γ = 2πΔn d/λ. A plate of order m for a fraction f of a wave has d = (m + f)λ/|Δn|
 *   (zero order: m = 0). Δn may be negative (calcite, sapphire, LiNbO₃): only |Δn| sets the thickness; the sign
 *   says which axis is fast (Δn > 0: the optic axis is slow).
 * - Compound plate: two plates with crossed axes retard by 2π(Δn₁d₁ − Δn₂d₂)/λ; in one material, a
 *   "compound zero-order" plate acts as a single plate of thickness d₁ − d₂.
 * - Achromatic pair: two materials with crossed axes, thicknesses solving Δn₁(λᵢ)d₁ − Δn₂(λᵢ)d₂ = R λᵢ at two
 *   wavelengths λ₁, λ₂ (R in waves), by Cramer's rule.
 * - Total internal reflection at angle θ from glass of index n (n_rel = 1/n < 1 outside) shifts the p and s
 *   phases apart by δ, tan(δ/2) = cos θ √(sin²θ − n_rel²)/sin²θ (Born & Wolf §1.5.4). δ peaks at
 *   sin²θ = 2n_rel²/(1 + n_rel²) with tan(δ_max/2) = (1 − n_rel²)/(2 n_rel). A Fresnel rhomb makes two such
 *   reflections at the angle where δ = 45°, for 90° in all (n = 1.51: θ = 48°37′ or 54°37′, Born & Wolf).
 */

import { refractiveIndex } from "../materials/sellmeier";
import { SCHOTT_GLASSES } from "../materials/sellmeier-data";
import { crystalBirefringence, plateRetardance, plateWaves, resolveCrystalIndices } from "./uniaxial";

const TWO_PI = 2 * Math.PI;
// Order-crossing search: log grid over the range, then bisection to a relative 1e-12.
const CROSS_GRID = 2000;
const BISECT_MAX = 200;

/** Retardance 2πΔn d/λ, rad (signed with Δn). NaN unless λ > 0 and all are finite. */
export function retardance(dn: number, d: number, lambda: number): number {
  return retardanceFromPath(dn * d, lambda);
}

/** Retardance 2πR/λ, rad, of an optical path difference R = Δn d (m) at vacuum wavelength λ (m). NaN unless λ > 0. */
export function retardanceFromPath(pathDifference: number, lambda: number): number {
  if (!(lambda > 0 && Number.isFinite(lambda * pathDifference))) return NaN;
  return (TWO_PI * pathDifference) / lambda;
}

/** Thickness for |Γ| = waves·2π: waves·λ/|Δn|, m. NaN when Δn = 0 or waves < 0. */
export function plateThickness(dn: number, lambda: number, waves: number): number {
  if (dn === 0 || !(waves >= 0)) return NaN;
  return (waves * lambda) / Math.abs(dn);
}

/** |Δn| d/λ split into the integer order and the fraction of a wave left over. */
export function plateOrder(dn: number, d: number, lambda: number): { waves: number; order: number; fraction: number } {
  const waves = (Math.abs(dn) * d) / lambda;
  const order = Math.floor(waves);
  return { waves, order, fraction: waves - order };
}

/** Retardance of two plates with crossed axes, 2π(Δn₁d₁ − Δn₂d₂)/λ, rad. */
export function compoundRetardance(dn1: number, d1: number, dn2: number, d2: number, lambda: number): number {
  return (TWO_PI * (dn1 * d1 - dn2 * d2)) / lambda;
}

/**
 * Wavelengths in [lo, hi] where a plate of thickness d is a whole number of waves (|Δn(λ)| d/λ = m ≥ 1):
 * the transmission zeros between crossed polarizers. Ascending. Δn(λ) may disperse.
 */
export function fullWaveWavelengths(dnOf: (lambda: number) => number, d: number, lo: number, hi: number): number[] {
  const w = (l: number) => (Math.abs(dnOf(l)) * d) / l;
  const out: number[] = [];
  const step = Math.log(hi / lo) / CROSS_GRID;
  let a = lo;
  let wa = w(a);
  for (let i = 1; i <= CROSS_GRID; i++) {
    const b = lo * Math.exp(i * step);
    const wb = w(b);
    if (Number.isFinite(wa) && Number.isFinite(wb)) {
      const m0 = Math.ceil(Math.min(wa, wb));
      const m1 = Math.floor(Math.max(wa, wb));
      for (let m = Math.max(1, m0); m <= m1; m++) {
        if ((wa - m) * (wb - m) > 0) continue;
        let x0 = a, x1 = b, f0 = wa - m;
        for (let k = 0; k < BISECT_MAX && x1 - x0 > 1e-12 * x1; k++) {
          const mid = 0.5 * (x0 + x1);
          const fm = w(mid) - m;
          if (f0 * fm <= 0) x1 = mid;
          else { x0 = mid; f0 = fm; }
        }
        const root = 0.5 * (x0 + x1);
        if (!out.length || Math.abs(root - out[out.length - 1]) > 1e-9 * root) out.push(root);
      }
    }
    a = b;
    wa = wb;
  }
  return out.sort((p, q) => p - q);
}

/**
 * Two-material achromatic retarder with crossed axes: thicknesses d₁, d₂ (m) with |Δn₁d₁ − Δn₂d₂| = R λ at both
 * λ₁ and λ₂. `sign` is +1 when plate 1 dominates and −1 when plate 2 does (the same retarder with its fast and
 * slow axes swapped). NaN when the system is singular or the thicknesses would need opposite signs (parallel axes).
 */
export function achromaticPair(
  dn1Of: (lambda: number) => number, dn2Of: (lambda: number) => number, lambda1: number, lambda2: number, waves: number,
): { d1: number; d2: number; sign: 1 | -1 } {
  const bad = { d1: NaN, d2: NaN, sign: 1 as const };
  const a1 = dn1Of(lambda1), b1 = -dn2Of(lambda1), a2 = dn1Of(lambda2), b2 = -dn2Of(lambda2);
  const r1 = waves * lambda1, r2 = waves * lambda2;
  const det = a1 * b2 - a2 * b1;
  const scale = Math.abs(a1 * b2) + Math.abs(a2 * b1);
  if (!(Math.abs(det) > 1e-12 * scale)) return bad;
  const d1 = (r1 * b2 - r2 * b1) / det;
  const d2 = (a1 * r2 - a2 * r1) / det;
  if (d1 >= 0 && d2 >= 0) return { d1, d2, sign: 1 };
  if (d1 <= 0 && d2 <= 0) return { d1: -d1, d2: -d2, sign: -1 };
  return bad;
}

/** Phase difference δ between p and s on total internal reflection inside glass of index n at angle θ, rad. */
export function tirPhaseDifference(n: number, theta: number): number {
  const nr = 1 / n;
  const s2 = Math.sin(theta) ** 2;
  if (!(n > 1) || s2 <= nr * nr) return NaN;
  return 2 * Math.atan((Math.cos(theta) * Math.sqrt(s2 - nr * nr)) / s2);
}

/** Largest δ on total internal reflection and the angle where it occurs. */
export function tirMaxPhase(n: number): { theta: number; delta: number } {
  const nr = 1 / n;
  return { theta: Math.asin(Math.sqrt((2 * nr * nr) / (1 + nr * nr))), delta: 2 * Math.atan((1 - nr * nr) / (2 * nr)) };
}

/**
 * The two angles where one total internal reflection gives δ (below and above the peak), rad; NaN when δ exceeds
 * the peak. A Fresnel rhomb (δ = π/4 per reflection) is usually cut at the larger one.
 */
export function tirAnglesForPhase(n: number, delta: number): [number, number] {
  const { theta: peak, delta: dmax } = tirMaxPhase(n);
  if (!(delta > 0) || delta > dmax) return [NaN, NaN];
  const thetaC = Math.asin(1 / n);
  const solve = (lo: number, hi: number, rising: boolean) => {
    for (let k = 0; k < BISECT_MAX && hi - lo > 1e-14; k++) {
      const mid = 0.5 * (lo + hi);
      if ((tirPhaseDifference(n, mid) < delta) === rising) lo = mid;
      else hi = mid;
    }
    return 0.5 * (lo + hi);
  };
  return [solve(thetaC, peak, true), solve(peak, Math.PI / 2, false)];
}

// ---------------------------------------------------------------------------------------------------------------
// Retarder-type comparison (quartz zero order, multi-order, compound, quartz + MgF₂ achromat, N-BK7 Fresnel rhomb).
// Moved from the retarder-types page so the API schema shares it; behaviour unchanged.

/** Common range of the quartz, MgF₂ and N-BK7 fits, m. */
export const RETARDER_RANGE: [number, number] = [300e-9, 2000e-9];
/** Bandwidth criterion: |Γ − target| ≤ 1 % of the target. */
export const RETARDER_TOLERANCE = 0.01;
/** Tilt of the 'change at tilt' column, rad (5°). */
export const RETARDER_TILT = (5 * Math.PI) / 180;

const dnQuartz = crystalBirefringence("quartz", NaN);
const dnMgF2 = crystalBirefringence("mgf2", NaN);
const nBK7 = (lambda: number) => refractiveIndex(SCHOTT_GLASSES["N-BK7"].model, lambda);
const fold = (w: number) => w - Math.floor(w);

/** e-relative-to-o retardance (waves) of a plate with its axis in the faces at azimuth φ from the tilt plane. */
function tiltedWaves(crystal: "quartz" | "mgf2", d: number, azimuth: number, lambda: number, tilt: number): number {
  const { no, ne } = resolveCrystalIndices(crystal, lambda, NaN, NaN);
  const w = plateWaves(no, ne, { nIncident: 1, incidence: tilt, axisPolar: Math.PI / 2, axisAzimuth: azimuth });
  return plateRetardance(w, d, lambda) / TWO_PI;
}

export interface RetarderType {
  id: "zero" | "multi" | "compound" | "achromatic" | "rhomb";
  name: string;
  /** Plate thicknesses, m (zero, multi: [d]; compound: [d_m, d_whole]; achromatic: [quartz, MgF₂]; rhomb: []). */
  d: number[];
  /** Fresnel rhomb only: number of reflections and the cut angle, rad. */
  reflections?: number;
  theta?: number;
  /** Retardance in waves at λ (unfolded) and with the beam tilted in the plane holding the first plate's axis. */
  waves: (lambda: number, tilt: number) => number;
  /** Fold to one wave before comparing with the target (multi-order plates). */
  folded: boolean;
}

/** The five retarders for a target of R waves at λ₀ (order m for the multi-order one; achromat at λ₁, λ₂), m. */
export function retarderTypes(lambda0: number, R: number, m: number, lambda1: number, lambda2: number): RetarderType[] {
  const dn0 = dnQuartz(lambda0);
  const d0 = plateThickness(dn0, lambda0, R);
  const dm = plateThickness(dn0, lambda0, m + R);
  const dWhole = plateThickness(dn0, lambda0, m);
  const ach = achromaticPair(dnQuartz, dnMgF2, lambda1, lambda2, R);
  // Fresnel rhomb: the fewest pairs of reflections whose 45°-or-less phase each adds up to R; cut at the larger angle.
  const n0 = nBK7(lambda0);
  const reflections = 2 * Math.ceil((R * TWO_PI) / (2 * tirMaxPhase(n0).delta));
  const theta = tirAnglesForPhase(n0, (R * TWO_PI) / reflections)[1];
  return [
    { id: "zero", name: "Zero order", d: [d0], folded: false, waves: (l, t) => tiltedWaves("quartz", d0, 0, l, t) },
    { id: "multi", name: `Multi-order (m = ${m})`, d: [dm], folded: true, waves: (l, t) => tiltedWaves("quartz", dm, 0, l, t) },
    {
      id: "compound", name: "Compound zero order", d: [dm, dWhole], folded: false,
      waves: (l, t) => tiltedWaves("quartz", dm, 0, l, t) - tiltedWaves("quartz", dWhole, Math.PI / 2, l, t),
    },
    {
      id: "achromatic", name: "Achromatic", d: [ach.d1, ach.d2], folded: false,
      waves: (l, t) => ach.sign * (tiltedWaves("quartz", ach.d1, 0, l, t) - tiltedWaves("mgf2", ach.d2, Math.PI / 2, l, t)),
    },
    {
      id: "rhomb", name: "Fresnel rhomb", d: [], reflections, theta, folded: false,
      waves: (l, t) => {
        const n = nBK7(l);
        return (reflections * tirPhaseDifference(n, theta + Math.asin(Math.sin(t) / n))) / TWO_PI;
      },
    },
  ];
}

/** Contiguous band around λ₀ where the (folded) retardance stays within the tolerance of the target, m. */
export function retarderBand(t: RetarderType, lambda0: number, target: number): [number, number] {
  const N = 4000;
  const l = (i: number) => RETARDER_RANGE[0] * (RETARDER_RANGE[1] / RETARDER_RANGE[0]) ** (i / N);
  const ok = (x: number) => {
    const w = Math.abs(t.waves(x, 0));
    return Math.abs((t.folded ? fold(w) : w) - target) <= RETARDER_TOLERANCE * target;
  };
  const i0 = Math.round((N * Math.log(lambda0 / RETARDER_RANGE[0])) / Math.log(RETARDER_RANGE[1] / RETARDER_RANGE[0]));
  if (!ok(l(i0))) return [NaN, NaN];
  let a = i0, b = i0;
  while (a > 0 && ok(l(a - 1))) a--;
  while (b < N && ok(l(b + 1))) b++;
  // Refine each edge between its last good and first bad grid point (multi-order bands are narrower than a step).
  const edge = (good: number, bad: number) => {
    for (let k = 0; k < 40; k++) {
      const mid = 0.5 * (good + bad);
      if (ok(mid)) good = mid;
      else bad = mid;
    }
    return good;
  };
  return [a > 0 ? edge(l(a), l(a - 1)) : l(a), b < N ? edge(l(b), l(b + 1)) : l(b)];
}

/** Table row of one type at λ₀: retardance (waves, folded for multi-order), the ±1 % band (m) and the change at 5° tilt. */
export function retarderRow(t: RetarderType, lambda0: number, target: number): { at: number; band: [number, number]; tilt: number } {
  const w0 = Math.abs(t.waves(lambda0, 0));
  return {
    at: t.folded ? fold(w0) : w0,
    band: retarderBand(t, lambda0, target),
    tilt: Math.abs(t.waves(lambda0, RETARDER_TILT)) - w0,
  };
}
