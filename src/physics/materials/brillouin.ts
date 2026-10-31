/**
 * Brillouin scattering in a bulk medium or the core of a fibre: the Stokes frequency shift, the acoustic wavelength and
 * phonon lifetime, and the peak gain of the Lorentzian Brillouin gain line.
 * Model tier: textbook (backward scattering from a single longitudinal acoustic mode, scalar fields, CW pump narrower
 * than the Brillouin line; no acoustic guiding or overlap integral of a real fibre).
 * SI units: λ in m, velocities in m/s, densities in kg/m³, frequencies in Hz, g_B in m/W.
 *
 * G. P. Agrawal, Nonlinear Fiber Optics, 6th ed. (Academic Press, 2019), doi:10.1016/C2018-0-01168-8, Brillouin
 * scattering:
 *   ν_B = 2 n v_A/λ_p,   Λ = λ_p/(2n) = v_A/ν_B,   Δν_B = Γ_B/2π,   T_B = 1/Γ_B = 1/(2πΔν_B),
 *   g_B = 2π n⁷ p₁₂² / (c λ_p² ρ₀ v_A Δν_B)   (peak of the Lorentzian line, Δν_B its FWHM),
 * with fused-silica values n = 1.45, v_A = 5.96 km/s, ρ₀ = 2210 kg/m³ and p₁₂ = 0.286. Δν_B scales as λ_p⁻² (the
 * phonon damping grows as the acoustic wavenumber squared), so the peak g_B hardly depends on the pump wavelength.
 * Other media, each with a measurement of ν_B, Δν_B and g_B that the formula reproduces (bulk values; waveguide and fibre
 * papers divide out or quote their overlap):
 * - As₂Se₃ fibre: M. S. Abedin, Opt. Express 13, 10266 (2005), doi:10.1364/OPEX.13.010266, Table 1 (n from the manufacturer,
 *   ρ and v_A after Uchida & Niizeki 1973, p₁₂ after Ohmachi & Uchida 1972) and measured 7.95 GHz, 13.2 MHz at 1.56 µm.
 * - As₂S₃ waveguide: R. Pant et al., Opt. Express 19, 8285 (2011), doi:10.1364/OE.19.008285, p. 8288: n 2.37, ρ 3200,
 *   p₁₂ 0.24; ν_B ≈ 7.7 GHz and Δν_B 34 MHz at 1544.8 nm, g_B 0.715e-9 m/W (0.74e-9 calculated with overlap 0.95).
 *   v_A = ν_Bλ/(2n) = 2509 m/s from the measured shift.
 * - Diamond, longitudinal phonons along [110], pump polarized along ⟨111⟩: Z. Bai et al., APL Photonics 5, 031301
 *   (2020), doi:10.1063/1.5134907: n 2.43, ρ 3520, effective p² 0.0153 (their value, after Grimsditch & Ramdas 1975; the
 *   paper does not state its contraction convention), ν_B 167 ± 1 GHz and Δν_B 11.9 ± 4.3 MHz at 532 nm, g 60 ± 9 cm/GW
 *   measured from the laser threshold. With that p² the formula gives 74 cm/GW at 11.9 MHz and 60 at 14.7 MHz, inside
 *   the linewidth's error; v_A = ν_Bλ/(2n) = 18 280 m/s from the measured shift.
 * `brillouinShift` and `stokesWavelength` are in fiber-optics/fiber-nonlinear.ts; the threshold (`sbsThreshold`) is
 * there too and has its own page, fiber-optics/sbs-threshold.
 */

import { c } from "../constants";
import { SILICA_ACOUSTIC_VELOCITY, SILICA_MODE_INDEX } from "../fiber-optics/fiber-nonlinear";

export interface BrillouinMedium {
  name: string;
  /** Refractive (mode) index. */
  n: number;
  /** Longitudinal acoustic velocity, m/s. */
  vA: number;
  /** Density, kg/m³. */
  rho: number;
  /** Elasto-optic coefficient p₁₂ of a glass, or the effective p for the acoustic and optical directions of a crystal. */
  p12: number;
  source: string;
  /** A measurement of the same medium, to compare with. */
  measured?: BrillouinMeasurement;
}

export interface BrillouinMeasurement {
  /** Pump wavelength, m. */
  lambda: number;
  /** Brillouin shift, Hz. */
  nuB: number;
  /** FWHM gain bandwidth, Hz. */
  fwhm: number;
  /** Measured peak gain, m/W. */
  gB: number;
}

export const FUSED_SILICA_BRILLOUIN: BrillouinMedium = {
  name: "Fused silica",
  n: SILICA_MODE_INDEX,
  vA: SILICA_ACOUSTIC_VELOCITY,
  rho: 2210,
  p12: 0.286,
  source: "Agrawal, Nonlinear Fiber Optics, 6th ed.",
};

export type BrillouinMediumId = "fused-silica" | "as2se3" | "as2s3" | "diamond";

export const BRILLOUIN_MEDIA: Record<BrillouinMediumId, BrillouinMedium> = {
  "fused-silica": FUSED_SILICA_BRILLOUIN,
  as2se3: {
    name: "As₂Se₃ glass", n: 2.808, vA: 2250, rho: 4640, p12: 0.266, source: "Abedin 2005, Table 1",
    measured: { lambda: 1.56e-6, nuB: 7.95e9, fwhm: 13.2e6, gB: 6.0e-9 },
  },
  as2s3: {
    name: "As₂S₃ glass", n: 2.37, vA: 2509, rho: 3200, p12: 0.24, source: "Pant et al. 2011",
    measured: { lambda: 1544.775e-9, nuB: 7.7e9, fwhm: 34e6, gB: 0.715e-9 },
  },
  diamond: {
    name: "Diamond, phonon ∥ [110]", n: 2.43, vA: 18280, rho: 3520, p12: Math.sqrt(0.0153), source: "Bai et al. 2020",
    measured: { lambda: 532e-9, nuB: 167e9, fwhm: 11.9e6, gB: 60e-11 },
  },
};

const positive = (x: number) => Number.isFinite(x) && x > 0;

/** Peak Brillouin gain g_B = 2π n⁷ p₁₂²/(c λ² ρ v_A Δν_B), m/W. NaN unless every input is positive. */
export function brillouinGain(lambdaPump: number, m: Pick<BrillouinMedium, "n" | "vA" | "rho" | "p12">, linewidth: number): number {
  if (![lambdaPump, m.n, m.vA, m.rho, m.p12, linewidth].every(positive)) return NaN;
  return (2 * Math.PI * m.n ** 7 * m.p12 ** 2) / (c * lambdaPump ** 2 * m.rho * m.vA * linewidth);
}

/** Acoustic wavelength Λ = λ_p/(2n) of the phonon that back-scatters the pump, m. */
export function acousticWavelength(lambdaPump: number, n: number): number {
  return positive(lambdaPump) && positive(n) ? lambdaPump / (2 * n) : NaN;
}

/** Phonon lifetime T_B = 1/Γ_B = 1/(2πΔν_B) from the FWHM gain bandwidth (Agrawal: ≈ 10 ns in silica), s. */
export function phononLifetime(linewidth: number): number {
  return positive(linewidth) ? 1 / (2 * Math.PI * linewidth) : NaN;
}
