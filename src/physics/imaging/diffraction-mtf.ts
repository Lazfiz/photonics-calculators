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
