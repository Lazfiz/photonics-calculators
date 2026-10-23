/**
 * Linear electro-optic (Pockels) effect: index change, half-wave voltages of longitudinal and transverse modulators,
 * and the diffusion-driven photorefractive grating with its two-beam coupling gain.
 * Model tier: textbook (principal-axis geometries, r fixed at its reference wavelength, plane waves).
 * SI units: λ in m, r in m/V, fields in V/m, voltages in V, lengths in m.
 *
 * - Index change along a principal axis: Δn = −½ n³ r E (A. Yariv & P. Yeh, Optical Waves in Crystals, ch. 7).
 * - Longitudinal KDP-type cell (field and light along z, 42m crystals): the induced axes x′, y′ change by ∓½ n_o³ r₆₃ E,
 *   so the retardation is Γ = 2π n_o³ r₆₃ V / λ and V_π = λ / (2 n_o³ r₆₃), independent of the crystal size. A beam
 *   polarized along x′ alone gets the phase π n_o³ r₆₃ V / λ, which needs twice that voltage for π (J. Wilson &
 *   J. Hawkes, Optoelectronics: An Introduction, Table 3.1 and Example 3.2).
 * - Transverse z-field modulator (3m crystals such as LiNbO₃, light along x or y, electrode gap d, length L): a
 *   z-polarized beam gets φ = π n_e³ r₃₃ V L / (λ d), V_π = λ d / (n_e³ r₃₃ L); the retardation between z and the
 *   ordinary polarization is Γ = π (n_e³ r₃₃ − n_o³ r₁₃) V L / (λ d) on top of the natural birefringence.
 * - KTP (mm2) in the same geometry, light along x: the z and y polarizations see n_z³ r₃₃ and n_y³ r₂₃, so the
 *   retardation uses n_z³ r₃₃ − n_y³ r₂₃ (D. Xie & O. Pfister, arXiv:physics/0507123 (2005), eqs. 3–4). r₃₃ = 36.3 and
 *   r₂₃ = 15.7 pm/V at 633 nm are L. K. Cheng et al.'s values (J. Cryst. Growth 137, 107 (1994),
 *   doi:10.1016/0022-0248(94)91256-4) as quoted there; n_y, n_z from Kato & Takaoka 2002 (`biaxial-data.ts`).
 * - Photorefractive grating (N. V. Kukhtarev et al., Ferroelectrics 22, 949 (1978), doi:10.1080/00150197908239450),
 *   diffusion only, no applied field and no photovoltaic current, small fringe modulation m: the space-charge field
 *   per unit m is E_sc = E_D / (1 + E_D / E_q), E_D = k_B T K / q, E_q = q N_eff / (ε₀ ε K), K = 2π/Λ, shifted by a
 *   quarter period from the fringes. Two-beam coupling then transfers intensity as dI₁/dz = Γ I₁I₂/(I₁ + I₂) with
 *   Γ = 2π n³ r_eff E_sc / (λ cos θ), θ the half-angle inside the crystal (P. Yeh, IEEE J. Quantum Electron. 25, 484
 *   (1989), doi:10.1109/3.18564). The sign of Γ follows the c-axis orientation; its magnitude is returned.
 */

import { epsilon_0, k_B, q } from "../constants";
import { biaxialIndices, biaxialRange } from "./biaxial-data";
import { crystalIndices, crystalRange } from "./uniaxial-data";

export type PockelsId = "kdp" | "kdp-d" | "adp" | "linbo3" | "ktp";
export type PockelsGeometry = "longitudinal" | "transverse";

export interface PockelsCrystal {
  name: string;
  pointGroup: string;
  geometry: PockelsGeometry;
  /**
   * Coefficients in m/V: r₆₃ for a longitudinal cell; for a transverse one r₃₃ (z polarization) and r₁₃, the
   * coefficient of the polarization across z (r₂₃ for KTP, labelled by `perp`).
   */
  r: { r63?: number; r33?: number; r13?: number };
  /**
   * Index across z (n_o; n_y for KTP) and along z (n_e; n_z for KTP) at λ (m): a Sellmeier fit, or fixed values
   * where only a single index is published.
   */
  indices: (lambda: number) => { no: number; ne: number };
  /** Labels of the polarization across z when it isn't the ordinary one (biaxial crystals). */
  perp?: { n: string; nz: string; r: string };
  /** Wavelength range of the index model, m (fixed indices: the range of the source's examples). */
  range: [number, number];
  /** Static relative permittivity along the field (photorefractive E_q), or NaN where not tabulated. */
  epsilon: number;
  source: string;
}

const fixed = (n: number) => () => ({ no: n, ne: NaN });

export const POCKELS: Record<PockelsId, PockelsCrystal> = {
  kdp: {
    name: "KDP (KH₂PO₄)", pointGroup: "42m", geometry: "longitudinal", r: { r63: 10.6e-12 },
    indices: (lambda) => crystalIndices("kdp", lambda), range: crystalRange("kdp"), epsilon: NaN,
    source: "r₆₃ Wilson & Hawkes Table 3.1; n_o Zernike 1964",
  },
  "kdp-d": {
    name: "KD*P (KD₂PO₄)", pointGroup: "42m", geometry: "longitudinal", r: { r63: 26.4e-12 },
    indices: fixed(1.51), range: [633e-9, 1060e-9], epsilon: NaN,
    source: "r₆₃ and n_o = 1.51 Wilson & Hawkes Table 3.1 and Example 3.3",
  },
  adp: {
    name: "ADP (NH₄H₂PO₄)", pointGroup: "42m", geometry: "longitudinal", r: { r63: 8.5e-12 },
    indices: fixed(1.52), range: [633e-9, 1060e-9], epsilon: NaN,
    source: "r₆₃ and n_o ≈ 1.52 Wilson & Hawkes Table 3.1",
  },
  linbo3: {
    name: "LiNbO₃ (congruent)", pointGroup: "3m", geometry: "transverse", r: { r33: 30.8e-12, r13: 8.6e-12 },
    indices: (lambda) => crystalIndices("linbo3", lambda), range: crystalRange("linbo3"), epsilon: 28,
    source: "r₃₃, r₁₃ (clamped, 633 nm) and ε₃₃ Weis & Gaylord 1985; n_o, n_e Zelmon et al. 1997",
  },
  ktp: {
    name: "KTP (KTiOPO₄)", pointGroup: "mm2", geometry: "transverse", r: { r33: 36.3e-12, r13: 15.7e-12 },
    indices: (lambda) => {
      const { ny, nz } = biaxialIndices("ktp", lambda);
      return { no: ny, ne: nz };
    },
    range: biaxialRange("ktp"), epsilon: NaN, perp: { n: "n_y", nz: "n_z", r: "r₂₃" },
    source: "r₃₃, r₂₃ (633 nm) Cheng et al. 1994 via Xie & Pfister 2005; n_y, n_z Kato & Takaoka 2002",
  },
};

const pos = (x: number) => Number.isFinite(x) && x > 0;

/** Index change −½ n³ r E along one principal axis (r in m/V, E in V/m). */
export const pockelsIndexChange = (n: number, r: number, E: number) => (pos(n) ? -0.5 * n ** 3 * r * E : NaN);

/** Half-wave voltage of a longitudinal KDP-type cell, λ / (2 n_o³ r₆₃): the retardation reaches π. */
export const longitudinalHalfWaveVoltage = (lambda: number, no: number, r63: number) =>
  pos(lambda) && pos(no) && pos(r63) ? lambda / (2 * no ** 3 * r63) : NaN;

/** Voltage for a phase shift of π on one polarization, λ d / (n³ r L); a longitudinal cell has d = L. */
export const phaseHalfWaveVoltage = (lambda: number, n: number, r: number, d: number, L: number) =>
  pos(lambda) && pos(n) && pos(r) && pos(d) && pos(L) ? (lambda * d) / (n ** 3 * r * L) : NaN;

/** Half-wave voltage of a transverse z-field retardation modulator, λ d / (|n_e³ r₃₃ − n_o³ r₁₃| L). */
export function transverseHalfWaveVoltage(lambda: number, no: number, ne: number, r33: number, r13: number, d: number, L: number): number {
  const rc = Math.abs(ne ** 3 * r33 - no ** 3 * r13);
  return pos(lambda) && pos(no) && pos(ne) && pos(rc) && pos(d) && pos(L) ? (lambda * d) / (rc * L) : NaN;
}

/** Intensity transmission sin²(Γ/2) of a retarder between crossed polarizers at 45° to its axes. */
export const crossedPolarizerTransmission = (retardation: number) => Math.sin(retardation / 2) ** 2;

/** Grating period Λ = λ / (2 sin θ) for two beams crossing at the full angle 2θ (outside or inside; λ in that medium). */
export const gratingPeriod = (lambda: number, halfAngle: number) =>
  pos(lambda) && halfAngle > 0 && halfAngle < Math.PI / 2 ? lambda / (2 * Math.sin(halfAngle)) : NaN;

/** Diffusion field E_D = k_B T K / q, V/m, for a grating period Λ (m) at temperature T (K). */
export const diffusionField = (period: number, T: number) => (pos(period) && pos(T) ? (k_B * T * 2 * Math.PI) / (q * period) : NaN);

/** Trap-limited field E_q = q N_eff Λ / (2π ε₀ ε), V/m, for an effective trap density N_eff (m⁻³). */
export const trapLimitedField = (period: number, Neff: number, epsilon: number) =>
  pos(period) && pos(Neff) && pos(epsilon) ? (q * Neff * period) / (2 * Math.PI * epsilon_0 * epsilon) : NaN;

/** Diffusion-only space-charge field per unit fringe modulation, E_D / (1 + E_D / E_q). */
export const spaceChargeField = (ED: number, Eq: number) => (pos(ED) && pos(Eq) ? ED / (1 + ED / Eq) : NaN);

/** Two-beam coupling gain |Γ| = 2π n³ r_eff E_sc / (λ cos θ), m⁻¹, θ the half-angle inside the crystal. */
export const twoBeamCouplingGain = (lambda: number, n: number, rEff: number, Esc: number, thetaInside: number) =>
  pos(lambda) && pos(n) && pos(rEff) && pos(Esc) && Math.abs(thetaInside) < Math.PI / 2
    ? (2 * Math.PI * n ** 3 * rEff * Esc) / (lambda * Math.cos(thetaInside))
    : NaN;

/**
 * Grating period where E_D = E_q, Λ = 2π √(ε₀ ε k_B T / (q² N_eff)) (2π times the Debye screening length). Since
 * E_D ∝ 1/Λ and E_q ∝ Λ, E_sc = 1/(1/E_D + 1/E_q) peaks there at E_D/2.
 */
export const balancedGratingPeriod = (Neff: number, epsilon: number, T: number) =>
  pos(Neff) && pos(epsilon) && pos(T) ? 2 * Math.PI * Math.sqrt((epsilon_0 * epsilon * k_B * T) / (q * q * Neff)) : NaN;

/**
 * Signal gain of two-beam coupling without absorption: dI₁/dz = Γ I₁I₂/(I₁ + I₂) with I₁ + I₂ fixed integrates to
 * I₁(L)/I₁(0) = (1 + β) / (1 + β e^(−ΓL)), β = I₂(0)/I₁(0) the pump-to-signal ratio (Yeh 1989). It tends to e^(ΓL) for
 * an undepleted pump (β → ∞) and to 1 + β when the pump is used up.
 */
export const twoBeamSignalGain = (gammaL: number, beta: number) =>
  Number.isFinite(gammaL) && pos(beta) ? (1 + beta) / (1 + beta * Math.exp(-gammaL)) : NaN;
