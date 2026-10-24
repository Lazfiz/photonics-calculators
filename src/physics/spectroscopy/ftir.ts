/**
 * Fourier-transform infrared (FTIR) spectrometer: resolution, sampling, scan time, apodization and instrument line
 * shape (ILS), the interferogram of a set of lines and its cosine transform. Wavenumbers σ in cm⁻¹ and optical path
 * difference (OPD) x in cm unless a name says otherwise. Model tier: exact (ideal interferometer, no divergence).
 *
 * P. R. Griffiths, J. A. de Haseth, Fourier Transform Infrared Spectrometry, 2nd ed. (Wiley, 2007), ch. 2:
 *   interferogram I(x) = 2∫₀^∞ B(σ) cos(2πσx) dσ, spectrum B(σ) = ∫ I(x) cos(2πσx) dx over −L … L;
 *   truncation at |x| = L convolves B with the ILS 2L·sinc(2πσL) (FWHM 0.6034/L); nominal resolution 1/L;
 *   OPD sampling Δx = 1/(2σ_max) (Nyquist), so a single-sided scan 0 … L has 2Lσ_max points;
 *   moving-mirror speed v changes the OPD at 2v, so a scan takes L/(2v) and σ is modulated at f = 2vσ.
 * Apodization A(u), u = x/L, multiplies the interferogram; the ILS is its cosine transform
 *   ILS(s) ∝ ∫₀¹ A(u) cos(2πsu) du, s = (σ − σ₀)·L,
 * in closed form for the cosine-sum windows, (1/a₀)Σ aₖ[sinc(2s − k) + sinc(2s + k)]/2 with sinc y = sin(πy)/(πy), and
 * the triangle, sinc²(s), and numerically for Norton–Beer (Simpson, 200 panels: error < 10⁻⁸ near the main lobe, < 2·10⁻⁶ at s = 4). So the FWHM
 * and sidelobe of every window are computed, not quoted. Windows:
 *   Norton–Beer A(u) = Σ Cᵢ(1 − u²)ⁱ (R. H. Norton, R. Beer, J. Opt. Soc. Am. 66, 259 (1976); 67, 419 (1977)),
 *     with the coefficients as tabulated by D. A. Naylor, M. K. Tahic, J. Opt. Soc. Am. A 24, 3644 (2007);
 *   Happ–Genzel 0.54 + 0.46 cos(πu) (Griffiths & de Haseth ch. 2);
 *   Blackman–Harris 3- and 4-term Σ aₖ cos(πku) (F. J. Harris, Proc. IEEE 66, 51 (1978), −67 dB and −92 dB).
 */
import { nextPow2, fftRadix2 } from "../fft";
import { firstCrossing, integrateSimpson, sinc } from "../math";

export type FtirApodization =
  | "boxcar" | "triangular" | "happ-genzel" | "nb-weak" | "nb-medium" | "nb-strong" | "bh3" | "bh4";

type Window = { label: string; cosine?: number[]; nortonBeer?: number[]; triangular?: true };

export const FTIR_APODIZATIONS: Record<FtirApodization, Window> = {
  boxcar: { label: "Boxcar (none)", cosine: [1] },
  triangular: { label: "Triangular", triangular: true },
  "happ-genzel": { label: "Happ–Genzel", cosine: [0.54, 0.46] },
  "nb-weak": { label: "Norton–Beer weak", nortonBeer: [0.384093, -0.087577, 0.703484] },
  "nb-medium": { label: "Norton–Beer medium", nortonBeer: [0.152442, -0.136176, 0.983734] },
  "nb-strong": { label: "Norton–Beer strong", nortonBeer: [0.045335, 0, 0.554883, 0, 0.399782] },
  bh3: { label: "Blackman–Harris 3-term", cosine: [0.42323, 0.49755, 0.07922] },
  bh4: { label: "Blackman–Harris 4-term", cosine: [0.35875, 0.48829, 0.14128, 0.01168] },
};

export const FTIR_APODIZATION_NAMES = Object.keys(FTIR_APODIZATIONS) as FtirApodization[];

/** Apodization A(u) at u = x/L; 0 for |u| > 1. Every window is 1 at u = 0. */
export function apodization(name: FtirApodization, u: number): number {
  const a = Math.abs(u);
  if (!(a <= 1)) return 0;
  const w = FTIR_APODIZATIONS[name];
  if (w.triangular) return 1 - a;
  if (w.nortonBeer) {
    const q = 1 - a * a;
    return w.nortonBeer.reduce((s, c, i) => s + c * q ** i, 0);
  }
  return (w.cosine ?? [1]).reduce((s, c, k) => s + c * Math.cos(Math.PI * k * a), 0);
}

const PANELS = 200;
const AREA = new Map<FtirApodization, number>();

const sincPi = (y: number) => sinc(Math.PI * y);

/** ILS normalized to 1 at the line centre, at s = (σ − σ₀)·L (dimensionless). */
export function instrumentLineShape(name: FtirApodization, s: number): number {
  const w = FTIR_APODIZATIONS[name];
  if (w.triangular) return sincPi(s) ** 2;
  if (w.cosine) return w.cosine.reduce((acc, a, k) => acc + (a * (sincPi(2 * s - k) + sincPi(2 * s + k))) / 2, 0) / w.cosine[0];
  let area = AREA.get(name);
  if (area === undefined) {
    area = integrateSimpson((u) => apodization(name, u), 0, 1, PANELS);
    AREA.set(name, area);
  }
  return integrateSimpson((u) => apodization(name, u) * Math.cos(2 * Math.PI * s * u), 0, 1, PANELS) / area;
}

/** ILS full width at half maximum in units of 1/L (boxcar 0.6034). */
export function ilsFwhm(name: FtirApodization): number {
  return 2 * firstCrossing((s) => instrumentLineShape(name, s), 0, 3, 0.5, 300);
}

/**
 * Largest ILS sidelobe beyond the first minimum of the main lobe, signed (boxcar −0.2172), searched for s ≤ 4 in
 * steps of 0.01 (every window here has its largest sidelobe within s < 3), each extremum refined by a parabola through
 * its three samples.
 */
export function ilsHighestSidelobe(name: FtirApodization): number {
  const step = 0.01;
  const v = Array.from({ length: 401 }, (_, i) => instrumentLineShape(name, i * step));
  let k = 1;
  while (k < v.length - 1 && !(v[k] <= v[k - 1] && v[k] <= v[k + 1])) k++;
  let best = v[k];
  for (let i = k; i < v.length - 1; i++) {
    const extremum = (v[i] >= v[i - 1] && v[i] >= v[i + 1]) || (v[i] <= v[i - 1] && v[i] <= v[i + 1]);
    const curvature = v[i + 1] - 2 * v[i] + v[i - 1];
    const peak = curvature !== 0 ? v[i] - (v[i + 1] - v[i - 1]) ** 2 / (8 * curvature) : v[i];
    if (extremum && Math.abs(peak) > Math.abs(best)) best = peak;
  }
  return best;
}

/** Nominal resolution 1/L, cm⁻¹, for maximum OPD L in cm. */
export const nominalResolution = (maxOpd_cm: number): number => (maxOpd_cm > 0 ? 1 / maxOpd_cm : NaN);

/** Points in a single-sided scan 0 … L sampled at the Nyquist step 1/(2σ_max). */
export const singleSidedPoints = (maxOpd_cm: number, sigmaMax_cm: number): number => 2 * maxOpd_cm * sigmaMax_cm;

/** Single-scan time L/(2v), s, for mirror speed v in cm/s. */
export const scanTime = (maxOpd_cm: number, mirrorSpeed_cm_s: number): number =>
  mirrorSpeed_cm_s > 0 ? maxOpd_cm / (2 * mirrorSpeed_cm_s) : NaN;

/** Fourier (modulation) frequency 2vσ, Hz. */
export const modulationFrequency = (mirrorSpeed_cm_s: number, sigma_cm: number): number => 2 * mirrorSpeed_cm_s * sigma_cm;

export interface SpectralLine {
  sigma: number; // wavenumber, any unit u⁻¹
  amplitude: number;
  fwhm: number; // Gaussian FWHM in the same unit; 0 for a monochromatic line
}

/**
 * Interferogram (AC part) of Gaussian lines at OPD x (unit u): Σ aᵢ cos(2πσᵢx)·exp(−(πΓᵢx)²/(4 ln 2)), the cosine
 * transform of lines with area aᵢ/2 each (the factor 2 in I = 2∫B cos). The envelope halves at x = 2 ln 2/(πΓ).
 */
export function lineInterferogram(lines: readonly SpectralLine[], x: number): number {
  return lines.reduce(
    (s, l) => s + l.amplitude * Math.cos(2 * Math.PI * l.sigma * x) * Math.exp(-((Math.PI * l.fwhm * x) ** 2) / (4 * Math.LN2)),
    0,
  );
}

/** OPD at which a Gaussian line's fringe visibility falls to ½: 2 ln 2/(πΓ). */
export const halfVisibilityOpd = (fwhm: number): number => (fwhm > 0 ? (2 * Math.LN2) / (Math.PI * fwhm) : Infinity);

/**
 * Cosine transform of a single-sided, symmetric interferogram I(nΔx), n = 0 … N − 1:
 *   B(σ_k) = Δx·[I₀ + 2 Σ_{n≥1} Iₙ cos(2πσ_k nΔx)],  σ_k = k/(PΔx), k = 0 … P/2,
 * by an FFT of the mirrored sequence zero-padded to P = `pad`·nextPow2(2N) points (`pad` a power of two ≥ 1). A line
 * cos(2πσ₁x) of unit amplitude gives B(σ₁) ≈ L = NΔx.
 */
export function cosineTransform(I: readonly number[], dx: number, pad = 1): { sigma: number[]; B: number[] } {
  const N = I.length;
  if (N < 2 || !(dx > 0)) return { sigma: [], B: [] };
  const P = nextPow2(2 * N) * nextPow2(Math.max(1, pad));
  const re = new Array<number>(P).fill(0);
  const im = new Array<number>(P).fill(0);
  re[0] = I[0];
  for (let n = 1; n < N; n++) re[n] = re[P - n] = I[n];
  fftRadix2(re, im);
  const half = P / 2;
  return {
    sigma: Array.from({ length: half + 1 }, (_, k) => k / (P * dx)),
    B: Array.from({ length: half + 1 }, (_, k) => dx * re[k]),
  };
}
