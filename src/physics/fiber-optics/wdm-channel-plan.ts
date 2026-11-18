/**
 * WDM channel plans and the isolation of Gaussian passbands.
 *
 * DWDM (ITU-T G.694.1): the spacing is recognised as a G.694.1 value (Δν = 12.5, 25, 50, 100 or 200 GHz, from
 * Δν ≈ cΔλ/λc² at the centre). The channels are then at equal frequency steps cΔλ/λc² about λc; they are not
 * snapped to the grid and not anchored at 193.1 THz. CWDM (ITU-T G.694.2): 20 nm steps in
 * *wavelength*, 1271–1611 nm. A plan that matches neither is spaced equally in wavelength.
 *
 * Passbands are Gaussian in wavelength with full width at half maximum FWHM, σ = FWHM/(2√(2 ln 2)). The leak of a
 * channel's filter at its neighbour, Δλ away, is exp(−Δλ²/2σ²), so the adjacent-channel isolation is
 *   ISO = 10 log₁₀(e) · Δλ²/(2σ²) = 10 log₁₀(e) · 4 ln 2 · (Δλ/FWHM)² ≈ 12.04 (Δλ/FWHM)² dB.
 * Illustrative: thin-film filters are flat-topped with steeper skirts, AWGs close to Gaussian, Mach–Zehnder
 * interleavers sin²-shaped, so real isolation depends on the technology.
 */
import { c } from "../constants";
import { frequencyWidth } from "../spectroscopy/wavenumber";

export interface WdmGrid {
  /** Grid name for display. */
  name: string;
  /** True for the G.694.1 frequency grid (equal Δν), false for equal Δλ. */
  equalFrequency: boolean;
}

/** G.694.1 DWDM spacings, Hz, with the match tolerance used to recognise them. */
const DWDM_GRIDS: readonly [number, number][] = [
  [12.5e9, 2e9],
  [25e9, 2e9],
  [50e9, 2e9],
  [100e9, 2e9],
  [200e9, 5e9],
];
/** G.694.2 CWDM spacing, m, and the match tolerance. */
const CWDM_SPACING = 20e-9;
const CWDM_TOLERANCE = 0.5e-9;

/** The ITU-T grid a wavelength spacing (m) at centre wavelength λc (m) corresponds to. */
export function ituGrid(spacing: number, centre: number): WdmGrid {
  const dNu = frequencyWidth(centre, spacing);
  for (const [grid, tol] of DWDM_GRIDS) {
    if (Math.abs(dNu - grid) < tol) return { name: `ITU-T G.694.1 DWDM, ${grid / 1e9} GHz`, equalFrequency: true };
  }
  if (Math.abs(spacing - CWDM_SPACING) < CWDM_TOLERANCE) return { name: "ITU-T G.694.2 CWDM, 20 nm", equalFrequency: false };
  return { name: "Custom (equal wavelength steps)", equalFrequency: false };
}

/**
 * Channel wavelengths (m), ascending, for n channels centred on λc with spacing Δλ (m). With `equalFrequency` the
 * channels sit at ν_c + kΔν, Δν = cΔλ/λc², k = −(n−1)/2 … (n−1)/2. A channel at or below zero wavelength or frequency
 * is NaN.
 */
export function channelWavelengths(n: number, centre: number, spacing: number, equalFrequency: boolean): number[] {
  if (!(n >= 1 && centre > 0 && spacing > 0)) return [];
  const out: number[] = [];
  const nuC = c / centre;
  const dNu = frequencyWidth(centre, spacing);
  for (let i = 0; i < n; i++) {
    const k = i - (n - 1) / 2;
    if (equalFrequency) {
      // Ascending wavelength = descending frequency.
      const nu = nuC - k * dNu;
      out.push(nu > 0 ? c / nu : NaN);
    } else {
      const lambda = centre + k * spacing;
      out.push(lambda > 0 ? lambda : NaN);
    }
  }
  return out;
}

/** Transmission exp(−(λ − λ_ch)²/2σ²) of a Gaussian passband with full width at half maximum `fwhm` (any length unit). */
export function gaussianPassband(detuning: number, fwhm: number): number {
  if (!(fwhm > 0)) return NaN;
  const sigma = fwhm / (2 * Math.sqrt(2 * Math.LN2));
  return Math.exp(-0.5 * (detuning / sigma) ** 2);
}

/** Adjacent-channel isolation of Gaussian passbands, dB: 10 log₁₀(e)·4 ln 2·(Δλ/FWHM)² (see the header). */
export function gaussianAdjacentIsolationDb(spacing: number, fwhm: number): number {
  if (!(spacing > 0 && fwhm > 0)) return NaN;
  return (10 / Math.LN10) * 4 * Math.LN2 * (spacing / fwhm) ** 2;
}

/** Wavelength range of the page's centre-wavelength input (and of typical WDM components), m. */
export const WDM_RANGE: readonly [number, number] = [800 * 1e-9, 1700 * 1e-9];

/**
 * Page and API summary of a channel plan of n channels centred on λc (m) with spacing Δλ (m) and passband FWHM (m):
 * the grid, channel wavelengths (m), whether the plan is invalid (no channels or one at or below zero wavelength), the
 * first and last channel and their span (m, NaN when invalid), whether a channel lies outside `WDM_RANGE`, the
 * frequency spacing cΔλ/λc² (Hz) and the adjacent-channel isolation of Gaussian passbands (dB).
 */
export function wdmPlanSummary(n: number, centre: number, spacing: number, fwhm: number) {
  const grid = ituGrid(spacing, centre);
  const channels = channelWavelengths(n, centre, spacing, grid.equalFrequency);
  const planInvalid = channels.length === 0 || channels.some((ch) => !Number.isFinite(ch));
  const first = planInvalid ? NaN : Math.min(...channels);
  const last = planInvalid ? NaN : Math.max(...channels);
  return {
    grid, channels, planInvalid, first, last,
    totalBandwidth: last - first,
    outOfRange: !planInvalid && (first < WDM_RANGE[0] || last > WDM_RANGE[1]),
    frequencySpacing: frequencyWidth(centre, spacing),
    isolationDb: gaussianAdjacentIsolationDb(spacing, fwhm),
  };
}
