/**
 * Antireflection coating for two wavelengths: the layer thicknesses that minimise R(λ₁) + R(λ₂) for given
 * layer indices, found by a bounded search. SI units (m). Model tier: exact for the stack (transfer matrix,
 * normal incidence, lossless layers with constant indices, back surface ignored); the fit is a numerical
 * optimum, not a guaranteed global one.
 *
 * Search: each thickness is bounded to [0, λ_max/(2nᵢ)], a half wave at the longer wavelength (a half wave is
 * absentee there, so thicker layers only repeat its phase). A grid of `grid` points per layer is evaluated, and
 * Nelder–Mead (reflection 1, expansion 2, contraction ½, shrink ½, thicknesses clamped to the bounds) refines the
 * best `starts` grid points until the simplex's spread in R(λ₁) + R(λ₂) is below 1e-15 or 400 iterations. With
 * three layers and two targets a zero of both is usually reachable, and the result is one of many designs.
 *
 * References: H. A. Macleod, Thin-Film Optical Filters, 4th ed., ch. 4 (two- and three-layer AR coatings);
 * J. A. Nelder, R. Mead, Comput. J. 7, 308 (1965).
 */
import { stackResponse } from "./transfer-matrix";

export interface DualBandArProblem {
  /** Incident medium index (> 0). */
  incident: number;
  /** Layer indices, outermost first (1–4 layers, each > 0). */
  indices: readonly number[];
  /** Substrate index (> 0). */
  substrate: number;
  /** The two design wavelengths, m. */
  lambda1: number;
  lambda2: number;
}

export interface DualBandArFit {
  /** Fitted thicknesses, outermost first, m. */
  thicknesses: number[];
  R1: number;
  R2: number;
}

/** Reflectance of the stack at λ for the given thicknesses. */
export function dualBandReflectance(p: DualBandArProblem, thicknesses: readonly number[], wavelength: number): number {
  const layers = p.indices.map((n, i) => ({ n, thickness: thicknesses[i] }));
  return stackResponse({ incident: p.incident, layers, substrate: { n: p.substrate } }, wavelength).R;
}

function validProblem(p: DualBandArProblem): boolean {
  return (
    p.incident > 0 && p.substrate > 0 && p.indices.length >= 1 && p.indices.length <= 4 &&
    p.indices.every((n) => n > 0 && Number.isFinite(n)) &&
    p.lambda1 > 0 && p.lambda2 > 0 && Number.isFinite(p.lambda1) && Number.isFinite(p.lambda2)
  );
}

function nelderMead(f: (x: number[]) => number, start: number[], step: number[], clamp: (x: number[]) => number[]) {
  const n = start.length;
  let pts = [clamp(start)];
  for (let i = 0; i < n; i++) {
    const x = start.slice();
    x[i] += step[i];
    pts.push(clamp(x));
  }
  let vals = pts.map(f);
  for (let iter = 0; iter < 400; iter++) {
    const order = vals.map((v, i) => i).sort((a, b) => vals[a] - vals[b]);
    pts = order.map((i) => pts[i]);
    vals = order.map((i) => vals[i]);
    if (vals[n] - vals[0] < 1e-15) break;
    const centroid = Array.from({ length: n }, (_, j) => pts.slice(0, n).reduce((s, x) => s + x[j], 0) / n);
    const along = (t: number) => clamp(centroid.map((c, j) => c + t * (pts[n][j] - c)));
    const xr = along(-1);
    const fr = f(xr);
    if (fr < vals[0]) {
      const xe = along(-2);
      const fe = f(xe);
      [pts[n], vals[n]] = fe < fr ? [xe, fe] : [xr, fr];
    } else if (fr < vals[n - 1]) {
      [pts[n], vals[n]] = [xr, fr];
    } else {
      const xc = fr < vals[n] ? along(-0.5) : along(0.5);
      const fc = f(xc);
      if (fc < Math.min(fr, vals[n])) {
        [pts[n], vals[n]] = [xc, fc];
      } else {
        for (let i = 1; i <= n; i++) {
          pts[i] = clamp(pts[i].map((x, j) => pts[0][j] + 0.5 * (x - pts[0][j])));
          vals[i] = f(pts[i]);
        }
      }
    }
  }
  const best = vals.indexOf(Math.min(...vals));
  return { x: pts[best], f: vals[best] };
}

/**
 * Thicknesses minimising R(λ₁) + R(λ₂). NaN thicknesses and R for invalid input (see DualBandArProblem).
 * `grid` points per layer (≥ 2) and `starts` refined grid points set the effort.
 */
export function fitDualBandAr(p: DualBandArProblem, grid = 16, starts = 4): DualBandArFit {
  if (!validProblem(p)) return { thicknesses: p.indices.map(() => NaN), R1: NaN, R2: NaN };
  const m = p.indices.length;
  const upper = p.indices.map((n) => Math.max(p.lambda1, p.lambda2) / (2 * n));
  const clamp = (x: number[]) => x.map((v, i) => Math.min(Math.max(v, 0), upper[i]));
  const cost = (x: number[]) => dualBandReflectance(p, x, p.lambda1) + dualBandReflectance(p, x, p.lambda2);

  const g = Math.max(2, Math.round(grid));
  const scored: { x: number[]; f: number }[] = [];
  const total = g ** m;
  for (let k = 0; k < total; k++) {
    const x: number[] = [];
    let r = k;
    for (let i = 0; i < m; i++) {
      x.push((upper[i] * (r % g)) / (g - 1));
      r = Math.floor(r / g);
    }
    scored.push({ x, f: cost(x) });
  }
  scored.sort((a, b) => a.f - b.f);

  let best = scored[0];
  const step = upper.map((u) => u / (g - 1));
  for (const s of scored.slice(0, Math.max(1, starts))) {
    const r = nelderMead(cost, s.x, step, clamp);
    if (r.f < best.f) best = r;
  }
  return {
    thicknesses: best.x,
    R1: dualBandReflectance(p, best.x, p.lambda1),
    R2: dualBandReflectance(p, best.x, p.lambda2),
  };
}
