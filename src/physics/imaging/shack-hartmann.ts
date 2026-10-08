/**
 * Shack-Hartmann wavefront sensor design. SI units in and out (lengths in m, angles in rad). Model tier: textbook
 * approximation (diffraction-limited lenslet spots, photon-noise-limited centroiding).
 *
 * Lenslets of pitch (width) d and focal length f, square (100 % fill, sinc² spot) or circular (Airy spot):
 * - Spot radius to the first zero ρ₀ = λf/d (square) or 1.22 λf/d (circular); spot diameter 2ρ₀;
 *   FWHM 0.886 λf/d (square) or 1.029 λf/d (circular).
 * - Lenslet-bound dynamic range: the largest local tilt before the spot leaves its own sub-aperture,
 *   θ_max = (d − 2ρ₀)/(2f) (V. Akondi, A. Dubra, "Shack-Hartmann wavefront sensor optical dynamic range",
 *   Opt. Express 29(6) (2021), eq. 2, image width D_i = 2ρ₀). Square: θ_max = d/(2f) − λ/d, positive only for a
 *   Fresnel number N_F = d²/(λf) above 2. Over a pupil of diameter D: a PV tilt θ_max·D, a PV defocus
 *   θ_max·D/4 (W = W_PV (2r/D)² has slope 4W_PV/D at the edge), or a defocus of 2θ_max/D dioptres.
 * - Sensitivity: a one-pixel spot shift p is a tilt p/f, a wavefront step p·d/f across one lenslet.
 * - Photon-limited centroid precision σ_c = σ_spot/√N, with σ_spot = FWHM/(2√(2 ln 2)) of the Gaussian of the
 *   same FWHM (read noise, pixelation and the sinc²/Airy wings are neglected).
 * - Strehl ratio from the RMS wavefront error, extended Maréchal exp(−(2πσ/λ)²) (V. N. Mahajan, JOSA 73, 860
 *   (1983)); good to about 10 % down to S ≈ 0.3.
 */

export type LensletShape = "square" | "circular";

const positive = (...xs: number[]) => xs.every((x) => Number.isFinite(x) && x > 0);
const FIRST_ZERO = { square: 1, circular: 1.21967 } as const; // sinc² zero at 1, Airy zero 3.8317/π
const FWHM = { square: 0.885893, circular: 1.028994 } as const; // in λf/d: 2·0.442946, 2·1.616340/π

/** Spot radius to the first dark ring/line, m. */
export function spotFirstZeroRadius(lambda: number, f: number, d: number, shape: LensletShape): number {
  return positive(lambda, f, d) ? (FIRST_ZERO[shape] * lambda * f) / d : NaN;
}

/** Spot FWHM, m. */
export function spotFwhm(lambda: number, f: number, d: number, shape: LensletShape): number {
  return positive(lambda, f, d) ? (FWHM[shape] * lambda * f) / d : NaN;
}

/** Fresnel number N_F = d²/(λf) of one lenslet. */
export function fresnelNumber(lambda: number, f: number, d: number): number {
  return positive(lambda, f, d) ? (d * d) / (lambda * f) : NaN;
}

/** Lenslet-bound dynamic range θ_max = (d − 2ρ₀)/(2f), rad. Zero or negative: the spot doesn't fit. */
export function dynamicRangeAngle(lambda: number, f: number, d: number, shape: LensletShape): number {
  return (d - 2 * spotFirstZeroRadius(lambda, f, d, shape)) / (2 * f);
}

/** What θ_max allows over a pupil of diameter D: PV tilt (m), PV defocus (m) and defocus (dioptres, 1/m). */
export function dynamicRangeOverPupil(thetaMax: number, D: number) {
  if (!positive(D) || !Number.isFinite(thetaMax)) return { tiltPV: NaN, defocusPV: NaN, defocusDiopters: NaN };
  const t = Math.max(thetaMax, 0);
  return { tiltPV: t * D, defocusPV: (t * D) / 4, defocusDiopters: (2 * t) / D };
}

/** Wavefront step across one lenslet that moves the spot by one pixel, p·d/f, m. */
export function wavefrontPerPixel(pixel: number, f: number, d: number): number {
  return positive(pixel, f, d) ? (pixel * d) / f : NaN;
}

/** Photon-limited centroid precision σ_spot/√N on the detector, m. */
export function centroidPrecision(lambda: number, f: number, d: number, shape: LensletShape, photons: number): number {
  if (!positive(photons)) return NaN;
  return spotFwhm(lambda, f, d, shape) / (2 * Math.sqrt(2 * Math.LN2) * Math.sqrt(photons));
}

/** Extended Maréchal Strehl ratio exp(−(2πσ/λ)²). */
export function marechalStrehl(rmsWavefront: number, lambda: number): number {
  if (!positive(lambda) || !(Number.isFinite(rmsWavefront) && rmsWavefront >= 0)) return NaN;
  const phase = (2 * Math.PI * rmsWavefront) / lambda;
  return Math.exp(-phase * phase);
}

export interface LensletCell {
  x: number;
  y: number;
  full: boolean;
}

/**
 * Lenslets of a square grid (a lenslet corner on the axis) that lie fully or partly inside a circular pupil of
 * diameter D. Returns the counts and, if `withCells`, the cell centres (m). Capped at 2.5 × 10⁷ cells scanned.
 */
export function lensletsInPupil(D: number, d: number, withCells = false) {
  if (!positive(D, d)) return { full: NaN, partial: NaN, cells: [] as LensletCell[] };
  const R = D / 2;
  const K = Math.ceil(R / d) + 1;
  if ((2 * K) ** 2 > 2.5e7) return { full: NaN, partial: NaN, cells: [] as LensletCell[] };
  let full = 0, partial = 0;
  const cells: LensletCell[] = [];
  const tol = 1e-12 * d;
  for (let i = -K; i < K; i++) {
    for (let j = -K; j < K; j++) {
      const x = (i + 0.5) * d, y = (j + 0.5) * d;
      const far = Math.hypot(Math.abs(x) + d / 2, Math.abs(y) + d / 2);
      const near = Math.hypot(Math.max(Math.abs(x) - d / 2, 0), Math.max(Math.abs(y) - d / 2, 0));
      if (far <= R + tol) {
        full++;
        if (withCells) cells.push({ x, y, full: true });
      } else if (near < R - tol) {
        partial++;
        if (withCells) cells.push({ x, y, full: false });
      }
    }
  }
  return { full, partial, cells };
}
