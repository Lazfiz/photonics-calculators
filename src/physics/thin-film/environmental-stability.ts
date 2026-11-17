/**
 * Environmental stability of optical coatings. SI units unless a name says otherwise: wavelengths in m,
 * temperatures in K, thermal coefficients in 1/K, particle sizes in µm.
 *
 * 1. Moisture in porous layers (H. A. Macleod, "Moisture adsorption in optical coatings", NASA Conf. Publ.,
 *    1988, NTRS 19890003956). A film of packing density p (solid volume / total volume; "most often from 0.8
 *    to 0.9") mixes a solid of index n_s with pores of index n_v:
 *        linear interpolation (eq. 3):  n = p n_s + (1 − p) n_v
 *        Bragg–Pippard columns (eq. 4): n² = [(1 − p) n_v⁴ + (1 + p) n_s² n_v²] / [(1 + p) n_v² + (1 − p) n_s²]
 *    Water filling a fraction f of the pore volume gives n_v = 1 + f (n_w − 1) (eq. 5, with n_w = 1.33).
 *    Macleod: the linear law suits low-index films and high-index films with p above about 0.92; Bragg–Pippard
 *    is usually better for high-index films of lower p. The fill f depends on humidity, on the pore-size
 *    distribution and on time (water enters as spreading patches: Macleod & Richmond, Thin Solid Films 37, 163
 *    (1976)), so it is an input here. Model tier: textbook approximation.
 *
 * 2. Temperature: each layer's index moves by dn/dT·ΔT and its thickness by the strain ε_z. A free film expands
 *    by ε_z = α_f ΔT. A film bonded to a substrate much thicker than itself is held to the substrate's in-plane
 *    strain α_s ΔT. With σ_z = 0 and the isotropic thermoelastic Hooke's law ε_i = [(1 + ν)σ_i − ν Σσ]/E + α ΔT
 *    (S. P. Timoshenko, J. N. Goodier, Theory of Elasticity, 3rd ed., McGraw-Hill 1970, ch. 13), the biaxial
 *    mismatch stress is σ = [E/(1 − ν)](α_s − α_f) ΔT (L. B. Freund, S. Suresh, Thin Film Materials, Cambridge
 *    2004, ch. 2, doi:10.1017/CBO9780511754715), so
 *        ε_z = α_f ΔT − [2ν/(1 − ν)](α_s − α_f) ΔT = {[(1 + ν)/(1 − ν)] α_f − [2ν/(1 − ν)] α_s} ΔT.
 *    On heating, a substrate that expands more than the film thins it compared with a free film (H. Takahashi, Appl. Opt. 34, 667 (1995),
 *    doi:10.1364/AO.34.000667, uses high-expansion substrates to cancel dn/dT). The stress-optic change of n is
 *    not modelled: dn/dT is taken as entered. It is about as large as the Poisson term: SiO₂ on N-BK7 at ΔT = 50 K
 *    carries σ ≈ 29 MPa, Δn ≈ −1.4e-4 (p11 0.121, p12 0.270), about −0.03 nm on the band centre, unless dn/dT was
 *    measured on a film on its substrate. A quarter-wave stack's band centre scales with the stack's optical
 *    thickness Σ n d. Model tier: textbook approximation.
 *
 * 3. Particles (IEST-STD-CC1246E; slope from MIL-STD-1246): the number of particles of size ≥ x on 0.1 m² of
 *    a level-L surface is log₁₀ N = 0.926 (log₁₀² L − log₁₀² x), N(L) = 1. The obscured area fraction is
 *    ∫ (π x²/4) (−dN/dx) dx from x_min to L, for spheres seen face on (Ma, Fong & Lee, Proc. SPIE 1165, 381
 *    (1990), doi:10.1117/12.962866: log₁₀(%Obs) = −7.245 + 0.926 log₁₀² L per ft², their eq. 17a). Integrated here by
 *    Simpson's rule in ln x (2000 intervals, relative error < 1e-8). Model tier: exact for that distribution.
 *
 * 4. Accelerated ageing (Arrhenius, with Peck's humidity term: D. S. Peck, Proc. 24th IRPS, 44 (1986),
 *    doi:10.1109/IRPS.1986.362110):
 *        AF = (RH_test / RH_use)ⁿ · exp[(E_a / k_B)(1/T_use − 1/T_test)]
 *    n = 0 is plain Arrhenius. Peck fitted n = 2.66 and E_a = 0.79 eV ("nearly equivalent": 2.50/0.81, 3.00/0.77 eV)
 *    to epoxy-packaged circuits, not to coatings: both are
 *    inputs. Model tier: exact for the model; its validity rests on the single activation energy.
 */
import { k_B_eV } from "../constants";
import { N_WATER } from "./anti-fog";
import type { Layer } from "./transfer-matrix";

export type MixingLaw = "linear" | "bragg-pippard";

/** Index of a pore filled to a fraction `fill` (0–1) of its volume with water (Macleod 1988, eq. 5). */
export function poreIndex(fill: number): number {
  return 1 + fill * (N_WATER - 1);
}

/** Film index from the solid index nS, pore index nV and packing density p (Macleod 1988, eqs. 3 and 4). */
export function filmIndex(nS: number, nV: number, p: number, law: MixingLaw): number {
  if (law === "linear") return p * nS + (1 - p) * nV;
  const nS2 = nS * nS, nV2 = nV * nV;
  return Math.sqrt(((1 - p) * nV2 * nV2 + (1 + p) * nS2 * nV2) / ((1 + p) * nV2 + (1 - p) * nS2));
}

/**
 * Solid index from the index of the film with empty pores (n_v = 1). NaN where the law can't reach that index:
 * Bragg–Pippard needs n² < (1 + p)/(1 − p), and both laws need n ≥ 1.
 */
export function solidIndex(nDry: number, p: number, law: MixingLaw): number {
  if (!(nDry >= 1) || !(p > 0 && p <= 1)) return NaN;
  if (law === "linear") return (nDry - (1 - p)) / p;
  const n2 = nDry * nDry;
  const den = 1 + p - (1 - p) * n2;
  return den > 0 ? Math.sqrt(((1 + p) * n2 - (1 - p)) / den) : NaN;
}

/** Index of a layer whose dry (empty-pore) index is nDry once water fills a fraction `fill` of its pores. */
export function wetIndex(nDry: number, p: number, fill: number, law: MixingLaw): number {
  return filmIndex(solidIndex(nDry, p, law), poreIndex(fill), p, law);
}

export interface CoatingMaterial {
  /** Index with empty pores, at the reference temperature. */
  n: number;
  /** Packing density, 0–1. */
  p: number;
  law: MixingLaw;
  /** Thermo-optic coefficient, 1/K. */
  dnDT: number;
  /** Linear thermal expansion, 1/K. */
  cte: number;
  /** Poisson's ratio of the film; used only on a substrate. */
  nu?: number;
}

/**
 * Thickness strain ε_z of an isotropic film held in-plane by a thick substrate (expansion alphaS, 1/K) over ΔT:
 * {[(1 + ν)/(1 − ν)] α_f − [2ν/(1 − ν)] α_s} ΔT. NaN unless −1 < ν ≤ 0.5.
 */
export function clampedThicknessStrain(alphaF: number, alphaS: number, nu: number, dT: number): number {
  if (!(nu > -1 && nu <= 0.5)) return NaN;
  return (alphaF - ((2 * nu) / (1 - nu)) * (alphaS - alphaF)) * dT;
}

/**
 * A layer that is a quarter wave at lambda0 when dry at the reference temperature, after ΔT and pore fill. With
 * alphaS (the substrate's expansion, 1/K) the film is held by the substrate; without it the film expands freely.
 */
export function environmentLayer(m: CoatingMaterial, lambda0: number, dT: number, fill: number, alphaS?: number): Layer {
  const strain = alphaS === undefined ? m.cte * dT : clampedThicknessStrain(m.cte, alphaS, m.nu ?? NaN, dT);
  return { n: wetIndex(m.n, m.p, fill, m.law) + m.dnDT * dT, thickness: (lambda0 / (4 * m.n)) * (1 + strain) };
}

/** (HL)^N quarter-wave stack at lambda0 (dry, reference temperature) after ΔT and pore fill. */
export function environmentStack(
  h: CoatingMaterial, l: CoatingMaterial, pairs: number, lambda0: number, dT: number, fill: number, alphaS?: number,
): Layer[] {
  const H = environmentLayer(h, lambda0, dT, fill, alphaS), L = environmentLayer(l, lambda0, dT, fill, alphaS);
  return Array.from({ length: 2 * pairs }, (_, j) => (j % 2 === 0 ? H : L));
}

/** Band-centre shift Δλ of the quarter-wave stack: λ0 (Σ n′d′ / Σ n d − 1), one H and one L layer per pair. */
export function centreShift(h: CoatingMaterial, l: CoatingMaterial, lambda0: number, dT: number, fill: number, alphaS?: number): number {
  const H = environmentLayer(h, lambda0, dT, fill, alphaS), L = environmentLayer(l, lambda0, dT, fill, alphaS);
  return lambda0 * ((H.n * H.thickness + L.n * L.thickness) / (lambda0 / 2) - 1);
}

/** IEST-STD-CC1246 log-log² slope. */
export const CC1246_SLOPE = 0.926;
/** CC1246D/E counting area, m² (MIL-STD-1246 used 1 ft² = 0.09290304 m²). */
export const CC1246_AREA = 0.1;

/** Particles of size ≥ x_um on 0.1 m² of a level-`level` surface (CC1246); 0 above the level. */
export function cc1246Count(x_um: number, level: number): number {
  if (!(x_um > 0 && level >= 1)) return NaN;
  if (x_um > level) return 0;
  return 10 ** (CC1246_SLOPE * (Math.log10(level) ** 2 - Math.log10(x_um) ** 2));
}

/**
 * Fraction of the surface covered by the particles of a level-`level` CC1246 distribution between xMin_um and
 * the level, as face-on spheres, on a counting area `area` m² (0.1 for CC1246D/E, 1 ft² for Ma et al.).
 */
export function cc1246Obscuration(level: number, xMin_um = 1, area = CC1246_AREA): number {
  if (!(level >= 1 && xMin_um > 0 && area > 0)) return NaN;
  if (xMin_um >= level) return 0;
  // −dN/dx dx = N · 2 · 0.926 · log₁₀ x · d(ln x)
  const a = Math.log(xMin_um), b = Math.log(level), n = 2000, h = (b - a) / n;
  let s = 0;
  for (let i = 0; i <= n; i++) {
    const x = Math.exp(a + i * h);
    const f = (Math.PI * x * x / 4) * cc1246Count(x, level) * 2 * CC1246_SLOPE * Math.log10(x);
    s += f * (i === 0 || i === n ? 1 : i % 2 ? 4 : 2);
  }
  return ((s * h) / 3) * 1e-12 / area;
}

/** Arrhenius–Peck acceleration factor; temperatures in K, humidities in % (same scale), Ea in eV. */
export function accelerationFactor(eaEv: number, tUse: number, tTest: number, rhUse = 1, rhTest = 1, rhExponent = 0): number {
  if (!(tUse > 0 && tTest > 0 && rhUse > 0 && rhTest > 0)) return NaN;
  return (rhTest / rhUse) ** rhExponent * Math.exp((eaEv / k_B_eV) * (1 / tUse - 1 / tTest));
}
