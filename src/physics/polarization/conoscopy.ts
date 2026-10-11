/**
 * Conoscopic (interference) figures of a uniaxial or biaxial plate between crossed or parallel polarizers.
 * Principal indices n_α ≤ n_β ≤ n_γ (uniaxial: n_α = n_β = n_o < n_γ = n_e, or n_α = n_e < n_β = n_γ = n_o).
 * Angles in radians; wave vectors in units of k₀ = 2π/λ. Model tier: textbook approximation (below).
 *
 * - Eigenwaves for a wave normal s: the impermeability tensor η = diag(1/n_α², 1/n_β², 1/n_γ²) projected onto the
 *   plane ⊥ s has eigenvalues 1/n² and eigenvectors along D (Born & Wolf, Principles of Optics, 7th ed., ch. 15
 *   "Optics of crystals", doi:10.1017/CBO9781139644181.024).
 * - Optic axial angle about γ: cos²V_z = (n_β⁻² − n_γ⁻²)/(n_α⁻² − n_γ⁻²). V_z < 45°: positive, γ is the acute
 *   bisectrix (Bxa); V_z > 45°: negative, α is. The acute 2V is 2·min(V_z, 90° − V_z).
 * - A pupil point at numerical aperture ν = n_imm sin θ has transverse wave vector ν(cos φ, sin φ), conserved in the
 *   plate; each eigenwave has k_z = √(n(s)² − ν²), solved by fixed-point iteration (bisection on
 *   n(s)² − ν² − k_z² between √(n_α² − ν²) and √(n_γ² − ν²) when that does not converge). Retardance (slow − fast) after a
 *   plate of thickness d: Γ = k₀ d (k_z,slow − k_z,fast) (Veiras, Perez, Garea, Appl. Opt. 49, 2769 (2010),
 *   doi:10.1364/AO.49.002769, for the uniaxial case).
 * - Approximation: the plate acts as a retarder whose slow axis is the azimuth ψ of the slow wave's D projected onto
 *   the plate plane; Fresnel transmission differences and the slight non-orthogonality of the projected modes are
 *   neglected. Crossed polars then give T = sin²2(ψ − P) sin²(Γ/2): isochromes from Γ, isogyres where ψ = P or
 *   P + 90°.
 * - White light: R(λ) = R(λ₀)·B(λ)/B(λ₀) with the birefringence B = n_γ − n_α, so the dispersion of the optic axes
 *   is neglected. Colours from interference-colours.ts.
 * - Image: each pixel is averaged over its footprint (interference-colours.ts pixelVisibility, with the retardance
 *   change to the neighbouring pixels), so isochromes finer than a pixel fade to grey instead of aliasing; grey levels
 *   are sRGB encoded.
 */
import { type RGB, COLOUR_WAVELENGTHS, srgbEncode } from "../cie-colour";
import { largestSymmetricEigenvalue } from "../math";
import { interferenceColour, pixelVisibility, polariscopeTransmission } from "./interference-colours";

export type Vec3 = [number, number, number];
export type PrincipalIndices = [number, number, number];

export interface OpticAxialAngle {
  /** Angle of each optic axis from γ, rad (0 for positive uniaxial, π/2 for negative). */
  Vz: number;
  /** Acute optic axial angle 2V, rad. */
  twoV: number;
  /** Optic sign; null for invalid or isotropic indices. */
  sign: "+" | "−" | null;
}

/** Optic axial angle of a crystal with principal indices n_α ≤ n_β ≤ n_γ; NaN unless n_α < n_γ and the order holds. */
export function opticAxialAngle([na, nb, ng]: PrincipalIndices): OpticAxialAngle {
  if (!(na > 0 && na <= nb && nb <= ng && na < ng)) return { Vz: NaN, twoV: NaN, sign: null };
  const c2 = (nb ** -2 - ng ** -2) / (na ** -2 - ng ** -2);
  const Vz = Math.acos(Math.sqrt(Math.min(1, Math.max(0, c2))));
  const positive = Vz <= Math.PI / 4;
  return { Vz, twoV: 2 * (positive ? Vz : Math.PI / 2 - Vz), sign: positive ? "+" : "−" };
}

export interface PlateOrientation {
  /** Tilt of the acute bisectrix (uniaxial: the optic axis) from the plate normal, rad, toward azimuth `rotation`. */
  tilt: number;
  /** Azimuth of the optic axial plane (uniaxial: of the axis tilt) from the polarizer direction x, rad. */
  rotation: number;
}

/** Impermeability tensor in the lab frame for a plate cut ⊥ Bxa, then tilted and rotated. Row-major 3×3. */
export function impermeability(n: PrincipalIndices, o: PlateOrientation): number[] {
  const { Vz } = opticAxialAngle(n);
  const positive = !(Vz > Math.PI / 4);
  const cr = Math.cos(o.rotation), sr = Math.sin(o.rotation), ct = Math.cos(o.tilt), st = Math.sin(o.tilt);
  const bxa: Vec3 = [st * cr, st * sr, ct];
  const bxo: Vec3 = [ct * cr, ct * sr, -st];
  const normal: Vec3 = [-sr, cr, 0];
  // Bxa is γ for a positive crystal, α for a negative one; β is the optic normal.
  const [ea, eg] = positive ? [bxo, bxa] : [bxa, bxo];
  const axes: [Vec3, number][] = [[ea, n[0] ** -2], [normal, n[1] ** -2], [eg, n[2] ** -2]];
  const T = new Array<number>(9).fill(0);
  for (const [a, w] of axes) for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) T[3 * i + j] += w * a[i] * a[j];
  return T;
}

export interface Eigen {
  nSlow: number;
  nFast: number;
  dSlow: Vec3;
}

const quad = (T: number[], u: Vec3, v: Vec3) =>
  u[0] * (T[0] * v[0] + T[1] * v[1] + T[2] * v[2]) +
  u[1] * (T[3] * v[0] + T[4] * v[1] + T[5] * v[2]) +
  u[2] * (T[6] * v[0] + T[7] * v[1] + T[8] * v[2]);

/** Slow and fast indices and the slow wave's D direction for unit wave normal s (lab frame). */
export function transverseEigen(T: number[], s: Vec3): Eigen {
  // Basis u, v ⊥ s: u = ẑ × s normalised (x̂ when s ∥ ẑ), v = s × u.
  const h = Math.hypot(s[0], s[1]);
  const u: Vec3 = h > 1e-12 ? [-s[1] / h, s[0] / h, 0] : [1, 0, 0];
  const v: Vec3 = [s[1] * u[2] - s[2] * u[1], s[2] * u[0] - s[0] * u[2], s[0] * u[1] - s[1] * u[0]];
  const a = quad(T, u, u), b = quad(T, u, v), c = quad(T, v, v);
  const mean = (a + c) / 2, half = Math.hypot((a - c) / 2, b);
  // (cos θ, sin θ) with θ = ½ atan2(2b, a − c) is the eigenvector of the larger 1/n², the fast wave; slow is ⊥.
  const th = 0.5 * Math.atan2(2 * b, a - c);
  const cs = -Math.sin(th), sn = Math.cos(th);
  return {
    nSlow: 1 / Math.sqrt(mean - half),
    nFast: 1 / Math.sqrt(mean + half),
    dSlow: [cs * u[0] + sn * v[0], cs * u[1] + sn * v[1], cs * u[2] + sn * v[2]],
  };
}

const MAX_ITER = 50;
const BISECT_ITER = 100;
const TOL = 1e-13;
/** |n(s)² − ν² − k_z²| accepted as zero at a bracket end (rounding of n² ≈ 1…10). */
const F_TOL = 1e-12;

/**
 * k_z of the slow or fast eigenwave for transverse wave vector (νx, νy): fixed-point iteration, then bisection between
 * the bounds set by n_α ≤ n(s) ≤ n_γ; NaN when evanescent or not bracketed. Tolerance 1e-13 in k_z (units of k₀).
 * `start` is the index that seeds the iteration; maxIter = 0 goes straight to the bisection.
 */
export function eigenKz(
  T: number[], nux: number, nuy: number, branch: "slow" | "fast", start: number, maxIter = MAX_ITER,
): { kz: number; e: Eigen } {
  const nu2 = nux * nux + nuy * nuy;
  const at = (kz: number) => {
    const m = Math.sqrt(nu2 + kz * kz);
    const e = transverseEigen(T, [nux / m, nuy / m, kz / m]);
    const n = branch === "slow" ? e.nSlow : e.nFast;
    return { e, f: n * n - nu2 - kz * kz };
  };
  let kz = Math.sqrt(Math.max(0, start * start - nu2));
  let e = transverseEigen(T, [0, 0, 1]);
  for (let i = 0; i < maxIter; i++) {
    const m = Math.sqrt(nu2 + kz * kz);
    e = transverseEigen(T, [nux / m, nuy / m, kz / m]);
    const n = branch === "slow" ? e.nSlow : e.nFast;
    const k2 = n * n - nu2;
    if (!(k2 > 0)) break;
    const next = Math.sqrt(k2);
    if (Math.abs(next - kz) < TOL) return { kz: next, e };
    kz = next;
  }
  // The eigenvalues of T are 1/n_α² ≥ 1/n_β² ≥ 1/n_γ², and n_α ≤ n(s) ≤ n_γ brackets the root: f ≥ 0 at lo, ≤ 0 at
  // hi. An ordinary wave sits on an end (n = n_α or n_γ for every s), so |f| within rounding (F_TOL) is a root there.
  const nMin = 1 / Math.sqrt(largestSymmetricEigenvalue(T));
  const nMax = 1 / Math.sqrt(-largestSymmetricEigenvalue(T.map((t) => -t)));
  let lo = Math.sqrt(Math.max(0, nMin * nMin - nu2)), hi = Math.sqrt(Math.max(0, nMax * nMax - nu2));
  const atLo = at(lo), atHi = at(hi);
  if (Math.abs(atLo.f) <= F_TOL) return { kz: lo, e: atLo.e };
  if (Math.abs(atHi.f) <= F_TOL) return { kz: hi, e: atHi.e };
  if (!(atLo.f > 0 && atHi.f < 0)) return { kz: NaN, e };
  for (let i = 0; i < BISECT_ITER && hi - lo > TOL; i++) {
    const mid = 0.5 * (lo + hi);
    if (at(mid).f > 0) lo = mid;
    else hi = mid;
  }
  const kzRoot = 0.5 * (lo + hi);
  return { kz: kzRoot, e: at(kzRoot).e };
}

export interface ConoscopicPoint {
  /** Retardance slow − fast, rad. */
  gamma: number;
  /** Retardance as a path difference, m. */
  R: number;
  /** Azimuth of the slow wave's D projected on the plate, rad. */
  psi: number;
  kzSlow: number;
  kzFast: number;
}

/** Retardance and slow-axis azimuth at pupil point (νx, νy) for a plate of thickness d (m) at wavelength λ (m). */
export function conoscopicPoint(T: number[], nux: number, nuy: number, d: number, lambda: number): ConoscopicPoint {
  const n0 = transverseEigen(T, [0, 0, 1]);
  const slow = eigenKz(T, nux, nuy, "slow", n0.nSlow);
  const fast = eigenKz(T, nux, nuy, "fast", n0.nFast);
  const R = d * (slow.kz - fast.kz);
  return {
    gamma: (2 * Math.PI * R) / lambda,
    R,
    psi: Math.atan2(slow.e.dSlow[1], slow.e.dSlow[0]),
    kzSlow: slow.kz,
    kzFast: fast.kz,
  };
}

export interface FigureSettings {
  indices: PrincipalIndices;
  orientation: PlateOrientation;
  /** Plate thickness, m. */
  d: number;
  /** Wavelength for the monochromatic figure and the reference of the white-light one, m. */
  lambda: number;
  /** Numerical aperture of the conoscope (edge of the figure). */
  NA: number;
  /** Polarizer and analyzer azimuths, rad. */
  P: number;
  A: number;
  /** "mono": grey level T at λ; "white": D65 interference colours. */
  mode: "mono" | "white";
  /** Birefringence ratio B(λ)/B(λ₀) for the white-light figure; 1 when omitted. */
  dispersion?: (lambda: number) => number;
}

/**
 * Figure as N×N RGBA bytes (row 0 at +y, the top of the field), transparent outside the NA circle and where a wave is
 * evanescent; also returns the largest retardance in the field, m. Each pixel's visibility is reduced by the change of
 * retardance across it (central difference to its neighbours, one-sided at the rim).
 */
export function conoscopicFigure(s: FigureSettings, N: number): { rgba: Uint8ClampedArray; maxR: number } {
  const T = impermeability(s.indices, s.orientation);
  const rgba = new Uint8ClampedArray(N * N * 4);
  const ratio = s.dispersion ? COLOUR_WAVELENGTHS.map(s.dispersion) : null;
  const R = new Float64Array(N * N).fill(NaN), psi = new Float64Array(N * N), gamma = new Float64Array(N * N);
  let maxR = 0;
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const nux = ((2 * (i + 0.5)) / N - 1) * s.NA, nuy = (1 - (2 * (j + 0.5)) / N) * s.NA;
      if (nux * nux + nuy * nuy > s.NA * s.NA) continue;
      const p = conoscopicPoint(T, nux, nuy, s.d, s.lambda);
      if (!Number.isFinite(p.R)) continue;
      const k = j * N + i;
      R[k] = p.R;
      psi[k] = p.psi;
      gamma[k] = p.gamma;
      maxR = Math.max(maxR, Math.abs(p.R));
    }
  }
  /** Retardance change across one pixel along a row (step 1) or a column (step N). */
  const delta = (k: number, step: number, before: boolean, after: boolean) => {
    const b = before ? R[k - step] : NaN, a = after ? R[k + step] : NaN;
    if (Number.isFinite(a) && Number.isFinite(b)) return (a - b) / 2;
    if (Number.isFinite(a)) return a - R[k];
    if (Number.isFinite(b)) return R[k] - b;
    return 0;
  };
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const k = j * N + i;
      if (!Number.isFinite(R[k])) continue;
      const dRx = delta(k, 1, i > 0, i < N - 1), dRy = delta(k, N, j > 0, j < N - 1);
      let rgb: RGB;
      if (s.mode === "mono") {
        const t = srgbEncode(polariscopeTransmission(s.P, psi[k], s.A, gamma[k], pixelVisibility(dRx, dRy, s.lambda)));
        rgb = [t, t, t];
      } else {
        const r = R[k];
        rgb = ratio
          ? interferenceColour((_, n) => r * ratio[n], s.P, psi[k], s.A, (l, n) => pixelVisibility(dRx * ratio[n], dRy * ratio[n], l))
          : interferenceColour(() => r, s.P, psi[k], s.A, (l) => pixelVisibility(dRx, dRy, l));
      }
      rgba[4 * k] = Math.round(255 * rgb[0]);
      rgba[4 * k + 1] = Math.round(255 * rgb[1]);
      rgba[4 * k + 2] = Math.round(255 * rgb[2]);
      rgba[4 * k + 3] = 255;
    }
  }
  return { rgba, maxR };
}
