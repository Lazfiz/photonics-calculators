/**
 * Incoherent transfer function of an aberration-free or defocused circular pupil, and the Wiener restoration filter.
 * SI units in and out (lengths in m, frequencies in cycles/m). Model tier: textbook approximation (scalar,
 * paraxial defocus, uniform pupil).
 *
 * - Cutoff f_c = 2NA/λ; with ν = f/f_c the in-focus MTF is (2/π)[arccos ν − ν√(1 − ν²)] (Goodman, Introduction to
 *   Fourier Optics, 3rd ed. (2005), §6.3, circular pupil).
 * - Defocus W(ρ) = W₀₂₀ρ² with the paraxial W₀₂₀ = Δz·NA²/(2n) (exact edge path difference n·Δz(1 − cos θ)).
 *   The OTF is the normalised overlap of two pupils shifted by ±ν, weighted by cos(4kW₀₂₀νx) (H. H. Hopkins, "The
 *   frequency response of a defocused optical system", Proc. R. Soc. A 231, 91–103 (1955),
 *   doi:10.1098/rspa.1955.0158). With x + ν = cos t:
 *   OTF(ν) = (4/π) ∫₀^arccos ν sin²t · cos(4kW₀₂₀ν(cos t − ν)) dt, real and even in W₀₂₀; it first goes negative
 *   (contrast reversal) near W₀₂₀ = 0.65λ.
 * - High-NA defocus (scalar Debye integral, B. Richards & E. Wolf, Proc. R. Soc. A 253, 358–379 (1959),
 *   doi:10.1098/rspa.1959.0200; C. J. R. Sheppard, Appl. Opt. 27, 4782–4786 (1988), doi:10.1364/AO.27.004782): a focus
 *   shift Δz in a medium of index n multiplies the pupil by exp(i k n Δz cos θ), and an aplanatic lens maps sin θ = sρ
 *   with s = NA/n. The pupil phase is then 2πD√(1 − s²ρ²), D = nΔz/λ, which is not quadratic in ρ; its ρ² term is the
 *   paraxial W₀₂₀ = Ds²/2. The pupil amplitude stays uniform in ρ, so the in-focus OTF is still the circular-pupil MTF;
 *   an aplanatic lens would weight it by (1 − s²ρ²)^(−1/4) (Richards–Wolf √cos θ with dρ ∝ cos θ dθ), which brightens
 *   the rim: at NA 0.95, Δz 0.5 µm, 550 nm OTF(0.5) falls from 0.0432 to 0.0275 and the Strehl ratio from 0.273 to 0.240
 *   (physics review, session 201). No vector effects. The OTF is the overlap integral of the two shifted pupils,
 *   (1/π)∫∫ cos(B(ρ₊) − B(ρ₋)) dx dy with ρ±² = (x ± ν)² + y², done in 2D; the Strehl ratio has the closed form
 *   |(2/s²)∫_c^1 e^(i2πDu) u du|², c = √(1 − s²) (substitute u = √(1 − s²ρ²)).
 * - Wiener filter for white noise and a flat object spectrum of noise-to-signal power ratio NSR: G = H/(H² + NSR), so
 *   the restored transfer is H²/(H² + NSR) (Gonzalez & Woods, Digital Image Processing, 4th ed. (2018), §5.8,
 *   Wiener filter with a constant K). It falls to ½ where H = √NSR.
 */
import { firstCrossing, integrateSimpson } from "../math";

const positive = (x: number) => Number.isFinite(x) && x > 0;

/** Incoherent cutoff frequency 2NA/λ, cycles/m. */
export function cutoffFrequency(na: number, lambda: number): number {
  return positive(na) && positive(lambda) ? (2 * na) / lambda : NaN;
}

/** Diffraction-limited MTF at normalised frequency ν = f/f_c (0 for ν ≥ 1). */
export function diffractionMtf(nu: number): number {
  if (!(Number.isFinite(nu) && nu >= 0)) return NaN;
  if (nu >= 1) return 0;
  return (2 / Math.PI) * (Math.acos(nu) - nu * Math.sqrt(1 - nu * nu));
}

/** Paraxial defocus coefficient W₀₂₀ = Δz·NA²/(2n), m, for a focus shift Δz in a medium of index n. */
export function defocusW020(dz: number, na: number, n = 1): number {
  if (!Number.isFinite(dz) || !positive(na) || !(n >= na)) return NaN;
  return (dz * na * na) / (2 * n);
}

/** Largest argument 4kW₀₂₀ν handled; the Simpson grid grows with it. */
const MAX_OTF_PHASE = 1e5;

/**
 * Hopkins' defocused OTF at ν = f/f_c for a defocus W₀₂₀ in waves (W₀₂₀/λ). Simpson's rule with ≥ 16 points per
 * oscillation: within 1e-8 of a 4× finer grid. NaN beyond 4kW₀₂₀ν = 10⁵.
 */
export function defocusedOtf(nu: number, w020Waves: number): number {
  if (!(Number.isFinite(nu) && nu >= 0 && Number.isFinite(w020Waves))) return NaN;
  if (nu >= 1) return 0;
  const a = 4 * 2 * Math.PI * Math.abs(w020Waves) * nu;
  if (a === 0) return diffractionMtf(nu);
  if (a > MAX_OTF_PHASE) return NaN;
  const T = Math.acos(nu);
  const g = (t: number) => {
    const s = Math.sin(t);
    return s * s * Math.cos(a * (Math.cos(t) - nu));
  };
  return (4 / Math.PI) * integrateSimpson(g, 0, T, Math.max(200, Math.ceil(4 * a)));
}

const GL8_NODES = [0.1834346424956498, 0.525532409916329, 0.7966664774136267, 0.9602898564975363];
const GL8_WEIGHTS = [0.362683783378362, 0.3137066458778873, 0.2223810344533745, 0.1012285362903763];

/** Composite 8-point Gauss–Legendre nodes and weights on [0, 1] with `panels` equal panels. */
function gaussLegendreGrid(panels: number): [Float64Array, Float64Array] {
  const x = new Float64Array(8 * panels);
  const w = new Float64Array(8 * panels);
  let k = 0;
  for (let p = 0; p < panels; p++) {
    const mid = (p + 0.5) / panels;
    const half = 0.5 / panels;
    for (let i = 0; i < 4; i++) {
      x[k] = mid - half * GL8_NODES[i];
      w[k++] = GL8_WEIGHTS[i] * half;
      x[k] = mid + half * GL8_NODES[i];
      w[k++] = GL8_WEIGHTS[i] * half;
    }
  }
  return [x, w];
}

/**
 * Largest phase difference across the overlap handled by highNaDefocusOtf, rad (≈ 40 waves at the pupil edge); the
 * grid grows with it, and a 101-point curve at the limit takes about 0.4 s.
 */
export const MAX_HIGH_NA_PHASE = 250;

/**
 * Defocused OTF at ν = f/f_c with the exact high-NA defocus phase 2πD√(1 − s²ρ²), D = nΔz/λ, s = NA/n ∈ (0, 1].
 * The overlap integral runs over the quadrant x, y ≥ 0 with x = (1 − ν)(1 − τ²) (smooth at the lens tip) and
 * y = Y(x)·t(2 − t) (smooth at the rim ρ₊ = 1, where the phase has an infinite slope at s = 1), on composite
 * Gauss–Legendre grids with a panel per 4 rad (τ) and 16 rad (t) of the largest phase difference: within 2e-7 of a
 * grid 4× finer in both for s ≤ 0.95, and within 1e-6 (absolute) as s → 1. NaN beyond MAX_HIGH_NA_PHASE. Tends to defocusedOtf(ν, Ds²/2) as s → 0.
 */
export function highNaDefocusOtf(nu: number, defocusWaves: number, s: number): number {
  if (!(Number.isFinite(nu) && nu >= 0 && Number.isFinite(defocusWaves) && s > 0 && s <= 1)) return NaN;
  if (nu >= 1) return 0;
  if (defocusWaves === 0) return diffractionMtf(nu);
  const K = 2 * Math.PI * Math.abs(defocusWaves);
  const c = Math.sqrt(1 - s * s);
  // |B(ρ₊) − B(ρ₋)| is at most the edge phase K(1 − c), and at most the largest slope K s²/c times ρ₊ − ρ₋ ≤ 2ν.
  const edge = (K * s * s) / (1 + c);
  const phase = c > 0 ? Math.min(edge, (2 * nu * K * s * s) / c) : edge;
  if (phase > MAX_HIGH_NA_PHASE) return NaN;
  const B = (r2: number) => K * Math.sqrt(Math.max(0, 1 - s * s * r2));
  const [tau, wTau] = gaussLegendreGrid(Math.ceil(phase / 4) + 1);
  const [t, wT] = gaussLegendreGrid(Math.ceil(phase / 16) + 1);
  const X = 1 - nu;
  let sum = 0;
  for (let i = 0; i < tau.length; i++) {
    const x = X * (1 - tau[i] * tau[i]);
    const xp = x + nu;
    const xm = x - nu;
    const Y = Math.sqrt(Math.max(0, 1 - xp * xp));
    let inner = 0;
    for (let j = 0; j < t.length; j++) {
      const y2 = (Y * t[j] * (2 - t[j])) ** 2;
      inner += wT[j] * 2 * (1 - t[j]) * Math.cos(B(xp * xp + y2) - B(xm * xm + y2));
    }
    sum += wTau[i] * 2 * X * tau[i] * Y * inner;
  }
  return (4 / Math.PI) * sum;
}

/**
 * Strehl ratio of the exact high-NA defocus 2πD√(1 − s²ρ²) over a uniform pupil (closed form; see the header).
 * With δ = 1 − c and z = 2πDδ: S = |(2/s²)(c·δ·E(z) + δ²·G(z))|², E = ∫₀¹e^(izt)dt, G = ∫₀¹t·e^(izt)dt. Tends to
 * sinc²(kW₀₂₀/2) as s → 0.
 */
export function highNaDefocusStrehl(defocusWaves: number, s: number): number {
  if (!(Number.isFinite(defocusWaves) && s > 0 && s <= 1)) return NaN;
  const c = Math.sqrt(1 - s * s);
  const delta = (s * s) / (1 + c);
  const z = 2 * Math.PI * Math.abs(defocusWaves) * delta;
  let eRe: number, eIm: number, gRe: number, gIm: number;
  if (Math.abs(z) < 0.5) {
    // Series Σ (iz)ᵐ/(m!(m + 1)) and Σ (iz)ᵐ/(m!(m + 2)); 20 terms reach 1e-17 at |z| = 0.5.
    eRe = eIm = gRe = gIm = 0;
    let termRe = 1, termIm = 0;
    for (let m = 0; m < 20; m++) {
      eRe += termRe / (m + 1); eIm += termIm / (m + 1);
      gRe += termRe / (m + 2); gIm += termIm / (m + 2);
      [termRe, termIm] = [(-termIm * z) / (m + 1), (termRe * z) / (m + 1)];
    }
  } else {
    // E = (e^(iz) − 1)/(iz); G = e^(iz)(1/(iz) + 1/z²) − 1/z².
    const cz = Math.cos(z), sz = Math.sin(z);
    eRe = sz / z;
    eIm = (1 - cz) / z;
    gRe = (cz + z * sz - 1) / (z * z);
    gIm = (sz - z * cz) / (z * z);
  }
  const re = (2 / (s * s)) * (c * delta * eRe + delta * delta * gRe);
  const im = (2 / (s * s)) * (c * delta * eIm + delta * delta * gIm);
  return re * re + im * im;
}

/** Wiener filter gain H/(H² + NSR) for a real transfer value H. */
export function wienerGain(h: number, nsr: number): number {
  if (!Number.isFinite(h) || !(Number.isFinite(nsr) && nsr >= 0)) return NaN;
  const d = h * h + nsr;
  return d > 0 ? h / d : NaN;
}

/** Restored transfer H·G = H²/(H² + NSR) of the Wiener filter. */
export function wienerTransfer(h: number, nsr: number): number {
  if (!Number.isFinite(h) || !(Number.isFinite(nsr) && nsr >= 0)) return NaN;
  const d = h * h + nsr;
  return d > 0 ? (h * h) / d : NaN;
}

/** ν where the in-focus MTF equals √NSR, i.e. the Wiener-restored transfer is ½; 0 if NSR ≥ 1. */
export function wienerHalfFrequency(nsr: number): number {
  if (!positive(nsr)) return nsr === 0 ? 1 : NaN;
  const level = Math.sqrt(nsr);
  if (level >= 1) return 0;
  return firstCrossing(diffractionMtf, 0, 1, level, 64);
}
