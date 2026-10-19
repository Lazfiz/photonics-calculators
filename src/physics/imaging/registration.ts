/**
 * Image registration and tile stitching error budgets. Image coordinates in pixels (px), measured from the image
 * centre; convert with the pixel size at the UI boundary. Model tier: textbook (first-order, small errors).
 *
 * - Displacement of a linear transform x' = A·x + t averaged over a centred L × L image: the cross term vanishes and
 *   ⟨x²⟩ = ⟨y²⟩ = L²/12, so ⟨|d|²⟩ = |t|² + (L²/12)·‖A − I‖²_F (exact).
 * - Point-based registration: J. M. Fitzpatrick, J. B. West, C. R. Maurer, "Predicting error in rigid-body
 *   point-based registration", IEEE Trans. Med. Imaging 17, 694 (1998), https://doi.org/10.1109/42.736021. Their
 *   3-D result ⟨TRE²⟩ ≈ (⟨FLE²⟩/N)(1 + ⅓Σ d_k²/f_k²) and ⟨FRE²⟩ ≈ (1 − 2/N)⟨FLE²⟩ come from linearised least squares;
 *   the same derivation in 2-D, for isotropic FLE and an isotropic fiducial layout with mean squared radius f², gives
 *   TRE² = (FLE²/N)(1 + m·d²/(2f²)), with m = 1 (rigid), 2 (similarity) or 4 (affine) linear parameters, and
 *   FRE² = FLE²(1 − p/(2N)) for p = m + 2 parameters fitted to 2N coordinates.
 * - Intensity-based translation: D. Robinson, P. Milanfar, "Fundamental performance limits in image registration",
 *   IEEE Trans. Image Process. 13, 1185 (2004), https://doi.org/10.1109/TIP.2004.832923, §II-A: the Fisher information
 *   is J = (1/σ²)Σ∇f∇fᵀ for a noise-free reference and white Gaussian noise σ on the moving image. For a random
 *   texture of rms contrast σ_s and Gaussian correlation length ℓ, ⟨f_x²⟩ = σ_s²/ℓ², so the bound per axis over
 *   N_px pixels is ℓ/(SNR·√N_px) with SNR = σ_s/σ.
 * - Stitching: tile positions from pairwise offsets with independent errors σ per axis. A chain sums k offsets
 *   (σ√k); the global least-squares solution (S. Preibisch, S. Saalfeld, P. Tomancak, Bioinformatics 25, 1463 (2009),
 *   https://doi.org/10.1093/bioinformatics/btp184) has variance σ²·R_eff, the effective resistance between the anchor
 *   tile and the tile in the grid graph with unit edges (P. Barooah, J. P. Hespanha, "Estimation on graphs from
 *   relative measurements", IEEE Control Syst. Mag. 27(4), 57 (2007), https://doi.org/10.1109/MCS.2007.384125).
 */

export type TransformModel = "rigid" | "similarity" | "affine";

/** Degrees of freedom p of each 2-D transform model. */
export const TRANSFORM_DOF: Record<TransformModel, number> = { rigid: 3, similarity: 4, affine: 6 };

/** Minimum number of point pairs that fixes the model, ⌈p/2⌉. */
export function minControlPoints(model: TransformModel): number {
  return Math.ceil(TRANSFORM_DOF[model] / 2);
}

/** 2 × 2 linear part [a, b; c, d] of x' = A·x + t, row-major. */
export type Matrix2 = [number, number, number, number];

/**
 * Linear part of the transform: rigid R(θ), similarity s·R(θ), affine s·R(θ)·[1, tan φ; 0, 1] (shear φ).
 * Scale and shear are ignored by the models that don't have them. NaN unless s > 0 and |φ| < π/2.
 */
export function transformMatrix(model: TransformModel, theta: number, scale = 1, shear = 0): Matrix2 {
  const s = model === "rigid" ? 1 : scale;
  const phi = model === "affine" ? shear : 0;
  if (!Number.isFinite(theta) || !(s > 0) || !(Math.abs(phi) < Math.PI / 2)) return [NaN, NaN, NaN, NaN];
  const c = Math.cos(theta);
  const sn = Math.sin(theta);
  const h = Math.tan(phi);
  return [s * c, s * (c * h - sn), s * sn, s * (sn * h + c)];
}

/** RMS displacement √(|t|² + (L²/12)‖A − I‖²_F) over a centred L × L image, px. NaN unless L > 0. */
export function displacementRms(a: Matrix2, tx: number, ty: number, size: number): number {
  if (!(size > 0)) return NaN;
  const frob = (a[0] - 1) ** 2 + a[1] ** 2 + a[2] ** 2 + (a[3] - 1) ** 2;
  return Math.sqrt(tx * tx + ty * ty + ((size * size) / 12) * frob);
}

/** Largest displacement |(A − I)x + t| over the four corners (±L/2, ±L/2), px; the maximum over the image. */
export function displacementMax(a: Matrix2, tx: number, ty: number, size: number): number {
  if (!(size > 0)) return NaN;
  const h = size / 2;
  let max = 0;
  for (const [x, y] of [[h, h], [h, -h], [-h, h], [-h, -h]]) {
    const dx = (a[0] - 1) * x + a[1] * y + tx;
    const dy = a[2] * x + (a[3] - 1) * y + ty;
    max = Math.max(max, Math.hypot(dx, dy));
  }
  return max;
}

export interface PointRegistrationInputs {
  model: TransformModel;
  /** Number of control-point pairs N, at least ⌈p/2⌉. */
  n: number;
  /** RMS fiducial localisation error FLE (2-D), px. */
  fle: number;
  /** RMS distance of the fiducials from their centroid f, px. */
  fiducialRms: number;
  /** Distance of the target from the fiducial centroid d, px. */
  targetDistance: number;
}

/** Expected 2-D TRE = FLE·√((1 + m·d²/(2f²))/N), px (Fitzpatrick 1998 in 2-D). NaN outside the domain. */
export function targetRegistrationError({ model, n, fle, fiducialRms, targetDistance }: PointRegistrationInputs): number {
  if (!(n >= minControlPoints(model)) || !(fle >= 0) || !(fiducialRms > 0) || !(targetDistance >= 0)) return NaN;
  const m = TRANSFORM_DOF[model] - 2;
  return fle * Math.sqrt((1 + (m * targetDistance ** 2) / (2 * fiducialRms ** 2)) / n);
}

/** Expected RMS fiducial registration error FLE·√(1 − p/(2N)), px. NaN unless N ≥ ⌈p/2⌉ and FLE ≥ 0. */
export function fiducialRegistrationError(model: TransformModel, n: number, fle: number): number {
  if (!(n >= minControlPoints(model)) || !(fle >= 0)) return NaN;
  return fle * Math.sqrt(Math.max(0, 1 - TRANSFORM_DOF[model] / (2 * n)));
}

/**
 * Cramér–Rao bound on the translation error per axis, ℓ/(SNR·√N_px), px (Robinson & Milanfar 2004, Gaussian-correlated
 * random texture). NaN unless SNR, ℓ and N_px are positive.
 */
export function translationCrlb(snr: number, correlationLength: number, pixels: number): number {
  if (!(snr > 0) || !(correlationLength > 0) || !(pixels > 0)) return NaN;
  return correlationLength / (snr * Math.sqrt(pixels));
}

export interface TileGridInputs {
  cols: number;
  rows: number;
  /** Tile width and height, px. */
  tileWidth: number;
  tileHeight: number;
  /** Overlap between neighbours as a fraction of the tile size, 0 ≤ o < 1. */
  overlap: number;
}

export interface TileGridResult {
  /** Overlaps round(w·o) and round(h·o), px. */
  overlapX: number;
  overlapY: number;
  /** Mosaic size C·w − (C − 1)·o_x by R·h − (R − 1)·o_y, px. */
  width: number;
  height: number;
  tiles: number;
  /** Mosaic pixels over acquired pixels. */
  efficiency: number;
}

/** Mosaic geometry of a C × R tile grid. NaN fields unless C, R are integers ≥ 1, w, h > 0 and 0 ≤ o < 1. */
export function tileGrid({ cols, rows, tileWidth, tileHeight, overlap }: TileGridInputs): TileGridResult {
  const ok = Number.isInteger(cols) && cols >= 1 && Number.isInteger(rows) && rows >= 1
    && tileWidth > 0 && tileHeight > 0 && overlap >= 0 && overlap < 1;
  if (!ok) return { overlapX: NaN, overlapY: NaN, width: NaN, height: NaN, tiles: NaN, efficiency: NaN };
  const overlapX = Math.round(tileWidth * overlap);
  const overlapY = Math.round(tileHeight * overlap);
  const width = cols * tileWidth - (cols - 1) * overlapX;
  const height = rows * tileHeight - (rows - 1) * overlapY;
  const tiles = cols * rows;
  return { overlapX, overlapY, width, height, tiles, efficiency: (width * height) / (tiles * tileWidth * tileHeight) };
}

export type BlendProfile = "linear" | "cosine";

/** Weight of the left tile at position t ∈ [0, 1] across the blend: 1 − t or cos²(πt/2); the right tile gets 1 − w. */
export function blendWeight(profile: BlendProfile, t: number): number {
  const u = Math.min(1, Math.max(0, t));
  return profile === "linear" ? 1 - u : Math.cos((Math.PI * u) / 2) ** 2;
}

export interface StitchErrorResult {
  /** Per-axis position error of each tile relative to the anchor tile (0, 0), in σ units, row-major (rows × cols). */
  perTile: number[];
  /** Largest and RMS over all tiles, in σ units. */
  max: number;
  rms: number;
}

/** Largest grid for the global solution; the eigen-sum costs (C·R)² operations. */
export const MAX_GRID_TILES = 2500;

/**
 * Chained (sequential) stitching: the first row is chained from the anchor and each column down from it, so tile
 * (i, j) sums i + j offsets and its error is √(i + j)·σ. Empty result unless C, R are integers ≥ 1.
 */
export function sequentialStitchError(cols: number, rows: number): StitchErrorResult {
  if (!Number.isInteger(cols) || cols < 1 || !Number.isInteger(rows) || rows < 1) return { perTile: [], max: NaN, rms: NaN };
  const perTile: number[] = [];
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) perTile.push(Math.sqrt(i + j));
  return { perTile, max: Math.sqrt(rows + cols - 2), rms: Math.sqrt((rows - 1) / 2 + (cols - 1) / 2) };
}

/**
 * Global least-squares stitching: error √R_eff(anchor, tile)·σ in the R × C grid graph. The grid Laplacian is the
 * Kronecker sum of two path Laplacians, with eigenvalues 2 − 2cos(πp/n) and DCT-II eigenvectors, so
 * R_eff(a, b) = Σ_{(p,q)≠0} (φ_pq(a) − φ_pq(b))²/(λ_p + μ_q), exact. Empty result unless 1 ≤ C·R ≤ MAX_GRID_TILES.
 */
export function globalStitchError(cols: number, rows: number): StitchErrorResult {
  if (!Number.isInteger(cols) || cols < 1 || !Number.isInteger(rows) || rows < 1 || cols * rows > MAX_GRID_TILES) {
    return { perTile: [], max: NaN, rms: NaN };
  }
  // Path-graph modes: vec[i·n + p] = eigenvector p at node i, val[p] its eigenvalue.
  const modes = (n: number) => {
    const vec = new Float64Array(n * n);
    const val = new Float64Array(n);
    for (let p = 0; p < n; p++) {
      const norm = p === 0 ? Math.sqrt(1 / n) : Math.sqrt(2 / n);
      for (let i = 0; i < n; i++) vec[i * n + p] = norm * Math.cos((Math.PI * p * (i + 0.5)) / n);
      val[p] = 2 - 2 * Math.cos((Math.PI * p) / n);
    }
    return { vec, val };
  };
  const u = modes(rows);
  const v = modes(cols);
  const k = rows * cols;
  const invLambda = new Float64Array(k);
  const anchor = new Float64Array(k);
  for (let p = 0; p < rows; p++) {
    for (let q = 0; q < cols; q++) {
      invLambda[p * cols + q] = p === 0 && q === 0 ? 0 : 1 / (u.val[p] + v.val[q]);
      anchor[p * cols + q] = u.vec[p] * v.vec[q];
    }
  }
  const perTile: number[] = [];
  let max = 0;
  let sum = 0;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      let r = 0;
      for (let p = 0; p < rows; p++) {
        const up = u.vec[i * rows + p];
        const base = p * cols;
        for (let q = 0; q < cols; q++) {
          const diff = anchor[base + q] - up * v.vec[j * cols + q];
          r += diff * diff * invLambda[base + q];
        }
      }
      perTile.push(Math.sqrt(r));
      max = Math.max(max, r);
      sum += r;
    }
  }
  return { perTile, max: Math.sqrt(max), rms: Math.sqrt(sum / (rows * cols)) };
}
