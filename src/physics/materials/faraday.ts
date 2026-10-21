/**
 * Faraday rotation and Verdet-constant dispersion of magneto-optic materials.
 * Model tier: textbook approximation (θ = VBL is exact; V(λ) from published fits, inside their ranges).
 *
 * - Faraday rotation θ = V B L, V in rad/(T·m) (Vojna et al. 2019, Appl. Sci. 9, 3160, doi:10.3390/app9153160, eq. 1).
 *   Their convention: V < 0 when the medium rotates the polarization clockwise for light propagating along B. Paramagnetic
 *   (Tb³⁺, Ce³⁺) materials are negative, diamagnetic glasses positive. The rotation is non-reciprocal: a round trip doubles it.
 * - Paramagnetic fits, single-transition model V(λ) = F λ₀²/(λ² − λ₀²) + G for |V| (Vojna et al. 2019, eq. 13; Tables 1–2).
 *   TGG F 820.3, G −6.2 rad/(T·m), λ₀ 239.3 nm (|V| 130.6 at 633 nm, 37.5 at 1064 nm); TSAG F 756.7, λ₀ 262 nm (156.6,
 *   48.9); CeF₃ F 743.6, λ₀ 239 nm (Table 1, UV fit; 123.7 at 633 nm against 123 in Table 2, but 39.5 at 1064 nm against
 *   46.3, so it stops at 700 nm).
 * - Fused silica (diamagnetic): V = α/(λ² − λ₀²) + β, α 8.045 × 10⁷ nm²·°/(T·m), β 8.464 °/(T·m), λ₀ 130.9 nm, fitted to
 *   310 ± 3 °/(T·m) at 532 nm and the literature data of Tamaru, Sivaramakrishnan and Bougas (Tran et al. 2024, J. Chem.
 *   Phys. 160, 054201, eq. 2; doi:10.1063/5.0187832).
 * - YIG is ferrimagnetic: above saturation its rotation per length is fixed, |θ/L| = 304 rad/m at 1550 nm (Vojna et al.
 *   2019, Table 3), and no longer grows with B.
 */

const DEG = Math.PI / 180;

export type MagnetoOpticId = "tgg" | "tsag" | "cef3" | "silica" | "yig";

export interface MagnetoOpticMaterial {
  name: string;
  kind: "paramagnetic" | "diamagnetic" | "ferrimagnetic";
  /** Wavelength range of the fit or data, m. */
  range: readonly [number, number];
  /** Verdet constant V(λ), rad/(T·m), signed; for a ferrimagnet the saturated rotation per length, rad/m. */
  verdet: (lambda: number) => number;
  source: string;
}

/** Single-transition model F λ₀²/(λ² − λ₀²) + G, with F, G in rad/(T·m) and λ, λ₀ in m (Vojna et al. 2019, eq. 13). */
export function singleTransitionVerdet(F: number, G: number, lambda0: number, lambda: number): number {
  const d = lambda * lambda - lambda0 * lambda0;
  return d > 0 ? (F * lambda0 * lambda0) / d + G : NaN;
}

/** Fused silica Verdet constant, rad/(T·m) (Tran et al. 2024, eq. 2). */
export function silicaVerdet(lambda: number): number {
  const nm = lambda * 1e9;
  const d = nm * nm - 130.9 * 130.9;
  return d > 0 ? (8.045e7 / d + 8.464) * DEG : NaN;
}

const inside = (range: readonly [number, number], lambda: number) => lambda >= range[0] * (1 - 1e-9) && lambda <= range[1] * (1 + 1e-9);

export const MAGNETO_OPTIC: Record<MagnetoOpticId, MagnetoOpticMaterial> = {
  tgg: {
    name: "TGG (Tb₃Ga₅O₁₂)", kind: "paramagnetic", range: [400e-9, 1100e-9],
    verdet: (l) => -singleTransitionVerdet(820.3, -6.2, 239.3e-9, l),
    source: "Vojna et al. 2019, Table 2",
  },
  tsag: {
    name: "TSAG (Tb₃Sc₂Al₃O₁₂)", kind: "paramagnetic", range: [400e-9, 1100e-9],
    verdet: (l) => -singleTransitionVerdet(756.7, 0, 262e-9, l),
    source: "Vojna et al. 2019, Table 2",
  },
  cef3: {
    name: "CeF₃", kind: "paramagnetic", range: [300e-9, 700e-9],
    verdet: (l) => -singleTransitionVerdet(743.6, 0, 239e-9, l),
    source: "Vojna et al. 2019, Table 1",
  },
  silica: {
    name: "Fused silica (SiO₂)", kind: "diamagnetic", range: [300e-9, 1100e-9],
    verdet: silicaVerdet,
    source: "Tran et al. 2024",
  },
  yig: {
    name: "YIG (Y₃Fe₅O₁₂)", kind: "ferrimagnetic", range: [1550e-9, 1550e-9],
    verdet: () => 304,
    source: "Vojna et al. 2019, Table 3",
  },
};

/** Verdet constant (rad/(T·m)) of a listed material, NaN outside its range. */
export function verdetConstant(id: MagnetoOpticId, lambda: number): number {
  const m = MAGNETO_OPTIC[id];
  return inside(m.range, lambda) ? m.verdet(lambda) : NaN;
}

/** Faraday rotation θ = V B L, rad, for V (rad/(T·m)), B (T) and L (m). */
export const faradayRotation = (V: number, B: number, L: number) => V * B * L;

/** Field (T) that rotates by |θ| (rad) over L (m); NaN when V or L is 0. */
export function fieldForRotation(V: number, L: number, theta: number): number {
  const VL = Math.abs(V * L);
  return VL > 0 ? Math.abs(theta) / VL : NaN;
}

/** Length (m) that rotates by |θ| (rad) in field B (T); NaN when V or B is 0. */
export function lengthForRotation(V: number, B: number, theta: number): number {
  const VB = Math.abs(V * B);
  return VB > 0 ? Math.abs(theta) / VB : NaN;
}
