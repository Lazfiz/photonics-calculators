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
