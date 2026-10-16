/**
 * Sea-level cosmic-ray muons in a silicon image sensor, SI units (m, s, eV).
 *
 * Flux: about 1 cm⁻² min⁻¹ through a horizontal surface, zenith distribution ∝ cos²θ for E ≈ 3 GeV, mean energy
 * ≈ 4 GeV (PDG, R. L. Workman et al., Prog. Theor. Exp. Phys. 2022, 083C01, Review "Cosmic rays" §30.3.1). These
 * muons are close to minimum ionizing.
 * Silicon: ⟨dE/dx⟩_min = 1.664 MeV g⁻¹ cm² (3.876 MeV/cm), ħω_p = 31.05 eV, Z/A = 14/28.0855 (PDG 2024 Atomic and
 * Nuclear Properties, silicon); w = 3.65 eV per e–h pair at room temperature (PDG 2024, S. Navas et al., Phys. Rev. D
 * 110, 030001, §35.8 and Table 35.10).
 */

import { N_A, a_0, alpha, c, eV, m_e } from "../constants";

/** Mean energy loss of a minimum-ionizing particle in Si, eV/m (1.664 MeV g⁻¹ cm² × 2.329 g/cm³). */
export const SI_DEDX_MIN = 1.664e6 * 2.329 * 100;
/** Si density in g/cm³ and mass per area per metre of path (g/cm² per m). */
const SI_DENSITY_G_CM3 = 2.329;
const Z_OVER_A = 14 / 28.0855;
const SI_PLASMA_EV = 31.05;
/** Mean energy per electron–hole pair in Si at 300 K, eV. */
export const SI_PAIR_ENERGY = 3.65;
/** Landau–Vavilov–Bichsel constant j (PDG 2024 Eq. 34.12). */
const J_LANDAU = 0.2;
/** K = 4π N_A r_e² m_e c² in MeV mol⁻¹ cm² (PDG Table 34.1: 0.307075); r_e = α² a₀. */
export const K_BETHE = (4 * Math.PI * N_A * (alpha ** 2 * a_0) ** 2 * m_e * c ** 2 * 1e4) / (eV * 1e6);
const ME_C2_EV = (m_e * c ** 2) / eV;

/** Mean e–h pairs per metre of track for a minimum-ionizing particle (≈ 106 per µm). */
export const SI_MEAN_PAIRS_PER_M = SI_DEDX_MIN / SI_PAIR_ENERGY;

/**
 * Most probable energy loss (eV) of a minimum-ionizing particle over a silicon path x (m), Fermi-plateau limit of the
 * Landau–Vavilov–Bichsel result, PDG 2024 Eq. 34.13: Δp = ξ [ln(2 m_e c² ξ/(ħω_p)²) + j], ξ = (K/2)(Z/A)·x·ρ.
 * The mean is dominated by the rare large deposits (δ rays); below about 10 µm the straggling function is much broader
 * than Landau's and Δp is rough.
 */
export function mostProbableLoss(path: number): number {
  if (!(path > 0)) return NaN;
  const xi = (K_BETHE / 2) * Z_OVER_A * path * 100 * SI_DENSITY_G_CM3 * 1e6; // eV
  return xi * (Math.log((2 * ME_C2_EV * xi) / SI_PLASMA_EV ** 2) + J_LANDAU);
}

/** Path through a layer of thickness t at zenith angle θ (rad): t/cos θ; NaN at or beyond 90°. */
export function pathLength(thickness: number, zenith: number): number {
  return zenith >= 0 && zenith < Math.PI / 2 ? thickness / Math.cos(zenith) : NaN;
}

/** Track length projected on the pixel plane: t·tan θ. */
export function projectedLength(thickness: number, zenith: number): number {
  return zenith >= 0 && zenith < Math.PI / 2 ? thickness * Math.tan(zenith) : NaN;
}

/**
 * Averages over the flux through a horizontal sensor, dN ∝ cos²θ · cos θ dΩ (normalised ∫cos³θ sinθ dθ = 1/4):
 * ⟨1/cos θ⟩ = 4/3 and ⟨tan θ⟩ = π/4.
 */
export const MEAN_SEC_ZENITH = 4 / 3;
export const MEAN_TAN_ZENITH = Math.PI / 4;

/**
 * Expected pixels touched by a straight track of projected length ℓ on a square grid of pitch p, at random position and
 * azimuth φ: one cell plus the grid lines crossed, ℓ(|cos φ| + |sin φ|)/p, whose azimuth average is 4/π (Buffon).
 */
export function pixelsPerTrack(projected: number, pitch: number): number {
  return pitch > 0 && projected >= 0 ? 1 + (4 * projected) / (Math.PI * pitch) : NaN;
}

/** Fraction of pixels hit when μ tracks of n pixels each land at random among N pixels: 1 − exp(−μ n/N). */
export function hitPixelFraction(hits: number, pixelsPerHit: number, pixels: number): number {
  return pixels > 0 && hits >= 0 && pixelsPerHit >= 0 ? -Math.expm1((-hits * pixelsPerHit) / pixels) : NaN;
}
