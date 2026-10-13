/**
 * Spectral attenuation of germania-doped silica fibre: Rayleigh scattering, infrared and ultraviolet absorption
 * tails, and the OH (water) band at 1383 nm. Wavelengths in m; losses in dB/km (the unit fibre data use).
 * Model tier: textbook approximation (empirical fits); the OH band shape is illustrative.
 *
 *   Rayleigh      α_R = A/λ⁴, λ in µm, A ≈ 0.7–0.9 dB·km⁻¹·µm⁴ depending on the core dopants
 *                 (Agrawal, Fiber-Optic Communication Systems, 4th ed., 2010, §2.5).
 *   Infrared      α_IR = 7.81×10¹¹ exp(−48.48/λ), λ in µm (Keiser, Optical Fiber Communications, 4th ed., 2010,
 *                 §3.1, after Osanai et al., Electron. Lett. 12, 549 (1976), doi 10.1049/el:19760418).
 *   Ultraviolet   α_UV = 154.2x/(46.6x + 60) × 10⁻² exp(4.63/λ), x = GeO₂ mole fraction (same sources).
 *   OH band       a Gaussian of height α_OH at 1383 nm with an illustrative 30 nm FWHM. Real fibres also show
 *                 weaker OH bands near 1240 and 950 nm, not modelled. 1 ppm (weight) of OH gives ≈ 63 dB/km at
 *                 the peak (Humbach et al., J. Non-Cryst. Solids 203, 19 (1996)), so 0.5 dB/km is ≈ 8 ppb.
 * Not included: waveguide imperfection and bend losses, hydrogen ageing, and the absorption of other impurities.
 * With A = 0.85 and x = 0.04 the total is 0.323 dB/km at 1310 nm and 0.187 dB/km at 1550 nm, typical of G.652.D fibre.
 */

export const OH_PEAK_WAVELENGTH = 1383e-9;
/** Illustrative full width at half maximum of the 1383 nm OH band, m. */
export const OH_BAND_FWHM = 30e-9;
/** ITU-T G.694.2 CWDM grid: 18 channels, 1271–1611 nm in 20 nm steps (m). */
export const CWDM_CHANNELS = Array.from({ length: 18 }, (_, i) => (1271 + 20 * i) * 1e-9);

export interface SilicaLossParams {
  /** Rayleigh coefficient A, dB·km⁻¹·µm⁴, > 0. */
  rayleighA: number;
  /** GeO₂ mole fraction x in the core, 0 ≤ x < 1. */
  geO2Fraction: number;
  /** Excess OH loss at the 1383 nm peak, dB/km, ≥ 0. */
  ohPeakDbPerKm: number;
}

export interface SilicaLoss {
  rayleigh: number;
  infrared: number;
  ultraviolet: number;
  oh: number;
  total: number;
}

const valid = (p: SilicaLossParams, lambda: number) =>
  p.rayleighA > 0 && p.geO2Fraction >= 0 && p.geO2Fraction < 1 && p.ohPeakDbPerKm >= 0 && lambda > 0 && Number.isFinite(lambda);

/** Loss terms at vacuum wavelength λ (m), dB/km. NaN fields outside the domain. */
export function silicaLossDbPerKm(p: SilicaLossParams, lambda: number): SilicaLoss {
  if (!valid(p, lambda)) return { rayleigh: NaN, infrared: NaN, ultraviolet: NaN, oh: NaN, total: NaN };
  const lambda_um = lambda * 1e6;
  const x = p.geO2Fraction;
  const rayleigh = p.rayleighA / lambda_um ** 4;
  const infrared = 7.81e11 * Math.exp(-48.48 / lambda_um);
  const ultraviolet = ((154.2 * x) / (46.6 * x + 60)) * 1e-2 * Math.exp(4.63 / lambda_um);
  const sigma = OH_BAND_FWHM / (2 * Math.sqrt(2 * Math.LN2));
  const oh = p.ohPeakDbPerKm * Math.exp(-0.5 * ((lambda - OH_PEAK_WAVELENGTH) / sigma) ** 2);
  return { rayleigh, infrared, ultraviolet, oh, total: rayleigh + infrared + ultraviolet + oh };
}

/**
 * Wavelength of minimum total loss between 1450 and 1800 nm (m), where the loss is unimodal (falling scattering,
 * rising infrared absorption; the OH band is below). Golden-section search to 1e-13 m.
 */
export function minimumLossWavelength(p: SilicaLossParams): number {
  if (!valid(p, 1.55e-6)) return NaN;
  const f = (l: number) => silicaLossDbPerKm(p, l).total;
  const g = (Math.sqrt(5) - 1) / 2;
  let a = 1450e-9;
  let b = 1800e-9;
  let c = b - g * (b - a);
  let d = a + g * (b - a);
  let fc = f(c);
  let fd = f(d);
  for (let i = 0; i < 200 && b - a > 1e-13; i++) {
    if (fc < fd) {
      b = d;
      d = c;
      fd = fc;
      c = b - g * (b - a);
      fc = f(c);
    } else {
      a = c;
      c = d;
      fc = fd;
      d = a + g * (b - a);
      fd = f(d);
    }
  }
  return (a + b) / 2;
}
