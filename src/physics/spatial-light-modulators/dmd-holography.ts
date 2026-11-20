/**
 * Binary amplitude holography on a DMD: Lee holograms and the superpixel method. The DMD shows a binary pattern, a lens
 * of focal length f₁ Fourier-transforms it, an aperture in the Fourier plane passes one part of the spectrum, and a
 * second lens images the filtered field (a 4f system). SI units in and out. Model tier: textbook (scalar, paraxial
 * Fourier optics; ideal pixels with 100 % fill factor; plane-wave illumination). Counts and positions are exact for
 * that model.
 *
 * Lee holograms (Gutiérrez-Cuevas R., Popoff S. M., "Binary holograms for shaping light with digital micromirror
 * devices," J. Phys. Photonics 6, 045022 (2024), doi:10.1088/2515-7647/ad8617; equation numbers from arXiv:2311.16685v1).
 * On the pixel grid the carrier is ν = (1/p, 0) cycles per pixel, p a whole number of pixels. A cell of p × p pixels
 * holds a rectangle wₓ wide, w_y high and shifted by sₓ, and the filtered order (−1, 0) carries (Eq. 22)
 *   T₋₁,₀ = (w_y/p) sin(π wₓ/p)/π · e^{2πi sₓ/p}.
 * The parallel Lee hologram (Eq. 11) varies wₓ with w_y = p; the orthogonal one (Eq. 16) varies w_y with wₓ ≈ p/2.
 * The best efficiency is 1/π² for even p and sin²[π(p − 1)/2p]/π² for odd p (text after Eq. 22). The order lies at
 * rₐ = −λ f₁ ν (Sec. 2), λ f₁/(p d) from the zero order. The target bandwidth must stay below ‖ν‖/2 (Sec. 2, Nyquist),
 * which sets the aperture radius here to λ f₁/(2 p d). That is a sampling bound, not a guarantee of no crosstalk: order
 * −2 spreads to about twice the bandwidth.
 *
 * Superpixels (Goorden S. A., Bertolotti J., Mosk A. P., "Superpixel-based spatial amplitude and phase modulation using
 * a digital micromirror device," Opt. Express 22, 17999 (2014), doi:10.1364/OE.22.017999). The aperture sits at
 * (a, n a) from the zero order, |a| = λ f₁/(n² d), so the n × n pixels of a superpixel respond with phases 2π/n² apart
 * along x and 2π/n along y, evenly spread round the circle. A superpixel makes the mean of the responses of its
 * pixels that are on; n = 3 gives 343 distinct fields and n = 4 gives 6561. The most is half the pixels on:
 * |E|² = [sin(π⌊n²/2⌋/n²)/(n² sin(π/n²))]², 10.3 % for n = 4 (Sec. 4). The aperture radius is kept to
 * r ≤ λ f₁/(4 n d), i.e. a bandwidth of at most π/(2n) rad per pixel (Δk = 2π d r/(λ f₁), Sec. 3).
 *
 * The two conventions differ. Goorden's 10.3 % is the bare phasor sum of the pixels. Eq. 22 integrates flat pixels of
 * 100 % fill, so it already holds the pixel envelope sinc²(πνₓ) sinc²(πν_y) at the aperture (ν in cycles per pixel):
 * 1/π² = (1/8) sinc²(π/4) at p = 4. On that common footing (derived here, in neither paper) a 4 × 4 superpixel gives
 * 10.26 % × sinc²(π/16) sinc²(π/4) = 8.21 %. Both are returned.
 */
import { BINARY_AMPLITUDE_EFFICIENCY, pixelEnvelope } from "../imaging/holography";

export type HologramMethod = "superpixel" | "lee-parallel" | "lee-orthogonal";

export interface HologramSetup {
  method: HologramMethod;
  /** Wavelength, m. */
  lambda: number;
  /** Micromirror pitch d, m. */
  pitch: number;
  /** Focal length f₁ of the first (Fourier) lens, m. */
  focal: number;
  /** Mirrors across (x) and down (y). */
  columns: number;
  rows: number;
  /** Lee carrier period p, pixels (whole, ≥ 2). */
  period: number;
  /** Superpixel side n, pixels (whole, ≥ 2). */
  superpixel: number;
}

export interface HologramResult {
  /** Most power in the filtered order, as a fraction of the incident power, flat pixels of 100 % fill. */
  efficiency: number;
  /** The same without the pixel envelope: the mean of the pixel phasors (Goorden's convention). */
  phasorEfficiency: number;
  /** Pixel envelope sinc²(πνₓ) sinc²(πν_y) at the aperture centre. */
  envelope: number;
  /** Spatial frequency of the filtered order, cycles per pixel along x and y. */
  nuX: number;
  nuY: number;
  /** Phase step between neighbouring pixels at the aperture centre, rad, along x and y. */
  phaseStepX: number;
  phaseStepY: number;
  /** Lee carrier period p d, m (NaN for superpixels: no carrier). */
  carrierPeriod: number;
  /** Aperture centre from the zero order in the Fourier plane, m: −λ f₁ ν for Lee; (−a, n a) as Goorden et al. print it. */
  apertureX: number;
  apertureY: number;
  /** Largest aperture radius that keeps out the neighbouring orders (Lee) or the pixel structure (superpixels), m. */
  apertureRadius: number;
  /** Finest target period passed by that aperture, pixels. */
  finestPeriod: number;
  /** Cells (Lee, p × p) or superpixels (n × n) on the array. */
  cells: number;
  /** Spacing λ f₁/d of the pixel-grid orders, m. With flat pixels of 100 % fill they vanish; a real DMD shows them. */
  fourierPeriod: number;
  /** Fourier-plane resolution λ f₁/(N d) across x and y, m: first zero of the full-array spot. */
  spotX: number;
  spotY: number;
}

/** True for a whole number ≥ 2. */
const wholeAtLeast2 = (v: number) => Number.isInteger(v) && v >= 2;

/** Best first-order efficiency of a Lee hologram with period p pixels (Gutiérrez-Cuevas & Popoff 2024, after Eq. 22). */
export function leeEfficiency(p: number): number {
  if (!wholeAtLeast2(p)) return NaN;
  return p % 2 === 0 ? BINARY_AMPLITUDE_EFFICIENCY : Math.sin((Math.PI * (p - 1)) / (2 * p)) ** 2 * BINARY_AMPLITUDE_EFFICIENCY;
}

/** Best efficiency of an n × n superpixel: half its pixels on (Goorden et al. 2014, Sec. 4; 10.3 % for n = 4). */
export function superpixelEfficiency(n: number): number {
  if (!wholeAtLeast2(n)) return NaN;
  const N = n * n;
  return (Math.sin((Math.PI * Math.floor(N / 2)) / N) / (N * Math.sin(Math.PI / N))) ** 2;
}

/**
 * Fraction of the incident power in order m of the brightest parallel Lee cell, wₓ = ⌊p/2⌋ and w_y = p (Gutiérrez-Cuevas
 * & Popoff 2024, Eq. 21): (wₓ/p)² for m = 0, [sin(π m wₓ/p)/(π m)]² otherwise. The order lies at ν = m/p cycles/pixel.
 */
export function leeOrderPower(p: number, m: number): number {
  if (!wholeAtLeast2(p) || !Number.isInteger(m)) return NaN;
  const wx = Math.floor(p / 2);
  return m === 0 ? (wx / p) ** 2 : (Math.sin((Math.PI * m * wx) / p) / (Math.PI * m)) ** 2;
}

/** A complex value as [re, im]. */
export type Field = readonly [number, number];

/** Keeps one of each value, equal to 1e-9. */
function distinct(values: Field[]): Field[] {
  const seen = new Map<string, Field>();
  for (const v of values) {
    const key = `${Math.round(v[0] * 1e9)},${Math.round(v[1] * 1e9)}`;
    if (!seen.has(key)) seen.set(key, v);
  }
  return [...seen.values()];
}

/**
 * The values T₋₁,₀ a Lee cell of period p can encode (Gutiérrez-Cuevas & Popoff 2024, Eq. 22), each once. The origin
 * is mid-pixel, so an odd width takes whole shifts sₓ = 0 … p − 1 and an even width half-integer ones (Sec. 3).
 */
export function leeFields(p: number, method: "lee-parallel" | "lee-orthogonal"): Field[] {
  if (!wholeAtLeast2(p) || p > 64) return [];
  const out: Field[] = [];
  const cell = (wx: number, wy: number) => {
    const amp = ((wy / p) * Math.sin((Math.PI * wx) / p)) / Math.PI;
    for (let k = 0; k < p; k++) {
      const phase = (2 * Math.PI * (k + (wx % 2 === 0 ? 0.5 : 0))) / p;
      out.push([amp * Math.cos(phase), amp * Math.sin(phase)]);
    }
  };
  if (method === "lee-parallel") for (let wx = 0; wx <= p; wx++) cell(wx, p);
  else for (let wy = 0; wy <= p; wy++) cell(Math.floor(p / 2), wy);
  return distinct(out);
}

/** Largest superpixel side whose fields are enumerated: 2^(n²) pixel patterns, 65 536 for n = 4. */
export const SUPERPIXEL_ENUMERATED = 4;

/**
 * The fields an n × n superpixel can make (Goorden et al. 2014, Sec. 2), each once: the mean of exp(2πi(j + n k)/n²)
 * over the pixels (j, k) that are on. Enumerated up to n = 4; larger n returns [] (2^(n²) patterns).
 */
export function superpixelFields(n: number): Field[] {
  if (!wholeAtLeast2(n) || n > SUPERPIXEL_ENUMERATED) return [];
  const N = n * n;
  // Pixel (j, k) answers with phase 2π(j/n² + k/n) = 2π(j + n k)/n²: the n² phases are all the steps 2π m/n².
  const re = Array.from({ length: N }, (_, m) => Math.cos((2 * Math.PI * m) / N) / N);
  const im = Array.from({ length: N }, (_, m) => Math.sin((2 * Math.PI * m) / N) / N);
  const out: Field[] = [];
  for (let mask = 0; mask < 1 << N; mask++) {
    let x = 0, y = 0;
    for (let m = 0; m < N; m++) if (mask & (1 << m)) { x += re[m]; y += im[m]; }
    out.push([x, y]);
  }
  return distinct(out);
}

/** Fourier-plane geometry, efficiency and cell count of a binary DMD hologram; NaN fields for invalid input. */
export function dmdHologram(s: HologramSetup): HologramResult {
  const { method, lambda, pitch, focal, columns, rows, period: p, superpixel: n } = s;
  const lee = method !== "superpixel";
  const side = lee ? p : n;
  const ok = lambda > 0 && pitch > 0 && focal > 0 && wholeAtLeast2(side) && columns >= side && rows >= side;
  const scale = (lambda * focal) / pitch;
  const nuX = !ok ? NaN : lee ? 1 / p : 1 / (n * n);
  const nuY = !ok ? NaN : lee ? 0 : 1 / n;
  // Flat pixel of side d at spatial frequency ν/d: sinc²(πν) per axis.
  const envelope = pixelEnvelope(nuX / pitch, pitch, 1) * pixelEnvelope(nuY / pitch, pitch, 1);
  // Lee's Eq. 22 holds the envelope; Goorden's phasor sum does not.
  const efficiency = !ok ? NaN : lee ? leeEfficiency(p) : superpixelEfficiency(n) * envelope;
  return {
    efficiency,
    phasorEfficiency: efficiency / envelope,
    envelope,
    nuX,
    nuY,
    phaseStepX: 2 * Math.PI * nuX,
    phaseStepY: 2 * Math.PI * nuY,
    carrierPeriod: ok && lee ? p * pitch : NaN,
    apertureX: -scale * nuX,
    apertureY: scale * nuY,
    // Lee: half the order spacing λ f₁/(p d). Superpixels: Δk = 2π d r/(λ f₁) ≤ π/(2n).
    apertureRadius: !ok ? NaN : lee ? scale / (2 * p) : scale / (4 * n),
    finestPeriod: !ok ? NaN : lee ? 2 * p : 4 * n,
    cells: !ok ? NaN : Math.floor(columns / side) * Math.floor(rows / side),
    fourierPeriod: ok ? scale : NaN,
    spotX: ok ? scale / columns : NaN,
    spotY: ok ? scale / rows : NaN,
  };
}
