/**
 * Bloch waves of an infinite periodic bilayer (a 1D photonic crystal) at normal incidence, for lossless,
 * non-dispersive layers of index n_H, n_L and thickness d_H, d_L (period Λ = d_H + d_L).
 *
 * Model tier: Exact. The period's characteristic matrix has half-trace
 *   cos KΛ = cos δ_H cos δ_L − ½(n_H/n_L + n_L/n_H) sin δ_H sin δ_L,   δ_j = 2π n_j d_j/λ,
 * and a Bloch wave e^{iKz} propagates where |cos KΛ| ≤ 1. Outside, KΛ = mπ + iκ with cosh κ = |cos KΛ|: the
 * field falls by e^{−κ} per period (a stop band). For quarter-wave layers at λ₀ the gap is centred on λ₀,
 * κ(λ₀) = ln(n_H/n_L) and the gap/midgap ratio is Δω/ω₀ = (4/π) asin(|n_H − n_L|/(n_H + n_L)).
 *
 * References: P. Yeh, A. Yariv, C.-S. Hong, "Electromagnetic propagation in periodic stratified media. I. General
 * theory", J. Opt. Soc. Am. 67, 423 (1977), doi:10.1364/JOSA.67.000423. M. Born & E. Wolf, Principles of Optics,
 * 7th ed. (Cambridge University Press, 1999), §1.6.5. J. D. Joannopoulos et al., Photonic Crystals: Molding the
 * Flow of Light, 2nd ed. (Princeton University Press, 2008), ch. 4 (quarter-wave gap/midgap ratio).
 */
import { stopBandHalfWidth } from "./quarter-wave-stack";

/** Half-trace cos KΛ of one H + L period at vacuum wavelength λ (thicknesses and λ in m). NaN unless n > 0, d ≥ 0, λ > 0. */
export function bilayerBlochCos(nH: number, dH: number, nL: number, dL: number, lambda: number): number {
  if (!(nH > 0 && nL > 0 && dH >= 0 && dL >= 0 && lambda > 0)) return NaN;
  const dhPhase = (2 * Math.PI * nH * dH) / lambda;
  const dlPhase = (2 * Math.PI * nL * dL) / lambda;
  return Math.cos(dhPhase) * Math.cos(dlPhase) - 0.5 * (nH / nL + nL / nH) * Math.sin(dhPhase) * Math.sin(dlPhase);
}

/** Bloch phase per period KΛ = re + i·im from the half-trace: re in [0, π], im ≥ 0 (zero in a pass band). */
export function blochPhase(halfTrace: number): { re: number; im: number } {
  if (!Number.isFinite(halfTrace)) return { re: NaN, im: NaN };
  if (halfTrace > 1) return { re: 0, im: Math.acosh(halfTrace) };
  if (halfTrace < -1) return { re: Math.PI, im: Math.acosh(-halfTrace) };
  return { re: Math.acos(halfTrace), im: 0 };
}

/** Period Λ (m) of a quarter-wave H + L pair at λ₀: λ₀/4 · (1/n_H + 1/n_L). */
export function quarterWavePeriod(lambda0: number, nH: number, nL: number): number {
  if (!(lambda0 > 0 && nH > 0 && nL > 0)) return NaN;
  return (lambda0 / 4) * (1 / nH + 1 / nL);
}

/** Gap/midgap ratio Δω/ω₀ of the quarter-wave crystal's first gap: twice Macleod's half-width Δg. */
export function quarterWaveGapMidgap(nH: number, nL: number): number {
  return 2 * stopBandHalfWidth(nH, nL);
}

/** Field decay per period at the centre of the quarter-wave gap, κ = |ln(n_H/n_L)| (nepers). */
export function quarterWaveDecayPerPeriod(nH: number, nL: number): number {
  if (!(nH > 0 && nL > 0)) return NaN;
  return Math.abs(Math.log(nH / nL));
}
