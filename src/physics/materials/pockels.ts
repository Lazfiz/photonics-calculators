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
 *   doi:10.1016/0022-0248(94)91256-4) as quoted there; n_y, n_z from Kato & Takaoka 2002 (`biaxial-data.ts`). They are
 *   the low-frequency (unclamped, r^T) values: vendor tables (Laser Components KTP sheet) list them beside high-frequency
 *   r₃₃ 35.0, r₂₃ 13.8 pm/V, and Xie & Pfister's kHz measurements agree with them. LiNbO₃'s Weis & Gaylord r are clamped.
 * - BaTiO₃ (tetragonal 4mm at room temperature, negative uniaxial) in the same z-field geometry: M. Zgonik et al.,
 *   Phys. Rev. B 50, 5941 (1994), doi:10.1103/PhysRevB.50.5941, at 633 nm and 23 °C: stress-free (unclamped, below the
 *   crystal's acoustic resonances, 0.1 to a few MHz for Zgonik's samples) r₁₃ 8 ± 2, r₃₃ 105 ± 10, r₄₂ 1300 ± 100 pm/V
 *   and ε₁₁ 4400 ± 400, ε₃₃ 129 ± 5 (Table III); clamped r 10.2 ± 0.6, 40.6 ± 2.5, 730 ± 100 pm/V and ε 2200 ± 200,
 *   56 ± 3 (Table II). The modulators use r₁₃ and r₃₃; r₄₂ needs a field across z and enters only the photorefractive
 *   grating below. n_o, n_e: S. H. Wemple, M. DiDomenico Jr., I. Camlibel, J. Phys. Chem. Solids 29, 1797
 *   (1968), doi:10.1016/0022-3697(68)90164-9, n² − 1 = Bλ²/(λ² − λ₀²) (o: B 4.187, λ₀ 0.223 µm; e: 4.064, 0.211 µm),
 *   0.4–0.7 µm, as transcribed by refractiveindex.info (CC0).
 * - LiTaO₃ (congruent, 3m, positive uniaxial: n_e exceeds n_o by ≈ 0.004) in the same z-field geometry: unclamped r₃₃ and
 *   r₁₃ at 632.8, 980, 1330 and 1558 nm from J. L. Casson et al., J. Opt. Soc. Am. B 21, 1948 (2004),
 *   doi:10.1364/JOSAB.21.001948, Table 2 (horn-shaped domain deflector, precision ≈ 2 %). Their scale is set by r₃₃ =
 *   30.5 pm/V at 632.8 nm, the literature value (K. Onuki, N. Uchida, T. Saku, J. Opt. Soc. Am. 62, 1030 (1972)); r₁₃ at
 *   632.8 nm is their 7.62 pm/V (Onuki: 8.4). r is interpolated linearly in λ between the four wavelengths. n_o, n_e:
 *   W. L. Bond, J. Appl. Phys. 36, 1674 (1965), doi:10.1063/1.1703106, tabulated at room temperature (refractiveindex.info,
 *   CC0), interpolated linearly in 1/λ²; this reproduces the indices of Casson's Table 2 (Gervais & Fonseca, Palik vol. 3)
 *   to 3 × 10⁻⁴. No ε is tabulated, so LiTaO₃ stays off the photorefractive grating.
 * - Photorefractive grating (N. V. Kukhtarev et al., Ferroelectrics 22, 949 (1978), doi:10.1080/00150197908239450),
 *   diffusion only, no applied field and no photovoltaic current, small fringe modulation m: the space-charge field
 *   per unit m is E_sc = E_D / (1 + E_D / E_q), E_D = k_B T K / q, E_q = q N_eff / (ε₀ ε K), K = 2π/Λ, shifted by a
 *   quarter period from the fringes. Two-beam coupling then transfers intensity as dI₁/dz = Γ I₁I₂/(I₁ + I₂) with
 *   Γ = 2π n³ r_eff E_sc / (λ cos θ), θ the half-angle inside the crystal (P. Yeh, IEEE J. Quantum Electron. 25, 484
 *   (1989), doi:10.1109/3.18564). The sign of Γ follows the c-axis orientation; its magnitude is returned.
 * - Anisotropic grating (J. Feinberg, D. Heiman, A. R. Tanguay Jr., R. W. Hellwarth, J. Appl. Phys. 51, 1297 (1980),
 *   doi:10.1063/1.327824, eqs. 7, 13 and 19): E_q uses the static permittivity along the grating vector, ε_K = k̂·ε·k̂,
 *   and the beams couple through (ê₁·ε_ω(R·k̂)ε_ω·ê₂)(ê₁·ê₂), ε_ω = diag(n_o², n_o², n_e²). For two e-polarized beams at
 *   ±θ (inside) about a bisector in the x–z plane, with K tilted by β from c, the 4mm tensor (r₁₃, r₃₃, r₄₂ = r₅₁)
 *   contracts to cos β·[n_o⁴r₁₃(sin²β − sin²θ) + 2n_o²n_e²r₄₂ sin²β + n_e⁴r₃₃(cos²β − sin²θ)] (derived here;
 *   tests/materials-pockels.test.ts checks it against the full tensor sum), and ê₁·ê₂ = cos 2θ is the fringe contrast.
 *   Divided by n⁴, n the e-index along the bisector, this is the r_eff of Γ. The beams' E and D directions are taken
 *   equal (BaTiO₃'s walk-off is at most ≈ 1.05° at 633 nm, 1.24° at 532 nm). A grating's strain is neither zero nor free: its effective r adds
 *   piezoelectric and elasto-optic terms that depend on K (Zgonik et al. 1994, sec. II), so the clamped and free sets
 *   are two limiting cases, not the grating's own values.
 */

import { epsilon_0, k_B, q } from "../constants";
import { biaxialIndices, biaxialRange } from "./biaxial-data";
import { fromResonanceWavelengths, refractiveIndex } from "./sellmeier";
import { crystalIndices, crystalRange } from "./uniaxial-data";

export type PockelsId = "kdp" | "kdp-d" | "adp" | "linbo3" | "litao3" | "ktp" | "batio3" | "batio3-clamped";
export type PockelsGeometry = "longitudinal" | "transverse";

export interface PockelsCrystal {
  name: string;
  pointGroup: string;
  geometry: PockelsGeometry;
  /**
   * Coefficients in m/V: r₆₃ for a longitudinal cell; for a transverse one r₃₃ (z polarization) and r₁₃, the
   * coefficient of the polarization across z (r₂₃ for KTP, labelled by `perp`).
   */
  r: { r63?: number; r33?: number; r13?: number; r42?: number };
  /** r₃₃ and r₁₃ (m/V) measured at several wavelengths (m), where published; `r` then holds the first row. */
  rDispersion?: { lambda: readonly number[]; r33: readonly number[]; r13: readonly number[] };
  /**
   * Index across z (n_o; n_y for KTP) and along z (n_e; n_z for KTP) at λ (m): a Sellmeier fit, or fixed values
   * where only a single index is published.
   */
  indices: (lambda: number) => { no: number; ne: number };
  /** Labels of the polarization across z when it isn't the ordinary one (biaxial crystals). */
  perp?: { n: string; nz: string; r: string };
  /** Wavelength range of the index model, m (fixed indices: the range of the source's examples). */
  range: [number, number];
  /** Static relative permittivity ε₃₃ along z (photorefractive E_q), or NaN where not tabulated. */
  epsilon: number;
  /** Static relative permittivity ε₁₁ across z, where tabulated. */
  epsilon11?: number;
  source: string;
}

const fixed = (n: number) => () => ({ no: n, ne: NaN });

// BaTiO₃ n_o and n_e, Wemple et al. 1968 (see the header).
const BATIO3_O = fromResonanceWavelengths(1, [4.187], [0.223], [0.4, 0.7]);
const BATIO3_E = fromResonanceWavelengths(1, [4.064], [0.211], [0.4, 0.7]);
const batio3Indices = (lambda: number) => ({ no: refractiveIndex(BATIO3_O, lambda), ne: refractiveIndex(BATIO3_E, lambda) });

/** Linear interpolation of ys over strictly ascending xs (at least two nodes); NaN outside [xs[0], xs[last]]. */
function interpolate(xs: readonly number[], ys: readonly number[], x: number): number {
  const last = xs.length - 1;
  if (!(x >= xs[0] && x <= xs[last])) return NaN;
  let k = 0;
  while (k < last - 1 && x > xs[k + 1]) k++;
  return ys[k] + ((ys[k + 1] - ys[k]) * (x - xs[k])) / (xs[k + 1] - xs[k]);
}

// LiTaO₃ n_o, n_e, Bond 1965 (see the header), λ in µm; interpolated in 1/λ², which is nearly linear in n.
const LITAO3_UM = [0.6, 0.7, 0.8, 0.9, 1.0, 1.2, 1.4, 1.6];
const LITAO3_NO = [2.1834, 2.1652, 2.1538, 2.1454, 2.1391, 2.1305, 2.1236, 2.1174];
const LITAO3_NE = [2.1878, 2.1696, 2.1578, 2.1493, 2.1432, 2.1341, 2.1273, 2.1213];
// The same rows in ascending u = 1/λ² (µm⁻²).
const LITAO3_U = LITAO3_UM.map((x) => 1 / x ** 2).reverse();
const LITAO3_NO_U = [...LITAO3_NO].reverse();
const LITAO3_NE_U = [...LITAO3_NE].reverse();
const litao3Indices = (lambda: number) => {
  const u = 1 / (lambda * 1e6) ** 2;
  return { no: interpolate(LITAO3_U, LITAO3_NO_U, u), ne: interpolate(LITAO3_U, LITAO3_NE_U, u) };
};
// Casson et al. 2004, Table 2: unclamped r₃₃, r₁₃ (pm/V).
const LITAO3_R = { lambda: [632.8e-9, 980e-9, 1330e-9, 1558e-9], r33: [30.5e-12, 29.6e-12, 27.7e-12, 27.4e-12], r13: [7.62e-12, 6.96e-12, 6.55e-12, 6.92e-12] };

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
  litao3: {
    name: "LiTaO₃ (congruent)", pointGroup: "3m", geometry: "transverse", r: { r33: LITAO3_R.r33[0], r13: LITAO3_R.r13[0] },
    rDispersion: LITAO3_R, indices: litao3Indices, range: [LITAO3_R.lambda[0], LITAO3_R.lambda[3]], epsilon: NaN,
    source: "r₃₃, r₁₃ (unclamped, 632.8–1558 nm, interpolated) Casson et al. 2004, Table 2, scaled to r₃₃ = 30.5 pm/V at 632.8 nm (Onuki et al. 1972); n_o, n_e Bond 1965",
  },
  ktp: {
    name: "KTP (KTiOPO₄)", pointGroup: "mm2", geometry: "transverse", r: { r33: 36.3e-12, r13: 15.7e-12 },
    indices: (lambda) => {
      const { ny, nz } = biaxialIndices("ktp", lambda);
      return { no: ny, ne: nz };
    },
    range: biaxialRange("ktp"), epsilon: NaN, perp: { n: "n_y", nz: "n_z", r: "r₂₃" },
    source: "r₃₃, r₂₃ (unclamped, 633 nm) Cheng et al. 1994 via Xie & Pfister 2005; n_y, n_z Kato & Takaoka 2002",
  },
  batio3: {
    name: "BaTiO₃ (unclamped)", pointGroup: "4mm", geometry: "transverse", r: { r33: 105e-12, r13: 8e-12, r42: 1300e-12 },
    indices: batio3Indices, range: [BATIO3_O.range[0], BATIO3_O.range[1]], epsilon: 129, epsilon11: 4400,
    source: "r₃₃ 105 ± 10, r₁₃ 8 ± 2 (unclamped, below the acoustic resonances; 633 nm) Zgonik et al. 1994, Table III; n_o, n_e Wemple et al. 1968",
  },
  "batio3-clamped": {
    name: "BaTiO₃ (clamped)", pointGroup: "4mm", geometry: "transverse", r: { r33: 40.6e-12, r13: 10.2e-12, r42: 730e-12 },
    indices: batio3Indices, range: [BATIO3_O.range[0], BATIO3_O.range[1]], epsilon: 56, epsilon11: 2200,
    source: "r₃₃ 40.6 ± 2.5, r₁₃ 10.2 ± 0.6 (clamped, above the piezoelectric resonances; 633 nm) Zgonik et al. 1994, Table II; n_o, n_e Wemple et al. 1968",
  },
};

const pos = (x: number) => Number.isFinite(x) && x > 0;

/**
 * r₃₃ and r₁₃ (m/V) of a transverse crystal at λ: interpolated linearly in λ where the coefficients were measured at several
 * wavelengths (NaN outside them), else the reference-wavelength values.
 */
export function transverseCoefficients(crystal: PockelsCrystal, lambda: number): { r33: number; r13: number } {
  const t = crystal.rDispersion;
  if (!t) return { r33: crystal.r.r33 ?? NaN, r13: crystal.r.r13 ?? NaN };
  // Snap λ within 1e-9 (relative) of the ends, the tolerance of the page's range check, so an end point isn't lost to rounding.
  const x = Math.min(t.lambda[t.lambda.length - 1], Math.max(t.lambda[0], lambda));
  const inside = Math.abs(x - lambda) <= 1e-9 * lambda;
  return inside ? { r33: interpolate(t.lambda, t.r33, x), r13: interpolate(t.lambda, t.r13, x) } : { r33: NaN, r13: NaN };
}

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

/** Index of an extraordinary wave travelling at ψ from the c axis: 1/n² = cos²ψ/n_o² + sin²ψ/n_e². */
export const extraordinaryIndex = (no: number, ne: number, psi: number) =>
  pos(no) && pos(ne) ? 1 / Math.sqrt(Math.cos(psi) ** 2 / no ** 2 + Math.sin(psi) ** 2 / ne ** 2) : NaN;

/** Static permittivity along a grating vector at β from c, k̂·ε·k̂ = ε₁₁ sin²β + ε₃₃ cos²β (Feinberg et al. 1980, eq. 7). */
export const gratingPermittivity = (epsilon11: number, epsilon33: number, beta: number) =>
  pos(epsilon11) && pos(epsilon33) ? epsilon11 * Math.sin(beta) ** 2 + epsilon33 * Math.cos(beta) ** 2 : NaN;

/**
 * Effective coefficient |r_eff| (m/V) of two e-polarized beams at ±θ inside about their bisector, with the grating vector
 * at β ∈ [0, π/2] from c, in a 4mm crystal (or 3m with the plane of incidence x–z; in y–z, r₂₂ adds a term for β ≠ 0): cos 2θ · cos β · [n_o⁴r₁₃(sin²β − sin²θ) + 2n_o²n_e²r₄₂ sin²β
 * + n_e⁴r₃₃(cos²β − sin²θ)] / n⁴, n the e-index along the bisector (see the header). It goes into Γ with that n.
 */
export function eWaveEffectiveCoefficient(no: number, ne: number, r13: number, r33: number, r42: number, beta: number, theta: number): number {
  if (!pos(no) || !pos(ne) || !(beta >= 0 && beta <= Math.PI / 2) || !(Math.abs(theta) < Math.PI / 2)) return NaN;
  const s2b = Math.sin(beta) ** 2;
  const s2t = Math.sin(theta) ** 2;
  const bracket = no ** 4 * r13 * (s2b - s2t) + 2 * no ** 2 * ne ** 2 * r42 * s2b + ne ** 4 * r33 * (1 - s2b - s2t);
  const n = extraordinaryIndex(no, ne, Math.PI / 2 - beta);
  return Math.abs(Math.cos(2 * theta) * Math.cos(beta) * bracket) / n ** 4;
}

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
