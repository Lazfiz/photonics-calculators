/**
 * Fluorescent-protein spectra, filter fractions and Förster overlap. Wavelengths in metres; spectra are peak-normalised
 * shapes, so fractions and ratios are unit-free. Invalid inputs give NaN.
 *
 * - Catalogue: peak wavelengths, extinction coefficient ε (M⁻¹ cm⁻¹), quantum yield Φ and pKa from FPbase
 *   (T. J. Lambert, Nat. Methods 16, 277 (2019), doi:10.1038/s41592-019-0352-8; www.fpbase.org, read 2026-10-18),
 *   each with the DOI of the protein's original paper.
 * - Band shape: the log-normal of D. B. Siano, D. E. Metzler, J. Chem. Phys. 51, 1856 (1969), doi:10.1063/1.1672270,
 *   in wavenumber ν with maximum ν_m, full width at half maximum H and skewness ρ (ratio of the high-ν to the low-ν
 *   half-width): f = exp(−(ln 2/ln²ρ)·ln²(1 + (ν − ν_m)(ρ² − 1)/(ρH))), zero where the log's argument is ≤ 0; ρ = 1 is
 *   the Gaussian. Past the cutoff (the weak anti-Stokes tail) the shape is exactly 0. ν_m, H and ρ were fitted (least
 *   squares, Nelder–Mead) to each FPbase excitation and emission spectrum above 5 % of its peak; the fits leave rms residuals of 1–7 % of the peak, and the fitted maxima differ from the
 *   catalogue peaks by ≤ 10 nm. The excitation shape stands in for the absorption spectrum. Against the raw FPbase
 *   spectra the fits give Förster radii within 2.5 % (EGFP → mCherry 5.05 nm against 5.11 nm), filter fractions within
 *   0.06 and laser-line excitation within 0.09 of the peak.
 * - Förster (J. R. Lakowicz, Principles of Fluorescence Spectroscopy, 3rd ed., Springer 2006, §13.2):
 *   J = ∫F_D(λ) ε_A(λ) λ⁴ dλ / ∫F_D(λ) dλ in M⁻¹ cm⁻¹ nm⁴, R₀⁶ = 9000 ln10 κ² Φ_D J/(128 π⁵ N_A n⁴), which is
 *   R₀ = 0.02108 (κ² Φ_D n⁻⁴ J)^(1/6) nm; efficiency E = 1/(1 + (r/R₀)⁶).
 */

import { N_A } from "../constants";

export interface LogNormalBand {
  /** Wavenumber of the maximum, cm⁻¹. */
  peak_cm1: number;
  /** Full width at half maximum, cm⁻¹. */
  fwhm_cm1: number;
  /** Skewness ρ: high-wavenumber half-width over low-wavenumber half-width (1 = Gaussian). */
  skew: number;
}

export interface Fluorophore {
  name: string;
  /** FPbase excitation and emission maxima, nm. */
  exPeak_nm: number;
  emPeak_nm: number;
  /** Peak extinction coefficient, M⁻¹ cm⁻¹. */
  extinction: number;
  quantumYield: number;
  pKa: number;
  /** DOI of the original description, as listed by FPbase. */
  doi: string;
  ex: LogNormalBand;
  em: LogNormalBand;
}

const band = (peak_cm1: number, fwhm_cm1: number, skew: number): LogNormalBand => ({ peak_cm1, fwhm_cm1, skew });

/** Fluorescent proteins from FPbase, blue to far red; ex/em shapes fitted to the FPbase spectra (see the header). */
export const FLUOROPHORES: readonly Fluorophore[] = [
  { name: "mTagBFP2", exPeak_nm: 399, emPeak_nm: 454, extinction: 50600, quantumYield: 0.64, pKa: 2.7, doi: "10.1371/journal.pone.0028674", ex: band(24967, 3020, 1.323), em: band(21807, 2342, 0.649) },
  { name: "mTurquoise2", exPeak_nm: 434, emPeak_nm: 474, extinction: 30000, quantumYield: 0.93, pKa: 3.1, doi: "10.1038/ncomms1738", ex: band(22573, 3159, 1.765), em: band(20850, 2299, 0.516) },
  { name: "EGFP", exPeak_nm: 488, emPeak_nm: 507, extinction: 55900, quantumYield: 0.6, pKa: 6.0, doi: "10.1016/0378-1119(95)00685-0", ex: band(20474, 2428, 2.444), em: band(19671, 1395, 0.565) },
  { name: "mVenus", exPeak_nm: 515, emPeak_nm: 527, extinction: 104000, quantumYield: 0.64, pKa: 5.5, doi: "10.1021/bi0516273", ex: band(19359, 1109, 2.301), em: band(18951, 1207, 0.482) },
  { name: "mScarlet", exPeak_nm: 569, emPeak_nm: 594, extinction: 100000, quantumYield: 0.7, pKa: 5.3, doi: "10.1038/nmeth.4074", ex: band(17494, 1550, 2.577), em: band(16813, 1740, 0.552) },
  { name: "mCherry", exPeak_nm: 587, emPeak_nm: 610, extinction: 72000, quantumYield: 0.22, pKa: 4.5, doi: "10.1038/nbt1037", ex: band(17096, 1797, 2.214), em: band(16425, 1542, 0.508) },
  { name: "mKate2", exPeak_nm: 588, emPeak_nm: 633, extinction: 62500, quantumYield: 0.4, pKa: 5.4, doi: "10.1042/bj20081949", ex: band(16957, 1705, 2.046), em: band(15783, 2147, 0.654) },
  { name: "miRFP670", exPeak_nm: 642, emPeak_nm: 670, extinction: 87400, quantumYield: 0.14, pKa: 4.5, doi: "10.1038/ncomms12405", ex: band(15648, 1913, 1.862), em: band(14942, 1330, 0.547) },
];

/** Catalogue entry by name, or the first entry when the name is unknown. */
export function fluorophoreByName(name: string): Fluorophore {
  return FLUOROPHORES.find((f) => f.name === name) ?? FLUOROPHORES[0];
}

/** Siano–Metzler log-normal shape at wavenumber ν (cm⁻¹), 1 at the maximum. */
export function logNormalBand({ peak_cm1, fwhm_cm1, skew }: LogNormalBand, nu_cm1: number): number {
  if (!(fwhm_cm1 > 0) || !(skew > 0) || !Number.isFinite(nu_cm1)) return NaN;
  const x = (nu_cm1 - peak_cm1) / fwhm_cm1;
  if (Math.abs(skew - 1) < 1e-9) return Math.exp(-4 * Math.LN2 * x * x);
  const arg = 1 + (x * (skew * skew - 1)) / skew;
  if (arg <= 0) return 0;
  const lnRho = Math.log(skew);
  return Math.exp((-Math.LN2 / (lnRho * lnRho)) * Math.log(arg) ** 2);
}

/** The band's shape at a wavelength λ (m). */
export function bandAtWavelength(b: LogNormalBand, lambda: number): number {
  return lambda > 0 ? logNormalBand(b, 0.01 / lambda) : NaN;
}

/** Emission spectra are integrated over 300–1000 nm. */
export const SPECTRUM_MIN = 300e-9;
export const SPECTRUM_MAX = 1000e-9;
const STEP = 0.25e-9;

/** Composite Simpson ∫f dλ over [a, b] (m) with steps ≤ 0.25 nm (the bands are smooth: they vanish with every derivative at the log-normal cutoff). */
export function integrateSpectrum(f: (lambda: number) => number, a = SPECTRUM_MIN, b = SPECTRUM_MAX): number {
  if (!(b > a)) return 0;
  const n = 2 * Math.max(1, Math.ceil((b - a) / (2 * STEP)));
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return (s * h) / 3;
}

/** Fraction of the emission inside a top-hat window [λ_lo, λ_hi] (m), relative to 300–1000 nm. */
export function emissionFraction(b: LogNormalBand, lo: number, hi: number): number {
  if (!(hi > lo)) return NaN;
  const shape = (l: number) => bandAtWavelength(b, l);
  const total = integrateSpectrum(shape);
  const a = Math.max(lo, SPECTRUM_MIN);
  const z = Math.min(hi, SPECTRUM_MAX);
  return total > 0 ? integrateSpectrum(shape, a, z) / total : NaN;
}

/** Molecular brightness ε·Φ/1000, mM⁻¹ cm⁻¹. */
export function brightness(f: Fluorophore): number {
  return (f.extinction * f.quantumYield) / 1000;
}

/**
 * Detected signal per molecule, relative: ε_peak·(Σ excitation shape at the laser lines)·Φ·(fraction of the emission in
 * the window), in M⁻¹ cm⁻¹. Assumes the same photon flux from every laser line and no saturation.
 */
export function relativeSignal(f: Fluorophore, lasers: readonly number[], lo: number, hi: number): number {
  const ex = lasers.reduce((s, l) => s + bandAtWavelength(f.ex, l), 0);
  return f.extinction * ex * f.quantumYield * emissionFraction(f.em, lo, hi);
}

/**
 * Spillover matrix L[i][j] = R_ij/R_jj: the signal of dye j in channel i relative to dye j in its own channel j, with
 * R_ij = relativeSignal(dye j, lasers on in frame i, filter band i). "simultaneous": every laser is on in one frame, so
 * the excitation cancels and L_ij is the emission ratio of dye j between filters i and j. "sequential": frame i has only
 * laser i, so L_ij also carries the excitation ratio f_ex,j(λ_i)/f_ex,j(λ_j). NaN where dye j gives no own-channel signal.
 */
export function spilloverMatrix(
  dyes: readonly Fluorophore[], lasers: readonly number[], bands: readonly (readonly [number, number])[],
  mode: "simultaneous" | "sequential",
): number[][] {
  const R = bands.map(([lo, hi], i) => dyes.map((d) => relativeSignal(d, mode === "simultaneous" ? lasers : [lasers[i]], lo, hi)));
  return R.map((row) => row.map((v, j) => (R[j][j] > 0 ? v / R[j][j] : NaN)));
}

/** Förster overlap J = ∫F_D ε_A λ⁴ dλ / ∫F_D dλ (Lakowicz §13.2), in M⁻¹ cm⁻¹ nm⁴. */
export function forsterOverlap(donor: Fluorophore, acceptor: Fluorophore): number {
  const emD = (l: number) => bandAtWavelength(donor.em, l);
  const num = integrateSpectrum((l) => emD(l) * acceptor.extinction * bandAtWavelength(acceptor.ex, l) * (l * 1e9) ** 4);
  const den = integrateSpectrum(emD);
  return den > 0 ? num / den : NaN;
}

/**
 * R₀ = (9000 ln10/(128 π⁵ N_A))^(1/6)·(κ² Φ_D n⁻⁴ J)^(1/6) with J in M⁻¹ cm⁻¹ nm⁴ = 1e-28 M⁻¹ cm³ (N_A per mol,
 * lengths in cm), which makes the prefactor 0.02108 nm.
 */
export const FORSTER_PREFACTOR_NM = ((9000 * Math.LN10 * 1e-28) / (128 * Math.PI ** 5 * N_A)) ** (1 / 6) * 1e7;

/** Förster radius in metres; κ² = 2/3 for freely rotating dipoles, n = 1.4 for protein. */
export function forsterRadius(overlap: number, donorQy: number, kappa2 = 2 / 3, n = 1.4): number {
  if (!(overlap >= 0) || !(donorQy >= 0) || !(kappa2 >= 0) || !(n > 0)) return NaN;
  return FORSTER_PREFACTOR_NM * ((kappa2 * donorQy * overlap) / n ** 4) ** (1 / 6) * 1e-9;
}

/** FRET efficiency 1/(1 + (r/R₀)⁶). */
export function fretEfficiency(r: number, r0: number): number {
  if (!(r >= 0) || !(r0 > 0)) return NaN;
  return 1 / (1 + (r / r0) ** 6);
}
